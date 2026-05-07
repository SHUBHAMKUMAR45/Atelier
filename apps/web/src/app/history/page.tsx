'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, LayoutGrid, List } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { mutate } from 'swr'
import { useHistory } from '../../hooks'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { OutfitCard, OutfitCardSkeleton } from '../../components/outfit/OutfitCard'
import { OutfitDetail } from '../../components/outfit/OutfitDetail'
import { AppLayout } from '../../components/layout/AppLayout'
import { api } from '../../lib/api-client'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

const OCCASIONS = ['all', 'casual', 'work', 'date', 'party', 'outdoor', 'gym', 'travel', 'wedding'] as const

export default function HistoryPage(): React.JSX.Element {
  useAuth()
  const [page, setPage]     = useState(1)
  const [filter, setFilter] = useState<string>('all')
  const [view, setView]     = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OutfitRecommendation | null>(null)

  const { data, isLoading, error, refresh } = useHistory(page)
  const items    = data?.items ?? []
  const filtered = items.filter(r => {
    const matchOcc = filter === 'all' || r.occasion === filter
    const matchS   = !search || r.outfit.title.toLowerCase().includes(search.toLowerCase())
    return matchOcc && matchS
  })

  async function handleDelete(id: string) {
    try { await api.recommend.delete(id); await mutate(['history', page]); toast.success('Outfit removed') }
    catch { toast.error('Could not remove outfit') }
  }

  return (
    <AppLayout>
      <div className="bg-[#F8F8F7] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-ink-200 px-4 sm:px-6 md:px-8 py-5 md:py-7">
          <div className="max-w-[1100px] mx-auto flex items-end justify-between gap-4">
            <div>
              <p className="label-caps mb-1">Aesthetic Archive</p>
              <h1 className="font-display text-[clamp(24px,3vw,36px)] font-bold">Outfit History</h1>
            </div>
            {data && <span className="text-[13px] text-ink-400 mb-1">{data.total} looks</span>}
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search looks…" className="input-field pl-9 h-10 text-[13px]" />
            </div>
            <div className="flex gap-2">
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={cn('w-10 h-10 rounded flex items-center justify-center border transition-all', view === v ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200 text-ink-400 hover:border-ink-400')}>
                  {v === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion filters */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 pb-1">
            {OCCASIONS.map(occ => (
              <button key={occ} onClick={() => setFilter(occ)}
                className={cn('flex-shrink-0 px-4 h-8 rounded-sm text-[12px] font-semibold uppercase tracking-wide transition-all border capitalize', filter === occ ? 'bg-brand text-white border-brand' : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400')}>
                {occ === 'all' ? 'All' : occ}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {[0,1,2,3,4,5].map(i => <OutfitCardSkeleton key={i} index={i} />)}
            </div>
          ) : error ? (
            <ErrorState
              title="Couldn\'t load your history"
              message="There was a problem connecting to Atelier. Your outfits are safe — check your connection and try again."
              onRetry={() => refresh()}
            />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-ink-200 rounded">
              <Heart size={28} className="text-ink-300 mx-auto mb-4" strokeWidth={1.5} />
              <h4 className="text-[15px] font-bold mb-2">{search || filter !== 'all' ? 'No matches' : 'Empty collection'}</h4>
              <p className="text-[13px] text-ink-400">{search || filter !== 'all' ? 'Adjust your search or filters.' : 'Your curated outfits will appear here.'}</p>
            </div>
          ) : (
            <motion.div className={cn('gap-5', view === 'grid' ? 'grid grid-cols-1 md:grid-cols-3' : 'flex flex-col')} initial={{ opacity:0 }} animate={{ opacity:1 }}>
              {filtered.map((rec, i) => (
                <motion.div key={rec._id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2, delay: i * 0.04 }}>
                  <OutfitCard recommendation={rec} onOpen={() => setSelected(rec)} onDelete={handleDelete} index={i} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-8 mt-16">
              <Button variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>Back</Button>
              <span className="text-[13px] font-semibold text-ink-600">{page} / {data.pages}</span>
              <Button variant="outline" onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data.pages}>Forward</Button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && <OutfitDetail recommendation={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
