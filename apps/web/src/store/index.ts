import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { 
  UserProfile, 
  OutfitRecommendation,
} from '../../../../packages/shared/src/schemas'
import type { QuotaStatus } from '../lib/api-client'

// ─────────────────────────────────────────────────────────────────
// USER STORE
// ─────────────────────────────────────────────────────────────────

interface UserState {
  profile:     UserProfile | null
  quota:       QuotaStatus | null
  isLoading:   boolean

  setProfile:  (profile: UserProfile | null) => void
  setQuota:    (quota: QuotaStatus) => void
  setLoading:  (loading: boolean) => void
  reset:       () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        profile:    null,
        quota:      null,
        isLoading:  false,

        setProfile: (profile) => set({ profile }),
        setQuota:   (quota)   => set({ quota }),
        setLoading: (isLoading) => set({ isLoading }),
        reset:      () => set({ profile: null, quota: null, isLoading: false }),
      }),
      {
        name:    'user-store',
        partialize: (state) => ({ profile: state.profile }),
      },
    ),
    { name: 'UserStore' },
  ),
)

// ─────────────────────────────────────────────────────────────────
// RECOMMENDATION STORE
// ─────────────────────────────────────────────────────────────────

interface RecommendState {
  current:        OutfitRecommendation | null
  isGenerating:   boolean
  generationStep: 'idle' | 'analyzing' | 'styling' | 'finalizing' | 'done' | 'error'
  error:          string | null

  setCurrent:        (rec: OutfitRecommendation | null) => void
  setGenerating:     (generating: boolean) => void
  setGenerationStep: (step: RecommendState['generationStep'] | ((prev: RecommendState['generationStep']) => RecommendState['generationStep'])) => void
  setError:          (error: string | null) => void
  reset:             () => void
}

export const useRecommendStore = create<RecommendState>()(
  devtools(
    (set, get) => ({
      current:        null,
      isGenerating:   false,
      generationStep: 'idle',
      error:          null,

      setCurrent:    (current)      => set({ current }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      setGenerationStep: (step) => set({
        generationStep: typeof step === 'function' ? step(get().generationStep) : step,
      }),
      setError:      (error)        => set({ error }),
      reset: () => set({
        current: null, isGenerating: false,
        generationStep: 'idle', error: null,
      }),
    }),
    { name: 'RecommendStore' },
  ),
)
