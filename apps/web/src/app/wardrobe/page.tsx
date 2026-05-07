'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Plus, Search, Trash2, Shirt, LayoutGrid, List, X,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { useWardrobe } from '../../hooks'
import { AppLayout } from '../../components/layout/AppLayout'
import { cn } from '../../lib/utils'
import type { ClothingCategoryEnum } from '../../../../../packages/shared/src/schemas'
import type { z } from 'zod'

type Category = z.infer<typeof ClothingCategoryEnum>

const CATEGORIES = ['all', 'top', 'bottom', 'shoes', 'outerwear', 'accessory', 'dress', 'suit'] as const

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', top: 'Top', bottom: 'Bottom', shoes: 'Shoes',
  outerwear: 'Outerwear', accessory: 'Accessory', dress: 'Dress', suit: 'Suit',
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  top:       'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400&auto=format&fit=crop',
  bottom:    'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400&auto=format&fit=crop',
  shoes:     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
  outerwear: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=400&auto=format&fit=crop',
  accessory: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=400&auto=format&fit=crop',
  dress:     'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400&auto=format&fit=crop',
  suit:      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=400&auto=format&fit=crop',
}

interface AddItemFormData {
  name:      string
  category:  Category
  imageUrl:  string
  color:     string
}

const DEFAULT_FORM: AddItemFormData = {
  name:     '',
  category: 'top',
  imageUrl: '',
  color:    '',
}

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: AddItemFormData) => Promise<void> }) {
  const [form, setForm]     = useState<AddItemFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const previewSrc = form.imageUrl || PLACEHOLDER_IMAGES[form.category] || ''

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Item name is required'); return }

    const imageUrl = form.imageUrl.trim() || PLACEHOLDER_IMAGES[form.category] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400&auto=format&fit=crop'

    setSaving(true); setError('')
    try {
      await onAdd({ ...form, imageUrl })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white w-full sm:max-w-[520px] rounded-t-2xl sm:rounded shadow-[0_-8px_40px_rgba(0,0,0,0.15)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-200">
          <h2 className="font-display text-[20px] font-bold">Add to Wardrobe</h2>
          <button onClick={onClose} className="w-9 h-9 rounded flex items-center justify-center text-ink-400 hover:bg-ink-100 transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex gap-5 items-start">
            <div className="w-24 h-28 rounded bg-ink-100 overflow-hidden flex-shrink-0 border border-ink-200">
              {previewSrc && (
                <Image src={previewSrc} alt="Preview" width={96} height={112} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              {/* Category selector */}
              <div>
                <label className="text-[11px] font-bold text-ink-500 uppercase tracking-[0.1em] block mb-2">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter(c => c !== 'all').map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm(f => ({ ...f, category: cat as Category }))}
                      className={cn(
                        'px-3 py-1.5 rounded text-[11px] font-semibold border transition-all',
                        form.category === cat
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400'
                      )}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <Input
            label="Item Name"
            placeholder="e.g. White Oxford Shirt"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={error && !form.name.trim() ? error : ''}
          />

          {/* Color */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color (optional)"
              placeholder="e.g. #FFFFFF or White"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            />
            {form.color && (
              <div className="flex items-end pb-1">
                <div
                  className="w-9 h-9 rounded-full border-2 border-white shadow-soft"
                  style={{ backgroundColor: form.color.startsWith('#') ? form.color : undefined }}
                />
                {!form.color.startsWith('#') && (
                  <span className="text-[12px] text-ink-400 ml-2">{form.color}</span>
                )}
              </div>
            )}
          </div>

          {/* Image URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-ink-500 uppercase tracking-[0.1em]">
                Image URL (optional)
              </label>
              <span className="text-[11px] text-ink-400">Auto-assigned if blank</span>
            </div>
            <Input
              placeholder="https://images.unsplash.com/..."
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              hint="Leave blank to use a default image for this category"
            />
          </div>

          {error && form.name.trim() && (
            <p className="text-[13px] text-red-500 font-medium">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="brand" className="flex-1" onClick={handleSubmit} isLoading={saving}>
              Add to Wardrobe
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function WardrobePage(): React.JSX.Element {
  const { items, isLoading, error: wardrobeError, addItem, deleteItem } = useWardrobe()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView]     = useState<'grid' | 'list'>('grid')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = items.filter(item => {
    const matchCat    = filter === 'all' || item.category === filter
    const matchSearch = !search || (item.name || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <AppLayout>
      <div className="bg-[#F8F8F7] min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-ink-200 px-4 sm:px-6 md:px-8 py-5 md:py-7">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="label-caps mb-1">Personal Archive</p>
              <h1 className="font-display text-[clamp(24px,3vw,36px)] font-bold">Wardrobe</h1>
            </div>
            <Button variant="brand" className="flex items-center gap-2" onClick={() => setShowAdd(true)}>
              <Plus size={14} strokeWidth={3} /> Add Item
            </Button>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          {/* Search + controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search wardrobe..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 h-10 text-[13px]"
              />
            </div>
            <div className="flex gap-2">
              {(['grid', 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'w-10 h-10 rounded flex items-center justify-center border transition-all',
                    view === v ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200 text-ink-400 hover:border-ink-400'
                  )}
                >
                  {v === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  'flex-shrink-0 px-4 h-8 rounded-sm text-[12px] font-semibold uppercase tracking-wide transition-all border',
                  filter === cat
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400'
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
            <button
              onClick={() => setShowAdd(true)}
              className="flex-shrink-0 ml-auto px-4 h-8 rounded-sm text-[12px] font-semibold uppercase tracking-wide bg-ink-900 text-white border border-ink-900 flex items-center gap-1.5 hover:bg-ink-700 transition-colors"
            >
              <Plus size={12} strokeWidth={3} /> Add Item
            </button>
          </div>

          {/* Stats bar */}
          {wardrobeError && !isLoading && (
            <div className="border border-red-200 bg-red-50 rounded p-5 mb-6 flex items-center justify-between" role="alert">
              <p className="text-[13px] text-red-700 font-medium">Couldn't load your wardrobe. Check your connection.</p>
              <button onClick={() => window.location.reload()} className="text-[12px] font-semibold text-red-600 hover:text-red-800 underline">Retry</button>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="flex items-center gap-4 mb-6 text-[12px] text-ink-400">
              <span><strong className="text-ink-700">{items.length}</strong> total items</span>
              {filter !== 'all' && <span><strong className="text-ink-700">{filtered.length}</strong> matching</span>}
            </div>
          )}

          {/* Grid / List */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2">
              <Shirt size={32} className="text-ink-300 mb-5" strokeWidth={1.5} />
              <h4 className="text-[15px] font-bold mb-2">
                {search || filter !== 'all' ? 'No items found' : 'Empty Wardrobe'}
              </h4>
              <p className="text-[13px] text-ink-400 max-w-xs mb-6">
                {search || filter !== 'all'
                  ? 'Try a different filter or search term.'
                  : 'Digitize your collection to unlock AI-powered style recommendations.'}
              </p>
              {!search && filter === 'all' && (
                <Button variant="brand" onClick={() => setShowAdd(true)}>
                  <Plus size={14} /> Add First Item
                </Button>
              )}
            </Card>
          ) : (
            <div className={cn(
              view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5' : 'flex flex-col gap-3'
            )}>
              {filtered.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card
                    variant={view === 'grid' ? 'interactive' : 'default'}
                    className={cn('group', view === 'list' && 'p-3 flex items-center gap-4')}
                  >
                    {view === 'grid' ? (
                      <>
                        <div className="relative aspect-[3/4] bg-ink-100 overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name || ''}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Shirt size={32} className="text-ink-300" strokeWidth={1} />
                            </div>
                          )}
                          {/* Delete overlay */}
                          <button
                            onClick={() => deleteItem(item._id)}
                            className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-ink-200"
                          >
                            <Trash2 size={12} className="text-ink-400 hover:text-red-500 transition-colors" />
                          </button>
                          {/* Info overlay on hover */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-ink-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-[12px] font-semibold truncate">{item.name}</p>
                            <p className="text-white/70 text-[10px] uppercase tracking-wide">{item.category}</p>
                          </div>
                          {/* Color indicator */}
                          {item.color && (
                            <div
                              className="absolute top-2 left-2 w-4 h-4 rounded-full border border-white/50 shadow-sm"
                              style={{ backgroundColor: item.color.startsWith('#') ? item.color : undefined }}
                            />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-[13px] font-semibold text-ink-900 truncate">{item.name || 'Untitled'}</p>
                          <p className="text-[11px] text-ink-400 uppercase tracking-wide mt-0.5 capitalize">{item.category}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-ink-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-ink-200">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name ?? item.category} width={56} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <Shirt size={18} className="text-ink-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-ink-900 truncate">{item.name || 'Untitled'}</p>
                          <p className="text-[11px] text-ink-400 uppercase tracking-wide capitalize">{item.category}</p>
                        </div>
                        {item.color && (
                          <div
                            className="w-5 h-5 rounded-full flex-shrink-0 border border-ink-200"
                            style={{ backgroundColor: item.color.startsWith('#') ? item.color : undefined }}
                          />
                        )}
                        <button
                          onClick={() => deleteItem(item._id)}
                          className="w-8 h-8 flex items-center justify-center text-ink-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddItemModal
            onClose={() => setShowAdd(false)}
            onAdd={async (data) => {
              const addData: { name: string; category: typeof data.category; imageUrl: string; color?: string } = {
                name:     data.name,
                category: data.category,
                imageUrl: data.imageUrl,
              }
              if (data.color) addData.color = data.color
              await addItem(addData)
            }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
