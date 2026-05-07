'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Bell, Search, ChevronRight, History, Shirt, TrendingUp, Plus, MapPin } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useProfile, useHistory } from '../../hooks'
import { OutfitCard, OutfitCardSkeleton } from '../../components/outfit/OutfitCard'
import { OutfitDetail } from '../../components/outfit/OutfitDetail'
import { ErrorState } from '../../components/ui/ErrorState'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

export function DashboardClient(): React.JSX.Element {
  const { profile, error: profileError, refresh: refreshProfile } = useProfile()
  const { data: history, isLoading: histLoading, error: histError, refresh: refreshHistory } = useHistory()
  const [selected, setSelected] = useState<OutfitRecommendation | null>(null)

  const error = profileError || histError
  const refresh = () => { refreshProfile(); refreshHistory() }

  if (error) return <ErrorState message={error} onRetry={refresh} />

  const recent = history?.items?.slice(0, 3) ?? []
  const firstName = profile?.displayName?.split(' ')?.[0] ?? 'Stylist'
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="bg-[#F8F8F7] min-h-screen">
      {/* ── Page Header ─────────────────────────── */}
      <div className="bg-white border-b border-ink-200 px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="max-w-[1100px] mx-auto flex items-start justify-between gap-6">
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
            <p className="label-caps mb-2 flex items-center gap-1.5">
              <MapPin size={10} className="text-brand" />
              {profile?.location ? `${profile.location.city}, ${profile.location.country}` : 'Your Style Studio'}
            </p>
            <h1 className="font-display text-[clamp(28px,3.5vw,44px)] font-black leading-tight">
              {greeting},<br />
              <span className="text-brand italic font-normal">{firstName}</span>
            </h1>
          </motion.div>
          <div className="flex items-center gap-3 mt-2">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" placeholder="Search outfits, styles..." className="input-field pl-9 h-9 w-52 text-[13px]" />
            </div>
            <Button variant="outline" size="icon">
              <Bell size={16} />
            </Button>
            <Link href="/profile">
              <div className="w-9 h-9 rounded bg-brand text-white flex items-center justify-center font-bold text-[14px]">
                {(firstName[0] || 'A').toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* ── Hero Generate Card ──────────────────── */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
          <Link href="/recommend">
            <div className="relative h-[220px] sm:h-[280px] lg:h-[340px] rounded overflow-hidden mb-10 group cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop"
                fill className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]" alt="Fashion Hero"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent" />
              <div className="absolute inset-0 p-10 flex flex-col justify-end">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-1.5 rounded-sm mb-4 self-start">
                  <Sparkles size={10} className="text-white fill-white" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-[0.12em]">AI Curated</span>
                </div>
                <h2 className="font-display text-[clamp(22px,3vw,40px)] font-bold text-white tracking-tight mb-6">
                  Spring Collection<br />Curated for You
                </h2>
                <div className="flex gap-3">
                  <button className="btn-outline text-white border-white hover:bg-white hover:text-ink-900 text-[11px] h-9 px-5">Explore Collection</button>
                  <button className="btn-primary text-[11px] h-9 px-5">Generate Outfit</button>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Quick Actions ───────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-[20px] font-bold">Studio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Wardrobe', sub: 'Manage your items', icon: Shirt, href: '/wardrobe', color: '#10B981' },
              { label: 'Trends', sub: "What's hot today", icon: TrendingUp, href: '/trends', color: '#F59E0B' },
              { label: 'History', sub: 'Your past looks', icon: History, href: '/history', color: '#2E5B8E' },
            ].map((a, i) => (
              <Link href={a.href} key={i}>
                <Card variant="interactive" className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.color + '18' }}>
                    <a.icon size={18} style={{ color: a.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink-900">{a.label}</p>
                    <p className="text-[12px] text-ink-400">{a.sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-ink-300 flex-shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Looks ─────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-[20px] font-bold">Recent Looks</h2>
            <Link href="/history" className="text-[12px] font-semibold text-brand hover:text-brand-dark uppercase tracking-wide transition-colors flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          {histLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {[0,1,2].map(i => <OutfitCardSkeleton key={i} index={i} />)}
            </div>
          ) : recent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {recent.map((outfit, i) => (
                <motion.div key={outfit._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay: i * 0.08 }}>
                  <OutfitCard recommendation={outfit} onOpen={() => setSelected(outfit)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-ink-200">
              <div className="w-12 h-12 rounded border border-ink-200 flex items-center justify-center mb-5">
                <Plus size={24} className="text-ink-300" strokeWidth={1.5} />
              </div>
              <h4 className="text-[16px] font-bold mb-2">No looks yet</h4>
              <p className="text-[13px] text-ink-400 mb-6 max-w-xs">Your AI styling journey starts here.</p>
              <Link href="/recommend"><Button variant="brand">Style Me Now</Button></Link>
            </Card>
          )}
        </section>
      </div>

      <AnimatePresence>
        {selected && <OutfitDetail recommendation={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
