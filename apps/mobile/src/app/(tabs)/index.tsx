import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, User } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';

const PILLS = ['Casual', 'Street', 'Smart'];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity className="p-2 -ml-2">
          <Menu size={24} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-border overflow-hidden"
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' }}
            className="w-full h-full"
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Greeting */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <Typography variant="heading" className="text-3xl mt-4 mb-8">
            Good Morning, Alex
          </Typography>
        </Animated.View>

        {/* Hero Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View className="rounded-[20px] overflow-hidden bg-white mb-6">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80' }}
              className="w-full aspect-[4/3]"
              contentFit="cover"
            />
          </View>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <Typography variant="heading" className="text-2xl mb-1">
            Smart Casual
          </Typography>
          <Typography variant="body" className="mb-6 text-secondary">
            Generated for you.
          </Typography>

          {/* Pills */}
          <View className="flex-row gap-3 mb-8">
            {PILLS.map((pill, index) => (
              <View 
                key={pill} 
                className={`px-4 py-2 rounded-full ${index === 0 ? 'bg-muted' : 'border border-border'}`}
              >
                <Typography variant="caption" className={index === 0 ? 'text-primary font-dmsans-medium' : 'text-secondary'}>
                  {pill}
                </Typography>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View className="gap-4">
            <Button 
              label="Style Me Today" 
              className="w-full h-14 bg-accent"
            />
            <Button 
              label="Continue with Google" 
              variant="outline"
              className="w-full h-14 bg-white"
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
