'use client'

import { useState }              from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, useUser }      from '@clerk/nextjs'
import { UserButton }            from '@clerk/nextjs'
import { mutate }                from 'swr'
import { Save, ChevronDown, ChevronUp, Check, Ruler, Heart } from 'lucide-react'
import { useProfile, useHistory } from '../../hooks'
import { AppLayout }             from '../../components/layout/AppLayout'
import { api }                   from '../../lib/api-client'
import { toast }                 from 'sonner'
import type { UserPreferences }  from '../../../../../packages/shared/src/schemas'

const STYLES    = ['casual','formal','streetwear','business','athletic','bohemian','minimalist','vintage'] as const
const OCCASIONS = ['casual','work','date','party','outdoor','gym','travel','wedding'] as const
const GENDERS   = ['male','female','non-binary','prefer-not-to-say'] as const
const BUDGETS   = ['budget','mid','luxury'] as const
const BUDGET_LABELS: Record<string, string> = { budget: '$  Budget', mid: '$$  Mid-range', luxury: '$$$  Luxury' }
const PALETTE   = ['#000000','#FFFFFF','#F83286','#34C759','#FFCC00','#AF52DE','#FF2D55','#8E8E93','#5856D6','#FF3B30']

function Section({ title, icon, open, onToggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-[24px] border border-ink-border overflow-hidden mb-6 shadow-sm">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-6 hover:bg-secondary transition-all text-left">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-[14px] bg-secondary border border-ink-border flex items-center justify-center shadow-sm text-brand">{icon}</div>
          <span className="font-extrabold text-[19px] text-ink-primary tracking-tight">{title}</span>
        </div>
        {open ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}>
            <div className="px-8 pb-10 pt-2 border-t border-ink-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ProfilePage() : JSX.Element {
  const { getToken }         = useAuth()
  const { user }             = useUser()
  const { profile, isLoading } = useProfile()
  const { data: history }   = useHistory(1)

  const [openSection, setOpenSection] = useState<string>('measurements')
  const [saving, setSaving] = useState(false)

  // Measurements state
  const [height, setHeight]   = useState(() => profile?.measurements?.height ?? 170)
  const [weight, setWeight]   = useState(() => profile?.measurements?.weight ?? 65)
  const [chest,  setChest]    = useState(() => profile?.measurements?.chest ?? 90)
  const [waist,  setWaist]    = useState(() => profile?.measurements?.waist ?? 76)
  const [hips,   setHips]     = useState(() => profile?.measurements?.hips ?? 92)

  // Preferences state
  const [styles,    setStyles]    = useState<string[]>(() => profile?.preferences?.styles ?? ['casual'])
  const [occasions, setOccasions] = useState<string[]>(() => profile?.preferences?.occasions ?? ['casual'])
  const [gender,    setGender]    = useState<string>(() => profile?.preferences?.gender ?? 'prefer-not-to-say')
  const [budget,    setBudget]    = useState<string>(() => profile?.preferences?.budget ?? 'mid')
  const [colors,    setColors]    = useState<string[]>(() => profile?.preferences?.colors ?? [])
  const [avoid,     setAvoid]     = useState<string[]>(() => profile?.preferences?.avoidColors ?? [])

  function toggleArr(arr: string[], val: string, max?: number): string[] {
    return arr.includes(val)
      ? arr.filter(v => v !== val)
      : max && arr.length >= max ? arr : [...arr, val]
  }

  async function saveMeasurements() {
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('No token')
      const measurements = {
        height, weight,
        ...(chest ? { chest } : {}),
        waist: waist || undefined,
        hips: hips || undefined,
      }
      if (!profile) {
        await api.profile.setup(token, {
          email: user?.primaryEmailAddress?.emailAddress || 'unknown@example.com',
          displayName: user?.fullName || 'User',
          measurements
        })
      } else {
        await api.profile.updateMeasurements(token, measurements)
      }
      await mutate('profile')
      toast.success('Measurements saved successfully')
    } catch {
      toast.error('Could not save measurements')
    } finally { setSaving(false) }
  }

  async function savePreferences() {
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('No token')
      const prefs: UserPreferences = {
        styles:      styles.length > 0 ? styles as UserPreferences['styles'] : ['casual'],
        occasions:   occasions.length > 0 ? occasions as UserPreferences['occasions'] : ['casual'],
        gender:      gender as UserPreferences['gender'],
        budget:      budget as UserPreferences['budget'],
        colors,
        avoidColors: avoid,
      }
      if (!profile) {
        await api.profile.setup(token, {
          email: user?.primaryEmailAddress?.emailAddress || 'unknown@example.com',
          displayName: user?.fullName || 'User',
          preferences: prefs
        })
      } else {
        await api.profile.updatePreferences(token, prefs)
      }
      await mutate('profile')
      toast.success('Style profile updated')
    } catch {
      toast.error('Could not save preferences')
    } finally { setSaving(false) }
  }

  const toggleSection = (s: string) => setOpenSection(o => o === s ? '' : s)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-12 px-6">
          <div className="skeleton h-12 w-64 rounded-md bg-secondary mb-8" />
          {[0,1,2].map(i => <div key={i} className="skeleton h-20 w-full rounded-[24px] bg-secondary mb-5 border border-ink-border" />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-12 px-6">
        {/* ── Header ─────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-12">
          <p className="text-[11px] font-black text-brand uppercase tracking-[0.2em] mb-3">Identity Management</p>
          <h1 className="text-5xl font-black tracking-tighter text-ink-primary leading-tight mb-10">
            Style Profile
          </h1>

          {/* Profile card */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-white rounded-[32px] border border-ink-border p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-6 flex-1 w-full relative z-10">
              <UserButton appearance={{ elements: { avatarBox: 'w-20 h-20 ring-4 ring-secondary shadow-sm' } }} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-[22px] text-ink-primary tracking-tight">{profile?.displayName ?? '—'}</p>
                <p className="text-[14px] text-ink-secondary font-bold mt-1 tracking-tight">{profile?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto text-center relative z-10">
              {[
                { n: history?.total ?? 0, l: 'Outfits' },
                { n: profile?.dailyQuota?.count ?? 0, l: 'Limit' },
                { n: styles.length, l: 'Styles' },
              ].map(({ n, l }) => (
                <div key={l} className="bg-secondary rounded-[20px] px-6 py-5 border border-ink-border">
                  <p className="font-black text-ink-primary text-2xl tracking-tighter leading-none mb-1">{n}</p>
                  <p className="text-[9px] font-black text-ink-secondary uppercase tracking-widest leading-none">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Measurements section ───────────────────────── */}
        <Section title="Body Measurements" icon={<Ruler size={20} />}
          open={openSection === 'measurements'} onToggle={() => toggleSection('measurements')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {[
              { label:'Height (cm)', val: height, set: setHeight, min:140, max:220 },
              { label:'Weight (kg)', val: weight, set: setWeight, min:40,  max:180 },
              { label:'Chest (cm)',  val: chest,  set: setChest,  min:60,  max:160 },
              { label:'Waist (cm)',  val: waist,  set: setWaist,  min:50,  max:150 },
            ].map(({ label, val, set, min, max }) => (
              <div key={label}>
                <label className="text-[11px] font-black text-ink-secondary uppercase tracking-wider block mb-2 px-1">
                  {label}
                </label>
                <input type="number" value={val}
                  onChange={e => set(Number(e.target.value))}
                  min={min} max={max}
                  className="w-full bg-secondary border border-ink-border rounded-[16px] px-5 py-4
                             text-[16px] font-bold text-ink-primary focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all" />
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 col-span-1 md:col-span-2">
              <div>
                <label className="text-[11px] font-black text-ink-secondary uppercase tracking-wider block mb-2 px-1">
                  Hips (cm)
                </label>
                <input type="number" value={hips}
                  onChange={e => setHips(Number(e.target.value))} min={60} max={170}
                  className="w-full bg-secondary border border-ink-border rounded-[16px] px-5 py-4
                             text-[16px] font-bold text-ink-primary focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all" />
              </div>
              <div className="flex items-end">
                <button onClick={saveMeasurements} disabled={saving}
                  className="w-full h-[58px] font-black text-white bg-ink-900 rounded-[18px] hover:bg-ink-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                  {saving ? <div className="animate-spin border-2 border-white/30 border-t-white w-5 h-5 rounded-full" /> : <><Save size={18} strokeWidth={3} /> Save Data</>}
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Style preferences ─────────────────────────── */}
        <Section title="Style Preferences" icon={<Heart size={20} />}
          open={openSection === 'preferences'} onToggle={() => toggleSection('preferences')}>
          <div className="space-y-10 mt-2 relative z-10">
            {/* Gender */}
            <div>
              <p className="text-[13px] font-black text-slate-900 mb-5 block">I dress for</p>
              <div className="flex flex-wrap gap-3">
                {GENDERS.map(g => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`text-[13px] font-black px-6 py-3 rounded-full border transition-all duration-200 capitalize ${
                      gender === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}>
                    {g.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-[13px] font-black text-ink-primary mb-5 block">Investment level</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BUDGETS.map(b => (
                  <button key={b} onClick={() => setBudget(b)}
                    className={`w-full text-[14px] font-black py-4 rounded-[20px] border transition-all duration-200 ${
                      budget === b ? 'bg-brand text-white border-brand shadow-md' : 'bg-secondary text-ink-secondary border-ink-border hover:bg-white hover:shadow-sm'
                    }`}>
                    {BUDGET_LABELS[b]}
                  </button>
                ))}
              </div>
            </div>

            {/* Styles */}
            <div>
              <p className="text-[13px] font-black text-slate-900 mb-5 block">
                Style vibes <span className="font-bold text-slate-400 ml-2">(pick up to 5)</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyles(toggleArr(styles, s, 5))}
                    className={`text-[13px] font-black px-6 py-3 rounded-full border transition-all duration-200 capitalize ${
                      styles.includes(s) ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasions */}
            <div>
              <p className="text-[13px] font-black text-slate-900 mb-5 block">
                Occasions I dress for
              </p>
              <div className="flex flex-wrap gap-3">
                {OCCASIONS.map(o => (
                  <button key={o} onClick={() => setOccasions(toggleArr(occasions, o))}
                    className={`text-[13px] font-black px-6 py-3 rounded-full border transition-all duration-200 capitalize ${
                      occasions.includes(o) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-[13px] font-black text-slate-900 mb-5 block">Favorite colors</p>
              <div className="flex gap-4 flex-wrap">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setColors(toggleArr(colors, c))}
                    className="relative w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 shadow-sm border border-slate-200"
                    style={{ background: c }}>
                    {colors.includes(c) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                        <Check size={20} strokeWidth={4} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={savePreferences} disabled={saving}
              className="w-full h-[64px] font-black text-white bg-brand rounded-full hover:bg-brand-dark transition-all flex items-center justify-center gap-3 text-[18px] mt-10 shadow-lg shadow-brand/20 active:scale-[0.98]">
              {saving ? <div className="animate-spin border-2 border-white/30 border-t-white w-6 h-6 rounded-full" /> : <><Save size={22} strokeWidth={3} /> Save Profile</>}
            </button>
          </div>
        </Section>
      </div>
    </AppLayout>
  )
}
