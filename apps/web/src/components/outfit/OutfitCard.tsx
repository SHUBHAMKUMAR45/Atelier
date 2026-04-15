'use client'

import Image             from 'next/image'
import { motion }        from 'framer-motion'
import { Heart, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { clsx }          from 'clsx'
import { useFeedback }   from '../../hooks'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

interface OutfitCardProps {
  recommendation: OutfitRecommendation
  onDelete?:      (id: string) => void
  onOpen?:        () => void
  index?:         number
  showActions?:   boolean
}

export function OutfitCard({
  recommendation,
  onDelete,
  onOpen,
  index = 0,
  showActions = true,
}: OutfitCardProps) : JSX.Element {
  const { submit } = useFeedback()
  const { outfit, occasion, weatherContext, imageUrl, imageStatus, feedback } = recommendation

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white border border-ink-border rounded-2xl flex flex-col shadow-sm transition-all hover:shadow-md active:scale-[0.99] h-full"
      onClick={onOpen}
      {...(onOpen ? { style: { cursor: "pointer" } } : {})}
    >
      {/* ── Image area ─────────────────────────────────────── */}
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden rounded-t-2xl">
        {imageStatus === 'ready' && imageUrl ? (
          <Image
            src={imageUrl}
            alt={outfit.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="flex gap-2">
              {outfit.colorPalette.slice(0, 5).map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {imageStatus === 'generating' && (
              <span className="text-ink-secondary text-[12px] font-bold animate-pulse">Generating image...</span>
            )}
          </div>
        )}

        {/* Confidence score */}
        <div className="absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
          <div className="bg-white/90 backdrop-blur-md border border-ink-border shadow-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <div
              className={clsx(
                "w-1.5 h-1.5 rounded-full",
                outfit.confidenceScore > 0.8 ? 'bg-green-500' : outfit.confidenceScore > 0.6 ? 'bg-amber-400' : 'bg-red-500'
              )}
            />
            <span className="text-[11px] font-black text-ink-primary tracking-tight">
              {Math.round(outfit.confidenceScore * 100)}%
            </span>
          </div>
        </div>

        {/* Quick info overlay */}
        <div className="absolute inset-0 bg-ink-primary/0 group-hover:bg-ink-primary/5 transition-colors duration-300" />
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-brand uppercase tracking-widest border border-brand/20 bg-brand/5 px-2 py-0.5 rounded">
            {occasion}
          </span>
          <span className="text-[10px] font-bold text-ink-secondary lowercase">
            {weatherContext.temp}°C · {weatherContext.condition}
          </span>
        </div>

        <h3 className="text-[18px] font-black text-ink-primary leading-tight mb-2 tracking-tight line-clamp-1">
          {outfit.title}
        </h3>
        
        <p className="text-ink-secondary text-[14px] leading-snug line-clamp-2 mb-6 font-medium">
          {outfit.description}
        </p>

        {/* ── Actions ─────────────────────────────────────── */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-ink-border">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); submit(recommendation._id, 'like'); }}
                className={clsx(
                  'p-2 rounded-lg transition-all border',
                  feedback.rating === 'like'
                    ? 'bg-brand border-brand text-white shadow-sm'
                    : 'bg-white border-ink-border text-ink-secondary hover:bg-secondary hover:text-ink-primary',
                )}
              >
                <ThumbsUp size={16} strokeWidth={feedback.rating === 'like' ? 3 : 2} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); submit(recommendation._id, 'dislike'); }}
                className={clsx(
                  'p-2 rounded-lg transition-all border',
                  feedback.rating === 'dislike'
                    ? 'bg-brand border-brand text-white shadow-sm'
                    : 'bg-white border-ink-border text-ink-secondary hover:bg-secondary hover:text-ink-primary',
                )}
              >
                <ThumbsDown size={16} strokeWidth={feedback.rating === 'dislike' ? 3 : 2} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {feedback.savedAt && (
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                  <Heart size={16} className="fill-current" />
                </div>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(recommendation._id); }}
                  className="p-2 rounded-lg text-ink-secondary hover:text-red-500 hover:bg-red-50 transition-all border border-transparent"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.article>
  )
}

export function OutfitCardSkeleton({ index = 0 }: { index?: number }): JSX.Element {
  return (
    <div className="bg-white border border-ink-border rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
      <div className="skeleton aspect-[4/5] w-full bg-secondary" />
      <div className="p-5 space-y-4">
        <div className="skeleton h-5 w-2/3 rounded bg-secondary" />
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded bg-secondary" />
          <div className="skeleton h-3 w-4/5 rounded bg-secondary" />
        </div>
        <div className="flex gap-2 pt-4">
          <div className="skeleton h-8 w-8 rounded-lg bg-secondary" />
          <div className="skeleton h-8 w-8 rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  )
}
