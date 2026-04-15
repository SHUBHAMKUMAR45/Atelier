'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Loader2, AlertCircle, RefreshCw,
  ChevronRight, CloudSun, Info, Shirt,
} from 'lucide-react'
import { clsx }            from 'clsx'
import { useRecommend, useWeather, useHistory }    from '../../hooks'
import { useRecommendStore } from '../../store'
import { OutfitDetail }      from '../../components/outfit/OutfitDetail'
import { OutfitCard }        from '../../components/outfit/OutfitCard'
import { AppLayout }         from '../../components/layout/AppLayout'
import {
  OccasionEnum,
} from '../../../../../packages/shared/src/schemas'
import type { z }            from 'zod'

const _OCCASION_OPTIONS = OccasionEnum.options

type Occasion = z.infer<typeof OccasionEnum>

const OCCASIONS: Array<{ value: Occasion; label: string; icon: string; desc: string }> = [
  { value: 'casual',  label: 'Casual',  icon: '☕', desc: 'Everyday comfort' },
  { value: 'work',    label: 'Work',    icon: '💼', desc: 'Professional & polished' },
  { value: 'date',    label: 'Date',    icon: '🌹', desc: 'Romantic & elevated' },
  { value: 'party',   label: 'Party',   icon: '✨', desc: 'Bold & festive' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌿', desc: 'Active & practical' },
  { value: 'gym',     label: 'Gym',     icon: '⚡', desc: 'Performance first' },
  { value: 'travel',  label: 'Travel',  icon: '✈️', desc: 'Versatile & easy' },
  { value: 'wedding', label: 'Wedding', icon: '🤍', desc: 'Elegant & respectful' },
]

const STEP_LABELS: Record<string, string> = {
  analyzing:   'Analyzing your style profile…',
  styling:     'Curating the perfect outfit…',
  finalizing:  'Adding the finishing touches…',
  done:        'Your look is ready',
  error:       'Something went wrong',
}

const STEP_ORDER = ['analyzing', 'styling', 'finalizing']

export default function RecommendPage() : JSX.Element {
  const { generate }          = useRecommend()
  const { current, isGenerating, generationStep, error } = useRecommendStore()
  const { data: weather }              = useWeather()
  const { data: history }              = useHistory(1)
  const [occasion, setOccasion]        = useState<Occasion | null>(null)
  const [description, setDescription] = useState('')
  const [useWardrobe, setUseWardrobe]  = useState(true)
  const [showDetail, setShowDetail]    = useState(false)


  const lastOutfit = history?.items[0] ?? null

  async function handleGenerate() {
    if (!occasion) return
    try {
      await generate({
        occasion,
        description: description || undefined,
        useWardrobe,
      })
      setShowDetail(true)
    } catch { /* shown via toast */ }
  }

  const stepIdx = STEP_ORDER.indexOf  return (
    <AppLayout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="max-w-3xl mx-auto py-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-12 text-center">
          <p className="text-[13px] font-bold text-brand uppercase tracking-widest mb-4">AI Styling Session</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-ink-primary leading-tight mb-8">
            What's the occasion?
          </h1>
          {weather && (
            <div className="inline-flex items-center gap-2 mt-4 bg-secondary border border-ink-border rounded-lg px-4 py-2">
              <CloudSun size={14} className="text-ink-secondary" />
              <span className="text-[13px] font-bold text-ink-primary">
                {Math.round(weather.temp)}°C · {weather.condition} factored in
              </span>
            </div>
          )}
        </div>

        {/* ── Generating state ───────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div key="generating"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              className="rounded-[24px] border border-ink-border bg-white overflow-hidden mb-12 shadow-md">

              {/* Progress steps */}
              <div className="px-10 pt-12 pb-10">
                <div className="flex items-center justify-between mb-12 relative">
                  <div className="absolute top-4 left-0 right-0 h-[2px] bg-secondary z-0" />
                  {STEP_ORDER.map((step, i) => (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-white",
                        i < stepIdx ? 'bg-brand border-brand' :
                        i === stepIdx ? 'border-brand' :
                        'border-ink-border'
                      )}>
                        {i < stepIdx ? (
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        ) : i === stepIdx ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                            <Loader2 size={16} strokeWidth={2.5} className="text-brand" />
                          </motion.div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                        )}
                      </div>
                      <span className={clsx(
                        "text-[12px] font-black uppercase tracking-widest",
                        i <= stepIdx ? 'text-brand' : 'text-ink-secondary'
                      )}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Skeleton content */}
                <div className="space-y-6">
                  <div className="skeleton h-64 w-full rounded-[24px] bg-secondary" />
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded-md bg-secondary" />
                    <div className="skeleton h-4 w-1/2 rounded-md bg-secondary" />
                  </div>
                </div>
              </div>

              <div className="border-t border-ink-border px-10 py-6 bg-secondary/50">
                <p className="text-[14px] font-bold text-ink-primary text-center animate-pulse">
                  {STEP_LABELS[generationStep] ?? 'Working on your look…'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Error state ─────────────────────────── */}
          {!isGenerating && generationStep === 'error' && (
            <motion.div key="error"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              className="rounded-[32px] border border-red-100 bg-red-50 p-10 mb-12 text-center">
              <AlertCircle size={40} className="mx-auto mb-6 text-red-500" />
              <h3 className="text-2xl font-black text-ink-primary mb-3">AI is taking a breather</h3>
              <p className="text-red-700 font-medium mb-8 max-w-md mx-auto">{error}</p>
              <button onClick={handleGenerate} disabled={!occasion}
                className="w-full sm:w-auto px-10 py-4 bg-brand text-white font-black rounded-full shadow-lg shadow-brand/20">
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Picker ────────────────────────────────── */}
        {!isGenerating && (
          <motion.div key="picker" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {OCCASIONS.map((occ, i) => (
                <motion.button
                  key={occ.value}
                  initial={{ opacity:0, y:8 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setOccasion(occasion === occ.value ? null : occ.value)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-3 p-6 rounded-[24px] text-center transition-all duration-200 border shadow-sm",
                    occasion === occ.value
                      ? 'bg-brand text-white border-brand shadow-md scale-[1.02]'
                      : 'bg-white border-ink-border hover:bg-secondary hover:scale-[1.01]'
                  )}>
                  <span className="text-3xl mb-1 grayscale-[0.5] group-hover:grayscale-0">{occ.icon}</span>
                  <span className="text-[15px] font-black tracking-tight leading-none uppercase">
                    {occ.label}
                  </span>
                  <span className={clsx(
                    "text-[11px] font-bold leading-snug",
                    occasion === occ.value ? 'text-white/80' : 'text-ink-secondary'
                  )}>
                    {occ.desc}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* Virtual Stylist Toggle */}
            <div className="mb-6">
              <button 
                onClick={() => setUseWardrobe(!useWardrobe)}
                className={clsx(
                  "w-full flex items-center justify-between p-6 rounded-[24px] border transition-all duration-300",
                  useWardrobe 
                    ? "bg-brand/5 border-brand/20 shadow-sm" 
                    : "bg-white border-ink-border hover:bg-secondary"
                )}>
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    useWardrobe ? "bg-brand text-white" : "bg-secondary text-ink-secondary"
                  )}>
                    <Shirt size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-black text-ink-primary leading-tight">Virtual Stylist</p>
                    <p className="text-[13px] font-bold text-ink-secondary">Use my existing wardrobe items</p>
                  </div>
                </div>
                <div className={clsx(
                  "w-12 h-6 rounded-full relative transition-colors duration-300",
                  useWardrobe ? "bg-brand" : "bg-ink-border"
                )}>
                  <motion.div 
                    animate={{ x: useWardrobe ? 24 : 4 }}
                    className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </div>
              </button>
            </div>

            {/* Description input */}
            <div className="mb-10">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional context: 'rooftop evening', 'business travel'..."
                rows={3}
                className="w-full bg-white border border-ink-border rounded-[24px] px-6 py-5
                           text-[16px] text-ink-primary placeholder:text-ink-secondary shadow-sm
                           focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none font-medium"
              />
            </div>

            {/* Final CTA */}
            <button
              onClick={handleGenerate}
              disabled={!occasion}
              className="w-full py-6 text-xl font-black tracking-tight text-white rounded-[24px] 
                         flex items-center justify-center gap-3 transition-all duration-200
                         disabled:opacity-20 disabled:cursor-not-allowed
                         bg-brand shadow-lg shadow-brand/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] group">
              <Sparkles size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
              {occasion
                ? `Generate ${OCCASIONS.find(o => o.value === occasion)?.label} Look`
                : 'Select an occasion'}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Result Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showDetail && current && (
          <OutfitDetail recommendation={current} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
