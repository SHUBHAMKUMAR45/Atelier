import {
  View, Text, Image, ScrollView,
  TouchableOpacity, StyleSheet, Share, Dimensions,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useAuth }        from '@clerk/clerk-expo'
import { Haptics }       from '../lib/haptics'
import { ArrowLeft, Share2, ThumbsUp, ThumbsDown, Sparkles, Heart } from 'lucide-react-native'
import { mobileApi }      from '../lib/api-client'
import { useFeedback }    from '../hooks'
import { COLORS, SHADOWS, SPACING } from '../theme'
import type { OutfitRecommendation } from '../../../../packages/shared/src/schemas'

const { width } = Dimensions.get('window')

const CATEGORY_EMOJI: Record<string, string> = {
  top: '👕', bottom: '👖', shoes: '👟',
  outerwear: '🧥', dress: '👗', suit: '🤵', accessory: '💍',
}

export default function OutfitDetailScreen() {
  const { id }          = useLocalSearchParams<{ id: string }>()
  const router          = useRouter()
  const { getToken }    = useAuth()
  const { submit }      = useFeedback()
  const [rec, setRec]   = useState<OutfitRecommendation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getToken().then(token => {
      if (!token) return
      return mobileApi.recommend.getById(token, id)
    }).then(r => {
      if (r) setRec(r)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id, getToken])

  async function handleFeedback(rating: 'like' | 'dislike') {
    if (!rec) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await submit(rec._id, rating)
    setRec(prev => prev ? { ...prev, feedback: { ...prev.feedback, rating } } : null)
  }

  async function handleShare() {
    if (!rec) return
    await Share.share({
      title:   rec.outfit.title,
      message: `Check out this outfit from Atelier AI: ${rec.outfit.title} — ${rec.outfit.description}`,
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.brand} />
          <Text style={styles.loadingText}>Synthesizing look…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!rec) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtnOnly} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Outfit not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const { outfit, weatherContext, occasion } = rec

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Nav Header Overlay */}
        <View style={styles.navRowStrip}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={COLORS.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
            <Share2 size={20} color={COLORS.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <View style={styles.imageBlock}>
          {rec.imageUrl ? (
            <Image source={{ uri: rec.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Sparkles size={48} color={COLORS.brand} opacity={0.2} />
            </View>
          )}
          <View style={styles.occasionBadgeStrip}>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>{occasion}</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeText}>{weatherContext.temp}°C</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Main Info */}
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>AI CURATED LOOK</Text>
            <Text style={styles.title}>{outfit.title}</Text>
            <Text style={styles.description}>{outfit.description}</Text>
          </View>

          {/* Action Row */}
          <View style={styles.feedbackRow}>
            <TouchableOpacity
              style={[styles.feedBtn, rec.feedback.rating === 'like' && styles.feedBtnLiked]}
              onPress={() => handleFeedback('like')}
              activeOpacity={0.8}
            >
              <Heart 
                size={20} 
                color={rec.feedback.rating === 'like' ? '#FFFFFF' : COLORS.primary} 
                fill={rec.feedback.rating === 'like' ? '#FFFFFF' : 'transparent'}
              />
              <Text style={[styles.feedText, rec.feedback.rating === 'like' && { color: '#FFFFFF' }]}>
                {rec.feedback.rating === 'like' ? 'Saved' : 'Save Look'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.feedBtn, rec.feedback.rating === 'dislike' && styles.feedBtnDisliked]}
              onPress={() => handleFeedback('dislike')}
              activeOpacity={0.8}
            >
              <ThumbsDown 
                size={20} 
                color={rec.feedback.rating === 'dislike' ? '#FFFFFF' : COLORS.primary} 
              />
            </TouchableOpacity>
          </View>

          {/* The Pieces List */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>The Look</Text>
            <Text style={styles.itemCount}>{outfit.items.length} items</Text>
          </View>
          
          {outfit.items.map((item, i) => (
            <View key={i} style={styles.itemCard}>
              <View style={styles.itemInner}>
                <View style={styles.emojiBox}>
                  <Text style={styles.itemEmoji}>{CATEGORY_EMOJI[item.category] ?? '👔'}</Text>
                </View>
                <View style={styles.itemMain}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{item.priceRange}</Text>
                  </View>
                  <Text style={styles.itemSubText} numberOfLines={2}>{item.description}</Text>
                  {item.material && (
                    <View style={styles.miniBadge}>
                      <Text style={styles.miniBadgeText}>{item.material}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
              </View>
            </View>
          ))}

          {/* Tips Section */}
          {outfit.stylingTips.length > 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>Stylist Tips</Text>
              <View style={styles.tipsCard}>
                {outfit.stylingTips.map((tip, i) => (
                  <View key={i} style={styles.tipLine}>
                    <Sparkles size={14} color={COLORS.brand} />
                    <Text style={styles.tipLineText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Palette View */}
          <View style={styles.paletteSection}>
            <Text style={styles.sectionTitle}>Color Palette</Text>
            <View style={styles.paletteGroup}>
              {outfit.colorPalette.map((color, i) => (
                <View key={i} style={styles.paletteSlot}>
                  <View style={[styles.swatchFull, { backgroundColor: color }]} />
                  <Text style={styles.hexText}>{color}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 13, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 2 },
  
  backBtnOnly: { 
    margin: 20, width: 44, height: 44, borderRadius: 14, 
    alignItems: 'center', justifyContent: 'center', 
    backgroundColor: COLORS.secondaryBackground,
  },

  navRowStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center', justifyContent: 'center',
  },

  imageBlock: { 
    position: 'relative', 
    height: 460, 
    marginHorizontal: 24, 
    borderRadius: 24, 
    overflow: 'hidden', 
    ...SHADOWS.card 
  },
  heroImage:   { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.secondaryBackground },
  
  occasionBadgeStrip: {
    position: 'absolute', bottom: 20, left: 20,
    flexDirection: 'row', gap: 8,
  },
  badgeItem: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  badgeText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' },

  body: { padding: 24, paddingBottom: 100 },
  titleBlock: { marginBottom: 32 },
  eyebrow: {
    fontSize: 12, fontWeight: '800', color: COLORS.brand,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
  },
  title: { 
    fontSize: 32, fontWeight: '900', color: COLORS.primary, marginBottom: 12, lineHeight: 38,
    letterSpacing: -0.5,
  },
  description: { fontSize: 16, color: COLORS.secondary, lineHeight: 24, fontWeight: '600' },

  feedbackRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  feedBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 24,
    backgroundColor: COLORS.secondaryBackground,
  },
  feedBtnLiked: { backgroundColor: COLORS.brand },
  feedBtnDisliked: { backgroundColor: COLORS.primary },
  feedText:      { fontSize: 15, fontWeight: '900', color: COLORS.primary },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  itemCount:    { fontSize: 13, fontWeight: '700', color: COLORS.secondary },

  itemCard: {
    borderRadius: 24, marginBottom: 12,
    backgroundColor: COLORS.secondaryBackground,
    padding: 16,
    ...SHADOWS.minimal,
  },
  itemInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emojiBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.minimal,
  },
  itemEmoji:   { fontSize: 32 },
  itemMain:    { flex: 1 },
  itemTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName:    { fontSize: 16, fontWeight: '900', color: COLORS.primary, flex: 1 },
  itemPrice:   { fontSize: 11, fontWeight: '900', color: COLORS.brand },
  itemSubText: { fontSize: 13, color: COLORS.secondary, fontWeight: '500', marginTop: 2 },
  miniBadge: {
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, backgroundColor: '#FFFFFF',
  },
  miniBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.secondary, textTransform: 'uppercase' },
  colorSwatch:   { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#FFFFFF' },

  tipsSection: { marginTop: 32 },
  tipsCard: {
    borderRadius: 24, padding: 24, 
    backgroundColor: '#FFFFFF',
    ...SHADOWS.minimal,
  },
  tipLine: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tipLineText: { fontSize: 15, color: COLORS.primary, flex: 1, lineHeight: 22, fontWeight: '700' },

  paletteSection: { marginTop: 40 },
  paletteGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  paletteSlot:  { alignItems: 'center', gap: 8 },
  swatchFull:   { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: '#FFFFFF', ...SHADOWS.minimal },
  hexText:      { fontSize: 10, fontWeight: '900', color: COLORS.secondary, letterSpacing: 0.5 },
})
