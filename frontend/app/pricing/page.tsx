'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { stripeAPI } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import toast from 'react-hot-toast'

const FREE_FEATURES = [
  '5 skills to explore',
  'Basic lessons & quizzes',
  'Global leaderboard',
  'Daily challenges',
  'XP & level system',
]

const PREMIUM_FEATURES = [
  'All 20+ skills unlocked',
  'Advanced lessons & exercises',
  'Priority leaderboard ranking',
  'Exclusive legendary achievements',
  'Offline mode',
  'Ad-free experience',
  'Early access to new skills',
  'Premium badge on profile',
]

export default function PricingPage() {
  const router  = useRouter()
  const { user, isLoading: authLoading } = useAuthGuard()
  const [loading, setLoading] = useState(false)

  if (authLoading) return <PageLoader />

  const handleUpgrade = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (user.isPremium) { toast.success('You already have Premium!'); return }
    setLoading(true)
    try {
      const { data } = await stripeAPI.createCheckout()
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Could not start checkout. Please try again.')
      }
    } catch {
      toast.error('Checkout unavailable in demo mode.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">

        {/* Header */}
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-4xl font-black font-display text-gradient-brand mb-3">Level Up Your Quest</h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            Unlock the full SkillQuest experience with Premium
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free Plan */}
          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-subtle)' }}>Free</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>$0</span>
                <span className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>/month</span>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Get started for free</p>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="text-emerald-500 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <div
              className="w-full py-3 rounded-xl text-center text-sm font-semibold"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {user ? 'Current Plan' : 'Free Forever'}
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            className="relative rounded-2xl p-8 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(100,116,245,0.12) 0%, rgba(0,210,255,0.08) 100%)',
              border: '1px solid rgba(100,116,245,0.35)',
              boxShadow: '0 0 40px rgba(100,116,245,0.15)',
            }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {/* Popular badge */}
            <div
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              MOST POPULAR
            </div>

            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: '#6474f5' }}>Premium</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>$9</span>
                <span className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>/month</span>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Everything you need to master skills</p>
            </div>

            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <span className="flex-shrink-0" style={{ color: '#6474f5' }}>✦</span>
                  {f}
                </li>
              ))}
            </ul>

            {user?.isPremium ? (
              <div
                className="w-full py-3 rounded-xl text-center text-sm font-bold"
                style={{ background: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.3)' }}
              >
                ✓ You're Premium!
              </div>
            ) : (
              <motion.button
                onClick={handleUpgrade}
                disabled={loading}
                className="btn-glow w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Redirecting...' : 'Upgrade to Premium →'}
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Footer note */}
        <motion.p
          className="text-center text-sm mt-10"
          style={{ color: 'var(--text-subtle)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Payments powered by Stripe. Cancel anytime.
        </motion.p>
      </main>
    </div>
  )
}
