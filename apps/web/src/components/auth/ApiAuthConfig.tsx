'use client'

import { useEffect } from 'react'
import { useAuth }    from '@clerk/nextjs'
import { api }        from '../../lib/api-client'

/**
 * BRIDGE COMPONENT
 * Synchronizes Clerk session tokens with the unified AtelierAPI singleton.
 * This component must be placed inside the <ClerkProvider>.
 */
export function ApiAuthConfig() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      // Register Clerk's token getter with the API singleton
      api.setTokenProvider(async () => {
        try {
          return await getToken()
        } catch (err) {
          console.error('[API-AUTH] Failed to fetch Clerk token:', err)
          return null
        }
      })
    } else {
      // Clear token provider if signed out
      api.setTokenProvider(async () => null)
    }
  }, [isLoaded, isSignedIn, getToken])

  return null // Renderless component
}
