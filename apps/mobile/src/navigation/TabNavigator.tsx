import { Tabs }             from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { BlurView }         from 'expo-blur'
import {
  LayoutDashboard,
  Sparkles,
  History,
  User,
} from 'lucide-react-native'
import { useUserStore }     from '../store'
import { COLORS }           from '../theme'

function TabIcon({
  icon: Icon,
  focused,
  badge,
}: {
  icon: typeof LayoutDashboard
  focused: boolean
  badge?: number
}) {
  return (
    <View style={styles.iconWrap}>
      <Icon
        size={24}
        color={focused ? COLORS.primary : COLORS.secondary}
        strokeWidth={focused ? 2.5 : 2}
      />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge} />
      )}
    </View>
  )
}

export function TabNavigator() {
  const { quota } = useUserStore()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Studio',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={LayoutDashboard} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="recommend"
        options={{
          title: 'Style',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={Sparkles}
              focused={focused}
              {...(quota?.remaining !== undefined ? { badge: quota.remaining } : {})}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={History} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position:        'absolute',
    borderTopWidth:  StyleSheet.hairlineWidth,
    borderTopColor:  COLORS.border,
    elevation:       0,
    height:          84,
    paddingBottom:   24,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize:   10,
    fontWeight: '600',
  },
  iconWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  badge: {
    position:        'absolute',
    top:             -2,
    right:           -4,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: COLORS.brand,
    borderWidth:     1.5,
    borderColor:     COLORS.surface,
  },
})
