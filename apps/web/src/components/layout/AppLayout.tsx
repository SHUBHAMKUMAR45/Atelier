'use client'

import Link                  from 'next/link'
import { usePathname }       from 'next/navigation'
import { UserButton }        from '@clerk/nextjs'
import { motion }            from 'framer-motion'
import { useQuota }          from '../../hooks'
import { clsx }              from 'clsx'
import {
  LayoutDashboard, TrendingUp, Menu, X, Shirt,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Studio',   icon: LayoutDashboard },
  { href: '/recommend',  label: 'Style Me', icon: Sparkles },
  { href: '/history',    label: 'History',  icon: History },
  { href: '/history?saved=true', label: 'Saved', icon: Heart },
  { href: '/trends',     label: 'Trends',   icon: TrendingUp },
  { href: '/wardrobe',   label: 'Wardrobe', icon: Shirt },
  { href: '/profile',    label: 'Profile',  icon: User },
] as const

export function AppLayout({ children }: { children: React.ReactNode }) : JSX.Element {
  const pathname = usePathname()
  const { quota } = useQuota()
  const [mobileOpen, setMobileOpen] = useState(false)

  const quotaPct = quota ? Math.round((quota.used / quota.limit) * 100) : 0

  return (
    <div className="flex min-h-screen bg-white relative font-UI text-ink-primary">
      {/* ── Mobile Overlay ────────────────────────────────────── */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={clsx(
        "fixed left-0 top-0 h-full w-64 bg-secondary flex flex-col z-40 border-r border-ink-border transition-transform duration-300 md:translate-x-0 shadow-sm",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="px-6 py-8 border-b border-ink-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-brand" />
            <span className="font-display text-ink-primary text-xl font-bold tracking-tight">
              Atelier
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto w-full">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = (pathname ?? '').startsWith(href.split('?')[0]!)
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <div
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-white text-brand shadow-sm border border-ink-border'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-white/50'
                  )}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                  {label === 'Style Me' && quota && quota.remaining > 0 && (
                    <span className="ml-auto text-[10px] bg-brand text-white px-2 py-0.5 rounded-full font-bold">
                      {quota.remaining}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Quota bar */}
        {quota && (
          <div className="px-6 py-6 border-t border-ink-border bg-white/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-ink-secondary font-bold tracking-wider uppercase">Credits</span>
              <span className="text-[11px] text-ink-primary font-bold">{quota.remaining} / {quota.limit}</span>
            </div>
            <div className="h-1.5 bg-ink-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${quotaPct}%` }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className="h-full rounded-full bg-brand"
              />
            </div>
          </div>
        )}

        {/* User */}
        <div className="px-6 py-5 border-t border-ink-border flex items-center gap-3 bg-white/30 hover:bg-white/60 transition-colors cursor-pointer">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8 ring-2 ring-ink-border' } }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-ink-primary truncate">Settings</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-ink-border flex items-center justify-between px-5 h-14 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand" />
          <span className="font-display text-ink-primary text-[17px] font-bold tracking-tight">Atelier</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-ink-primary p-1 -mr-1">
          {mobileOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 min-h-screen md:ml-64 pt-14 md:pt-0 w-full overflow-x-hidden">
        <div className="w-full max-w-[1200px] mx-auto px-6 md:px-12 py-10 md:py-16">
          {children}
        </div>
      </main>
    </div>
  )
}
