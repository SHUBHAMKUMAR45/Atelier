import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Share } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';

const PILLS = ['Shirt', 'Polo', 'Short sleeve'];

export default function OutfitResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2" hitSlop={20}>
          <ChevronLeft size={24} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
        <Typography variant="heading" className="text-xl">
          Outfit Result
        </Typography>
        <TouchableOpacity className="p-2 -mr-2">
          <Share size={20} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Dominant Image */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <View className="rounded-[20px] overflow-hidden bg-[#E2E8F0] mb-6 mt-4 aspect-square">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80' }} // Polo shirt
              className="w-full h-full"
              contentFit="cover"
            />
          </View>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Typography variant="heading" className="text-2xl mb-4">
            Pale Blue Polo
          </Typography>

          {/* Tags */}
          <View className="flex-row gap-3 mb-8 flex-wrap">
            {PILLS.map((pill) => (
              <View 
                key={pill} 
                className="px-4 py-2 rounded-full border border-border"
              >
                <Typography variant="caption" className="text-secondary">
                  {pill}
                </Typography>
              </View>
            ))}
          </View>

          <View className="w-full h-[1px] bg-border mb-8" />

          {/* Items List */}
          <Typography variant="heading" className="text-xl mb-3">
            Items list
          </Typography>
          <Typography variant="body" className="text-secondary leading-6">
            An oversized shirt with chinos is perfect for a relaxed yet polished look.
          </Typography>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
