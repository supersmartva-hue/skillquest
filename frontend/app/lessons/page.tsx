'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { useRouter } from 'next/navigation'
import { Video, HelpCircle, BookOpen, Dumbbell, FileText, CheckCircle2 } from 'lucide-react'
import { skillsAPI } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { clsx } from 'clsx'

export default function LessonsPage() {
  const router = useRouter()
  const { isLoading: authLoading } = useAuthGuard()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['skills-lessons', selectedCategory],
    () => skillsAPI.getAll(selectedCategory ?? undefined).then((r) => r.data),
    { staleTime: 60_000 }
  )

  const { data: catData } = useQuery(
    'skillCategories',
    () => skillsAPI.getCategories().then((r) => r.data),
    { staleTime: 300_000 }
  )

  if (authLoading) return <PageLoader />

  const skills = data?.skills ?? []

  const TYPE_ICONS: Record<string, React.ReactNode> = {
    video:    <Video      className="w-4 h-4" />,
    quiz:     <HelpCircle className="w-4 h-4" />,
    reading:  <BookOpen   className="w-4 h-4" />,
    exercise: <Dumbbell   className="w-4 h-4" />,
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-black font-display text-gradient-brand">Lessons</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Browse all lessons by skill</p>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
            style={{
              background: !selectedCategory ? 'rgba(100,116,245,0.15)' : 'transparent',
              borderColor: !selectedCategory ? 'rgba(100,116,245,0.5)' : 'var(--border)',
              color: !selectedCategory ? '#6474f5' : 'var(--text-muted)',
            }}
          >
            All Skills
          </button>
          {catData?.categories?.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border capitalize"
              style={{
                background: selectedCategory === cat ? 'rgba(100,116,245,0.15)' : 'transparent',
                borderColor: selectedCategory === cat ? 'rgba(100,116,245,0.5)' : 'var(--border)',
                color: selectedCategory === cat ? '#6474f5' : 'var(--text-muted)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skills with their lessons */}
        {isLoading ? (
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 shimmer rounded-2xl" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            No skills found. Check back after the database is seeded!
          </div>
        ) : (
          <div className="space-y-6">
            {skills.map((skill: any, si: number) => (
              <motion.section
                key={skill.id}
                className="glass-card p-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.06 }}
              >
                {/* Skill header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${skill.color}22`, border: `1px solid ${skill.color}44` }}
                  >
                    {skill.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{skill.name}</h2>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                      {skill.category} · {skill.totalLessons ?? skill.lessons?.length ?? 0} lessons
                    </p>
                  </div>
                  {/* Progress pill */}
                  {skill.completionPercent != null && (
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: `${skill.color}22`, color: skill.color }}
                    >
                      {skill.completionPercent}% done
                    </span>
                  )}
                </div>

                {/* Lessons list */}
                <div className="space-y-2">
                  {(skill.lessons ?? []).length === 0 ? (
                    <p className="text-sm py-2" style={{ color: 'var(--text-subtle)' }}>No lessons yet for this skill.</p>
                  ) : (
                    (skill.lessons ?? []).map((lesson: any, li: number) => {
                      const isCompleted = lesson.completed
                      return (
                        <motion.button
                          key={lesson.id}
                          className={clsx(
                            'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all',
                            !skill.unlocked && 'opacity-50 cursor-not-allowed'
                          )}
                          style={{ background: 'var(--bg-card)' }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: si * 0.06 + li * 0.03 }}
                          whileHover={skill.unlocked ? { x: 3 } : {}}
                          onClick={() => skill.unlocked && router.push(`/skills/${skill.id}`)}
                          disabled={!skill.unlocked}
                        >
                          {/* Order / complete indicator */}
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              background: isCompleted ? 'rgba(46,204,113,0.15)' : 'var(--border)',
                              color: isCompleted ? '#2ecc71' : 'var(--text-subtle)',
                            }}
                          >
                            {isCompleted
                              ? <CheckCircle2 className="w-4 h-4" />
                              : lesson.order ?? li + 1}
                          </span>

                          {/* Type icon */}
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                            {TYPE_ICONS[lesson.type] ?? <FileText className="w-4 h-4" />}
                          </span>

                          {/* Title */}
                          <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {lesson.title}
                          </span>

                          {/* Duration + XP */}
                          <div className="flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: 'var(--text-subtle)' }}>
                            {lesson.duration && <span>{lesson.duration}m</span>}
                            <span style={{ color: '#6474f5' }}>+{lesson.xpReward} XP</span>
                          </div>
                        </motion.button>
                      )
                    })
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
