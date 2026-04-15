import { useEffect } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Stack }      from 'expo-router'
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider }       from 'react-native-safe-area-context'
import { LinearGradient }         from 'expo-linear-gradient'
import { StatusBar }              from 'expo-status-bar'
import { COLORS } from '../theme'

SplashScreen.preventAutoHideAsync()

const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key) } catch { return null }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value) } catch {/* non-fatal */}
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key) } catch {/* non-fatal */}
  },
}

const CLERK_PUBLISHABLE_KEY = process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? ''

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar style="dark" />
        <SafeAreaProvider style={{ backgroundColor: '#FFFFFF' }}>
          <RootNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  )
}

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.brand} />
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
          <Stack.Screen name="(tabs)"       options={{ animation: 'none' }} />
          <Stack.Screen name="outfit/[id]"  options={{ animation: 'slide_from_right' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
          <Stack.Screen name="sign-up" options={{ animation: 'slide_from_bottom' }} />
        </>
      )}
    </Stack>
  )
}
