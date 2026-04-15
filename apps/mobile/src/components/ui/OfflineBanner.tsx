import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView
} from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { COLORS, SPACING } from '../../theme'

interface OfflineBannerProps {
  pendingCount?: number
  onRetry?:      () => void
}

export function OfflineBanner({ pendingCount = 0, onRetry }: OfflineBannerProps) {
  const [isOffline, setIsOffline]     = useState(false)
  const [isSyncing, setIsSyncing]     = useState(false)
  const translateY = useState(new Animated.Value(-100))[0]

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false
      setIsOffline(offline)
      Animated.spring(translateY, {
        toValue:  offline ? 0 : -100,
        useNativeDriver: true,
        bounciness: 0,
      }).start()
    })
    return unsub
  }, [translateY])

  const handleRetry = useCallback(async () => {
    if (!onRetry) return
    setIsSyncing(true)
    try { onRetry() } finally { setIsSyncing(false) }
  }, [onRetry])

  if (!isOffline) return null

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Offline</Text>
            {pendingCount > 0 && (
              <Text style={styles.subtitle}>
                {pendingCount} item{pendingCount !== 1 ? 's' : ''} waiting to sync
              </Text>
            )}
          </View>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void handleRetry()}
              disabled={isSyncing}
              activeOpacity={0.7}
            >
              <Text style={styles.retryText}>{isSyncing ? '...' : 'Retry'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    backgroundColor: 'rgba(255, 59, 48, 0.95)', // iOS standard red
    zIndex:          1000,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop:      SPACING.sm, // Add minimal padding below safe area
  },
  textContainer:  { flex: 1, justifyContent: 'center' },
  title:          { color: COLORS.surface, fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  subtitle:       { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical:   6,
    borderRadius:      16,
  },
  retryText: { color: COLORS.surface, fontSize: 12, fontWeight: '600' },
})
