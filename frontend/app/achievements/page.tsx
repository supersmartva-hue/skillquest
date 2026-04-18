'use client'

import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { achievementsAPI } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'

const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string; bg: string }> = {
  common:    { label: 'Common',    color: 'var(--text-muted)',  glow: 'none',                                    bg: 'var(--bg-card)' },
  rare:      { label: 'Rare',      color: '#3b82f6',            glow: '0 0 12px rgba(59,130,246,0.35)',          bg: 'rgba(59,130,246,0.08)' },
  epic:      { label: 'Epic',      color: '#a855f7',            glow: '0 0 14px rgba(168,85,247,0.35)',          bg: 'rgba(168,85,247,0.08)' },
  legendary: { label: 'Legendary', color: '#f59e0b',            glow: '0 0 20px rgba(245,158,11,0.45)',          bg: 'rgba(245,158,11,0.08)' },
}

export default function AchievementsPage() {
  const { user, isLoading: authLoading } = useAuthGuard()

  const { data, isLoading } = useQuery(
    'achievements',
    () => achievementsAPI.getAll().then((r) => r.data),
    { enabled: !!user, staleTime: 60_000, retry: 1 }
  )

  if (authLoading) return <PageLoader />

  const achievements = data?.achievements ?? []
  const earned  = achievements.filter((a: any) => a.earned)
  const locked  = achievements.filter((a: any) => !a.earned)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black font-display text-gradient-brand">Achievements</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            {earned.length} of {achievements.length} unlocked
          </p>
        </motion.div>

        {/* Progress summary */}
        {achievements.length > 0 && (
          <motion.div
            className="glass-card p-5 mb-8 flex items-center gap-6"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-4xl">🏅</div>
            <div className="flex-1">
              <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {earned.length}/{achievements.length} achievements earned
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: achievements.length ? `${(earned.length / achievements.length) * 100}%` : '0%' }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black font-mono" style={{ color: '#6474f5' }}>
                {achievements.length ? Math.round((earned.length / achievements.length) * 100) : 0}%
              </p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>complete</p>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="h-36 shimmer rounded-2xl" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <p className="text-5xl mb-4">🏅</p>
            <p className="font-semibold">No achievements found.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-subtle)' }}>Complete lessons to unlock your first badge!</p>
          </div>
        ) : (
          <>
            {/* Earned */}
            {earned.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-subtle)' }}>
                  Earned ({earned.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earned.map((a: any, i: number) => (
                    <AchievementCard key={a.id} achievement={a} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-subtle)' }}>
                  Locked ({locked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locked.map((a: any, i: number) => (
                    <AchievementCard key={a.id} achievement={a} index={i} locked />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function AchievementCard({ achievement: a, index, locked }: { achievement: any; index: number; locked?: boolean }) {
  const cfg = RARITY_CONFIG[a.rarity] ?? RARITY_CONFIG.common

  return (
    <motion.div
      className="glass-card p-5 relative overflow-hidden"
      style={{ boxShadow: locked ? 'none' : cfg.glow, opacity: locked ? 0.55 : 1 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: locked ? 0.55 : 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -2 }}
    >
      {/* Rarity tag */}
      <span
        className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.label}
      </span>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: cfg.bg, filter: locked ? 'grayscale(1)' : 'none' }}
        >
          {locked ? '🔒' : (a.icon ?? '🏅')}
        </div>

        <div className="flex-1 min-w-0 mt-0.5">
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{a.description}</p>

          {/* XP reward */}
          {a.xpReward > 0 && (
            <p className="text-xs font-semibold mt-2" style={{ color: '#6474f5' }}>+{a.xpReward} XP</p>
          )}

          {/* Earned date */}
          {a.unlockedAt && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              Earned {new Date(a.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
