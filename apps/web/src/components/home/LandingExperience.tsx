'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Menu, X } from 'lucide-react'
import { useState } from 'react'

const HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop', caption: 'YOUR ULTIMATE\nFASHION DESTINATION.' },
  { src: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop', caption: '' },
  { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop', caption: 'FASHION OF THE\nTOWN!' },
]

const STEPS = [
  { num: '1', title: 'Enter your profile', desc: 'Tell us about your best style type, style preferences and precisely your body type.' },
  { num: '2', title: 'AI Analyses your style', desc: 'Our powerful AI learns your type from characteristics and curates fashion creations.' },
  { num: '3', title: 'Get outfit recommendations', desc: 'Receive personalised daily suggestions suitable for your fashion preferences.' },
]

const FEATURED = [
  { title: 'Urban Casual Fit',   sub: 'Curated for your lifestyle', img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600&auto=format&fit=crop' },
  { title: 'Summer Classic',    sub: 'AI-styled for warm days',    img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop' },
  { title: 'Street Style',      sub: 'Urban meets minimal',        img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop' },
]

const NAV_LINKS = ['Home', 'Wardrobe', 'Trends', 'Pricing']

export function LandingExperience(): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-ink-900 selection:bg-brand/10">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-ink-200">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-display text-2xl font-black tracking-tighter text-ink-900">A</span>
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">Atelier</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(item => (
              <Link key={item} href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="text-[13px] font-medium text-ink-500 hover:text-ink-900 transition-colors">
                {item}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in" className="text-[13px] font-medium text-ink-500 hover:text-ink-900 transition-colors">
              Login
            </Link>
            <Link href="/sign-up" className="btn-brand">Get Started</Link>
          </div>

          {/* Mobile: Login + Hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/sign-in" className="text-[13px] font-semibold text-ink-600 hover:text-ink-900 transition-colors">
              Login
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="w-9 h-9 flex items-center justify-center rounded border border-ink-200 text-ink-700 hover:bg-ink-50 transition-colors"
            >
              {mobileOpen ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-ink-100 bg-white md:hidden"
            >
              <div className="px-5 py-4 space-y-1">
                {NAV_LINKS.map(item => (
                  <Link
                    key={item}
                    href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-[15px] font-medium text-ink-700 hover:text-ink-900 hover:bg-ink-50 rounded transition-colors"
                  >
                    {item}
                  </Link>
                ))}
                <div className="pt-3 pb-1 border-t border-ink-100 flex flex-col gap-2 mt-2">
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)}
                    className="btn-outline w-full justify-center">
                    Login
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)}
                    className="btn-brand w-full justify-center">
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="pt-16 min-h-screen flex flex-col">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 flex-1 flex flex-col justify-center py-12 md:py-20">

          {/* Headline */}
          <motion.div
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
            className="mb-10 md:mb-14"
          >
            <h1 className="font-display text-[clamp(36px,6vw,88px)] font-black leading-[0.92] tracking-tight text-ink-900 uppercase max-w-[800px]">
              Elevate Your Style:{' '}
              <span className="font-normal italic">Unleashing</span>{' '}
              the Latest Trends
            </h1>
            <div className="w-28 md:w-40 h-px bg-ink-900 mt-5" />
          </motion.div>

          {/* ── Hero image grid — FIX 2: responsive breakpoints ── */}
          {/* mobile: 1 col (show first image only hero-sized)      */}
          {/* tablet md: 2 col                                       */}
          {/* desktop xl: 3 col                                      */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-12">
            {HERO_IMAGES.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.6, delay: i * 0.1, ease:[0.22,1,0.36,1] }}
                className={[
                  'relative overflow-hidden rounded bg-ink-100',
                  i === 0
                    ? 'aspect-[4/3] sm:aspect-[3/4]'
                    : i === 1
                    ? 'hidden sm:block aspect-[4/5]'
                    : 'hidden lg:block aspect-[3/4]',
                ].join(' ')}
              >
                <Image src={img.src} alt={img.caption ? img.caption.replace(/\n/g, ' ') : 'Fashion editorial'} fill className="object-cover object-top" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                {img.caption && (
                  <div className="absolute inset-0 bg-ink-900/30 flex items-end p-4 md:p-5">
                    <p className="text-white text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] leading-tight whitespace-pre-line">{img.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay:0.5, duration:0.5 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/sign-up" className="btn-outline w-full sm:w-auto justify-center">Explore Collection</Link>
              <Link href="/sign-up" className="btn-primary w-full sm:w-auto justify-center">Generate Outfit</Link>
            </div>
            <p className="text-[14px] text-ink-500 font-medium">Your ultimate AI fashion destination.</p>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-ink-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10">
          <motion.h2
            initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="font-display text-[clamp(28px,4vw,60px)] font-bold text-center mb-12 md:mb-20"
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 mb-12 md:mb-14">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay: i * 0.1, duration:0.5 }}
                className="text-center px-6 py-8 md:py-10 border border-ink-200 rounded bg-white"
              >
                <div className="w-10 h-10 rounded-full border-2 border-ink-300 flex items-center justify-center mx-auto mb-5">
                  <span className="font-display text-[18px] font-bold text-ink-700">{step.num}</span>
                </div>
                <div className="w-10 h-px bg-ink-300 mx-auto mb-5" />
                <h3 className="font-display text-[18px] md:text-[20px] font-bold mb-3">{step.title}</h3>
                <p className="text-[13px] text-ink-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/sign-up" className="btn-brand">Get Started</Link>
          </div>
        </div>
      </section>

      {/* ── AI Styling Journey ──────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-ink-50 border-t border-ink-200">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10">
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="mb-12 md:mb-16">
            <h2 className="font-display text-[clamp(26px,3.5vw,52px)] font-black uppercase tracking-tight mb-2">
              Start Your <em className="font-normal not-italic text-brand">AI Styling</em> Journey
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 mb-10 md:mb-12">
            {FEATURED.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, scale:0.96 }} whileInView={{ opacity:1, scale:1 }}
                viewport={{ once:true }} transition={{ delay: i * 0.08, duration:0.45 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] rounded overflow-hidden bg-ink-200 mb-4">
                  <Image src={item.img} alt={item.title} fill className="object-cover object-top transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" />
                </div>
                <h4 className="font-display text-[17px] md:text-[18px] font-bold mb-1">{item.title}</h4>
                <p className="text-[13px] text-ink-400">{item.sub}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/sign-up" className="btn-brand">Get Started</Link>
          </div>
        </div>
      </section>

      {/* ── Built for your body ─────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-ink-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <h2 className="font-display text-[clamp(26px,4vw,58px)] font-black uppercase leading-tight mb-5 md:mb-6">
              Built For Your Body, Style &amp; Climate
            </h2>
            <p className="text-[14px] md:text-[15px] text-ink-500 leading-relaxed mb-8 md:mb-10 max-w-md">
              AI-powered styling based on your body type, preferences, and real-time weather conditions. Look sharp, rain or shine.
            </p>
            <div className="space-y-3 md:space-y-4">
              {['Real-time weather integration', 'Body measurement profiling', 'Occasion-based outfit planning', 'Wardrobe management'].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-brand flex-shrink-0" />
                  <span className="text-[14px] font-medium text-ink-700">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="relative">
            <div className="relative h-[360px] md:h-[500px] rounded overflow-hidden bg-ink-100 shadow-float">
              <Image
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop"
                alt="Fashion AI" fill className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Floating UI card */}
              <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-[180px] md:w-[200px] bg-white rounded shadow-float p-3 border border-ink-200">
                <div className="bg-ink-50 rounded p-2 border border-ink-200">
                  <p className="text-[10px] font-bold text-ink-700">Smart Casual</p>
                  <p className="text-[9px] text-ink-400 mt-0.5">Style · Atelier AI</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-10 md:py-12 border-t border-ink-200 bg-ink-50">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-black tracking-tighter">Atelier</span>
            <span className="text-[11px] text-ink-400 uppercase tracking-widest">AI Fashion</span>
          </div>
          <p className="text-[11px] text-ink-400 uppercase tracking-[0.1em]">© 2026 Atelier AI · Premium Personal Styling</p>
          <div className="flex gap-5 md:gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-[12px] text-ink-400 hover:text-ink-900 uppercase tracking-wide transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
