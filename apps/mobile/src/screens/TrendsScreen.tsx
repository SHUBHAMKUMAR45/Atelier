import React                  from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions,
} from 'react-native'
import { SafeAreaView }       from 'react-native-safe-area-context'
import { TrendingUp, Sparkles, ChevronRight } from 'lucide-react-native'
import { motion }             from 'framer-motion' // Note: Using basic View if motion isn't setup for RN
import { useTrends }          from '../hooks'
import { COLORS, SHADOWS, TYPOGRAPHY } from '../theme'
import { useRouter }          from 'expo-router'

const { width } = Dimensions.get('window')

export default function TrendsScreen() {
  const router = useRouter()
  const { data, isLoading, refresh } = useTrends()

  if (isLoading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    )
  }

  const trends = data?.trends ?? []

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.brand} />
        }
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{data?.season ?? 'Current Season'}</Text>
          <View style={styles.row}>
            <Text style={styles.title}>Fashion Trends</Text>
            <View style={styles.iconContainer}>
              <TrendingUp size={20} color={COLORS.brand} strokeWidth={2.5} />
            </View>
          </View>
          {data?.location && (
            <Text style={styles.subtitle}>
              Curated for <Text style={styles.bold}>{data.location}</Text>
            </Text>
          )}
        </View>

        {/* ── Trend Cards ───────────────────────────────────── */}
        {trends.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <TrendingUp size={48} color={COLORS.secondary} strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>Forecast Pending</Text>
            <Text style={styles.emptySub}>We're analyzing the latest runway shows</Text>
          </View>
        ) : (
          trends.map((trend, i) => (
            <TouchableOpacity
              key={trend.trend}
              activeOpacity={0.9}
              onPress={() => router.push(`/recommend?trend=${encodeURIComponent(trend.trend)}`)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.trendNumber}>
                  <Text style={styles.numberText}>#{i + 1}</Text>
                </View>
                <View style={styles.relevanceTag}>
                  <Text style={styles.relevanceText}>
                    {trend.relevance >= 0.8 ? 'Hot' : 'Trending'}
                  </Text>
                </View>
              </View>

              <Text style={styles.trendTitle}>{trend.trend}</Text>
              <Text style={styles.trendDesc} numberOfLines={3}>
                {trend.description}
              </Text>

              {/* Relevance Bar */}
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.barFill, 
                    { width: `${trend.relevance * 100}%` }
                  ]} 
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.ctaText}>Style this look</Text>
                <ChevronRight size={16} color={COLORS.brand} strokeWidth={3} />
              </View>
            </TouchableOpacity>
          ))
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.brand,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 8,
  },
  bold: {
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trendNumber: {
    backgroundColor: COLORS.secondaryBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  numberText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },
  relevanceTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relevanceText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.brand,
    textTransform: 'uppercase',
  },
  trendTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  trendDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 20,
  },
  barContainer: {
    height: 6,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondaryBackground,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.brand,
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  footerSpace: {
    height: 100,
  },
})
