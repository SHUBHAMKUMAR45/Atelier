import React from 'react'
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter }    from 'expo-router'
import { FlashList }    from '@shopify/flash-list'
import { useAuth }      from '@clerk/clerk-expo'
import { Inbox }        from 'lucide-react-native'
import { Haptics }      from '../lib/haptics'
import { useHistory }   from '../hooks'
import { mobileApi }    from '../lib/api-client'
import { OutfitCard }   from '../components/outfit/OutfitCard'
import { COLORS, SHADOWS } from '../theme'
import type { OutfitRecommendation } from '../../../../packages/shared/src/schemas'

export default function HistoryScreen() {
  const router = useRouter()
  const { getToken }    = useAuth()
  const {
    items, isLoading, isLoadingMore,
    refresh, loadMore, hasMore,
  } = useHistory()

  async function handleDelete(id: string) {
    try {
      const token = await getToken()
      if (!token) return
      await mobileApi.recommend.delete(token, id)
      await refresh()
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {/* non-fatal */}
  }

  if (!isLoading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Your Style Journey</Text>
          <Text style={styles.title}>History</Text>
        </View>
      <View style={styles.empty}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Inbox size={32} color={COLORS.brand} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Your Archive is Quiet</Text>
          <Text style={styles.emptySub}>Transform your style with AI-curated looks that will appear here.</Text>
          <TouchableOpacity 
            style={styles.emptyBtn} 
            onPress={() => router.push('/recommend')}
          >
            <Text style={styles.emptyBtnText}>Start Styling</Text>
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>YOUR STYLE ARCHIVE</Text>
            <Text style={styles.title}>History</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length} LOOKS</Text>
          </View>
        </View>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item: OutfitRecommendation) => item._id}
        renderItem={({ item }: { item: OutfitRecommendation }) => (
          <View style={styles.cardWrap}>
            <OutfitCard
              recommendation={item}
              onPress={() => router.push({ pathname: '/outfit/[id]', params: { id: item._id } })}
              onDelete={handleDelete}
              showActions
            />
          </View>
        )}
        estimatedItemSize={400}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isLoadingMore ? (
          <View style={styles.loadingFooter}>
            <ActivityIndicator color={COLORS.brand} />
            <Text style={styles.loadingMore}>Curating more…</Text>
          </View>
        ) : !hasMore && items.length > 0 ? (
          <View style={styles.endSection}>
            <View style={styles.divider} />
            <Text style={styles.endText}>✦ STYLE GENIUS ✦</Text>
          </View>
        ) : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={COLORS.brand}
          />
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  header:  { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 12, fontWeight: '800', color: COLORS.brand,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8,
  },
  title:   { 
    fontSize: 34, fontWeight: '900', color: COLORS.primary,
    letterSpacing: -1,
  },
  countBadge: {
    backgroundColor: COLORS.secondaryBackground,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12,
    ...SHADOWS.minimal,
  },
  countText: { fontSize: 11, color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase' },

  list:     { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 120 },
  cardWrap: { marginBottom: 20 },

  empty: { flex: 1, padding: 24, justifyContent: 'center' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondaryBackground,
    ...SHADOWS.card,
  },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: COLORS.secondary, fontWeight: '600', marginTop: 8, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },

  loadingFooter: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  loadingMore: {
    fontSize: 11, color: COLORS.secondary, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  endSection: { paddingVertical: 64, alignItems: 'center' },
  divider:    { width: 40, height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  endText: {
    fontSize: 10, color: COLORS.secondary,
    fontWeight: '900', letterSpacing: 2,
  },
})
