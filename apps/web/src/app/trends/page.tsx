'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Sparkles, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useTrends } from '../../hooks'
import { ErrorState } from '../../components/ui/ErrorState'
import { AppLayout } from '../../components/layout/AppLayout'

const TREND_IMAGES = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600&auto=format&fit=crop',
]

const RELEVANCE_LABEL = (r: number) => r >= 0.8 ? 'Very Hot' : r >= 0.6 ? 'Trending Now' : 'Emerging'

export default function TrendsPage(): React.JSX.Element {
  const { data, isLoading, error, refresh } = useTrends()

  return (
    <AppLayout>
      <div className="bg-[#F8F8F7] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-ink-200 px-4 sm:px-6 md:px-8 py-5 md:py-7">
          <div className="max-w-[1100px] mx-auto flex items-end justify-between gap-4">
            <div>
              <p className="label-caps mb-1">{data?.season ?? 'Current Season'}</p>
              <h1 className="font-display text-[clamp(24px,3vw,36px)] font-bold">Fashion Trends</h1>
              {data?.location && (
                <p className="text-[13px] text-ink-400 mt-1">Curated for <span className="text-ink-700 font-medium">{data.location}</span></p>
              )}
            </div>
            <button onClick={() => refresh()} className="flex items-center gap-2 text-[12px] font-semibold text-ink-400 hover:text-brand uppercase tracking-wide transition-colors">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[0,1,2,3].map(i => (
                <div key={i} className="bg-white rounded border border-ink-200 p-6">
                  <div className="skeleton h-3 w-20 rounded mb-4" />
                  <div className="skeleton h-6 w-3/4 rounded mb-3" />
                  <div className="skeleton h-3 w-full rounded mb-2" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <ErrorState
              title="Couldn't load trends"
              message="There was a problem fetching trend data. Check your connection and try again."
              onRetry={() => refresh()}
            />
          )}

          {data && !isLoading && (
            <>
              {/* Hero trend */}
              {data.trends[0] && (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="relative overflow-hidden rounded bg-ink-900 mb-8">
                  <div className="absolute inset-0 opacity-20">
                    <Image src={TREND_IMAGES[0]!} alt={data.trends[0]?.trend ?? 'Fashion trend'} fill className="object-cover" />
                  </div>
                  <div className="relative z-10 p-10 md:p-14">
                    <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1.5 rounded-sm mb-6">
                      <TrendingUp size={10} className="text-white" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-[0.1em]">#{1} · {RELEVANCE_LABEL(data.trends[0].relevance)}</span>
                    </div>
                    <h2 className="font-display text-[clamp(24px,3vw,48px)] font-bold text-white tracking-tight mb-4 max-w-2xl">{data.trends[0].trend}</h2>
                    <p className="text-[15px] text-white/70 max-w-xl mb-8 leading-relaxed">{data.trends[0].description}</p>
                    <Link href={`/recommend?trend=${encodeURIComponent(data.trends[0].trend)}`}
                      className="inline-flex items-center gap-2 bg-white text-ink-900 px-6 h-10 rounded-sm text-[12px] font-bold uppercase tracking-wide hover:bg-ink-50 transition-colors">
                      <Sparkles size={13} strokeWidth={3} /> Style this Look <ArrowRight size={13} strokeWidth={3} />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Trend grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.trends.slice(1).map((trend, i) => (
                  <motion.div key={trend.trend} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:(i+1)*0.06 }}
                    className="group bg-white rounded border border-ink-200 overflow-hidden hover:border-brand/30 hover:shadow-card transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <Image src={TREND_IMAGES[(i+1) % TREND_IMAGES.length]!} alt={trend.trend} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-ink-900/20" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="label-caps">#{i+2} · {RELEVANCE_LABEL(trend.relevance)}</span>
                        <div className="w-10 h-10 rounded flex items-center justify-center bg-ink-100 group-hover:bg-brand transition-colors">
                          <TrendingUp size={16} className="text-ink-400 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <h3 className="font-display text-[20px] font-bold mb-2 tracking-tight">{trend.trend}</h3>
                      <p className="text-[13px] text-ink-500 leading-relaxed mb-4 line-clamp-2">{trend.description}</p>
                      <div className="h-1 bg-ink-100 rounded-full overflow-hidden mb-4">
                        <motion.div initial={{ width:0 }} animate={{ width:`${trend.relevance*100}%` }} transition={{ duration:1, delay:(i+1)*0.1, ease:[0.22,1,0.36,1] }}
                          className="h-full bg-brand rounded-full" />
                      </div>
                      <Link href={`/recommend?trend=${encodeURIComponent(trend.trend)}`}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand hover:text-brand-dark uppercase tracking-wide transition-colors opacity-0 group-hover:opacity-100">
                        Style Trend <ArrowRight size={12} strokeWidth={3} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
