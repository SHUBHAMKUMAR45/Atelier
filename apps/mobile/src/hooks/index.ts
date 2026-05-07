import { useState, useEffect, useCallback } from 'react'
import { useAuth }           from '@clerk/clerk-expo'
import { Haptics }            from '../lib/haptics'
import { mobileApi, APIError } from '../lib/api-client'
import { useUserStore, useRecommendStore } from '../store'
import type {
  OutfitRecommendation,
  RecommendRequest,
  WardrobeItem,
  CreateWardrobeItemRequest,
} from '../../../../packages/shared/src/schemas'

// ─────────────────────────────────────────────────────────────────
// USE PROFILE
// ─────────────────────────────────────────────────────────────────

export function useProfile() {
  const { getToken }         = useAuth()
  const { profile, setProfile, setQuota } = useUserStore()
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, q] = await Promise.all([
        mobileApi.profile.get(),
        mobileApi.profile.getQuota(),
      ])
      setProfile(p)
      setQuota(q)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [getToken, setProfile, setQuota])

  useEffect(() => { void refresh() }, [refresh])

  return { profile, isLoading, error, refresh }
}

// ─────────────────────────────────────────────────────────────────
// USE RECOMMEND
// ─────────────────────────────────────────────────────────────────

const STEP_SEQUENCE = ['analyzing', 'styling', 'finalizing'] as const

export function useRecommend() {
  const { getToken } = useAuth()
  const { setQuota } = useUserStore()
  const {
    setCurrent, setGenerating, setStep, setError, reset,
  } = useRecommendStore()

  const [isSlowGeneration, setIsSlowGeneration] = useState(false)

  const generate = useCallback(async (request: RecommendRequest): Promise<OutfitRecommendation | null> => {
    reset()
    setGenerating(true)
    setStep('analyzing')
    setIsSlowGeneration(false)

    let stepIdx = 0
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEP_SEQUENCE.length - 1)
      const next = STEP_SEQUENCE[stepIdx]
      if (next) setStep(next)
    }, 3_000)

    // Show "taking longer than usual" after 7s
    const slowTimer = setTimeout(() => setIsSlowGeneration(true), 7_000)

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const result = await mobileApi.recommend.generate(request)

      clearTimeout(slowTimer)
      clearInterval(stepTimer)
      setIsSlowGeneration(false)
      setStep('done')
      setCurrent(result)

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Refresh quota
      const quota = await mobileApi.profile.getQuota().catch(() => null)
      if (quota) setQuota(quota)

      return result
    } catch (err) {
      clearTimeout(slowTimer)
      clearInterval(stepTimer)
      setIsSlowGeneration(false)
      setStep('error')
      const msg = err instanceof APIError ? err.message : 'Generation failed'
      setError(msg)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return null
    } finally {
      setGenerating(false)
    }
  }, [getToken, setCurrent, setError, setGenerating, setQuota, setStep, reset])

  return { generate, isSlowGeneration }
}

// ─────────────────────────────────────────────────────────────────
// USE HISTORY
// ─────────────────────────────────────────────────────────────────

export function useHistory() {
  const { getToken }                        = useAuth()
  const [items, setItems]                   = useState<OutfitRecommendation[]>([])
  const [page, setPage]                     = useState(1)
  const [totalPages, setTotalPages]         = useState(1)
  const [isLoading, setLoading]             = useState(false)
  const [isLoadingMore, setLoadingMore]     = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const load = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true)
    else        setLoading(true)

    try {
      const result = await mobileApi.recommend.getHistory(pageNum, 10)
      setItems(prev => append ? [...prev, ...result.items] : result.items)
      setTotalPages(result.pages)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getToken])

  useEffect(() => { void load(1) }, [load])

  const loadMore = useCallback(() => {
    if (page < totalPages && !isLoadingMore) void load(page + 1, true)
  }, [page, totalPages, isLoadingMore, load])

  const refresh = useCallback(() => load(1), [load])

  return { items, isLoading, isLoadingMore, error, loadMore, refresh, hasMore: page < totalPages }
}

// ─────────────────────────────────────────────────────────────────
// USE FEEDBACK
// ─────────────────────────────────────────────────────────────────

export function useFeedback() {
  const { getToken } = useAuth()

  const submit = useCallback(async (id: string, rating: 'like' | 'dislike') => {
    try {
      await mobileApi.feedback.submit(id, { rating })
      await Haptics.impactAsync(
        rating === 'like'
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Rigid,
      )
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [])

  return { submit }
}

// ─────────────────────────────────────────────────────────────────
// USE TRENDS
// ─────────────────────────────────────────────────────────────────

export function useTrends(location?: string) {
  const { getToken }    = useAuth()
  const [data, setData] = useState<Awaited<ReturnType<typeof mobileApi.trends.get>> | null>(null)
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    mobileApi.trends.get(location).then(result => {
      if (!cancelled && result) setData(result)
    }).catch(() => {/* non-fatal */}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [getToken, location])

  return { data, isLoading }
}

// ─────────────────────────────────────────────────────────────────
// USE WARDROBE
// ─────────────────────────────────────────────────────────────────

export function useWardrobe() {
  const { getToken }    = useAuth()
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await mobileApi.wardrobe.get()
      setItems(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wardrobe')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { void refresh() }, [refresh])

  const addItem = async (data: CreateWardrobeItemRequest) => {
    try {
      const newItem = await mobileApi.wardrobe.add(data)
      setItems(prev => [newItem, ...prev])
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      return newItem
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      throw err
    }
  }

  const deleteItem = async (id: string) => {
    try {
      await mobileApi.wardrobe.delete(id)
      setItems(prev => prev.filter(i => i._id !== id))
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      throw err
    }
  }

  return { items, isLoading, error, refresh, addItem, deleteItem }
}

// ─────────────────────────────────────────────────────────────────
// USE OFFLINE DETECTION
// ─────────────────────────────────────────────────────────────────

export function useOnlineStatus() {
  const [isOnline, setOnline] = useState(true)

  useEffect(() => {
    // Lazy-load NetInfo to avoid startup delay
    let unsubscribe: (() => void) | null = null

    import('@react-native-community/netinfo').then(({ default: NetInfo }) => {
      // Get initial state
      void NetInfo.fetch().then(state => {
        setOnline(state.isConnected ?? true)
      })
      // Subscribe to changes
      unsubscribe = NetInfo.addEventListener(state => {
        setOnline(state.isConnected ?? true)
      })
    }).catch(() => {
      // Fallback — assume online if NetInfo unavailable
      setOnline(true)
    })

    return () => { unsubscribe?.() }
  }, [])

  return { isOnline }
}
