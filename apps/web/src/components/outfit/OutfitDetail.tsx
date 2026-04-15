'use client'

import Image             from 'next/image'
import { motion }        from 'framer-motion'
import { X, Sparkles }   from 'lucide-react'
import { clsx }          from 'clsx'
import type { OutfitRecommendation } from '../../../../../packages/shared/src/schemas'

interface OutfitDetailProps {
  recommendation: OutfitRecommendation
  onClose:        () => void
}

const CATEGORY_ICONS: Record<string, string> = {
  top:       '👕', bottom: '👖', shoes:     '👟',
  outerwear: '🧥', dress:  '👗', suit:       '🤵',
  accessory: '💍',
}

export function OutfitDetail({ recommendation, onClose }: OutfitDetailProps) : JSX.Element {
  const { outfit, weatherContext, occasion } = recommendation

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-ink-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 12 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{ scale: 0.98,    opacity: 0, y: 12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-ink-border rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative shrink-0">
          <div className="h-64 sm:h-80 bg-secondary relative overflow-hidden">
            {recommendation.imageUrl ? (
              <Image
                src={recommendation.imageUrl}
                alt={outfit.title}
                fill className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-wrap gap-4 px-8">
                  {outfit.colorPalette.map((color, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-14 h-14 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-md border border-ink-border
                       rounded-full flex items-center justify-center text-ink-primary shadow-sm
                       hover:bg-white hover:scale-105 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {/* Title Area */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-black text-brand uppercase tracking-widest border border-brand/20 bg-brand/5 px-2.5 py-1 rounded">
                {occasion}
              </span>
              <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-widest">
                {weatherContext.temp}°C · {weatherContext.condition}
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-ink-primary leading-tight mb-4">
              {outfit.title}
            </h2>
            <p className="text-ink-secondary text-[16px] leading-relaxed font-medium">
              {outfit.description}
            </p>
          </div>

          {/* Items Section */}
          <div className="mb-10">
            <h3 className="text-[13px] font-black text-ink-primary uppercase tracking-widest mb-6 px-1">Pieces</h3>
            <div className="space-y-4">
              {outfit.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-5 p-5 bg-secondary border border-ink-border rounded-2xl transition-colors hover:bg-white"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-ink-border shadow-sm flex items-center justify-center shrink-0">
                    <span className="text-2xl">{CATEGORY_ICONS[item.category] ?? '👕'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-black text-[15px] text-ink-primary tracking-tight truncate">{item.name}</p>
                      <span className="text-[11px] font-black text-brand uppercase">{item.priceRange}</span>
                    </div>
                    <p className="text-ink-secondary text-[14px] leading-snug font-medium line-clamp-1">{item.description}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full shrink-0 border border-white/40 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Styling tips */}
          {outfit.stylingTips.length > 0 && (
            <div className="mb-10">
              <h3 className="text-[13px] font-black text-ink-primary uppercase tracking-widest mb-6 px-1">Stylist Notes</h3>
              <div className="grid gap-3">
                {outfit.stylingTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-4 bg-brand/5 border border-brand/10 p-5 rounded-2xl">
                    <Sparkles size={18} className="text-brand shrink-0 mt-0.5" />
                    <p className="text-ink-primary text-[15px] leading-relaxed font-bold">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color palette */}
          <div className="mb-4">
            <h3 className="text-[13px] font-black text-ink-primary uppercase tracking-widest mb-6 px-1">Palette</h3>
            <div className="flex flex-wrap gap-5">
              {outfit.colorPalette.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-full border border-ink-border shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] font-black text-ink-secondary uppercase tracking-tighter">{color}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
