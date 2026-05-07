import { useEffect } from 'react'
import { useAuth }    from '@clerk/clerk-expo'
import { mobileApi }  from '../../lib/api-client'

/**
 * MOBILE AUTH BRIDGE
 * Synchronizes Clerk session tokens with the unified AtelierClient singleton.
 * This ensures that even if persistence keys change, the API client
 * always uses the SDK-vended session token.
 */
export function ApiAuthConfig() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      // Register Clerk's token getter with the Mobile API singleton
      mobileApi.setTokenProvider(async () => {
        try {
          // fetch current session token from Clerk SDK
          return await getToken()
        } catch (err) {
          console.error('[API-AUTH-MOBILE] Failed to fetch token:', err)
          return null
        }
      })
      if (__DEV__) console.log('[API-AUTH-MOBILE] Dynamic token provider active')
    } else {
      // Clear provider on logout
      mobileApi.setTokenProvider(async () => null)
    }
  }, [isLoaded, isSignedIn, getToken])

  return null // Renderless component
}
