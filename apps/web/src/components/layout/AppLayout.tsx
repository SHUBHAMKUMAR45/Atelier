'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useQuota } from '../../hooks'
import { clsx } from 'clsx'
import {
  LayoutDashboard, TrendingUp, Menu, X, Shirt,
  Sparkles, History, Heart, User,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Studio',    icon: LayoutDashboard },
  { href: '/recommend',          label: 'Style Me',  icon: Sparkles },
  { href: '/history',            label: 'History',   icon: History },
  { href: '/history?saved=true', label: 'Saved',     icon: Heart },
  { href: '/trends',             label: 'Trends',    icon: TrendingUp },
  { href: '/wardrobe',           label: 'Wardrobe',  icon: Shirt },
  { href: '/profile',            label: 'Profile',   icon: User },
] as const

export function AppLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname()
  const { quota } = useQuota()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F8F8F7]">
      {/* ── Mobile overlay ──── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-900/30 z-50 md:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ──── */}
      <aside id="sidebar-nav" className={clsx(
        "fixed left-0 top-0 h-full w-[220px] bg-white border-r border-ink-200 flex flex-col z-[100] transition-transform duration-300 ease-out md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-ink-200">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <span className="font-display text-2xl font-black tracking-tighter text-ink-900 group-hover:text-brand transition-colors">A</span>
            <span className="font-display text-[17px] font-bold tracking-tight text-ink-900">Atelier</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const base = href.split('?')[0]!
            const isActive = (pathname ?? '').startsWith(base) && (pathname !== '/')
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <div className={clsx(
                  'flex items-center gap-3 mx-3 px-3 py-2.5 rounded text-[13px] font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
                )}>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                  {label === 'Style Me' && quota && quota.remaining > 0 && (
                    <span className={clsx(
                      'ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-brand text-white'
                    )}>
                      {quota.remaining}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Quota */}
        {quota && (
          <div className="px-5 py-4 border-t border-ink-200">
            <div className="flex items-center justify-between mb-2">
              <span className="label-caps">Daily Credits</span>
              <span className="text-[11px] text-ink-600 font-semibold">{quota.remaining}/{quota.limit}</span>
            </div>
            <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((quota.used / quota.limit) * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.2,0.8,0.2,1] }}
                className="h-full rounded-full bg-brand"
              />
            </div>
          </div>
        )}

        {/* User */}
        <div className="px-5 py-4 border-t border-ink-200 flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-ink-700 truncate">Account</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ──── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[80] bg-white border-b border-ink-200 flex items-center justify-between px-5 h-14">
        <Link href="/dashboard" className="font-display text-[18px] font-bold tracking-tight text-ink-900">Atelier</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-ink-700 p-1" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </div>

      {/* ── Main ──── */}
      <main className="flex-1 ml-0 md:ml-[220px] min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
