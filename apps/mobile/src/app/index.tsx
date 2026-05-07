import React from 'react';
import { View, Image, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';

export default function LandingScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/style' as any);
  };

  const handleSignIn = async () => {
    await Haptics.selectionAsync();
    router.push('/sign-in');
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      
      {/* Hero Image */}
      <Animated.View entering={FadeIn.duration(1000)} className="absolute top-0 left-0 right-0 h-[65%]">
        <Image
          source={require('../../assets/atelier_hero.png')}
          className="w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(245,245,243,0.8)', '#F5F5F3']}
          className="absolute bottom-0 left-0 right-0 h-48"
        />
      </Animated.View>

      <SafeAreaView className="flex-1 justify-between px-6 pt-4 pb-8">
        {/* Top Logo */}
        <Animated.View entering={FadeInDown.delay(300).duration(800)}>
          <Typography variant="display" className="text-4xl ml-2">N</Typography>
        </Animated.View>

        {/* Content */}
        <View className="mt-auto pb-4">
          <Animated.View entering={FadeInUp.delay(500).duration(800)}>
            <Typography variant="display" className="text-5xl uppercase tracking-tight mb-2">
              AI FASHION{"\n"}STYLIST
            </Typography>
            <Typography variant="subheading" className="text-secondary mt-2 mb-10">
              Premium. Personal.{"\n"}AI-Powered.
            </Typography>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).duration(800)} className="gap-6 mt-6">
            <Button 
              label="Get Started" 
              onPress={handleGetStarted} 
              className="w-full h-14"
            />
            
            <TouchableOpacity 
              onPress={handleSignIn} 
              activeOpacity={0.7}
              className="items-center"
            >
              <Typography variant="bodyBold" className="text-primary text-[15px]">
                Sign In
              </Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
