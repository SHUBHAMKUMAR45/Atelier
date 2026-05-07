import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';

// Mock data
const STYLES = [
  { id: 'minimal', label: 'Minimal', image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80' },
  { id: 'classic', label: 'Classic', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80' },
  { id: 'streetwear', label: 'Streetwear', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80' },
  { id: 'smart', label: 'Smart', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&q=80' },
];

const COLORS_PALETTE = [
  '#2563EB', '#E5E7EB', '#FCD34D', '#B45309', '#78350F',
  '#064E3B', '#0F172A', '#111111', '#9CA3AF', '#F59E0B'
];

export default function StyleOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [selectedStyle, setSelectedStyle] = useState('minimal');
  const [height, setHeight] = useState("5'10\" (178 cm)");
  const [weight, setWeight] = useState("176 lbs (80 kg)");
  const [bodyType, setBodyType] = useState('Athletic');
  const [selectedColors, setSelectedColors] = useState<string[]>(['#2563EB', '#111111', '#064E3B']);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      router.replace('/(tabs)');
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const toggleColor = (color: string) => {
    Haptics.selectionAsync();
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2" hitSlop={20}>
          <ChevronLeft size={24} color="#111111" strokeWidth={2} />
        </TouchableOpacity>
        <Typography variant="label" className="text-secondary">
          Onboarding {step}/3
        </Typography>
        <View className="w-8" /> {/* Placeholder for balance */}
      </View>

      {/* Progress Bar */}
      <View className="px-6 flex-row gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <View 
            key={s} 
            className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-border'}`} 
          />
        ))}
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Step 1: Style */}
        {step === 1 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} layout={Layout}>
            <Typography variant="heading" className="text-3xl mb-2">What's Your{"\n"}Style?</Typography>
            <Typography variant="body" className="mb-8">Choose the styles you love</Typography>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedStyle(style.id);
                    }}
                    activeOpacity={0.9}
                    className="w-[48%]"
                  >
                    <View className={`rounded-[20px] overflow-hidden bg-white border ${isSelected ? 'border-primary' : 'border-transparent'}`}>
                      <Image
                        source={{ uri: style.image }}
                        className="w-full aspect-[4/5] opacity-90"
                        contentFit="cover"
                        transition={200}
                      />
                      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/90">
                        <Typography variant="bodyBold" className="text-center">{style.label}</Typography>
                      </View>
                      {isSelected && (
                        <View className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full items-center justify-center">
                          <Check size={14} color="white" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Measurements */}
        {step === 2 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} layout={Layout}>
            <Typography variant="heading" className="text-3xl mb-2">Your{"\n"}Measurements</Typography>
            <Typography variant="body" className="mb-8">Help us personalize your fits</Typography>

            <View className="gap-6">
              <View>
                <Typography variant="bodyBold" className="mb-2 ml-1 text-secondary">Height</Typography>
                <View className="h-14 rounded-2xl border border-border bg-white px-4 justify-center">
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    className="font-dmsans text-base text-primary"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View>
                <Typography variant="bodyBold" className="mb-2 ml-1 text-secondary">Weight</Typography>
                <View className="h-14 rounded-2xl border border-border bg-white px-4 justify-center">
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    className="font-dmsans text-base text-primary"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View>
                <Typography variant="bodyBold" className="mb-2 ml-1 text-secondary">Body Type</Typography>
                <View className="h-14 rounded-2xl border border-border bg-white px-4 flex-row items-center justify-between">
                  <Typography variant="bodyBold" className="text-base">{bodyType}</Typography>
                  <ChevronLeft size={20} color="#6B7280" style={{ transform: [{ rotate: '-90deg' }] }} />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 3: Colors */}
        {step === 3 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutLeft} layout={Layout}>
            <Typography variant="heading" className="text-3xl mb-2">Preferred{"\n"}Colors</Typography>
            <Typography variant="body" className="mb-8">Select your favorite colors</Typography>

            <View className="flex-row flex-wrap gap-4 mt-4">
              {COLORS_PALETTE.map((color) => {
                const isSelected = selectedColors.includes(color);
                return (
                  <TouchableOpacity
                    key={color}
                    onPress={() => toggleColor(color)}
                    activeOpacity={0.8}
                    className={`w-14 h-14 rounded-full items-center justify-center ${isSelected ? 'border-[3px] border-primary' : 'border border-transparent'}`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check size={20} color={color === '#FFFFFF' || color === '#E5E7EB' ? '#111111' : '#FFFFFF'} strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer Action */}
      <View className="px-6 pt-4 pb-2">
        <Button 
          label={step === 3 ? "Get Started" : "Next"} 
          onPress={handleNext}
          variant={step === 3 ? "primary" : "primary"} // In reference, Next is accent blue, Get Started is black. 
          className={`w-full h-14 ${step < 3 ? 'bg-accent' : 'bg-primary'}`}
        />
      </View>
    </SafeAreaView>
  );
}
