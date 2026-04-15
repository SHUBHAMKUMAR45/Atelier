import { useState, useEffect }  from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert,
} from 'react-native'
import { SafeAreaView }  from 'react-native-safe-area-context'
import { useAuth }       from '@clerk/clerk-expo'
import { Haptics }      from '../lib/haptics'
import { Save, CheckCircle, User, Settings, Ruler, Heart } from 'lucide-react-native'
import { useProfile }    from '../hooks'
import { useUserStore }  from '../store'
import { mobileApi }     from '../lib/api-client'
import { COLORS, SHADOWS, SPACING } from '../theme'
import type { BodyMeasurements, UserPreferences } from '../../../../packages/shared/src/schemas'

const STYLES_LIST = ['casual','formal','streetwear','business','athletic','bohemian','minimalist','vintage'] as const
const OCCASIONS_LIST = ['work','date','party','gym','travel','wedding','casual','outdoor'] as const

export default function ProfileScreen() {
  const { getToken }    = useAuth()
  const { profile }     = useUserStore()
  const { refresh }     = useProfile()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [measurements, setM] = useState<Partial<BodyMeasurements>>({})
  const [prefs, setPrefs]    = useState<Partial<UserPreferences>>({
    styles: [], occasions: [], colors: [], avoidColors: [],
    budget: 'mid', gender: 'prefer-not-to-say',
  })

  useEffect(() => {
    if (profile?.measurements) setM(profile.measurements)
    if (profile?.preferences)  setPrefs(profile.preferences)
  }, [profile])

  async function handleSave() {
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      if (measurements.height && measurements.weight) {
        await mobileApi.profile.updateMeasurements(token, measurements as BodyMeasurements)
      }
      if ((prefs.styles?.length ?? 0) > 0) {
        await mobileApi.profile.updatePreferences(token, prefs as UserPreferences)
      }
      await refresh()
      setSaved(true)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setSaving(false)
    }
  }

  function toggleStyle(s: typeof STYLES_LIST[number]) {
    setPrefs(p => ({
      ...p,
      styles: p.styles?.includes(s) ? p.styles.filter(x => x !== s) : [...(p.styles ?? []), s],
    }))
  }

  function toggleOccasion(o: typeof OCCASIONS_LIST[number]) {
    setPrefs(p => ({
      ...p,
      occasions: p.occasions?.includes(o) ? p.occasions.filter(x => x !== o) : [...(p.occasions ?? []), o],
    }))
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Styling Identity</Text>
            <Text style={styles.title}>{profile?.displayName?.split(' ')[0] ?? 'Premium'}{'\n'}Member</Text>
            <Text style={styles.email}>{profile?.email}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
            <View style={styles.saveBtnInner}>
              {saved
                ? <CheckCircle size={20} color="#FFFFFF" strokeWidth={3} />
                : <Save size={20} color={saving ? 'rgba(255,255,255,0.4)' : '#FFFFFF'} strokeWidth={2.5} />
              }
              <Text style={[styles.saveBtnText, saving && styles.saveBtnTextDisabled]}>
                {saved ? 'Saved' : saving ? '...' : 'Save'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Measurements Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ruler size={18} color={COLORS.brand} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Measurements</Text>
              <Text style={styles.cardSub}>Metric units (cm / kg)</Text>
            </View>
          </View>
          <View style={styles.meaGrid}>
            {([
              { key: 'height', label: 'Height' },
              { key: 'weight', label: 'Weight' },
              { key: 'chest',  label: 'Chest' },
              { key: 'waist',  label: 'Waist' },
              { key: 'hips',   label: 'Hips' },
              { key: 'inseam', label: 'Inseam' },
            ] as const).map(({ key, label }) => (
              <View key={key} style={styles.meaField}>
                <Text style={styles.meaLabel}>{label}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.meaInput}
                    value={String((measurements as Record<string, number>)[key] ?? '')}
                    onChangeText={v => setM(m => ({ ...m, [key]: v ? Number(v) : undefined }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.secondary}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Styles Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Heart size={18} color={COLORS.brand} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Style Vibes</Text>
              <Text style={styles.cardSub}>Select your aesthetic</Text>
            </View>
          </View>
          <View style={styles.chipGrid}>
            {STYLES_LIST.map(s => {
              const active = (prefs.styles ?? []).includes(s)
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleStyle(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Budget Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Text style={{ color: COLORS.brand, fontWeight: '900', fontSize: 18 }}>$</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Target Budget</Text>
              <Text style={styles.cardSub}>Price range preference</Text>
            </View>
          </View>
          <View style={styles.budgetRow}>
            {(['budget', 'mid', 'luxury'] as const).map(b => {
              const active = prefs.budget === b
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.budgetBtn, active && styles.budgetBtnActive]}
                  onPress={() => setPrefs(p => ({ ...p, budget: b }))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.budgetText, active && styles.budgetTextActive]}>
                    {b === 'budget' ? '$' : b === 'mid' ? '$$' : '$$$'}
                  </Text>
                  <Text style={[styles.budgetLabel, active && styles.budgetLabelActive]}>{b}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 120 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 32,
  },
  eyebrow: {
    fontSize: 12, fontWeight: '800', color: COLORS.brand,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
  title: { 
    fontSize: 32, fontWeight: '900', color: COLORS.primary, lineHeight: 38,
    letterSpacing: -1,
  },
  email:  { fontSize: 14, color: COLORS.secondary, fontWeight: '600', marginTop: 8 },
  saveBtn: {
    borderRadius: 14, backgroundColor: COLORS.primary,
    ...SHADOWS.minimal,
  },
  saveBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  saveBtnText:         { fontSize: 13, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' },
  saveBtnTextDisabled: { color: 'rgba(255,255,255,0.4)' },

  card: {
    borderRadius: 24, padding: 24, marginBottom: 16,
    backgroundColor: COLORS.secondaryBackground,
    ...SHADOWS.minimal,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.card,
  },
  cardTitle: { fontSize: 19, fontWeight: '900', color: COLORS.primary },
  cardSub:   { fontSize: 12, color: COLORS.secondary, fontWeight: '700', marginTop: 2 },

  meaGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meaField: { width: '47.5%' },
  meaLabel: {
    fontSize: 11, fontWeight: '800', color: COLORS.secondary,
    textTransform: 'uppercase', marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  meaInput: {
    padding: 14,
    fontSize: 16, color: COLORS.primary,
    fontWeight: '700',
  },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.brand,
  },
  chipText:      { fontSize: 14, fontWeight: '700', color: COLORS.primary, textTransform: 'capitalize' },
  chipTextActive:{ fontSize: 14, fontWeight: '900', color: '#FFFFFF', textTransform: 'capitalize' },

  budgetRow: { flexDirection: 'row', gap: 10 },
  budgetBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 18,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  budgetBtnActive:  { 
    backgroundColor: COLORS.brand,
  },
  budgetText:       { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  budgetTextActive: { color: '#FFFFFF' },
  budgetLabel:      { fontSize: 10, fontWeight: '900', color: COLORS.secondary, textTransform: 'uppercase', marginTop: 2 },
  budgetLabelActive:{ color: '#FFFFFF' },
})
