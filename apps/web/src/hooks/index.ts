'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'

function useSWRIsSlow() { return useState(false) }

import { api, APIError }  from '../lib/api-client'
import { useUserStore, useRecommendStore } from '../store'
import { toast }          from 'sonner'
import type { RecommendRequest } from '../../../../packages/shared/src/schemas/index'

// ─────────────────────────────────────────────────────────────────
// USE PROFILE
// ─────────────────────────────────────────────────────────────────

export function useProfile() {
  const { setProfile } = useUserStore()

  const { data, error, isLoading, mutate: refresh } = useSWR(
    'profile',
    async () => {
      try {
        const profile = await api.profile.get()
        setProfile(profile)
        return profile
      } catch (err) {
        if (err instanceof APIError && err.status === 404) {
          setProfile(null)
          return null
        }
        throw err
      }
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  return { profile: data, error, isLoading, refresh }
}

// ─────────────────────────────────────────────────────────────────
// USE QUOTA
// ─────────────────────────────────────────────────────────────────

export function useQuota() {
  const { setQuota } = useUserStore()

  const { data, mutate: refresh } = useSWR(
    'quota',
    async () => {
      const quota = await api.profile.getQuota()
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
  const {
    setGenerating,
    setGenerationStep,
    setCurrent,
    setError,
    reset,
  } = useRecommendStore()

  const [isSlow, setIsSlow] = useSWRIsSlow()

  async function generate(request: RecommendRequest) {
    reset()
    setGenerating(true)
    setGenerationStep('analyzing')
    setIsSlow(false)

    // Animate progress steps
    const stepTimer = setInterval(() => {
      setGenerationStep((prev) => {
        const idx = STEPS.indexOf(prev as typeof STEPS[number])
        return idx < STEPS.length - 1 ? STEPS[idx + 1]! : prev
      })
    }, 3_000)

    // Show "taking longer than usual" after 7s
    const slowTimer = setTimeout(() => setIsSlow(true), 7_000)

    try {
      const result = await api.recommend.generate(request)

      clearTimeout(slowTimer)
      clearInterval(stepTimer)
      setGenerationStep('done')
      setCurrent(result)

      // Refresh quota after generation
      await mutate('quota')

      return result
    } catch (err) {
      clearTimeout(slowTimer)
      clearInterval(stepTimer)
      setIsSlow(false)
      setGenerationStep('error')

      const message = err instanceof APIError 
        ? err.message 
        : err instanceof Error 
        ? err.message 
        : 'Something went wrong'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsSlow(false)
      setGenerating(false)
    }
  }

  return { generate, isSlow }
}

// ─────────────────────────────────────────────────────────────────
// USE HISTORY
// ─────────────────────────────────────────────────────────────────

export function useHistory(page = 1) {
  const { data, error, isLoading, mutate: refresh } = useSWR(
    ['history', page],
    async () => {
      return api.recommend.getHistory(page)
    },
    { revalidateOnFocus: false },
  )

  return { data, error, isLoading, refresh }
}

// ─────────────────────────────────────────────────────────────────
// USE FEEDBACK
// ─────────────────────────────────────────────────────────────────

export function useFeedback() {
  async function submit(id: string, rating: 'like' | 'dislike') {
    try {
      await api.feedback.submit(id, { rating })
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
  const { data, error, isLoading, mutate: refresh } = useSWR(
    'trends',
    async () => {
      return api.trends.get()
    },
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }, // 1h client-side dedup
  )

  return { data, error, isLoading, refresh }
}

// ─────────────────────────────────────────────────────────────────
// USE WEATHER
// ─────────────────────────────────────────────────────────────────

export function useWeather(lat?: number, lon?: number) {
  const key = lat && lon ? `weather-${lat}-${lon}` : 'weather-default'

  const { data, error, isLoading } = useSWR(
    key,
    async () => {
      return api.weather.get(lat ?? 40.7128, lon ?? -74.006)
    },
    { revalidateOnFocus: false, dedupingInterval: 1_800_000 /* 30 min */ },
  )

  return { data, error, isLoading }
}

// ─────────────────────────────────────────────────────────────────
// USE WARDROBE
// ─────────────────────────────────────────────────────────────────

export function useWardrobe() {
  const { data, error, isLoading, mutate: refresh } = useSWR(
    'wardrobe',
    async () => {
      return api.wardrobe.get()
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )

  const addItem = async (item: { name: string; category: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'dress' | 'suit'; imageUrl: string; color?: string }) => {
    try {
      const newItem = await api.wardrobe.add(item)
      await refresh()
      toast.success(`${item.name} added to wardrobe`)
      return newItem
    } catch {
      toast.error('Failed to add item')
      return null
    }
  }

  const deleteItem = async (id: string) => {
    try {
      await api.wardrobe.delete(id)
      await refresh()
      toast.success('Item removed')
    } catch {
      toast.error('Could not remove item')
    }
  }

  return { items: data || [], error, isLoading, refresh, addItem, deleteItem }
}

