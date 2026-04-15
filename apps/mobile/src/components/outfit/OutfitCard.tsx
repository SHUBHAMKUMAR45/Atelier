import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native'
import * as Haptics       from 'expo-haptics'
import { ThumbsUp, ThumbsDown, Trash2, Heart } from 'lucide-react-native'
import { useFeedback }    from '../../hooks'
import { COLORS, SHADOWS } from '../../theme'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

const { width } = Dimensions.get('window')
const CARD_W    = width - 40

export function OutfitCard({
  recommendation,
  onPress,
  onDelete,
  showActions = true,
}: OutfitCardProps) {
  const { submit }    = useFeedback()
  const { outfit, occasion, weatherContext, imageUrl, imageStatus, feedback } = recommendation

  async function handleFeedback(rating: 'like' | 'dislike') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await submit(recommendation._id, rating)
  }

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* ── Image ─────────────────────────── */}
      <View style={styles.imageContainer}>
        {imageStatus === 'ready' && imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.paletteRow}>
              {outfit.colorPalette.slice(0, 5).map((color, i) => (
                <View
                  key={i}
                  style={[styles.colorDot, { backgroundColor: color }]}
                />
              ))}
            </View>
            {imageStatus === 'generating' && (
              <Text style={styles.generatingText}>CRAFTING LOOK...</Text>
            )}
          </View>
        )}

        {/* Confidence Badge */}
        <View style={styles.badgeTopRight}>
          <View style={styles.matchBadge}>
            <View style={[styles.confidenceDot, {
              backgroundColor: outfit.confidenceScore > 0.8 ? '#10B981' : outfit.confidenceScore > 0.6 ? '#F59E0B' : '#EF4444',
            }]} />
            <Text style={styles.confidenceText}>
              {Math.round(outfit.confidenceScore * 100)}% Match
            </Text>
          </View>
        </View>
      </View>

      {/* ── Content ──────────────────────────────────────── */}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.occasionText}>{occasion.toUpperCase()}</Text>
          <Text style={styles.weatherText}>
            {weatherContext.temp}°C · {weatherContext.condition}
          </Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{outfit.title}</Text>
          {feedback.rating === 'like' && (
            <Heart size={16} color={COLORS.brand} fill={COLORS.brand} />
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{outfit.description}</Text>

        {/* Item tags */}
        <View style={styles.tags}>
          {outfit.items.slice(0, 2).map((item, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
          ))}
          {outfit.items.length > 2 && (
            <Text style={styles.moreTags}>+{outfit.items.length - 2}</Text>
          )}
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            <View style={styles.feedbackRow}>
              <TouchableOpacity
                style={[styles.actionBtn, feedback.rating === 'like' && styles.actionBtnActive]}
                onPress={() => handleFeedback('like')}
              >
                <ThumbsUp
                  size={18}
                  color={feedback.rating === 'like' ? '#FFFFFF' : COLORS.primary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, feedback.rating === 'dislike' && styles.actionBtnActive]}
                onPress={() => handleFeedback('dislike')}
              >
                <ThumbsDown
                  size={18}
                  color={feedback.rating === 'dislike' ? '#FFFFFF' : COLORS.primary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            {onDelete && (
              <TouchableOpacity
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                  onDelete(recommendation._id)
                }}
              >
                <Trash2 size={18} color={COLORS.secondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius:    24,
    marginBottom:    20,
    width:           CARD_W,
    ...SHADOWS.card,
  },
  imageContainer: {
    height:   320,
    position: 'relative',
    backgroundColor: COLORS.secondaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width:  '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width:          '100%',
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
  },
  paletteRow: {
    flexDirection: 'row',
    gap:           8,
  },
  colorDot: {
    width:        24,
    height:       24,
    borderRadius: 12,
    borderWidth:  2,
    borderColor:  '#FFFFFF',
  },
  generatingText: {
    fontSize:   10,
    fontWeight: '900',
    color:      COLORS.secondary,
    letterSpacing: 1,
  },
  badgeTopRight: { position: 'absolute', top: 12, right: 12 },
  matchBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 99,
  },
  confidenceDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  confidenceText: {
    fontSize:   11,
    fontWeight: '800',
    color:      COLORS.primary,
  },
  content: {
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  occasionText: {
    fontSize:    10,
    fontWeight:  '800',
    color:       COLORS.brand,
    letterSpacing: 1,
  },
  weatherText: {
    fontSize:   11,
    fontWeight: '700',
    color:      COLORS.secondary,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize:   20,
    fontWeight: '900',
    color:      COLORS.primary,
    letterSpacing: -0.5,
  },
  description: {
    fontSize:    14,
    color:       COLORS.secondary,
    lineHeight:  20,
    marginBottom: 16,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.secondaryBackground,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:    8,
  },
  tagText: {
    fontSize:      11,
    fontWeight:    '700',
    color:         COLORS.secondary,
  },
  moreTags: {
    fontSize:   11,
    fontWeight: '700',
    color:      COLORS.secondary,
  },
  actions: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginTop:       20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondaryBackground,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap:           12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: COLORS.primary,
  },
  deleteBtn: {
    padding: 10,
  },
})
