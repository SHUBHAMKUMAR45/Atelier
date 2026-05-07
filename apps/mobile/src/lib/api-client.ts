import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { AtelierAPI } from '../../../../packages/shared/src'

const API_BASE = (process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:4000').replace(/\/api\/v1\/?$/, '')

// ── Auth expiry event emitter ────────────────────────────────────
// Decouples the API client from React navigation (no circular import).
// The root layout subscribes to this and redirects to sign-in.
type AuthExpiredListener = () => void
const listeners = new Set<AuthExpiredListener>()

export const authExpiredEmitter = {
  emit:        ()                     => listeners.forEach(fn => fn()),
  subscribe:   (fn: AuthExpiredListener) => { listeners.add(fn);    return () => listeners.delete(fn) },
}

/**
 * PRODUCTION-READY UNIFIED CLIENT
 * This instance consumes the shared @ai-fashion/shared package.
 * Authentication logic is handled dynamically by ApiAuthConfig bridge.
 */
export const mobileApi = new AtelierAPI({
  baseUrl: API_BASE,
  getToken: async () => null, // Initialized dynamically by ApiAuthConfig
  onUnauthorized: () => {
    // Clear all local auth state and navigate to sign-in
    // Uses a module-level ref so the router is available at call time
    console.warn('[API] Session expired — redirecting to sign-in')
    // Signal the global auth handler (set up in _layout.tsx)
    authExpiredEmitter.emit()
  },
  debug: __DEV__
})

export { APIError } from '../../../../packages/shared/src'
export type { APIResponse, PaginatedData, QuotaStatus } from '../../../../packages/shared/src'
