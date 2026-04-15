import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { useRouter }      from 'expo-router'
import { Sparkles, Info } from 'lucide-react-native'
import { useRecommend }   from '../hooks'
import { useRecommendStore } from '../store'
import { OccasionEnum }   from '../../../../packages/shared/src/schemas'
import { COLORS, SHADOWS } from '../theme'
import type { z }         from 'zod'

type Occasion = z.infer<typeof OccasionEnum>

const OCCASIONS: Array<{ value: Occasion; label: string; emoji: string; desc: string }> = [
  { value: 'casual',  label: 'Casual',  emoji: '☕', desc: 'Everyday ease' },
  { value: 'work',    label: 'Work',    emoji: '💼', desc: 'Polished & pro' },
  { value: 'date',    label: 'Date',    emoji: '🌹', desc: 'Elevated & romantic' },
  { value: 'party',   label: 'Party',   emoji: '✨', desc: 'Bold & festive' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌿', desc: 'Practical & active' },
  { value: 'gym',     label: 'Gym',     emoji: '⚡', desc: 'Performance first' },
  { value: 'travel',  label: 'Travel',  emoji: '✈️', desc: 'Versatile & easy' },
  { value: 'wedding', label: 'Wedding', emoji: '🤍', desc: 'Elegant & graceful' },
]

const STEP_LABELS: Record<string, string> = {
  analyzing:  'Analyzing your profile…',
  styling:    'Curating the perfect look…',
  finalizing: 'Adding finishing touches…',
  done:       'Your look is ready ✦',
  error:      'Something went wrong',
}

export default function RecommendScreen() {
  const router           = useRouter()
  const { generate }     = useRecommend()
  const { isGenerating, step, error } = useRecommendStore()
  const [occasion, setOccasion]       = useState<Occasion | null>(null)
  const [description, setDescription] = useState('')

  async function handleGenerate() {
    if (!occasion) return
    const result = await generate({
      occasion,
      description: description.trim() || undefined,
    })
    if (result) {
      router.push({
        pathname: '/outfit/[id]',
        params:   { id: result._id },
      })
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AI Styling Session</Text>
          <Text style={styles.title}>What's the{'\n'}occasion?</Text>
        </View>

        {/* Occasion grid */}
        <View style={styles.grid}>
          {OCCASIONS.map((occ) => {
            const active = occasion === occ.value
            return (
              <TouchableOpacity
                key={occ.value}
                style={[
                  styles.occasionCard,
                  active && styles.occasionCardActive
                ]}
                onPress={() => setOccasion(occ.value)}
                activeOpacity={0.7}
              >
                <View style={styles.occasionInner}>
                  <Text style={styles.occasionEmoji}>{occ.emoji}</Text>
                  <Text style={[styles.occasionLabel, active && styles.occasionLabelActive]}>
                    {occ.label}
                  </Text>
                  <Text style={[styles.occasionDesc, active && styles.occasionDescActive]}>
                    {occ.desc}
                  </Text>
                </View>
                {active && (
                  <View style={styles.activeIndicator}>
                    <Sparkles size={12} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Notes input */}
        <View style={styles.notesSection}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Style notes (optional)</Text>
            <Info size={14} color={COLORS.secondary} />
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. 'important client meeting, prefer navy tones'"
              placeholderTextColor={COLORS.secondary}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, (!occasion || isGenerating) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!occasion || isGenerating}
          activeOpacity={0.9}
        >
          <View style={styles.generateContent}>
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Sparkles size={18} color="#FFFFFF" strokeWidth={2.5} />
            )}
            <Text style={styles.generateText}>
              {isGenerating ? (STEP_LABELS[step] ?? 'Styling…') : 'Generate My Look'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Progress bar */}
        {isGenerating && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: step === 'analyzing' ? '33%' : step === 'styling' ? '66%' : '100%',
                  }
                ]} 
              />
            </View>
            <Text style={styles.stepText}>{STEP_LABELS[step]}</Text>
          </View>
        )}

        {/* Error */}
        {error && !isGenerating && (
          <View style={styles.errorContainer}>
            <View style={styles.errorInner}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleGenerate} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  scroll:  { flex: 1 },
  content: { padding: 24, paddingBottom: 120 },

  header:  { marginBottom: 32 },
  eyebrow: {
    fontSize: 12, fontWeight: '800', color: COLORS.brand,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
  title: {
    fontSize: 32, fontWeight: '900',
    color: COLORS.primary, lineHeight: 38,
    letterSpacing: -1,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32,
  },
  occasionCard: {
    width:           '48%',
    height:          130,
    borderRadius:    24,
    backgroundColor: COLORS.secondaryBackground,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    ...SHADOWS.minimal,
  },
  occasionCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.brand,
    borderWidth: 1.5,
  },
  occasionInner: {
    flex: 1,
    justifyContent: 'center',
  },
  occasionEmoji:  { fontSize: 32, marginBottom: 8 },
  occasionLabel: {
    fontSize: 16, fontWeight: '900',
    color: COLORS.primary, marginBottom: 4,
  },
  occasionLabelActive: { color: COLORS.primary },
  occasionDesc: { fontSize: 11, color: COLORS.secondary, fontWeight: '700' },
  occasionDescActive: { color: COLORS.secondary },
  
  activeIndicator: {
    position: 'absolute', top: 12, right: 12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
  },

  notesSection: { marginBottom: 32 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  inputLabel: {
    fontSize: 12, fontWeight: '800', color: COLORS.primary,
  },
  inputWrapper: {
    borderRadius:    20,
    backgroundColor: COLORS.secondaryBackground,
    minHeight:       120,
  },
  input: {
    padding:         20,
    fontSize:        16,
    color:           COLORS.primary,
    textAlignVertical: 'top',
    fontWeight: '600',
  },
  charCount: {
    fontSize: 11, color: COLORS.secondary,
    textAlign: 'right', marginTop: 8, fontWeight: '700',
  },

  generateBtn:         { borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  generateBtnDisabled: { opacity: 0.5 },
  generateContent: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
    paddingVertical: 20,
    backgroundColor: COLORS.primary,
  },
  generateText: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },

  progressContainer: { marginTop: 8, alignItems: 'center' },
  progressBar: {
    height: 4, width: '100%', borderRadius: 2, backgroundColor: COLORS.secondaryBackground,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 2, backgroundColor: COLORS.brand,
  },
  stepText: { fontSize: 13, color: COLORS.primary, fontWeight: '900', marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },

  errorContainer: {
    borderRadius:    20,
    marginTop: 16,
    backgroundColor: COLORS.error + '10',
    borderWidth: 1, borderColor: COLORS.error,
  },
  errorInner: {
    padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  errorText:  { fontSize: 14, color: COLORS.error, flex: 1, fontWeight: '800' },
  retryBtn:   { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.error, borderRadius: 12 },
  retryText:  { fontSize: 12, color: '#FFFFFF', fontWeight: '900', textTransform: 'uppercase' },
})
