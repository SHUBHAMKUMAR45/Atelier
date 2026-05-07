import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Typography } from '../components/ui/Typography';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  async function handleSignUp() {
    if (!isLoaded || loading) return;
    setLoading(true); setError(null);
    try {
      await signUp.create({ firstName, lastName, emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setLoading(false); }
  }

  async function handleVerify() {
    if (!isLoaded || loading) return;
    setLoading(true); setError(null);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/onboarding/style' as any);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Hero image section */}
          <View className="h-48 relative">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop' }}
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
          <View className="flex-1 bg-white -mt-5 rounded-t-[24px] px-6 pt-8 pb-10 shadow-[0_-4px_24px_rgba(17,17,17,0.08)]">
            <Typography variant="heading" className="text-2xl mb-1">
              {pendingVerification ? 'Verify Email' : 'Join Atelier'}
            </Typography>
            <Typography variant="body" className="mb-6 text-secondary">
              {pendingVerification 
                ? 'Enter the verification code sent to your email.' 
                : 'Create your luxury styling profile'
              }
            </Typography>

            {!pendingVerification ? (
              <>
                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Alex"
                      leftIcon={<User size={18} color="#6B7280" />}
                      className="mb-0"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Johnson"
                      className="mb-0"
                    />
                  </View>
                </View>
                
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
                />

                {error && <Typography variant="caption" className="text-error text-center font-dmsans-medium mb-3">{error}</Typography>}

                <Button 
                  label="Create Account" 
                  onPress={handleSignUp} 
                  loading={loading} 
                  className="w-full h-14 mt-2 mb-5"
                />

                <View className="flex-row justify-center items-center">
                  <Typography variant="body" className="text-secondary">Already established? </Typography>
                  <TouchableOpacity onPress={() => router.push('/sign-in')} hitSlop={10}>
                    <Typography variant="bodyBold" className="text-primary">Log In</Typography>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Input
                  label="Verification Code"
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  className="mb-6 text-center text-xl tracking-widest font-dmsans-bold"
                />
                
                {error && <Typography variant="caption" className="text-error text-center font-dmsans-medium mb-3">{error}</Typography>}

                <Button 
                  label="Verify Email" 
                  onPress={handleVerify} 
                  loading={loading} 
                  className="w-full h-14 mb-5"
                />
                <TouchableOpacity onPress={() => setPendingVerification(false)}>
                  <Typography variant="bodyBold" className="text-secondary text-center">Back to sign up</Typography>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
