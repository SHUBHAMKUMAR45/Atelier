import * as SecureStore from 'expo-secure-store'
import type {
  OutfitRecommendation,
  UserProfile,
  RecommendRequest,
  SetupProfileRequest,
  BodyMeasurements,
  UserPreferences,
  AITrendOutput,
  WeatherContext,
  WardrobeItem,
  CreateWardrobeItemRequest,
} from '../../../../packages/shared/src/schemas'

const DEFAULT_LOCAL_URL = 'http://192.168.1.9:4000'
const API_BASE = (process.env['EXPO_PUBLIC_API_URL'] ?? DEFAULT_LOCAL_URL).replace(/\/api\/v1\/?$/, '')

console.log(`[API] Initialized with base: ${API_BASE}`)

// ─────────────────────────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────────────────────────

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('clerk_session_token', token)
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync('clerk_session_token')
}

// ─────────────────────────────────────────────────────────────────
// BASE REQUEST
// ─────────────────────────────────────────────────────────────────

export interface APIResponse<T> {
  success: boolean
  data?:   T
  error?:  string
  traceId?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  items:   T[]
  total:   number
  page:    number
  pages:   number
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public traceId?: string,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// FAILURE TESTING TOGGLE (Phase 3 Audit)
const DEBUG_BREAK_PROBABILITY = 0.05 // Set to 0.05 to test fallbacks

async function request<T>(
  path:    string,
  token:   string,
  options: RequestInit = {},
): Promise<T> {
  if (__DEV__ && Math.random() < DEBUG_BREAK_PROBABILITY) {
    throw new APIError('Simulated Network Failure', 500)
  }

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 15_000) // Reduced to 15s for better UX

  const url = `${API_BASE}/api/v1${path}`

  try {
    const res = await fetch(url, {
      ...options,
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      },
    })

    const body = await res.json() as APIResponse<T>
    
    if (!res.ok || !body.success) {
      console.warn(`[API WARN] ${options.method ?? 'GET'} ${path} — ${res.status}`, body)
      throw new APIError(body.error ?? `Server error (${res.status})`, res.status, body.traceId)
    }

    return body.data as T
  } catch (err) {
    if (err instanceof APIError) throw err
    
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    const isNetwork = err instanceof Error && err.message.includes('Network request failed')

    let userMsg = 'Connection failed'
    if (isTimeout) userMsg = 'Request timed out. Please check your internet.'
    if (isNetwork) {
      userMsg = 'Cannot reach server. ' + 
                (API_BASE.includes('localhost') ? 'Use your local IP instead of localhost.' : 'Please check your connection.')
    }

    console.error(`[FATAL] ${path}`, err)
    throw new Error(userMsg)
  } finally {
    clearTimeout(timeout)
  }
}

// ─────────────────────────────────────────────────────────────────
// API METHODS
// ─────────────────────────────────────────────────────────────────

export interface QuotaStatus {
  used: number; limit: number; remaining: number; resetAt: string
}

export const mobileApi = {
  profile: {
    get:    (token: string) =>
      request<UserProfile>('/profile', token),

    setup:  (token: string, data: SetupProfileRequest) =>
      request<UserProfile>('/profile/setup', token, { method: 'POST', body: JSON.stringify(data) }),

    updateMeasurements: (token: string, data: BodyMeasurements) =>
      request<void>('/profile/measurements', token, { method: 'PATCH', body: JSON.stringify(data) }),

    updatePreferences:  (token: string, data: UserPreferences) =>
      request<void>('/profile/preferences', token, { method: 'PATCH', body: JSON.stringify(data) }),

    getQuota: (token: string) =>
      request<QuotaStatus>('/profile/quota', token),
  },

  recommend: {
    generate: (token: string, data: RecommendRequest) =>
      request<OutfitRecommendation>('/recommend', token, { method: 'POST', body: JSON.stringify(data) }),

    getHistory: (token: string, page = 1, limit = 10): Promise<PaginatedResponse<OutfitRecommendation>> =>
      request<PaginatedResponse<OutfitRecommendation>>(`/recommend/history?page=${page}&limit=${limit}`, token),

    getById: (token: string, id: string) =>
      request<OutfitRecommendation>(`/recommend/${id}`, token),

    delete: (token: string, id: string) =>
      request<void>(`/recommend/${id}`, token, { method: 'DELETE' }),

    getSaved: (token: string) =>
      request<OutfitRecommendation[]>('/feedback/saved', token),
  },

  feedback: {
    submit: (token: string, id: string, rating: 'like' | 'dislike', reason?: string) =>
      request<void>(`/feedback/${id}`, token, { method: 'POST', body: JSON.stringify({ rating, reason }) }),
  },

  weather: {
    get: (token: string, lat: number, lon: number) =>
      request<WeatherContext>(`/weather?lat=${lat}&lon=${lon}`, token),
  },

  trends: {
    get: (token: string, location?: string) =>
      request<AITrendOutput>(`/trends${location ? `?location=${encodeURIComponent(location)}` : ''}`, token),
  },

  wardrobe: {
    get:    (token: string) =>
      request<WardrobeItem[]>('/wardrobe', token),
    
    add:    (token: string, data: CreateWardrobeItemRequest) =>
      request<WardrobeItem>('/wardrobe', token, { method: 'POST', body: JSON.stringify(data) }),
    
    delete: (token: string, id: string) =>
      request<void>(`/wardrobe/${id}`, token, { method: 'DELETE' }),
  },
}
