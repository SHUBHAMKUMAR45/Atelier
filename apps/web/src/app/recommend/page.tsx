'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Shirt } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useRecommend, useWeather } from '../../hooks'
import { useRecommendStore } from '../../store'
import { OutfitDetail } from '../../components/outfit/OutfitDetail'
import { AppLayout } from '../../components/layout/AppLayout'
import type { OccasionEnum } from '../../../../../packages/shared/src/schemas'
import type { z } from 'zod'
import { cn } from '../../lib/utils'

type Occasion = z.infer<typeof OccasionEnum>

const OCCASIONS: Array<{ value: Occasion; label: string; emoji: string; desc: string }> = [
  { value: 'casual',  label: 'Casual',  emoji: '☕', desc: 'Daily comfort' },
  { value: 'work',    label: 'Work',    emoji: '💼', desc: 'Office ready' },
  { value: 'date',    label: 'Date',    emoji: '🌹', desc: 'Evening look' },
  { value: 'party',   label: 'Party',   emoji: '✨', desc: 'Celebration' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌿', desc: 'Adventure' },
  { value: 'gym',     label: 'Gym',     emoji: '⚡', desc: 'Performance' },
  { value: 'travel',  label: 'Travel',  emoji: '✈️', desc: 'Jetsetter' },
  { value: 'wedding', label: 'Wedding', emoji: '🤍', desc: 'Formal' },
]

export default function RecommendPage(): React.JSX.Element {
  const { generate, isSlow } = useRecommend()
  const { current, isGenerating, generationStep, error: genError, reset: resetGen } = useRecommendStore()
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)

  // Rate limit cooldown timer — disable retry for 60s on 429
  useEffect(() => {
    if (genError?.includes('limit') || genError?.includes('429')) {
      setRateLimitCooldown(60)
      const tick = setInterval(() => {
        setRateLimitCooldown(prev => {
          if (prev <= 1) { clearInterval(tick); return 0 }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(tick)
    }
    return undefined
  }, [genError])
  const { data: weather } = useWeather()
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [description, setDescription] = useState('')
  const [showDetail, setShowDetail] = useState(false)

  async function handleGenerate() {
    if (!occasion) return
    try { await generate({ occasion, description: description || undefined, useWardrobe: true }); setShowDetail(true) }
    catch { /* toast handled */ }
  }

  return (
    <AppLayout>
      <div className="bg-[#F8F8F7] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-ink-200 px-4 sm:px-6 md:px-8 py-5 md:py-7">
          <div className="max-w-[760px] mx-auto">
            <p className="label-caps mb-1">Personal Stylist</p>
            <h1 className="font-display text-[clamp(24px,3vw,36px)] font-bold">What's the occasion?</h1>
          </div>
        </div>

        <div className="max-w-[760px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <AnimatePresence mode="wait">
            {genError ? (
              <motion.div
                key="gen-error"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="flex flex-col items-center gap-5 text-center py-20"
              >
                <div className={`w-16 h-16 rounded border flex items-center justify-center text-2xl font-bold ${rateLimitCooldown > 0 ? 'border-amber-200 bg-amber-50 text-amber-400' : 'border-red-200 bg-red-50 text-red-400'}`}>
                  {rateLimitCooldown > 0 ? '⏳' : '!'}
                </div>
                <div className="space-y-2">
                  <p className="text-[17px] font-bold text-ink-900">
                    {rateLimitCooldown > 0 ? 'Daily limit reached' : 'Something went wrong'}
                  </p>
                  <p className="text-[14px] text-ink-500 max-w-sm leading-relaxed">{genError}</p>
                  {rateLimitCooldown > 0 && (
                    <p className="text-[13px] font-semibold text-amber-600">
                      You can retry in {rateLimitCooldown}s
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetGen}
                    disabled={rateLimitCooldown > 0}
                    className={rateLimitCooldown > 0 ? 'opacity-40 cursor-not-allowed' : ''}
                  >
                    {rateLimitCooldown > 0 ? `Wait ${rateLimitCooldown}s` : 'Start Over'}
                  </Button>
                </div>
              </motion.div>
            ) : !isGenerating && !current ? (
              <motion.div key="form" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} className="space-y-10">
                <p className="text-[14px] text-ink-500 -mt-2">Select your destination and our AI will curate an aesthetic that fits you perfectly.</p>

                {/* Occasion grid — 4 col, clean */}
                <div>
                  <p className="label-caps mb-4">Select Occasion</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {OCCASIONS.map(occ => (
                      <button
                        key={occ.value}
                        onClick={() => setOccasion(occ.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 py-6 px-3 rounded border-2 transition-all duration-200 text-center',
                          occasion === occ.value
                            ? 'bg-brand border-brand text-white shadow-[0_4px_16px_-2px_rgba(46,91,142,0.3)]'
                            : 'bg-white border-ink-200 hover:border-brand/40 hover:bg-brand/5'
                        )}>
                        <span className={cn('text-2xl transition-all', occasion === occ.value ? 'scale-110' : 'grayscale opacity-70')}>{occ.emoji}</span>
                        <span className="text-[13px] font-semibold">{occ.label}</span>
                        <span className={cn('text-[11px]', occasion === occ.value ? 'text-white/70' : 'text-ink-400')}>{occ.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label-caps mb-3 block">Context (Optional)</label>
                  <textarea
                    className="w-full bg-white border border-ink-200 rounded px-4 py-4 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all resize-none min-h-[120px] leading-relaxed"
                    placeholder="e.g. 'Coffee date in Le Marais' or 'Rooftop party during sunset'..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {/* CTA */}
                <div className="space-y-4">
                  <Button variant="brand" className="w-full h-12 text-[14px]" disabled={!occasion} onClick={handleGenerate}>
                    <Sparkles size={16} className="fill-white" />
                    {occasion ? 'Generate Outfit' : 'Select an Occasion'}
                  </Button>
                  {weather && (
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded border border-ink-200 text-[12px] text-ink-500 font-medium">
                        <Shirt size={12} className="text-brand" />
                        Optimised for {Math.round(weather.temp)}°C · {weather.condition}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : isGenerating ? (
              <motion.div key="generating" initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="min-h-[60vh] flex flex-col items-center justify-center gap-10 text-center py-20">
                <div className="relative">
                  <div className="w-24 h-24 rounded border-2 border-brand/20 flex items-center justify-center">
                    <Sparkles size={36} className="text-brand fill-brand animate-pulse" />
                  </div>
                  <motion.div animate={{ rotate:360 }} transition={{ duration:8, repeat:Infinity, ease:'linear' }}
                    className="absolute -inset-5 border border-dashed border-brand/20 rounded" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-display text-[28px] font-bold">
                    {generationStep === 'styling' ? 'Curating Style...' : 'Analysing Aesthetic...'}
                  </h2>
                  <p className="text-[14px] text-ink-500 max-w-xs mx-auto">Mapping colours, cuts and contexts to your perfect look.</p>
                {isSlow && (
                  <p className="text-[12px] text-amber-500 font-semibold animate-pulse">
                    Taking longer than usual — hang tight…
                  </p>
                )}
                </div>
                <div className="w-64 h-0.5 bg-ink-100 rounded-full overflow-hidden relative">
                  <motion.div initial={{ left:'-100%' }} animate={{ left:'100%' }} transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}
                    className="absolute top-0 bottom-0 w-1/2 bg-brand rounded-full" />
                </div>
              </motion.div>
            ) : null}


          </AnimatePresence>

          <AnimatePresence>
            {showDetail && current && <OutfitDetail recommendation={current} onClose={() => setShowDetail(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  )
}
