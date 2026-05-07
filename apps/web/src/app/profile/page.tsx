'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { z } from 'zod'
import { UserButton } from '@clerk/nextjs'
import { mutate } from 'swr'
import { ChevronRight, Ruler, Heart, Sparkles, Info } from 'lucide-react'
import { useProfile, useHistory } from '../../hooks'
import { AppLayout } from '../../components/layout/AppLayout'
import { api } from '../../lib/api-client'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../lib/utils'
import type { UserPreferences, StyleEnum, OccasionEnum, GenderEnum, BudgetEnum } from '../../../../../packages/shared/src/schemas'

const STYLES = ['casual', 'formal', 'streetwear', 'business', 'athletic', 'bohemian', 'minimalist', 'vintage'] as const
const GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say'] as const

function Section({ title, icon, open, onToggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-ink-200 rounded overflow-hidden mb-3">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-5 hover:bg-ink-50/60 transition-colors text-left">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded bg-brand/10 text-brand flex items-center justify-center">{icon}</div>
          <span className="text-[15px] font-semibold text-ink-900">{title}</span>
        </div>
        <ChevronRight size={16} className={cn('text-ink-300 transition-transform duration-300', open && 'rotate-90')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}>
            <div className="px-6 pb-6 pt-2 border-t border-ink-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProfilePage(): React.JSX.Element {
  const { profile, isLoading } = useProfile()
  const { data: history } = useHistory(1)
  const [openSection, setOpenSection] = useState<string>('measurements')
  const [saving, setSaving] = useState(false)

  const [height, setHeight]   = useState(() => profile?.measurements?.height ?? 170)
  const [weight, setWeight]   = useState(() => profile?.measurements?.weight ?? 65)
  const [chest, setChest]     = useState(() => profile?.measurements?.chest ?? 90)
  const [waist, setWaist]     = useState(() => profile?.measurements?.waist ?? 76)
  const [hips]                = useState(() => profile?.measurements?.hips ?? 92)
  const [styles, setStyles]   = useState<string[]>(() => profile?.preferences?.styles ?? ['casual'])
  const [occasions]           = useState<string[]>(() => profile?.preferences?.occasions ?? ['casual'])
  const [gender, setGender]   = useState<string>(() => profile?.preferences?.gender ?? 'prefer-not-to-say')
  const [budget]              = useState<string>(() => profile?.preferences?.budget ?? 'mid')
  const [colors]              = useState<string[]>(() => profile?.preferences?.colors ?? [])

  function toggleArr(arr: string[], val: string, max?: number): string[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : max && arr.length >= max ? arr : [...arr, val]
  }

  async function saveMeasurements() {
    setSaving(true)
    try { await api.profile.updateMeasurements({ height, weight, chest, waist, hips }); await mutate('profile'); toast.success('Measurements updated') }
    catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  async function savePreferences() {
    setSaving(true)
    try {
      const prefs: UserPreferences = {
        styles: styles as Array<z.infer<typeof StyleEnum>>,
        occasions: occasions as Array<z.infer<typeof OccasionEnum>>,
        gender: gender as z.infer<typeof GenderEnum>,
        budget: budget as z.infer<typeof BudgetEnum>,
        colors, avoidColors: [],
      }
      await api.profile.updatePreferences(prefs); await mutate('profile'); toast.success('Style preferences updated')
    } catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  if (isLoading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="bg-[#F8F8F7] min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-ink-200 px-4 sm:px-6 md:px-8 py-5 md:py-7">
          <div className="max-w-[900px] mx-auto flex items-center justify-between">
            <div>
              <p className="label-caps mb-1">Account</p>
              <h1 className="font-display text-[clamp(24px,3vw,36px)] font-bold">Profile</h1>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          {/* User Card — matches reference: avatar + name + email + stats */}
          <div className="bg-white border border-ink-200 rounded p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-5">
            <div className="relative">
              <UserButton appearance={{ elements: { avatarBox: 'w-16 h-16' } }} />
              <div className="absolute -bottom-1 -right-1 bg-brand text-white p-1.5 rounded border-2 border-white">
                <Sparkles size={10} className="fill-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display text-[20px] font-bold">{profile?.displayName}</h2>
              <p className="text-[13px] text-ink-400">{profile?.email}</p>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-[22px] font-bold font-display">{history?.total || 0}</p>
                <p className="label-caps mt-0.5">Looks</p>
              </div>
              <div className="w-px h-10 bg-ink-200 self-center" />
              <div className="text-center">
                <p className="text-[22px] font-bold font-display">{styles.length}</p>
                <p className="label-caps mt-0.5">Styles</p>
              </div>
            </div>
          </div>

          {/* Sections — like reference collapsible rows */}
          <Section title="Measurements" icon={<Ruler size={16} />} open={openSection === 'measurements'} onToggle={() => setOpenSection(openSection === 'measurements' ? '' : 'measurements')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[{label:'Height (cm)', val:height, set:setHeight},{label:'Weight (kg)', val:weight, set:setWeight},{label:'Chest (cm)', val:chest, set:setChest},{label:'Waist (cm)', val:waist, set:setWaist}].map(item => (
                <Input key={item.label} label={item.label} type="number" value={item.val} onChange={e => item.set(Number(e.target.value))} />
              ))}
            </div>
            {/* Measurement chips — like reference */}
            <div className="flex flex-wrap gap-2 mt-4 mb-4">
              <span className="px-3 py-1.5 bg-ink-100 rounded text-[12px] font-medium text-ink-600">Height {height}cm</span>
              <span className="px-3 py-1.5 bg-ink-100 rounded text-[12px] font-medium text-ink-600">Weight {weight}lbs</span>
            </div>
            <Button variant="brand" onClick={saveMeasurements} isLoading={saving} className="mt-2">Save Measurements</Button>
          </Section>

          <Section title="Style Preferences" icon={<Heart size={16} />} open={openSection === 'preferences'} onToggle={() => setOpenSection(openSection === 'preferences' ? '' : 'preferences')}>
            <div className="space-y-6 mt-4">
              <div>
                <p className="label-caps mb-3">Wardrobe Context</p>
                <div className="flex flex-wrap gap-2">
                  {GENDERS.map(g => (
                    <button key={g} onClick={() => setGender(g)} className={cn('px-4 py-2 rounded text-[12px] font-semibold transition-all border capitalize', gender === g ? 'bg-ink-900 border-ink-900 text-white' : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400')}>
                      {g.replace(/-/g,' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-caps mb-3">Preferred Aesthetics (Max 5)</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => setStyles(toggleArr(styles,s,5))} className={cn('px-4 py-2 rounded text-[12px] font-semibold transition-all border capitalize', styles.includes(s) ? 'bg-brand border-brand text-white' : 'bg-white border-ink-200 text-ink-500 hover:border-brand/40')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Smart casual chips like reference */}
              <div>
                <p className="label-caps mb-3">Preferred Colors</p>
                <div className="flex gap-3">
                  {['#2E5B8E','#8B7355','#4A5568','#E8D5B7','#2D3748'].map((c,i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-soft cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button variant="brand" onClick={savePreferences} isLoading={saving}>Sync Preferences</Button>
            </div>
          </Section>

          {/* Info card */}
          <div className="bg-brand/5 border border-brand/15 rounded p-5 flex items-center gap-4 mt-3">
            <div className="w-9 h-9 rounded bg-white border border-brand/20 flex items-center justify-center text-brand flex-shrink-0"><Info size={16} /></div>
            <div>
              <p className="text-[14px] font-semibold text-ink-900 mb-0.5">Security & Settings</p>
              <p className="text-[12px] text-ink-500">Identity and security settings can be updated via the account button above.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
