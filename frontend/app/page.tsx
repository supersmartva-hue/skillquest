'use client'

/**
 * Landing Page — Hero section with animated background, feature highlights, CTA
 */

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { Zap, Network, Trophy, Award, Flame, Bot } from 'lucide-react'

// Animated floating orbs in background
function FloatingOrb({ delay, size, x, y, color }: {
  delay: number; size: number; x: string; y: string; color: string
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, background: color }}
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.1, 1],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

const FEATURES = [
  { icon: Zap,     color: '#818cf8', bg: 'rgba(129,140,248,0.12)', title: 'XP & Levels',    desc: 'Earn XP for every lesson. Watch yourself level up in real time.' },
  { icon: Network, color: '#34d399', bg: 'rgba(52,211,153,0.12)',  title: 'Skill Trees',    desc: 'Visual learning paths that unlock as you master prerequisites.' },
  { icon: Trophy,  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  title: 'Leaderboards',   desc: 'Compete globally or weekly with live rankings.' },
  { icon: Award,   color: '#f472b6', bg: 'rgba(244,114,182,0.12)', title: 'Achievements',   desc: '60+ badges across common, rare, epic, and legendary tiers.' },
  { icon: Flame,   color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  title: 'Daily Streaks',  desc: 'Build momentum with daily challenges and streak bonuses.' },
  { icon: Bot,     color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  title: 'AI Quizzes',     desc: 'Dynamically generated questions tailored to your skill level.' },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)

  // GSAP hero text entrance
  useEffect(() => {
    if (!heroRef.current) return
    gsap.fromTo(
      heroRef.current.querySelectorAll('[data-hero]'),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out', delay: 0.3 }
    )
  }, [])

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
      {/* Background orbs */}
      <FloatingOrb delay={0}   size={500} x="10%"  y="5%"   color="#6474f5" />
      <FloatingOrb delay={2}   size={400} x="70%"  y="10%"  color="#00D2FF" />
      <FloatingOrb delay={1}   size={300} x="50%"  y="60%"  color="#9B59B6" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-glow-sm">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-xl font-black font-display text-gradient-brand">SkillQuest</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="btn-glow bg-gradient-to-r from-brand-500 to-accent-cyan px-5 py-2.5 rounded-xl text-sm font-bold"
          >
            Start for Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 text-center pt-16 md:pt-24 pb-20 md:pb-32 px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <div data-hero className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-500/30 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm mb-6 md:mb-8">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-brand-300 font-medium">Now in public beta — free forever tier available</span>
        </div>

        {/* Headline */}
        <h1 data-hero className="text-4xl sm:text-5xl md:text-7xl font-black font-display leading-tight mb-5 md:mb-6">
          Level Up Your Skills
          <br />
          <span className="text-gradient-brand">Like a Game</span>
        </h1>

        <p data-hero className="text-base md:text-xl text-white/60 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
          Learn programming, design, and data skills through XP, achievements,
          skill trees, and daily challenges — not boring videos.
        </p>

        {/* CTA buttons */}
        <div data-hero className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
          <Link
            href="/auth/signup"
            className="btn-glow w-full sm:w-auto bg-gradient-to-r from-brand-500 to-accent-cyan px-8 py-4 rounded-2xl text-base md:text-lg font-bold shadow-glow-md text-center"
          >
            Start Your Quest →
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base md:text-lg font-bold border border-white/20 hover:border-white/40 transition-colors text-center"
          >
            Sign In
          </Link>
        </div>

        {/* Social proof numbers */}
        <div data-hero className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 md:mt-16 pt-8 md:pt-10 border-t border-white/5">
          {[
            { value: '12K+', label: 'Learners' },
            { value: '200+', label: 'Lessons' },
            { value: '60+',  label: 'Achievements' },
            { value: '4.9★', label: 'Rating' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-xl md:text-2xl font-black text-gradient-brand">{value}</div>
              <div className="text-xs md:text-sm text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-16 md:pb-24">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-black font-display mb-4">
            Everything you need to <span className="text-gradient-brand">level up</span>
          </h2>
          <p className="text-white/50 text-base md:text-lg">Built for learners who want results, not just content.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card p-6 group hover:border-brand-500/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ background: f.bg, color: f.color }}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="relative z-10 text-center py-16 md:py-24 px-4">
        <div className="max-w-2xl mx-auto glass-card p-8 md:p-12">
          <h2 className="text-2xl md:text-4xl font-black font-display mb-4">
            Ready to start your <span className="text-gradient-brand">quest?</span>
          </h2>
          <p className="text-white/50 mb-8">Join 12,000+ learners leveling up every day.</p>
          <Link
            href="/auth/signup"
            className="btn-glow inline-block bg-gradient-to-r from-brand-500 to-accent-cyan px-8 md:px-10 py-4 rounded-2xl text-base md:text-lg font-bold shadow-glow-lg"
          >
            Create Free Account →
          </Link>
        </div>
      </section>
    </div>
  )
}
