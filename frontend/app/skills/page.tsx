'use client'

/**
 * Skills Page — Interactive skill tree + list view toggle
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from 'react-query'
import { useRouter } from 'next/navigation'
import { skillsAPI } from '@/lib/api'
import { SkillTree } from '@/components/skill-tree/SkillTree'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { clsx } from 'clsx'

type ViewMode = 'tree' | 'list'

export default function SkillsPage() {
  const router = useRouter()
  const { isLoading: authLoading } = useAuthGuard()
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'list'
    return 'tree'
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    ['skills', selectedCategory],
    () => skillsAPI.getAll(selectedCategory ?? undefined).then((r) => r.data),
    { staleTime: 60_000 }
  )

  const { data: catData } = useQuery(
    'skillCategories',
    () => skillsAPI.getCategories().then((r) => r.data),
    { staleTime: 300_000 }
  )

  const skills = data?.skills ?? []

  if (authLoading) return <PageLoader />

  const handleSkillClick = (skill: any) => {
    setSelectedSkillId(skill.id)
    // Navigate to skill detail after a brief pause to show selection
    setTimeout(() => router.push(`/skills/${skill.id}`), 200)
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">
        {/* Header */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-display text-gradient-brand">Skill Tree</h1>
            <p className="mt-1 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>Explore and unlock new skills</p>
          </div>

          {/* View toggle */}
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
            {(['tree', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {viewMode === mode && (
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(100,116,245,0.2)' }}
                    layoutId="viewToggle"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {mode === 'tree' ? '🌳 Tree' : '📋 List'}
                </span>
              </button>
            ))}
          </div>
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
            All
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

        <AnimatePresence mode="wait">
          {viewMode === 'tree' ? (
            <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isLoading ? (
                <div className="h-[400px] md:h-[600px] shimmer rounded-2xl" />
              ) : (
                <SkillTree
                  skills={skills}
                  onSkillClick={handleSkillClick}
                  selectedSkillId={selectedSkillId}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading
                ? Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-40 shimmer rounded-2xl" />
                  ))
                : skills.map((skill: any, i: number) => (
                    <motion.div
                      key={skill.id}
                      className={clsx(
                        'glass-card p-5 cursor-pointer transition-all group',
                        !skill.unlocked && 'opacity-60'
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3 }}
                      onClick={() => skill.unlocked && handleSkillClick(skill)}
                    >
                      {/* Skill icon + name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: `${skill.color}22`, border: `1px solid ${skill.color}40` }}
                        >
                          {skill.unlocked ? skill.icon : '🔒'}
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{skill.name}</h3>
                          <p className="text-xs capitalize" style={{ color: 'var(--text-subtle)' }}>{skill.category}</p>
                        </div>
                        {skill.mastered && <span className="ml-auto text-xl">⭐</span>}
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs" style={{ color: 'var(--text-subtle)' }}>
                          <span>{skill.completedLessons}/{skill.totalLessons} lessons</span>
                          <span>{skill.completionPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: skill.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.completionPercent}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                          />
                        </div>
                      </div>

                      {/* Locked message */}
                      {!skill.unlocked && (
                        <p className="text-xs text-red-400/70 mt-3">
                          🔒 Complete prerequisites first
                        </p>
                      )}
                    </motion.div>
                  ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
