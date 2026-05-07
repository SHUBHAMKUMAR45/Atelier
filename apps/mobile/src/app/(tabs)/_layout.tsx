import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home, Heart, Plus, ShoppingBag, User } from 'lucide-react-native';

function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-2">
      <Icon size={24} color={focused ? '#111111' : '#9CA3AF'} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

function StyleFAB({ focused }: { focused: boolean }) {
  return (
    <View className={`w-[52px] h-[52px] rounded-full items-center justify-center -mt-6 shadow-md shadow-accent/30 ${focused ? 'bg-accent/90' : 'bg-accent'}`}>
      <Plus size={24} color="#FFFFFF" strokeWidth={3} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 32 : 24,
          left: 24,
          right: 24,
          height: 64,
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          borderTopWidth: 0,
          shadowColor: '#111111',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 24,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} /> }} 
      />
      <Tabs.Screen 
        name="favorites" 
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Heart} focused={focused} /> }} 
      />
      <Tabs.Screen 
        name="stylist" 
        options={{ tabBarIcon: ({ focused }) => <StyleFAB focused={focused} /> }} 
      />
      <Tabs.Screen 
        name="wardrobe" 
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={ShoppingBag} focused={focused} /> }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} /> }} 
      />
      
      {/* Hidden tabs that we navigate to */}
      <Tabs.Screen name="trends" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="recommend" options={{ href: null }} />
    </Tabs>
  );
}
