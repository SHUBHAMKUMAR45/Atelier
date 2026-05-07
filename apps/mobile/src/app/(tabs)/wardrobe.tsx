import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Typography } from '../../components/ui/Typography';

const FILTERS = ['Casual', 'Street', 'Smart'];

const ITEMS = [
  { id: '1', title: 'White Overshirt', price: '$80.22', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80', height: 200 },
  { id: '2', title: 'Urban Casual Fit', price: '$90.00', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80', height: 160 },
  { id: '3', title: 'Classic Denim', price: '$70.00', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&q=80', height: 180 },
];

export default function WardrobeScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('Casual');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2" hitSlop={20}>
          <ChevronLeft size={24} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
        <Typography variant="heading" className="text-xl">
          Wardrobe
        </Typography>
        <View className="w-8" />
      </View>

      {/* Filters */}
      <View className="px-6 mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
                className={`px-6 py-2.5 rounded-full ${isActive ? 'bg-accent border border-accent' : 'bg-transparent border border-border'}`}
              >
                <Typography variant="bodyBold" className={isActive ? 'text-white' : 'text-secondary'}>
                  {filter}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Editorial Grid (Masonry-like) */}
        <View className="flex-row justify-between">
          
          {/* Left Column */}
          <View className="w-[48%] gap-6">
            <Animated.View entering={FadeInUp.delay(100).duration(600)}>
              <View className={`rounded-[20px] overflow-hidden bg-white mb-3`} style={{ height: ITEMS[0]!.height }}>
                <Image source={{ uri: ITEMS[0]!.image }} className="w-full h-full" contentFit="cover" />
              </View>
              <Typography variant="bodyBold" className="mb-1">{ITEMS[0]!.title}</Typography>
              <Typography variant="body" className="text-secondary">{ITEMS[0]!.price}</Typography>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(600)}>
              <View className={`rounded-[20px] overflow-hidden bg-white mb-3`} style={{ height: ITEMS[2]!.height }}>
                <Image source={{ uri: ITEMS[2]!.image }} className="w-full h-full" contentFit="cover" />
              </View>
              <Typography variant="bodyBold" className="mb-1">{ITEMS[2]!.title}</Typography>
              <Typography variant="body" className="text-secondary">{ITEMS[2]!.price}</Typography>
            </Animated.View>
          </View>

          {/* Right Column */}
          <View className="w-[48%] gap-6">
            <Animated.View entering={FadeInUp.delay(200).duration(600)}>
              <View className={`rounded-[20px] overflow-hidden bg-white mb-3`} style={{ height: ITEMS[1]!.height }}>
                <Image source={{ uri: ITEMS[1]!.image }} className="w-full h-full" contentFit="cover" />
              </View>
              <Typography variant="bodyBold" className="mb-1">{ITEMS[1]!.title}</Typography>
              <Typography variant="body" className="text-secondary">{ITEMS[1]!.price}</Typography>
            </Animated.View>

            {/* Add Item Button */}
            <Animated.View entering={FadeInUp.delay(400).duration(600)}>
              <TouchableOpacity activeOpacity={0.7} className="w-full aspect-[4/5] rounded-[20px] border-2 border-dashed border-border items-center justify-center bg-white">
                <Plus size={32} color="#111111" strokeWidth={1.5} className="mb-2" />
                <Typography variant="bodyBold">Add Item</Typography>
              </TouchableOpacity>
            </Animated.View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
