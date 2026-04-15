import { useState }        from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native'
import { SafeAreaView }    from 'react-native-safe-area-context'
import { useSignIn }       from '@clerk/clerk-expo'
import { useRouter }       from 'expo-router'
import * as Haptics        from 'expo-haptics'
import { COLORS, SHADOWS, SPACING } from '../theme'

const { width } = Dimensions.get('window')

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router                          = useRouter()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)

  async function handleSignIn() {
    if (!isLoaded || loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        router.replace('/(tabs)')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      setError(msg)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.content}>
          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.brandName}>Atelier</Text>
            <Text style={styles.tagline}>THE FUTURE OF WARDROBE</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formContainer}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSub}>Please enter your details to sign in</Text>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@email.com"
                      placeholderTextColor={COLORS.secondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.secondary}
                      secureTextEntry
                    />
                  </View>
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={loading || !email || !password}
                  activeOpacity={0.8}
                  style={[styles.signInBtn, (loading || !email || !password) && styles.signInBtnDisabled]}
                >
                  <Text style={styles.signInText}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signUpLink}
                  onPress={() => router.push('/sign-up')}
                >
                  <Text style={styles.signUpText}>
                    New here?{' '}
                    <Text style={styles.signUpHighlight}>Create account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.secondaryBackground },
  kav:      { flex: 1 },
  content:  { flex: 1, padding: 24, justifyContent: 'center' },

  brandSection: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 64, height: 64, borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.minimal,
  },
  logoDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.brand,
  },
  brandName: { 
    fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5,
  },
  tagline: { 
    fontSize: 10, fontWeight: '800', color: COLORS.secondary, 
    letterSpacing: 2, marginTop: 4, textTransform: 'uppercase'
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...SHADOWS.card,
  },
  formContainer: {
    padding: 32,
  },
  welcomeTitle: { fontSize: 24, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  welcomeSub: { fontSize: 14, color: COLORS.secondary, textAlign: 'center', marginTop: 8, fontWeight: '600' },

  form:       { gap: 20, marginTop: 32 },
  field:      { gap: 8 },
  fieldLabel: {
    fontSize: 12, fontWeight: '800', color: COLORS.primary,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    padding: 16,
    fontSize: 16, color: COLORS.primary,
    fontWeight: '600',
  },

  error: { fontSize: 14, color: COLORS.error, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  signInBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  signInBtnDisabled: { opacity: 0.5 },
  signInText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  signUpLink: { alignItems: 'center', marginTop: 16 },
  signUpText:      { fontSize: 14, color: COLORS.secondary, fontWeight: '600' },
  signUpHighlight: { color: COLORS.brand, fontWeight: '900' },
})
