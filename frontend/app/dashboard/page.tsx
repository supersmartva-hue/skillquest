'use client'

import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import Link from 'next/link'
import { Zap, Trophy, Flame, BookOpen, Network, Award, ChevronRight } from 'lucide-react'
import { progressAPI, challengesAPI } from '@/lib/api'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { XPBar }             from '@/components/ui/XPBar'
import { StatsCard }         from '@/components/dashboard/StatsCard'
import { LevelUpModal }      from '@/components/ui/LevelUpModal'
import { DailyChallengeCard } from '@/components/dashboard/DailyChallengeCard'
import { Sidebar }           from '@/components/layout/Sidebar'
import { PageLoader }        from '@/components/ui/PageLoader'

export default function DashboardPage() {
  const { user, isLoading } = useAuthGuard()

  const { data: progressData, isLoading: progressLoading } = useQuery(
    'userProgress',
    () => progressAPI.getUserProgress().then((r) => r.data),
    { enabled: !!user, staleTime: 30_000, retry: 1 }
  )

  const { data: challengeData, refetch: refetchChallenge } = useQuery(
    'todayChallenge',
    () => challengesAPI.getToday().then((r) => r.data),
    { enabled: !!user, staleTime: 60_000, retry: 1 }
  )

  if (isLoading || !user) {
    return <PageLoader />
  }

  const xpToNext   = user.xpToNextLevel ?? 100
  const skills     = (progressData?.skills ?? []) as any[]
  const activities = (progressData?.recentActivity ?? []) as any[]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">
        <LevelUpModal />

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
                Welcome back, <span className="text-gradient-brand">{user.displayName}</span>! 👋
              </h1>
              <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                {user.streak > 0
                  ? <><span style={{ color: '#f97316' }}>🔥 {user.streak}-day streak!</span> Keep it going.</>
                  : 'Start a lesson to begin your streak.'}
              </p>
            </div>
            {/* Avatar + level badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-2xl shadow-lg">
                {user.avatar || '🧙'}
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-brand-600 border-2 flex items-center justify-center text-xs font-black text-white"
                style={{ borderColor: 'var(--bg-primary)' }}>
                {user.level}
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6 glass-card p-4">
            <XPBar currentXP={user.xp} xpToNextLevel={xpToNext} level={user.level} size="lg" animated />
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total XP"     value={user.xp}                           icon={<Zap     className="w-5 h-5" />} iconColor="#a5b4fc" color="from-brand-500 to-cyan-400"    delay={0}    />
          <StatsCard title="Level"        value={user.level}                        icon={<Trophy  className="w-5 h-5" />} iconColor="#fcd34d" color="from-yellow-500 to-orange-500" delay={0.08} />
          <StatsCard title="Day Streak"   value={user.streak}   unit="days"         icon={<Flame   className="w-5 h-5" />} iconColor="#fb923c" color="from-orange-500 to-red-500"   delay={0.16} />
          <StatsCard title="Lessons Done" value={progressData?.totalCompleted ?? 0} icon={<BookOpen className="w-5 h-5" />} iconColor="#6ee7b7" color="from-emerald-500 to-teal-500"  delay={0.24} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-6">

            {/* Skill Progress */}
            <motion.section className="glass-card p-6" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Skill Progress</h2>
                <Link href="/skills" className="text-sm font-medium" style={{ color: '#6474f5' }}>View all →</Link>
              </div>
              <div className="space-y-4">
                {progressLoading
                  ? Array(4).fill(0).map((_, i) => <div key={i} className="h-12 shimmer rounded-xl" />)
                  : skills.slice(0, 5).map((skill: any) => (
                      <div key={skill.id} className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${skill.color}22`, border: `1px solid ${skill.color}40` }}>
                          {skill.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
                            <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>
                              {skill.completedLessons}/{skill.totalLessons}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                            <motion.div className="h-full rounded-full" style={{ background: skill.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.completionPercent}%` }}
                              transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                        {skill.mastered && <span className="text-lg flex-shrink-0">⭐</span>}
                      </div>
                    ))
                }
              </div>
            </motion.section>

            {/* Recent Activity */}
            <motion.section className="glass-card p-6" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }}>
              <h2 className="text-lg font-bold font-display mb-5" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
              {activities.length === 0 && !progressLoading ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  No activity yet — complete a lesson to get started! 🚀
                </p>
              ) : (
                <div className="space-y-2">
                  {activities.slice(0, 6).map((item: any, i: number) => (
                    <motion.div key={item.id ?? i}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{ background: 'var(--bg-card)' }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.04 }}
                    >
                      {item.skill?.icon
                        ? <span className="text-xl">{item.skill.icon}</span>
                        : <BookOpen className="w-5 h-5 flex-shrink-0" style={{ color: '#6474f5' }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.lesson?.title ?? 'Lesson'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.skill?.name ?? ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold" style={{ color: '#6474f5' }}>+{item.lesson?.xpReward ?? 0} XP</p>
                        {item.score != null && <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{item.score}%</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            {challengeData?.challenge && (
              <DailyChallengeCard
                challenge={challengeData.challenge}
                secondsRemaining={challengeData.secondsRemaining ?? 0}
                onComplete={() => refetchChallenge()}
              />
            )}

            {/* Quick actions */}
            <motion.section className="glass-card p-6" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }}>
              <h2 className="text-base font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { href: '/skills',       icon: Network,  label: 'Explore Skills', color: '#818cf8' },
                  { href: '/leaderboard',  icon: Trophy,   label: 'Leaderboard',    color: '#fbbf24' },
                  { href: '/achievements', icon: Award,    label: 'Achievements',   color: '#34d399' },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{ background: `${color}18`, color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-subtle)' }} />
                  </Link>
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  )
}
