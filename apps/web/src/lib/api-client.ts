import { AtelierAPI } from '../../../../packages/shared/src/api-client/index'

const API_BASE = (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000').replace(/\/api\/v1\/?$/, '')

/**
 * PRODUCTION-READY UNIFIED CLIENT
 * This instance consumes the shared @ai-fashion/shared package.
 */
export const api = new AtelierAPI({
  baseUrl: API_BASE,
  getToken: async () => null, // Managed by ApiAuthConfig bridge
  debug: process.env.NODE_ENV !== 'production',
  onUnauthorized: () => {
    // Session expired or token invalid — redirect to sign-in.
    // Uses window.location so it works outside React component tree.
    if (typeof window !== 'undefined') {
      console.warn('[API] Session expired — redirecting to /sign-in')
      window.location.href = '/sign-in'
    }
  },
})

export { APIError } from '../../../../packages/shared/src/api-client/types'
export type { 
  APIResponse, 
  PaginatedData,
  QuotaStatus,
} from '../../../../packages/shared/src/api-client/types'

export type {
  UserProfile,
  WardrobeItem,
  OutfitRecommendation,
} from '../../../../packages/shared/src/schemas/index'
