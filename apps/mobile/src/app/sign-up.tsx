import { useState }       from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Dimensions,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { useSignUp }      from '@clerk/clerk-expo'
import { useRouter }      from 'expo-router'
import { Haptics }       from '../lib/haptics'
import { COLORS, SHADOWS, SPACING } from '../theme'

const { width } = Dimensions.get('window')

type Step = 'form' | 'verify'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router                          = useRouter()

  const [firstName, setFirstName]       = useState('')
  const [lastName, setLastName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode]                 = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)

  async function onSignUpPress() {
    if (!isLoaded || loading) return
    setLoading(true)
    setError(null)

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? 'Registration failed')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  async function onPressVerify() {
    if (!isLoaded || loading) return
    setLoading(true)
    setError(null)

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code })
      if (completeSignUp.status !== 'complete') {
        throw new Error('Verification failed')
      }
      await setActive({ session: completeSignUp.createdSessionId })
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? 'Invalid code')
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.brandName}>Atelier</Text>
            <Text style={styles.tagline}>CREATE YOUR IDENTITY</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formContainer}>
              {!pendingVerification ? (
                <>
                  <Text style={styles.welcomeTitle}>Create Account</Text>
                  <Text style={styles.welcomeSub}>Join common of 10k+ fashion enthusiasts</Text>

                  <View style={styles.form}>
                    <View style={styles.row}>
                      <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>First Name</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="John"
                            placeholderTextColor={COLORS.secondary}
                          />
                        </View>
                      </View>
                      <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Last Name</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Doe"
                            placeholderTextColor={COLORS.secondary}
                          />
                        </View>
                      </View>
                    </View>

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
                      onPress={onSignUpPress}
                      disabled={loading || !email || !password || !firstName}
                      activeOpacity={0.8}
                      style={[styles.btn, (loading || !email || !password || !firstName) && styles.btnDisabled]}
                    >
                      <Text style={styles.btnText}>
                        {loading ? 'Processing...' : 'Create Account'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.welcomeTitle}>Verify Email</Text>
                  <Text style={styles.welcomeSub}>Enter the 6-digit code sent to your inbox</Text>

                  <View style={styles.form}>
                    <View style={styles.field}>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.input, styles.codeInput]}
                          value={code}
                          onChangeText={setCode}
                          placeholder="000000"
                          placeholderTextColor={COLORS.secondary}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    {error && <Text style={styles.error}>{error}</Text>}

                    <TouchableOpacity
                      onPress={onPressVerify}
                      disabled={loading || code.length < 6}
                      activeOpacity={0.8}
                      style={[styles.btn, (loading || code.length < 6) && styles.btnDisabled]}
                    >
                      <Text style={styles.btnText}>
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.footerLink}
                onPress={() => router.push('/sign-in')}
              >
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Text style={styles.footerHighlight}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.secondaryBackground },
  kav:           { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40, justifyContent: 'center', minHeight: '100%' },

  brandSection: { alignItems: 'center', marginBottom: 32 },
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
  brandName: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  tagline:   { fontSize: 10, fontWeight: '800', color: COLORS.secondary, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...SHADOWS.card,
  },
  formContainer: { padding: 32 },
  welcomeTitle:  { fontSize: 24, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  welcomeSub:    { fontSize: 14, color: COLORS.secondary, textAlign: 'center', marginTop: 8, fontWeight: '600' },

  form:  { gap: 20, marginTop: 32 },
  row:   { flexDirection: 'row', gap: 12 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12, fontWeight: '800', color: COLORS.primary, marginLeft: 4,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '900',
  },

  error: { fontSize: 14, color: COLORS.error, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  btn: {
    backgroundColor: COLORS.brand,
    borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  footerLink:      { alignItems: 'center', marginTop: 24 },
  footerText:      { fontSize: 14, color: COLORS.secondary, fontWeight: '600' },
  footerHighlight: { color: COLORS.brand, fontWeight: '900' },
})
