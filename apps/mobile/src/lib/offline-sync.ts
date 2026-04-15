import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface PendingOperation {
  id:        string
  type:      'feedback' | 'profile-update' | 'generate-request'
  payload:   Record<string, unknown>
  endpoint:  string
  method:    'GET' | 'POST' | 'PATCH' | 'DELETE'
  timestamp: number
  retries:   number
  maxRetries: number
}

export interface OfflineState {
  isOnline:          boolean
  pendingOperations: PendingOperation[]
  lastSyncAt:        number | null
  cachedRecommendations: Record<string, unknown>[]
  cachedProfile:     Record<string, unknown> | null
}

// ─────────────────────────────────────────────────────────────────
// KEYS
// ─────────────────────────────────────────────────────────────────

const KEYS = {
  PENDING_OPS:      '@ai_fashion/pending_ops',
  CACHED_RECS:      '@ai_fashion/cached_recommendations',
  CACHED_PROFILE:   '@ai_fashion/cached_profile',
  LAST_SYNC:        '@ai_fashion/last_sync_at',
} as const

// ─────────────────────────────────────────────────────────────────
// OFFLINE SYNC MANAGER
// ─────────────────────────────────────────────────────────────────

class OfflineSyncManager {
  private isOnline = true
  private syncInProgress = false
  private listeners: Array<(state: Partial<OfflineState>) => void> = []
  private netInfoUnsubscribe: (() => void) | null = null
  private apiBaseUrl: string
  private getAuthToken: () => Promise<string | null>

  constructor(apiBaseUrl: string, getAuthToken: () => Promise<string | null>) {
    this.apiBaseUrl    = apiBaseUrl
    this.getAuthToken  = getAuthToken
  }

  // ── Initialization ───────────────────────────────────────────

  initialize(): void {
    this.netInfoUnsubscribe = NetInfo.addEventListener(
      (state: NetInfoState) => void this.handleNetworkChange(state),
    )
  }

  destroy(): void {
    this.netInfoUnsubscribe?.()
    this.netInfoUnsubscribe = null
  }

  // ── Network change handler ───────────────────────────────────

  private async handleNetworkChange(state: NetInfoState): Promise<void> {
    const wasOffline = !this.isOnline
    this.isOnline    = state.isConnected === true && state.isInternetReachable !== false

    this.emit({ isOnline: this.isOnline })

    if (wasOffline && this.isOnline) {
      // Came back online — drain the pending queue
      await this.drainPendingQueue()
    }
  }

  // ── Enqueue operation when offline ──────────────────────────

  async enqueueOperation(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const id  = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const full: PendingOperation = {
      ...op,
      id,
      timestamp: Date.now(),
      retries:   0,
    }

    const existing = await this.loadPendingOps()
    existing.push(full)
    await AsyncStorage.setItem(KEYS.PENDING_OPS, JSON.stringify(existing))
    this.emit({ pendingOperations: existing })
    return id
  }

  // ── Drain pending queue when back online ─────────────────────

  async drainPendingQueue(): Promise<void> {
    if (this.syncInProgress) return
    this.syncInProgress = true

    try {
      const ops = await this.loadPendingOps()
      if (ops.length === 0) { this.syncInProgress = false; return }

      const token = await this.getAuthToken()
      if (!token) { this.syncInProgress = false; return }

      const remaining: PendingOperation[] = []

      for (const op of ops) {
        try {
          const response = await fetch(`${this.apiBaseUrl}${op.endpoint}`, {
            method:  op.method,
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Offline-Sync': 'true',
            },
            body: op.method !== 'GET' ? JSON.stringify(op.payload) : undefined,
          })

          if (!response.ok && response.status >= 500) {
            // Server error — keep in queue with retry
            if (op.retries < op.maxRetries) {
              remaining.push({ ...op, retries: op.retries + 1 })
            }
            // Else: discard after max retries
          }
          // 2xx or 4xx (client error) — remove from queue
        } catch {
          // Network error — keep in queue
          if (op.retries < op.maxRetries) {
            remaining.push({ ...op, retries: op.retries + 1 })
          }
        }
      }

      await AsyncStorage.setItem(KEYS.PENDING_OPS, JSON.stringify(remaining))
      await AsyncStorage.setItem(KEYS.LAST_SYNC, String(Date.now()))
      this.emit({
        pendingOperations: remaining,
        lastSyncAt:        Date.now(),
      })
    } finally {
      this.syncInProgress = false
    }
  }

  // ── Cache management ─────────────────────────────────────────

  async cacheRecommendations(recs: Record<string, unknown>[]): Promise<void> {
    // Keep latest 50 for offline viewing
    const capped = recs.slice(0, 50)
    await AsyncStorage.setItem(KEYS.CACHED_RECS, JSON.stringify(capped))
    this.emit({ cachedRecommendations: capped })
  }

  async getCachedRecommendations(): Promise<Record<string, unknown>[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.CACHED_RECS)
      return raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []
    } catch {
      return []
    }
  }

  async cacheProfile(profile: Record<string, unknown>): Promise<void> {
    await AsyncStorage.setItem(KEYS.CACHED_PROFILE, JSON.stringify(profile))
    this.emit({ cachedProfile: profile })
  }

  async getCachedProfile(): Promise<Record<string, unknown> | null> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.CACHED_PROFILE)
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
    } catch {
      return null
    }
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.PENDING_OPS,
      KEYS.CACHED_RECS,
      KEYS.CACHED_PROFILE,
      KEYS.LAST_SYNC,
    ])
    this.emit({
      pendingOperations:     [],
      cachedRecommendations: [],
      cachedProfile:         null,
      lastSyncAt:            null,
    })
  }

  // ── State helpers ────────────────────────────────────────────

  async getState(): Promise<OfflineState> {
    const [ops, recs, profile, syncAt] = await Promise.all([
      this.loadPendingOps(),
      this.getCachedRecommendations(),
      this.getCachedProfile(),
      AsyncStorage.getItem(KEYS.LAST_SYNC),
    ])
    return {
      isOnline:              this.isOnline,
      pendingOperations:     ops,
      lastSyncAt:            syncAt ? Number(syncAt) : null,
      cachedRecommendations: recs,
      cachedProfile:         profile,
    }
  }

  getPendingCount(): Promise<number> {
    return this.loadPendingOps().then((ops) => ops.length)
  }

  // ── Observer pattern ─────────────────────────────────────────

  subscribe(listener: (state: Partial<OfflineState>) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private emit(state: Partial<OfflineState>): void {
    this.listeners.forEach((l) => l(state))
  }

  private async loadPendingOps(): Promise<PendingOperation[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.PENDING_OPS)
      return raw ? (JSON.parse(raw) as PendingOperation[]) : []
    } catch {
      return []
    }
  }

  get online(): boolean { return this.isOnline }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────

let instance: OfflineSyncManager | null = null

export function getOfflineSyncManager(
  apiBaseUrl:    string,
  getAuthToken:  () => Promise<string | null>,
): OfflineSyncManager {
  if (!instance) {
    instance = new OfflineSyncManager(apiBaseUrl, getAuthToken)
    instance.initialize()
  }
  return instance
}

export type { OfflineSyncManager }
