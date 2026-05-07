import "../../global.css"
import { useEffect } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display'
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans'

import { COLORS } from '../theme'
import { ApiAuthConfig } from '../components/auth/ApiAuthConfig'
import { authExpiredEmitter } from '../lib/api-client'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key)
      return item
    } catch (error) {
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value)
    } catch (err) {}
  },
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  })

  const router = useRouter()

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <ClerkProvider publishableKey={process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? ''} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <StatusBar style="dark" />
          <SafeAreaProvider style={{ backgroundColor: COLORS.background }}>
            <ApiAuthConfig />
            <RootNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ClerkProvider>
  )
}

function RootNavigator() {
  const { isSignedIn, isLoaded, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const unsub = authExpiredEmitter.subscribe(async () => {
      try { await signOut() } catch { /* ignore */ }
      router.replace('/sign-in')
    })
    return () => { unsub() }
  }, [signOut, router])

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' }
      }}>
      {isSignedIn ? (
        <>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="outfit/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding/style" options={{ animation: 'slide_from_bottom' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
        </>
      )}
    </Stack>
  )
}

