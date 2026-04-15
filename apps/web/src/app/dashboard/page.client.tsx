'use client'

import Link             from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState }     from 'react'
import {
  Sparkles, ArrowRight, TrendingUp, ChevronRight,
  CloudSun, Camera, Clock,
} from 'lucide-react'
import { useProfile, useQuota, useHistory, useTrends, useWeather } from '../../hooks'
import { OutfitCard, OutfitCardSkeleton } from '../../components/outfit/OutfitCard'
import { OutfitDetail }                   from '../../components/outfit/OutfitDetail'
import type { OutfitRecommendation }       from '../../../../../packages/shared/src/schemas'

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function DashboardClient() : JSX.Element {
  const { profile, isLoading: profileLoading } = useProfile()
  const { quota }                               = useQuota()
  const { data: history, isLoading: histLoading } = useHistory(1)
  const { data: trends }                         = useTrends()
  const { data: weather }                        = useWeather()
  const [selected, setSelected] = useState<OutfitRecommendation | null>(null)

  const recent   = history?.items.slice(0, 3) ?? []
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Stylist'
  const quotaPct  = quota ? Math.round((quota.used / quota.limit) * 100) : 0

  return (
    <>
      {/* ── Header Welcome ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <p className="text-[13px] font-bold text-ink-secondary mb-4 tracking-widest uppercase">
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-ink-primary leading-[1.1] mb-8">
          {profileLoading ? (
            <span className="skeleton inline-block w-48 h-12 rounded-lg bg-secondary" />
          ) : (
            <>Good {getTimeOfDay()}, <span className="text-brand font-black">{firstName}</span></>
          )}
        </h1>

        <div className="flex items-center gap-3">
          {/* Weather chip */}
          {weather ? (
            <div className="flex items-center gap-2 bg-secondary border border-ink-border rounded-lg px-4 py-2">
              <CloudSun size={14} className="text-ink-secondary" />
              <span className="text-[13px] font-bold text-ink-primary">
                {Math.round(weather.temp)}°C · {weather.condition}
              </span>
            </div>
          ) : (
            <div className="skeleton h-10 w-32 rounded-lg bg-secondary" />
          )}

          {/* Quota nudge */}
          {quota && (
            <div className="hidden sm:flex items-center gap-2 bg-white border border-ink-border rounded-lg px-4 py-2 shadow-sm">
              <Sparkles size={14} className="text-brand" />
              <span className="text-[13px] font-bold text-ink-primary">
                {quota.remaining} style{quota.remaining !== 1 ? 's' : ''} left
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Link href="/recommend"
          className="group relative overflow-hidden rounded-[24px] p-8 border border-ink-border bg-white shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Sparkles size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Sparkles size={20} className="text-brand" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-ink-primary mb-2">Get Styled</h3>
          <p className="text-ink-secondary font-medium mb-6">Create a tailored outfit based on your profile.</p>
          <div className="flex items-center gap-2 text-brand font-bold text-sm">
            Generate Now <ArrowRight size={16} />
          </div>
        </Link>

        <Link href="/history"
          className="group relative overflow-hidden rounded-[24px] p-8 border border-ink-border bg-secondary hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-white border border-ink-border flex items-center justify-center mb-6 shadow-sm">
            <Clock size={20} className="text-ink-primary" strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-bold text-ink-primary mb-2">History</h3>
          <p className="text-ink-secondary font-medium mb-6">Review your past generated looks.</p>
          <p className="text-ink-primary font-bold text-sm">
            {history ? `${history.total} looks` : 'Browse collection'}
          </p>
        </Link>

        <Link href="/profile"
          className="group relative overflow-hidden rounded-[24px] p-8 border border-ink-border bg-secondary hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-white border border-ink-border flex items-center justify-center mb-6 shadow-sm">
            <Camera size={20} className="text-ink-primary" strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-bold text-ink-primary mb-2">Identity</h3>
          <p className="text-ink-secondary font-medium mb-6">Refine measurements & style preferences.</p>
          <p className="text-ink-primary font-bold text-sm">Update settings</p>
        </Link>
      </div>

      {/* ── Recent looks ────────────────────────────────────── */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink-primary">Recent Looks</h2>
          {history && history.total > 0 && (
            <Link href="/history" className="text-sm font-bold text-brand hover:underline">
              View All
            </Link>
          )}
        </div>

        {histLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0,1,2].map(i => <OutfitCardSkeleton key={i} index={i} />)}
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recent.map((rec, i) => (
              <motion.div key={rec._id}
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: 0.05 * i }}>
                <OutfitCard recommendation={rec} onOpen={() => setSelected(rec)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-[24px] border border-ink-border bg-secondary text-center">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mb-6 shadow-sm">
              <Sparkles size={28} className="text-brand/40" />
            </div>
            <h3 className="text-2xl font-bold text-ink-primary mb-2">No looks yet</h3>
            <p className="text-ink-secondary mb-8 max-w-sm font-medium">
              Start your journey with an AI-curated outfit.
            </p>
            <Link href="/recommend" className="inline-flex items-center justify-center px-10 py-4 font-bold text-white bg-brand rounded-full shadow-lg shadow-brand/20">
              Generate First Look
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Detail Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <OutfitDetail recommendation={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
