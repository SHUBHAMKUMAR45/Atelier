'use client'

import useSWR, { mutate } from 'swr'
import { useAuth }        from '@clerk/nextjs'
import { api, APIError }  from '../lib/api-client'
import { useUserStore, useRecommendStore } from '../store'
import { toast }          from 'sonner'
import type { RecommendRequest } from '../../../../packages/shared/src/schemas'

// ─────────────────────────────────────────────────────────────────
// USE PROFILE
// ─────────────────────────────────────────────────────────────────

export function useProfile() {
  const { getToken } = useAuth()
  const { setProfile } = useUserStore()

  const { data, error, isLoading } = useSWR(
    'profile',
    async () => {
      try {
        const token = await getToken()
        if (!token) throw new Error('No token')
        const profile = await api.profile.get(token)
        setProfile(profile)
        return profile
      } catch (err) {
        if (err instanceof APIError && err.statusCode === 404) {
          setProfile(null)
          return null
        }
        throw err
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  return { profile: data, error, isLoading }
}

// ─────────────────────────────────────────────────────────────────
// USE QUOTA
// ─────────────────────────────────────────────────────────────────

export function useQuota() {
  const { getToken } = useAuth()
  const { setQuota } = useUserStore()

  const { data, mutate: refresh } = useSWR(
    'quota',
    async () => {
      const token = await getToken()
      if (!token) throw new Error('No token')
      const quota = await api.profile.getQuota(token)
      setQuota(quota)
      return quota
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  return { quota: data, refresh }
}

// ─────────────────────────────────────────────────────────────────
// USE RECOMMEND
// ─────────────────────────────────────────────────────────────────

const STEPS = ['analyzing', 'styling', 'finalizing'] as const

export function useRecommend() {
  const { getToken }  = useAuth()
  const {
    setGenerating,
    setGenerationStep,
    setCurrent,
    setError,
    reset,
  } = useRecommendStore()

  async function generate(request: RecommendRequest) {
    reset()
    setGenerating(true)
    setGenerationStep('analyzing')

    // Animate progress steps
    const stepTimer = setInterval(() => {
      setGenerationStep((prev) => {
        const idx = STEPS.indexOf(prev as typeof STEPS[number])
        return idx < STEPS.length - 1 ? STEPS[idx + 1]! : prev
      })
    }, 3_000)

    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')

      const result = await api.recommend.generate(token, request)

      clearInterval(stepTimer)
      setGenerationStep('done')
      setCurrent(result)

      // Refresh quota after generation
      await mutate('quota')

      return result
    } catch (err) {
      clearInterval(stepTimer)
      setGenerationStep('error')

      const message = err instanceof APIError ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  return { generate }
}

// ─────────────────────────────────────────────────────────────────
// USE HISTORY
// ─────────────────────────────────────────────────────────────────

export function useHistory(page = 1) {
  const { getToken } = useAuth()

  return useSWR(
    ['history', page],
    async () => {
      const token = await getToken()
      if (!token) throw new Error('No token')
      return api.recommend.getHistory(token, page)
    },
    { revalidateOnFocus: false },
  )
}

// ─────────────────────────────────────────────────────────────────
// USE FEEDBACK
// ─────────────────────────────────────────────────────────────────

export function useFeedback() {
  const { getToken } = useAuth()

  async function submit(id: string, rating: 'like' | 'dislike') {
    try {
      const token = await getToken()
      if (!token) throw new Error('No token')
      await api.feedback.submit(token, id, { rating })
      toast.success(rating === 'like' ? 'Saved to your collection ✦' : 'Got it — we\'ll improve')
    } catch {
      toast.error('Could not save feedback')
    }
  }

  return { submit }
}

// ─────────────────────────────────────────────────────────────────
// USE TRENDS
// ─────────────────────────────────────────────────────────────────

export function useTrends() {
  const { getToken } = useAuth()

  return useSWR(
    'trends',
    async () => {
      const token = await getToken()
      if (!token) throw new Error('No token')
      return api.trends.get(token)
    },
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }, // 1h client-side dedup
  )
}

// ─────────────────────────────────────────────────────────────────
// USE WEATHER
// ─────────────────────────────────────────────────────────────────

export function useWeather(lat?: number, lon?: number) {
  const { getToken } = useAuth()

  const key = lat && lon ? `weather-${lat}-${lon}` : 'weather-default'

  const { data, error, isLoading } = useSWR(
    key,
    async () => {
      const token = await getToken()
      if (!token) return null
      return api.weather.get(token, lat ?? 40.7128, lon ?? -74.006)
    },
    { revalidateOnFocus: false, dedupingInterval: 1_800_000 /* 30 min */ },
  )

  return { data, error, isLoading }
}

// ─────────────────────────────────────────────────────────────────
// USE WARDROBE
// ─────────────────────────────────────────────────────────────────

export function useWardrobe() {
  const { getToken } = useAuth()

  const { data, error, isLoading, mutate: refresh } = useSWR(
    'wardrobe',
    async () => {
      const token = await getToken()
      if (!token) throw new Error('No token')
      return api.wardrobe.get(token)
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )

  const addItem = async (item: { title: string; category: string; imageUrl: string; color?: string }) => {
    try {
      const token = await getToken()
      if (!token) return
      const newItem = await api.wardrobe.add(token, item)
      await refresh()
      toast.success(`${item.title} added to wardrobe`)
      return newItem
    } catch {
      toast.error('Failed to add item')
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const token = await getToken()
      if (!token) return
      await api.wardrobe.delete(token, id)
      await refresh()
      toast.success('Item removed')
    } catch {
      toast.error('Could not remove item')
    }
  }

  return { items: data || [], error, isLoading, refresh, addItem, deleteItem }
}

