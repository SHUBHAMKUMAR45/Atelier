'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useFeedback } from '../../hooks'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

interface OutfitCardProps {
  recommendation: OutfitRecommendation
  onDelete?: (id: string) => void
  onOpen?: () => void
  index?: number
  showActions?: boolean
}

export function OutfitCard({ recommendation, onOpen, onDelete, index: _index = 0, showActions = true }: OutfitCardProps): React.JSX.Element {
  const { submit } = useFeedback()
  const { outfit, occasion, weatherContext, imageUrl, imageStatus, feedback } = recommendation

  return (
    <motion.article
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4, delay: _index * 0.05, ease:[0.22,1,0.36,1] }}
      className="group bg-white border border-ink-200 rounded overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full"
      onClick={onOpen}
      style={onOpen ? { cursor:'pointer' as const } : {}}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-ink-100">
        {imageStatus === 'ready' && imageUrl ? (
          <Image src={imageUrl} alt={outfit.title} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {outfit.colorPalette.slice(0,5).map((color,i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
            {imageStatus === 'generating' && <span className="text-[11px] text-ink-400 font-medium animate-pulse">Generating…</span>}
          </div>
        )}
        {/* Confidence chip */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/95 border border-ink-200 rounded px-2 py-1 flex items-center gap-1.5">
            <div className={clsx('w-1.5 h-1.5 rounded-full', outfit.confidenceScore > 0.8 ? 'bg-green-500' : outfit.confidenceScore > 0.6 ? 'bg-amber-400' : 'bg-red-400')} />
            <span className="text-[10px] font-bold text-ink-700">{Math.round(outfit.confidenceScore * 100)}%</span>
          </div>
        </div>
        {/* Occasion label */}
        <div className="absolute top-3 left-3">
          <span className="bg-ink-900/80 text-white text-[9px] font-bold uppercase tracking-[0.08em] px-2 py-1 rounded">{occasion}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-[15px] sm:text-[16px] font-bold text-ink-900 leading-tight line-clamp-2 mb-1.5">{outfit.title}</h3>
        <p className="text-[12px] text-ink-400 mb-2">{weatherContext.temp}°C · {weatherContext.condition}</p>
        <p className="text-[12px] text-ink-500 line-clamp-2 mb-4 flex-1 leading-relaxed">{outfit.description}</p>

        {/* Tag chips — like reference */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {outfit.items.slice(0,3).map((item,i) => (
            <span key={i} className="px-2 py-0.5 bg-ink-50 border border-ink-200 rounded text-[10px] font-medium text-ink-500 capitalize">{item.category}</span>
          ))}
        </div>

        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <div className="flex items-center gap-1.5">
              <button onClick={e => { e.stopPropagation(); submit(recommendation._id,'like') }} className={clsx('w-8 h-8 rounded flex items-center justify-center border transition-all', feedback.rating === 'like' ? 'bg-brand border-brand text-white' : 'bg-white border-ink-200 text-ink-400 hover:border-brand hover:text-brand')}>
                <ThumbsUp size={13} strokeWidth={feedback.rating === 'like' ? 3 : 2} />
              </button>
              <button onClick={e => { e.stopPropagation(); submit(recommendation._id,'dislike') }} className={clsx('w-8 h-8 rounded flex items-center justify-center border transition-all', feedback.rating === 'dislike' ? 'bg-ink-900 border-ink-900 text-white' : 'bg-white border-ink-200 text-ink-400 hover:border-ink-400')}>
                <ThumbsDown size={13} strokeWidth={feedback.rating === 'dislike' ? 3 : 2} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {feedback.savedAt && <div className="w-8 h-8 flex items-center justify-center rounded bg-red-50 text-red-400"><Heart size={13} className="fill-current" /></div>}
              {onDelete && (
                <button onClick={e => { e.stopPropagation(); onDelete(recommendation._id) }} className="w-8 h-8 flex items-center justify-center rounded text-ink-300 hover:text-red-400 hover:bg-red-50 transition-all border border-transparent">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.article>
  )
}

export function OutfitCardSkeleton({ index: _i = 0 }: { index?: number } = {}): React.JSX.Element {
  return (
    <div className="bg-white border border-ink-200 rounded overflow-hidden flex flex-col">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="flex gap-1.5 pt-2">
          <div className="skeleton h-6 w-14 rounded" />
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  )
}
