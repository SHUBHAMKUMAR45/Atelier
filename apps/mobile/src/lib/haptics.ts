import * as ExpoHaptics from 'expo-haptics'
import { Platform }    from 'react-native'

/**
 * Safe wrapper for Expo Haptics that prevents crashes on unsupported platforms (like Web).
 */
export const Haptics = {
  async impactAsync(style: ExpoHaptics.ImpactFeedbackStyle) {
    if (Platform.OS === 'web') return
    try {
      await ExpoHaptics.impactAsync(style)
    } catch (e) {
      console.warn('Haptics.impactAsync failed', e)
    }
  },

  async notificationAsync(type: ExpoHaptics.NotificationFeedbackType) {
    if (Platform.OS === 'web') return
    try {
      await ExpoHaptics.notificationAsync(type)
    } catch (e) {
      console.warn('Haptics.notificationAsync failed', e)
    }
  },

  async selectionAsync() {
    if (Platform.OS === 'web') return
    try {
      await ExpoHaptics.selectionAsync()
    } catch (e) {
      console.warn('Haptics.selectionAsync failed', e)
    }
  },

  // Export the enums for convenience
  ImpactFeedbackStyle:        ExpoHaptics.ImpactFeedbackStyle,
  NotificationFeedbackType:   ExpoHaptics.NotificationFeedbackType,
}
