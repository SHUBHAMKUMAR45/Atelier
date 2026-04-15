import { create } from 'zustand'
import type { UserProfile, OutfitRecommendation } from '../../../../packages/shared/src/schemas'
import type { QuotaStatus } from '../lib/api-client'

interface UserStore {
  profile:    UserProfile | null
  quota:      QuotaStatus | null
  setProfile: (p: UserProfile | null) => void
  setQuota:   (q: QuotaStatus) => void
  reset:      () => void
}

export const useUserStore = create<UserStore>((set) => ({
  profile:    null,
  quota:      null,
  setProfile: (profile) => set({ profile }),
  setQuota:   (quota)   => set({ quota }),
  reset:      () => set({ profile: null, quota: null }),
}))

type GenerationStep = 'idle' | 'analyzing' | 'styling' | 'finalizing' | 'done' | 'error'

interface RecommendStore {
  current:        OutfitRecommendation | null
  isGenerating:   boolean
  step:           GenerationStep
  error:          string | null
  setCurrent:     (r: OutfitRecommendation | null) => void
  setGenerating:  (v: boolean) => void
  setStep:        (s: GenerationStep) => void
  setError:       (e: string | null) => void
  reset:          () => void
}

export const useRecommendStore = create<RecommendStore>((set) => ({
  current:       null,
  isGenerating:  false,
  step:          'idle',
  error:         null,
  setCurrent:    (current)      => set({ current }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setStep:       (step)         => set({ step }),
  setError:      (error)        => set({ error }),
  reset: () => set({ current: null, isGenerating: false, step: 'idle', error: null }),
}))
