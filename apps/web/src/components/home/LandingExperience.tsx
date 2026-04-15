'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'

export function LandingExperience() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  
  // Parallax transformations
  const heroY = useTransform(scrollYProgress, [0, 0.2], ['0%', '100%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])

  return (
    <div ref={containerRef} className="relative w-full bg-white font-UI overflow-x-hidden">
      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-50 bg-white/80 backdrop-blur-md border-b border-ink-border/50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-brand" />
          <span className="text-xl font-bold tracking-tight text-ink-primary">Atelier</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-sm font-bold text-ink-secondary hover:text-ink-primary transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-bold px-6 py-2.5 rounded-full bg-ink-primary text-white hover:bg-brand transition-all shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center px-6 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-ink-primary mb-8 leading-[0.9]">
            The intelligent way <br /> to style yourself.
          </h1>
          <p className="text-xl md:text-2xl text-ink-secondary mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Elevate your wardrobe with human-level intelligence. Perfectly tailored outfit recommendations for your life, weather, and unique aesthetic.
          </p>
          <Link href="/dashboard" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-brand rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-brand/20">
            Start Your Journey
          </Link>
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <div className="w-full bg-secondary py-24 md:py-32 border-t border-ink-border">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-ink-primary">Tell us about you.</h2>
            <p className="text-xl text-ink-secondary leading-relaxed font-medium">
              Share your preferences, lifestyle, and unique body metrics. Our engine translates your data into a high-dimensional style profile.
            </p>
          </motion.div>
          <div className="aspect-square bg-white rounded-[32px] border border-ink-border shadow-sm flex items-center justify-center overflow-hidden">
            <div className="w-1/2 h-1/2 bg-secondary rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>

      <div className="w-full bg-white py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 aspect-square bg-secondary rounded-[32px] border border-ink-border shadow-sm flex items-center justify-center overflow-hidden">
            <div className="w-2/3 h-2/3 bg-white rounded-2xl shadow-sm" />
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 md:order-2 space-y-6"
          >
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-ink-primary">AI understands your vibe.</h2>
            <p className="text-xl text-ink-secondary leading-relaxed font-medium">
              We analyze millions of fashion data points to map your personal aesthetic, predicting perfect combinations before you even ask.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-32 w-full flex flex-col items-center justify-center px-6 text-center bg-brand">
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-8">Ready to transform?</h2>
        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
          Join thousands of individuals using AI to look their best every single day.
        </p>
        <Link href="/sign-up" className="inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-brand bg-white rounded-full hover:scale-[1.02] transition-all duration-200 shadow-xl">
          Get Started for Free
        </Link>
      </section>
      
      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-ink-border bg-white text-center">
        <p className="text-sm font-bold text-ink-secondary tracking-widest uppercase">
          © 2026 Atelier AI · All Rights Reserved
        </p>
      </footer>
    </div>
  )
}
