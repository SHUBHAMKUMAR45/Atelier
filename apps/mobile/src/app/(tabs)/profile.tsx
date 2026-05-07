import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Typography } from '../../components/ui/Typography';

const COLORS = ['#2563EB', '#E5E7EB', '#FCD34D', '#FDE68A', '#111111'];

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Typography variant="heading" className="text-2xl">
          Profile
        </Typography>
        <TouchableOpacity className="px-4 py-1.5 rounded-full border border-border">
          <Typography variant="bodyBold" className="text-sm">Edit</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Avatar & Info */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} className="items-center mt-6 mb-10">
          <View className="w-24 h-24 rounded-full overflow-hidden bg-border mb-4">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' }} 
              className="w-full h-full" 
              contentFit="cover" 
            />
          </View>
          <Typography variant="heading" className="text-2xl mb-1">
            Alex Johnson
          </Typography>
          <Typography variant="body" className="text-secondary">
            alex@example.com
          </Typography>
        </Animated.View>

        {/* Measurements */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} className="mb-8">
          <Typography variant="bodyBold" className="mb-4">Measurements</Typography>
          <View className="flex-row justify-between bg-white rounded-2xl p-4 border border-border/50 shadow-sm shadow-black/5">
            <View className="flex-1 items-center border-r border-border">
              <Typography variant="caption" className="mb-1 text-secondary">Height</Typography>
              <Typography variant="bodyBold">5'10"</Typography>
            </View>
            <View className="flex-1 items-center">
              <Typography variant="caption" className="mb-1 text-secondary">Weight</Typography>
              <Typography variant="bodyBold">176 lbs</Typography>
            </View>
          </View>
        </Animated.View>

        {/* Style Preferences */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} className="mb-8">
          <Typography variant="bodyBold" className="mb-4">Style Preferences</Typography>
          <View className="flex-row gap-3">
            <View className="px-5 py-2.5 rounded-full bg-white border border-border/50 shadow-sm shadow-black/5">
              <Typography variant="bodyBold" className="text-primary">Casual</Typography>
            </View>
            <View className="px-5 py-2.5 rounded-full bg-white border border-border/50 shadow-sm shadow-black/5 flex-row items-center gap-1">
              <Typography variant="bodyBold" className="text-primary">Smart casual</Typography>
              <ChevronRight size={16} color="#111111" />
            </View>
          </View>
        </Animated.View>

        {/* Preferred Colors */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} className="mb-8">
          <Typography variant="bodyBold" className="mb-4">Preferred Colors</Typography>
          <View className="flex-row gap-4">
            {COLORS.map((color, index) => (
              <View 
                key={index} 
                className={`w-12 h-12 rounded-full ${color === '#FFFFFF' || color === '#E5E7EB' ? 'border border-border' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
