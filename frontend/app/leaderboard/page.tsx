'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from 'react-query'
import { leaderboardAPI } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { clsx } from 'clsx'

type Tab = 'global' | 'weekly'

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('global')
  const { user, isLoading: authLoading } = useAuthGuard()

  const { data: globalData, isLoading: globalLoading } = useQuery(
    'leaderboard-global',
    () => leaderboardAPI.getGlobal().then((r) => r.data),
    { staleTime: 60_000, retry: 1 }
  )

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery(
    'leaderboard-weekly',
    () => leaderboardAPI.getWeekly().then((r) => r.data),
    { staleTime: 60_000, retry: 1 }
  )

  const isLoading        = authLoading || (tab === 'global' ? globalLoading : weeklyLoading)
  const entries          = tab === 'global' ? (globalData?.users ?? []) : (weeklyData?.users ?? [])
  // Only show rank banner on global tab (weekly has no rank calculation)
  const currentUserRank  = tab === 'global' ? globalData?.currentUserRank : null

  if (authLoading) return <PageLoader />

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">

        <motion.div className="mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black font-display text-gradient-brand">Leaderboard</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Compete with learners worldwide</p>
        </motion.div>

        {/* Your rank banner */}
        {currentUserRank && (
          <motion.div className="glass-card p-4 mb-6 flex items-center gap-4"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <div className="text-3xl font-black font-mono" style={{ color: '#6474f5' }}>#{currentUserRank}</div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your Global Rank</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{(user?.xp ?? 0).toLocaleString()} total XP</p>
            </div>
            <div className="ml-auto text-sm" style={{ color: 'var(--text-subtle)' }}>Keep earning XP to climb! ⬆️</div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)' }}>
          {(['global', 'weekly'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="relative px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {tab === t && (
                <motion.div className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(100,116,245,0.2)' }}
                  layoutId="lbTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative capitalize">{t === 'global' ? '🌍 Global' : '📅 Weekly'}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[48px_1fr_90px] md:grid-cols-[60px_1fr_120px_90px_70px] gap-3 px-4 md:px-6 py-3 border-b text-xs font-semibold uppercase tracking-wider"
            style={{ borderColor: 'var(--border)', color: 'var(--text-subtle)' }}>
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">{tab === 'weekly' ? 'Week XP' : 'XP'}</span>
            <span className="text-right hidden md:block">Level</span>
            <span className="text-right hidden md:block">Streak</span>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" className="p-6 space-y-3">
                {Array(8).fill(0).map((_, i) => <div key={i} className="h-14 shimmer rounded-xl" />)}
              </motion.div>
            ) : entries.length === 0 ? (
              <motion.div key="empty" className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                No data yet — be the first to earn XP this {tab === 'weekly' ? 'week' : 'time'}!
              </motion.div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {entries.map((entry: any, idx: number) => {
                  const isMe = entry.isCurrentUser
                  return (
                    <motion.div key={entry.id ?? idx}
                      className="grid grid-cols-[48px_1fr_90px] md:grid-cols-[60px_1fr_120px_90px_70px] gap-3 px-4 md:px-6 py-4 border-b last:border-0 transition-colors"
                      style={{ borderColor: 'var(--border)', background: isMe ? 'rgba(100,116,245,0.08)' : 'transparent' }}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                    >
                      {/* Rank */}
                      <div className="flex items-center">
                        {MEDALS[entry.rank]
                          ? <span className="text-xl md:text-2xl">{MEDALS[entry.rank]}</span>
                          : <span className="font-mono font-bold text-sm" style={{ color: isMe ? '#6474f5' : 'var(--text-muted)' }}>#{entry.rank}</span>
                        }
                      </div>
                      {/* Player */}
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-400 flex items-center justify-center text-sm flex-shrink-0">
                          {entry.avatar || '🧙'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: isMe ? '#6474f5' : 'var(--text-primary)' }}>
                            {entry.displayName}{isMe && <span className="ml-1 text-xs opacity-60">(You)</span>}
                          </p>
                          <p className="text-xs truncate hidden sm:block" style={{ color: 'var(--text-subtle)' }}>@{entry.username}</p>
                        </div>
                      </div>
                      {/* XP */}
                      <div className="flex items-center justify-end">
                        <span className="text-sm font-mono font-semibold" style={{ color: '#6474f5' }}>
                          {((tab === 'weekly' ? entry.weeklyXP : entry.xp) ?? 0).toLocaleString()}
                        </span>
                      </div>
                      {/* Level — hidden on mobile */}
                      <div className="hidden md:flex items-center justify-end">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                          Lv.{entry.level}
                        </span>
                      </div>
                      {/* Streak — hidden on mobile */}
                      <div className="hidden md:flex items-center justify-end gap-1">
                        {(entry.streak ?? 0) > 0 && <span className="text-xs">🔥</span>}
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{entry.streak ?? 0}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
