import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, Image,
} from 'react-native'
import { SafeAreaView }   from 'react-native-safe-area-context'
import { useRouter }      from 'expo-router'
import { FlashList }      from '@shopify/flash-list'
import { MapPin, Search, Sparkles, TrendingUp, Bell, Sliders } from 'lucide-react-native'
import { useProfile, useHistory, useOnlineStatus } from '../hooks'
import { useUserStore }   from '../store'
import { OutfitCard }     from '../components/outfit/OutfitCard'
import { COLORS, SHADOWS, SPACING } from '../theme'

const CATS = [
  { id: '1', label: 'Casual', icon: '👕' },
  { id: '2', label: 'Formal', icon: '👔' },
  { id: '3', label: 'Party', icon: '✨' },
  { id: '4', label: 'Sport', icon: '👟' },
]

export default function HomeScreen() {
  const router          = useRouter()
  const { isOnline }    = useOnlineStatus()
  const { isLoading: profileLoading, refresh: refreshProfile } = useProfile()
  const { items, isLoading: histLoading, error: histError, refresh: refreshHistory } = useHistory()
  const { profile }     = useUserStore()

  const recent  = items.slice(0, 4)
  const isRefreshing = profileLoading || histLoading

  function handleRefresh() {
    void refreshProfile()
    void refreshHistory()
  }

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.brand} />
        }
      >
        {/* ── Header ────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <View style={styles.locationBox}>
              <MapPin size={12} color={COLORS.brand} fill={COLORS.brand} />
              <Text style={styles.locationText}>Paris, FR</Text>
            </View>
            <Text style={styles.greetingText}>
              {getGreeting()}, {'\n'}
              <Text style={styles.nameText}>{profile?.displayName?.split(' ')[0] ?? 'Stylist'}</Text>
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color={COLORS.primary} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.avatarBtn}
              onPress={() => router.push('/profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(profile?.displayName?.[0] ?? 'A').toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search Bar ────────────────────────────────── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search outfits, styles..."
              placeholderTextColor={COLORS.secondary}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Sliders size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Banner ───────────────────────────────── */}
        <TouchableOpacity 
          style={styles.hero}
          onPress={() => router.push('/recommend')}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop' }} 
            style={styles.heroImg}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.heroBadgeText}>AI INSPIRED</Text>
            </View>
            <Text style={styles.heroTitle}>Spring Collection{'\n'}Curated for You</Text>
            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Explore Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Categories ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catList}>
            {CATS.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.catCard}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Recent Collections ────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Curated for You</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {histLoading ? (
            <View style={styles.skeleton} />
          ) : histError ? (
            <ErrorState error={histError.message} onRetry={handleRefresh} />
          ) : recent.length === 0 ? (
            <EmptyState onPress={() => router.push('/recommend')} />
          ) : (
            <FlashList
              data={recent}
              keyExtractor={(item) => item._id}
              numColumns={1}
              renderItem={({ item }) => (
                <OutfitCard
                  recommendation={item}
                  onPress={() => router.push({
                    pathname: '/outfit/[id]',
                    params:   { id: item._id },
                  })}
                  showActions={false}
                />
              )}
              estimatedItemSize={400}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Sparkles size={32} color={COLORS.brand} />
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptySub}>Start your AI styling journey today</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onPress}>
        <Text style={styles.emptyBtnText}>Style Me</Text>
      </TouchableOpacity>
    </View>
  )
}

function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <View style={[styles.emptyCard, { borderColor: COLORS.error + '40' }]}>
      <Text style={[styles.emptyTitle, { color: COLORS.error }]}>Failed to load</Text>
      <Text style={styles.emptySub}>{error || 'Please check your connection'}</Text>
      <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]} onPress={onRetry}>
        <Text style={styles.emptyBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: 100 },

  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 24,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    lineHeight: 24,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    padding: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.minimal,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  searchRow: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchBar: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    marginHorizontal: 24,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    ...SHADOWS.card,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 24,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },

  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginLeft: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },

  catList: {
    paddingLeft: 24,
  },
  countBadge: {
    backgroundColor: COLORS.secondaryBackground,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 14,
    ...SHADOWS.minimal,
  },
  catCard: {
    backgroundColor: COLORS.secondaryBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    gap: 6,
    minWidth: 90,
  },
  catIcon: {
    fontSize: 20,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  skeleton: {
    marginHorizontal: 24,
    height: 300,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 24,
  },
  emptyCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondaryBackground,
    ...SHADOWS.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
})
