import { Tabs }             from 'expo-router'
import { BlurView }         from 'expo-blur'
import { StyleSheet, View, Platform } from 'react-native'
import { useUserStore }     from '../../store'
import { COLORS, SHADOWS }  from '../../theme'
import {
  LayoutDashboard, Sparkles, History, User, Shirt, TrendingUp,
} from 'lucide-react-native'

export default function TabLayout() {
  const { quota } = useUserStore()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: styles.label,
        sceneContainerStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, focused }) => <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="recommend"
        options={{
          title: 'Style Me',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Sparkles size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              {(quota?.remaining ?? 0) > 0 && (
                <View style={[styles.dot, { backgroundColor: COLORS.brand }]} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color, focused }) => <TrendingUp size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, focused }) => <Shirt size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => <History size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 0,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    ...SHADOWS.minimal,
  },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  dot: {
    position: 'absolute', top: -1, right: -4,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.brand,
  },
})
