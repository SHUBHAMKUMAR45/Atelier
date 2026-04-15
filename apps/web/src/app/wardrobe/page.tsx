'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, Trash2, 
  Shirt, LayoutGrid, List, PlusCircle 
} from 'lucide-react'
import { clsx } from 'clsx'
import { useWardrobe } from '../../hooks'
import { AppLayout } from '../../components/layout/AppLayout'

const CATEGORIES = ['all', 'tops', 'bottoms', 'shoes', 'outerwear', 'accessories']

export default function WardrobePage() : JSX.Element {
  const { items, isLoading, deleteItem } = useWardrobe()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = items.filter(item => {
    const matchCat = filter === 'all' || item.category.toLowerCase() === filter
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="mb-12">
        <p className="text-[13px] font-bold text-ink-secondary uppercase tracking-widest mb-4">Your Collection</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-ink-primary leading-tight">
            Wardrobe
          </h1>
          <button className="flex items-center justify-center gap-2 bg-brand text-white px-8 py-4 rounded-full font-black text-[15px] shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={20} strokeWidth={3} />
            Add New Item
          </button>
        </div>
      </motion.div>

      {/* ── Filters & Search ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 mb-10">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your clothes..."
            className="w-full bg-white border border-ink-border rounded-[20px] shadow-sm
                       pl-12 pr-4 py-4 text-[16px] font-medium text-ink-primary
                       placeholder:text-ink-secondary focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/40 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-secondary p-1 rounded-[20px] border border-ink-border">
          {['grid', 'list'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as 'grid' | 'list')}
              className={clsx(
                "p-3 rounded-[16px] transition-all",
                view === v ? "bg-white text-brand shadow-sm border border-ink-border" : "text-ink-secondary hover:text-ink-primary"
              )}
            >
              {v === 'grid' ? <LayoutGrid size={20} /> : <List size={20} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Pills ─────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-6 mb-10 hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={clsx(
              "flex-shrink-0 text-[14px] font-bold px-6 py-2.5 rounded-full border transition-all duration-200 capitalize",
              filter === cat
                ? 'bg-brand text-white border-brand shadow-md scale-[1.02]'
                : 'bg-white text-ink-secondary border-ink-border hover:bg-secondary'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} className="aspect-[3/4] rounded-[24px] bg-secondary animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 bg-secondary/30 rounded-[32px] border border-ink-border border-dashed">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Shirt size={32} className="text-brand/40" />
          </div>
          <h3 className="text-2xl font-black text-ink-primary mb-3">
            {search || filter !== 'all' ? 'No items found' : 'Your wardrobe is empty'}
          </h3>
          <p className="text-ink-secondary font-medium max-w-sm mx-auto">
            {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'Add items to see them here and use them for virtual styling.'}
          </p>
          {!search && filter === 'all' && (
            <button className="mt-8 inline-flex items-center gap-2 bg-white text-ink-primary px-6 py-3 rounded-full font-bold border border-ink-border shadow-sm hover:bg-secondary transition-all">
              <PlusCircle size={18} /> Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className={clsx(
          view === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" 
            : "flex flex-col gap-4"
        )}>
          {filtered.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={clsx(
                "group relative bg-white border border-ink-border overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
                view === 'grid' ? "rounded-[24px]" : "rounded-2xl p-4 flex items-center gap-6"
              )}
            >
              {/* Image Container */}
              <div className={clsx(
                "bg-secondary overflow-hidden relative",
                view === 'grid' ? "aspect-[3/4] w-full" : "w-24 h-24 rounded-xl flex-shrink-0"
              )}>
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Actions Overlay (Grid) */}
                {view === 'grid' && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => deleteItem(item._id)}
                      className="p-3 bg-white text-red-500 rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={clsx(
                "p-5",
                view === 'grid' ? "" : "flex-1 flex items-center justify-between"
              )}>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-brand uppercase tracking-widest">{item.category}</p>
                  <h4 className="text-[16px] font-bold text-ink-primary tracking-tight leading-tight">{item.title}</h4>
                  {view === 'grid' && <p className="text-[13px] text-ink-secondary font-medium">Added recently</p>}
                </div>

                {/* Actions (List) */}
                {view === 'list' && (
                  <button 
                    onClick={() => deleteItem(item._id)}
                    className="p-3 text-ink-secondary hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="h-20" />
    </AppLayout>
  )
}
