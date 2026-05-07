import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Typography } from '../../components/ui/Typography';

const TRENDS = [
  { id: '1', title: 'Casual Friday', subtitle: 'Try this style', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80' },
  { id: '2', title: 'Monochrome Chic', subtitle: 'Try this style', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80' },
  { id: '3', title: 'Minimalist Essentials', subtitle: 'Try this style', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&q=80' },
];

export default function TrendsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Typography variant="heading" className="text-2xl">
          Trends
        </Typography>
        <TouchableOpacity className="p-2 -mr-2" hitSlop={20}>
          <Settings size={24} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {TRENDS.map((trend, index) => (
          <Animated.View 
            key={trend.id} 
            entering={FadeInUp.delay(100 * (index + 1)).duration(600)}
            className="mb-8"
          >
            <View className="w-full aspect-[16/9] rounded-[20px] overflow-hidden bg-white mb-4">
              <Image 
                source={{ uri: trend.image }} 
                className="w-full h-full" 
                contentFit="cover" 
              />
            </View>
            <Typography variant="bodyBold" className="text-lg mb-1">
              {trend.title}
            </Typography>
            <Typography variant="body" className="text-secondary">
              {trend.subtitle}
            </Typography>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
