'use client'

import { useState }              from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, Grid3X3, List } from 'lucide-react'
import { useAuth }               from '@clerk/nextjs'
import { mutate }                from 'swr'
import { useHistory }            from '../../hooks'
import { OutfitCard, OutfitCardSkeleton } from '../../components/outfit/OutfitCard'
import { OutfitDetail }          from '../../components/outfit/OutfitDetail'
import { AppLayout }             from '../../components/layout/AppLayout'
import { api }                   from '../../lib/api-client'
import { toast }                 from 'sonner'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

const OCCASIONS = ['all','casual','work','date','party','outdoor','gym','travel','wedding'] as const

export default function HistoryPage() : JSX.Element {
  const { getToken }        = useAuth()
  const [page, setPage]     = useState(1)
  const [filter, setFilter] = useState<string>('all')
  const [view, setView]     = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OutfitRecommendation | null>(null)

  const { data, isLoading, error } = useHistory(page)

  const items = data?.items ?? []
  const filtered = items.filter(r => {
    const matchOccasion = filter === 'all' || r.occasion === filter
    const matchSearch   = !search || r.outfit.title.toLowerCase().includes(search.toLowerCase())
    return matchOccasion && matchSearch
  })

  async function handleDelete(id: string) {
    try {
      const token = await getToken()
      if (!token) return
      await api.recommend.delete(token, id)
      await mutate('history-1')
      toast.success('Outfit removed')
    } catch {
      toast.error('Could not remove outfit')
    }
  }

  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="mb-12">
        <p className="text-[13px] font-bold text-ink-secondary uppercase tracking-widest mb-4">Your Wardrobe</p>
        <div className="flex items-end justify-between">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-ink-primary leading-tight">
            Outfit History
          </h1>
          {data && (
            <span className="text-[15px] font-bold text-ink-secondary mb-2 whitespace-nowrap">{data.total} looks</span>
          )}
        </div>
      </motion.div>

      {/* ── Search + Controls ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-10">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your looks…"
            className="w-full bg-white border border-ink-border rounded-[20px] shadow-sm
                       pl-12 pr-4 py-4 text-[16px] font-medium text-ink-primary
                       placeholder:text-ink-secondary focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/40 transition-all"
          />
        </div>
        <div className="flex items-center self-end border border-ink-border rounded-[20px] overflow-hidden shadow-sm bg-white p-1">
          <button onClick={() => setView('grid')}
            className={clsx(
              "p-3 rounded-lg transition-all",
              view==='grid' ? 'bg-secondary text-brand' : 'text-ink-secondary hover:text-ink-primary'
            )}>
            <Grid3X3 size={20} />
          </button>
          <button onClick={() => setView('list')}
            className={clsx(
              "p-3 rounded-lg transition-all",
              view==='list' ? 'bg-secondary text-brand' : 'text-ink-secondary hover:text-ink-primary'
            )}>
            <List size={20} />
          </button>
        </div>
      </div>

      {/* ── Filter Pills ─────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-6 mb-10 hide-scrollbar scroll-smooth">
        {OCCASIONS.map(occ => (
          <button key={occ}
            onClick={() => setFilter(occ)}
            className={clsx(
              "flex-shrink-0 text-[14px] font-bold px-6 py-2.5 rounded-full border transition-all duration-200 capitalize",
              filter === occ
                ? 'bg-brand text-white border-brand shadow-md scale-[1.02]'
                : 'bg-white text-ink-secondary border-ink-border hover:bg-secondary'
            )}>
            {occ === 'all' ? 'All' : occ}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[0,1,2,3,4,5,6,7].map(i => <div key={i} className="aspect-[3/4] rounded-[24px] bg-secondary animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-24 text-ink-secondary font-bold text-lg">
          Connection lost. Please refresh.
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="text-center py-32 bg-secondary/30 rounded-[32px] border border-ink-border border-dashed mt-4">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Heart size={32} className="text-brand/40" />
          </div>
          <h3 className="text-2xl font-black text-ink-primary mb-3">
            {search || filter !== 'all' ? 'No matches' : 'Empty collection'}
          </h3>
          <p className="text-ink-secondary font-medium max-w-sm mx-auto">
            {search || filter !== 'all' ? 'Adjust your filters to see more.' : 'Your generated outfits will appear here.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8' : 'flex flex-col gap-6'}
          initial={{ opacity:0 }} animate={{ opacity:1 }}>
          {filtered.map((rec, i) => (
            <motion.div key={rec._id}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.04 }}>
              <OutfitCard
                recommendation={rec}
                onOpen={() => setSelected(rec)}
                onDelete={handleDelete}
                index={i}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ────────────────────────────────────── */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-8 mt-20">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-8 py-3 text-[15px] font-black rounded-xl border border-ink-border bg-white text-ink-primary
                       disabled:opacity-20 hover:bg-secondary transition-all shadow-sm active:scale-95">
            Previous
          </button>
          <span className="text-[15px] font-black text-ink-primary">
            {page} / {data.pages}
          </span>
          <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data.pages}
            className="px-8 py-3 text-[15px] font-black rounded-full border border-ink-border bg-white text-ink-primary
                       disabled:opacity-20 hover:bg-secondary transition-all shadow-sm active:scale-95">
            Next
          </button>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <OutfitDetail recommendation={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
