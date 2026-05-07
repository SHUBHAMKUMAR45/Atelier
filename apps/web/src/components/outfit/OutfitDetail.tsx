'use client'

import Image        from 'next/image'
import { useRouter }  from 'next/navigation'
import { motion }   from 'framer-motion'
import { X, Sparkles, Heart, Share2, RefreshCw, Info } from 'lucide-react'
import { useFeedback } from '../../hooks'
import type { OutfitRecommendation, ClothingItem } from '../../../../../packages/shared/src/schemas/index'

interface OutfitDetailProps {
  recommendation: OutfitRecommendation
  onClose:        () => void
  showActions?:   boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  top: '👕', bottom: '👖', shoes: '👟',
  outerwear: '🧥', dress: '👗', suit: '🤵', accessory: '💍',
}

/** Build a human-readable explanation from structured recommendation data.
 *  Never exposes raw AI prompts — only surfaces structured metadata. */
function buildExplainability(rec: OutfitRecommendation): string {
  const parts: string[] = []
  // Safely check for optional preferences if they exist in runtime response
  const styles = (rec as unknown as { preferences?: { styles: string[] } }).preferences?.styles
  if (styles?.length) parts.push(`matches your ${styles.slice(0, 2).join(' & ')} style preference`)
  const { temp, condition } = rec.weatherContext
  if (temp !== undefined && condition) {
    const feel = temp < 10 ? 'cold' : temp < 20 ? 'cool' : temp < 28 ? 'mild' : 'warm'
    parts.push(`suited for ${feel} ${condition.toLowerCase()} weather (${Math.round(temp)}°C)`)
  }
  if (rec.occasion) parts.push(`curated for a ${rec.occasion} occasion`)
  if (rec.outfit.confidenceScore > 0.85) parts.push('high confidence match based on your history')
  return parts.length
    ? `Recommended because it ${parts.join(', ')}.`
    : 'Curated based on your style profile and current conditions.'
}


export function OutfitDetail({ recommendation, onClose }: OutfitDetailProps): React.JSX.Element {
  const { submit } = useFeedback()
  const router = useRouter()
  const { outfit, occasion, weatherContext } = recommendation
  const liked = recommendation.feedback?.rating === 'like'
  const explainability = buildExplainability(recommendation)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white w-full sm:max-w-[680px] max-h-[96vh] sm:max-h-[88vh] overflow-y-auto flex flex-col relative rounded-t-2xl sm:rounded shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={outfit.title}
      >
        {/* ── Image hero ─────────────────────────────────── */}
        <div className="relative w-full h-[260px] sm:h-[320px] bg-ink-100 flex-shrink-0 overflow-hidden">
          {recommendation.imageUrl ? (
            <Image src={recommendation.imageUrl} alt={outfit.title} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center gap-4 flex-wrap px-10">
              {outfit.colorPalette.map((color: string, i: number) => (
                <div key={i} className="w-16 h-20 rounded" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 to-transparent" />

          {/* Chips at bottom of image — matches reference */}
          <div className="absolute bottom-4 left-5 flex gap-2">
            <span className="bg-white/90 backdrop-blur-sm text-ink-900 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-sm border border-white/50 capitalize">
              {occasion}
            </span>
            <span className="bg-white/90 backdrop-blur-sm text-ink-900 text-[11px] font-bold px-3 py-1.5 rounded-sm border border-white/50">
              {weatherContext.temp}°C · {weatherContext.condition}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded flex items-center justify-center text-ink-700 hover:bg-white transition-all border border-ink-200"
            aria-label="Close"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div className="flex-1 p-6 sm:p-8">

          <h2 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-ink-900 tracking-tight leading-tight mb-3">
            {outfit.title}
          </h2>
          <p className="text-[14px] text-ink-500 mb-5 leading-relaxed">{outfit.description}</p>

          {/* AI Explainability */}
          <div className="flex items-start gap-2.5 px-4 py-3 bg-brand/5 border border-brand/15 rounded mb-5">
            <Info size={13} className="text-brand flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-bold text-brand uppercase tracking-[0.1em] mb-0.5">Why this outfit?</p>
              <p className="text-[12px] text-ink-600 leading-relaxed">{explainability}</p>
            </div>
          </div>

          {/* Style tag chips — from reference */}
          <div className="flex flex-wrap gap-2 mb-6">
            {outfit.items.slice(0, 4).map((item: ClothingItem, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-ink-50 border border-ink-200 rounded text-[11px] font-semibold text-ink-600 capitalize">
                {item.category}
              </span>
            ))}
          </div>

          {/* Action row — Save · Regenerate · Share (like reference) */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-ink-100">
            <button
              onClick={() => submit(recommendation._id, 'like')}
              className={`flex items-center gap-2 px-4 h-9 rounded border text-[12px] font-semibold uppercase tracking-wide transition-all ${
                liked
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-ink-700 border-ink-200 hover:border-brand hover:text-brand'
              }`}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              {liked ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => { onClose(); router.push('/recommend') }}
              className="flex items-center gap-2 px-4 h-9 rounded border border-ink-200 text-[12px] font-semibold uppercase tracking-wide text-ink-700 hover:border-ink-400 transition-all bg-white"
              aria-label="Generate a new outfit"
            >
              <RefreshCw size={13} /> Regenerate
            </button>
            <button className="flex items-center gap-2 px-4 h-9 rounded border border-ink-200 text-[12px] font-semibold uppercase tracking-wide text-ink-700 hover:border-ink-400 transition-all bg-white">
              <Share2 size={13} /> Share
            </button>
          </div>

          {/* Items list — matches reference "Items list" section */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.12em] mb-1">Items list</h3>
            <p className="text-[13px] text-ink-500 mb-5 leading-relaxed">{outfit.description}</p>
            <div className="space-y-3">
              {outfit.items.map((item: ClothingItem, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="flex items-center gap-4 p-4 bg-ink-50 border border-ink-100 rounded hover:bg-white transition-colors"
                >
                  <div className="w-11 h-11 rounded bg-white border border-ink-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{CATEGORY_ICONS[item.category] ?? '👕'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-ink-900 truncate">{item.name}</p>

                    </div>
                    <p className="text-[12px] text-ink-400 line-clamp-1 mt-0.5">{item.description}</p>
                    {/* Tag chips per item */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-white border border-ink-200 rounded text-[10px] font-medium text-ink-500 capitalize">{item.category}</span>
                      {item.material && <span className="px-2 py-0.5 bg-white border border-ink-200 rounded text-[10px] font-medium text-ink-500">{item.material}</span>}
                      <span className="px-2 py-0.5 bg-white border border-ink-200 rounded text-[10px] font-medium text-ink-500 capitalize">{item.style}</span>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full flex-shrink-0 border border-ink-200" style={{ backgroundColor: item.color }} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Styling tips */}
          {outfit.stylingTips.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.12em] mb-4">Stylist Notes</h3>
              <div className="space-y-3">
                {outfit.stylingTips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-brand/5 border border-brand/15 rounded">
                    <Sparkles size={14} className="text-brand flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-ink-700 leading-relaxed font-medium">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colour palette */}
          <div>
            <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.12em] mb-4">Colour Palette</h3>
            <div className="flex flex-wrap gap-4">
              {outfit.colorPalette.map((color: string, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full border border-ink-200 shadow-soft" style={{ backgroundColor: color }} />
                  <span className="text-[9px] font-semibold text-ink-400 uppercase tracking-wide">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
