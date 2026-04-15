'use client'

import { motion }         from 'framer-motion'
import { TrendingUp, Sparkles, ArrowRight, RefreshCw } from 'lucide-react'
import Link               from 'next/link'
import { useTrends }      from '../../hooks'
import { AppLayout }      from '../../components/layout/AppLayout'

const RELEVANCE_LABEL = (r: number) =>
  r >= 0.8 ? 'Very Hot' : r >= 0.6 ? 'Trending Now' : 'Emerging'

const SEASON_GRADIENT: Record<string, string> = {
  spring: 'from-brand/20 to-transparent',
  summer: 'from-brand/30 to-brand-dark/10',
  autumn: 'from-orange-500/20 to-brand/10',
  winter: 'from-cyan-500/20 to-purple-500/10',
}

export default function TrendsPage() : JSX.Element {
  const { data, isLoading, error, mutate } = useTrends()

  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-12">
        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">
          {data?.season ?? 'Current Season'}
        </p>
        <div className="flex items-end justify-between">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-ink-primary leading-tight">
            Fashion Trends
          </h1>
          <button onClick={() => mutate()}
            className="flex items-center gap-2 text-[13px] font-black text-ink-secondary hover:text-brand transition-all mb-4 active:scale-95">
            <RefreshCw size={14} strokeWidth={3} /> Refresh
          </button>
        </div>
        {data?.location && (
          <p className="text-[14px] text-ink-secondary mt-4 font-bold tracking-tight">
            Curated for <span className="text-ink-primary">{data.location}</span> · Updated {new Date(data.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </motion.div>

      {/* ── Loading skeletons ─────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-[24px] border border-ink-border p-10 shadow-sm">
              <div className="skeleton h-4 w-28 rounded-md bg-secondary mb-6" />
              <div className="skeleton h-8 w-3/4 rounded-md bg-secondary mb-4" />
              <div className="skeleton h-4 w-full rounded-md bg-secondary mb-2" />
              <div className="skeleton h-4 w-2/3 rounded-md bg-secondary" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-slate-200 uppercase">
          <p className="text-[14px] font-black text-slate-400 tracking-widest">Connection Interrupted</p>
        </div>
      )}

      {/* ── Trend cards ───────────────────────────────────── */}
      {data && !isLoading && (
        <>
          {/* Hero trend */}
          {data.trends[0] && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              className={`rounded-[32px] bg-ink-900 p-12 mb-10 relative overflow-hidden shadow-2xl group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${SEASON_GRADIENT[data.season?.toLowerCase() ?? 'spring'] ?? 'from-brand to-transparent'} pointer-events-none opacity-20`} />
              
              <div className="relative z-10 flex items-start gap-4 mb-8">
                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest bg-white/10 px-5 py-2.5 rounded-xl border border-white/10">
                  Trend #{1} · {RELEVANCE_LABEL(data.trends[0].relevance)}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6 leading-tight max-w-2xl">
                {data.trends[0].trend}
              </h2>
              <p className="text-[18px] text-ink-secondary leading-relaxed max-w-xl mb-12 font-bold tracking-tight">
                {data.trends[0].description}
              </p>
              <Link href={`/recommend?trend=${encodeURIComponent(data.trends[0].trend)}`}
                className="inline-flex items-center gap-3 px-10 py-5 text-[17px] font-black text-ink-primary bg-white rounded-full hover:bg-secondary transition-all shadow-xl active:scale-95">
                <Sparkles size={18} strokeWidth={3} /> Style this Look
                <ArrowRight size={18} strokeWidth={3} />
              </Link>
            </motion.div>
          )}

          {/* Remaining trends grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.trends.slice(1).map((trend, i) => (
              <motion.div key={trend.trend}
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: (i + 1) * 0.06 }}
                className="group bg-white rounded-[24px] border border-ink-border p-10
                            hover:border-brand/30 hover:shadow-xl transition-all duration-500 flex flex-col h-full shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    #{i + 2} · {RELEVANCE_LABEL(trend.relevance)}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center
                                  group-hover:bg-indigo-600 transition-all duration-300 border border-slate-200">
                    <TrendingUp size={20} strokeWidth={3} className="text-slate-400 group-hover:text-white" />
                  </div>
                </div>
                <h3 className="text-[26px] font-black text-ink-primary mb-4 tracking-tight leading-tight">{trend.trend}</h3>
                <p className="text-[15px] text-ink-secondary font-bold leading-relaxed line-clamp-3 mb-10 flex-1 tracking-tight">
                  {trend.description}
                </p>
                {/* Relevance bar */}
                <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden mb-10 border border-ink-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trend.relevance * 100}%` }}
                    transition={{ duration: 1.2, delay: (i + 1) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
                <Link href={`/recommend?trend=${encodeURIComponent(trend.trend)}`}
                  className="mt-auto inline-flex items-center gap-2.5 text-[15px] font-black text-brand
                             opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-400 hover:text-brand-dark">
                  Style Trends <ArrowRight size={18} strokeWidth={3} />
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  )
}
