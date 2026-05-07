import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!isLoaded || loading) return;
    setLoading(true); setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1">
          {/* Hero image section */}
          <View className="h-60 relative">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop' }}
              className="w-full h-full"
              contentFit="cover"
            />
            <View className="absolute inset-0 bg-[#111111]/40 items-center justify-center">
              <View className="px-6 py-2.5 border-2 border-white/60 rounded-lg">
                <Typography variant="display" className="text-white text-xl tracking-[6px] uppercase">
                  ATELIER
                </Typography>
              </View>
            </View>
          </View>

          {/* Card */}
          <View className="flex-1 bg-white -mt-5 rounded-t-[24px] px-6 pt-8 shadow-[0_-4px_24px_rgba(17,17,17,0.08)]">
            <Typography variant="heading" className="text-2xl mb-1">Welcome back</Typography>
            <Typography variant="body" className="mb-6 text-secondary">Sign in to your personal stylist</Typography>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color="#6B7280" />}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              leftIcon={<Lock size={18} color="#6B7280" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                </TouchableOpacity>
              }
              rightAction={{ label: 'Forgot?', onPress: () => {} }}
            />

            {error && <Typography variant="caption" className="text-error text-center font-dmsans-medium mb-3">{error}</Typography>}

            <Button 
              label="Sign In" 
              onPress={handleSignIn} 
              loading={loading} 
              className="w-full h-14 mt-2 mb-5"
            />

            <View className="flex-row justify-center items-center">
              <Typography variant="body" className="text-secondary">New to Atelier? </Typography>
              <TouchableOpacity onPress={() => router.push('/sign-up')} hitSlop={10}>
                <Typography variant="bodyBold" className="text-primary">Create account</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
