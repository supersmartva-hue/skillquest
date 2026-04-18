'use client'

/**
 * Skill Detail Page  /skills/[id]
 *
 * Shows skill overview, lesson list, and an inline lesson player modal.
 * Calls POST /api/progress/complete-lesson on finish and fires XP/level-up events.
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from 'react-query'
import { skillsAPI, progressAPI, generateAPI, api } from '@/lib/api'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useUserStore } from '@/store/userStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import { XPBar } from '@/components/ui/XPBar'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { ArrowLeft, Lock, CheckCircle2, Play, Clock, Zap, Star, BookOpen, Video, HelpCircle, Dumbbell, FileText, Sparkles, RefreshCw } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Lesson {
  id: string
  title: string
  description: string
  order: number
  type: string
  xpReward: number
  duration: number
  content: string
  isActive: boolean
  progress?: { status: string; score?: number } | null
}

interface Skill {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  difficulty: number
  prerequisites: string[]
  lessons: Lesson[]
}

interface MCQQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface AIMcq {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface AIContent {
  notes: string
  mcqs: AIMcq[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }
const TYPE_ICONS: Record<string, React.ReactNode> = {
  video:    <Video      className="w-4 h-4" />,
  quiz:     <HelpCircle className="w-4 h-4" />,
  reading:  <BookOpen   className="w-4 h-4" />,
  exercise: <Dumbbell   className="w-4 h-4" />,
}

const parsedContent = (raw: string): { intro?: string; questions?: MCQQuestion[] } => {
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw }
  catch { return {} }
}

// ── Sub-component: Lesson row ─────────────────────────────────────────────────
function LessonRow({
  lesson,
  index,
  unlocked,
  onStart,
}: {
  lesson: Lesson
  index: number
  unlocked: boolean
  onStart: (lesson: Lesson) => void
}) {
  const completed = lesson.progress?.status === 'completed'
  const score     = lesson.progress?.score

  return (
    <motion.div
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border transition-all group',
        completed   && 'border-emerald-500/20',
        !completed && unlocked  && 'border-transparent hover:border-brand-500/30 cursor-pointer',
        !unlocked   && 'opacity-50 cursor-not-allowed',
      )}
      style={{
        background: completed
          ? 'rgba(46,204,113,0.05)'
          : unlocked ? 'var(--bg-card)' : 'var(--bg-card)',
        borderColor: completed ? 'rgba(46,204,113,0.2)' : undefined,
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => unlocked && onStart(lesson)}
      whileHover={unlocked ? { x: 4 } : {}}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {completed ? (
          <CheckCircle2 className="w-6 h-6" style={{ color: '#2ecc71' }} />
        ) : unlocked ? (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
            {lesson.order}
          </div>
        ) : (
          <Lock className="w-5 h-5" style={{ color: 'var(--text-subtle)' }} />
        )}
      </div>

      {/* Type icon */}
      <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
        {TYPE_ICONS[lesson.type] ?? <FileText className="w-4 h-4" />}
      </span>

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {lesson.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-subtle)' }}>
          {lesson.description}
        </p>
      </div>

      {/* Meta: duration, xp, score */}
      <div className="flex items-center gap-3 flex-shrink-0 text-xs">
        {lesson.duration > 0 && (
          <span className="flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
            <Clock className="w-3 h-3" /> {lesson.duration}m
          </span>
        )}
        <span className="font-semibold" style={{ color: '#6474f5' }}>+{lesson.xpReward} XP</span>
        {score != null && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
            {score}%
          </span>
        )}
      </div>

      {/* Play button (visible on hover) */}
      {unlocked && !completed && (
        <div className="w-8 h-8 rounded-lg items-center justify-center hidden group-hover:flex transition-all"
          style={{ background: 'rgba(100,116,245,0.15)', color: '#6474f5' }}>
          <Play className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  )
}

// ── Sub-component: AI Notes renderer ─────────────────────────────────────────
function AINotesDisplay({ notes }: { notes: string }) {
  // Split on numbered headings like "1. Introduction" or "## Overview"
  const lines = notes.split('\n')
  return (
    <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
      {lines.map((line, i) => {
        const isHeading = /^#+\s|^\d+\.\s[A-Z]/.test(line.trim())
        if (!line.trim()) return null
        return isHeading ? (
          <p key={i} className="font-bold text-sm mt-4 first:mt-0" style={{ color: 'var(--text-primary)' }}>
            {line.replace(/^#+\s*/, '')}
          </p>
        ) : (
          <p key={i}>{line}</p>
        )
      })}
    </div>
  )
}

// ── Sub-component: AI Loading skeleton ───────────────────────────────────────
function AILoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4" style={{ color: '#6474f5' }} />
        <span className="text-xs font-semibold" style={{ color: '#6474f5' }}>Generating AI notes…</span>
      </div>
      {[80, 100, 60, 90, 70].map((w, i) => (
        <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: 'var(--border)' }} />
      ))}
      <div className="h-3 rounded-full mt-4" style={{ width: '40%', background: 'var(--border)' }} />
      {[85, 95, 55].map((w, i) => (
        <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: 'var(--border)' }} />
      ))}
    </div>
  )
}

// ── Sub-component: Lesson Modal ───────────────────────────────────────────────
function LessonModal({
  lesson,
  skill,
  onClose,
  onComplete,
}: {
  lesson: Lesson
  skill: Skill
  onClose: () => void
  onComplete: (xpEarned: number, score?: number) => void
}) {
  const { user } = useUserStore()

  // ── AI content state ──────────────────────────────────────────────────────
  const [aiContent, setAiContent]   = useState<AIContent | null>(null)
  const [aiLoading, setAiLoading]   = useState(true)
  const [aiError, setAiError]       = useState<string | null>(null)
  const fetchedRef                  = useRef(false)

  // Fetch AI notes + MCQs once on mount
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const topic = `${lesson.title} in ${skill.name}`
    generateAPI.generate(topic)
      .then(({ data }) => {
        if (data.success && data.data) {
          setAiContent({
            notes: data.data.notes,
            mcqs:  data.data.mcqs.map((q: any) => ({
              question:    q.question,
              options:     q.options,
              answer:      q.correct_answer ?? q.answer,
              explanation: q.explanation ?? '',
            })),
          })
        } else {
          setAiError('AI content unavailable.')
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.error ?? 'Failed to generate AI content.'
        setAiError(msg)
      })
      .finally(() => setAiLoading(false))
  }, [lesson.id])

  // Use AI MCQs if available, otherwise fall back to static DB content
  const questions: AIMcq[] = aiContent?.mcqs ?? []
  const hasQuiz = questions.length > 0

  const [phase, setPhase]           = useState<'notes' | 'quiz' | 'result'>('notes')
  const [currentQ, setCurrentQ]     = useState(0)
  const [selected, setSelected]     = useState<string | null>(null)
  const [answered, setAnswered]     = useState(false)
  const [correctCount, setCorrect]  = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleStartQuiz = () => {
    setPhase('quiz')
    setCurrentQ(0)
    setCorrect(0)
    setSelected(null)
    setAnswered(false)
  }

  const handleSkipToComplete = () => handleFinish(undefined)

  const handleAnswer = (option: string) => {
    if (answered) return
    setSelected(option)
    setAnswered(true)
    if (option === questions[currentQ].answer) setCorrect((c) => c + 1)
  }

  const handleNext = () => {
    const isLast = currentQ + 1 >= questions.length
    if (!isLast) {
      setCurrentQ((q) => q + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      const lastCorrect = selected === questions[currentQ].answer ? 1 : 0
      const score = Math.round(((correctCount + lastCorrect) / questions.length) * 100)
      handleFinish(score)
    }
  }

  const handleFinish = async (score?: number) => {
    if (!user) { onClose(); return }
    setSubmitting(true)
    try {
      const { data } = await progressAPI.completeLesson(lesson.id, score)
      onComplete(data.xpEarned ?? 0, score)
      setPhase('result')
    } catch {
      toast.error('Could not save progress. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const finalScore = phase === 'result' && hasQuiz
    ? Math.round((correctCount / questions.length) * 100)
    : undefined

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div className="p-5 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${skill.color}22`, border: `1px solid ${skill.color}44` }}>
            {skill.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
              <span className="inline-flex">{TYPE_ICONS[lesson.type] ?? <FileText className="w-3 h-3" />}</span>
              <span className="capitalize">{lesson.type}</span>
              <span>· +{lesson.xpReward} XP</span>
              {!aiLoading && !aiError && (
                <span className="flex items-center gap-0.5 ml-1" style={{ color: '#6474f5' }}>
                  <Sparkles className="w-3 h-3" /> AI
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── NOTES phase ── */}
          {phase === 'notes' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

              {/* AI badge */}
              {!aiLoading && !aiError && (
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg w-fit"
                  style={{ background: 'rgba(100,116,245,0.10)', border: '1px solid rgba(100,116,245,0.2)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#6474f5' }} />
                  <span className="text-xs font-semibold" style={{ color: '#6474f5' }}>AI-Generated Notes</span>
                </div>
              )}

              {/* Notes content */}
              {aiLoading && <AILoadingSkeleton />}

              {aiError && (
                <div className="mb-5 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  ⚠️ {aiError}
                  <p className="mt-1 opacity-70" style={{ color: 'var(--text-subtle)' }}>
                    {lesson.description}
                  </p>
                </div>
              )}

              {!aiLoading && !aiError && aiContent && (
                <div className="mb-5 p-4 rounded-xl overflow-y-auto" style={{ background: 'var(--bg-secondary)', maxHeight: '320px' }}>
                  <AINotesDisplay notes={aiContent.notes} />
                </div>
              )}

              {/* Meta pills */}
              <div className="flex items-center gap-4 mb-5 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <Clock className="w-3.5 h-3.5" /> {lesson.duration} min
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#6474f5' }}>
                  <Zap className="w-3.5 h-3.5" /> +{lesson.xpReward} XP
                </div>
                {!aiLoading && hasQuiz && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                    ❓ {questions.length} AI questions
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!aiLoading && (
                <div className="space-y-2">
                  {hasQuiz && (
                    <motion.button
                      onClick={handleStartQuiz}
                      className="btn-glow w-full py-3.5 rounded-xl font-bold text-white text-sm"
                      style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start AI Quiz →
                    </motion.button>
                  )}
                  <button
                    onClick={handleSkipToComplete}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                  >
                    {submitting ? 'Saving…' : hasQuiz ? 'Skip Quiz & Complete' : 'Mark as Complete ✓'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── QUIZ phase ── */}
          {phase === 'quiz' && questions[currentQ] && (
            <motion.div key={currentQ} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(currentQ / questions.length) * 100}%`, background: skill.color }} />
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>
                  {currentQ + 1}/{questions.length}
                </span>
              </div>

              {/* AI badge */}
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3 h-3" style={{ color: '#6474f5' }} />
                <span className="text-xs" style={{ color: '#6474f5' }}>AI Question</span>
              </div>

              <p className="text-sm font-semibold mb-4 leading-snug" style={{ color: 'var(--text-primary)' }}>
                {questions[currentQ].question}
              </p>

              <div className="space-y-2 mb-5">
                {questions[currentQ].options.map((opt) => {
                  const isCorrect = opt === questions[currentQ].answer
                  const isChosen  = opt === selected
                  let bg = 'var(--bg-secondary)', border = 'var(--border)', color = 'var(--text-muted)'
                  if (answered) {
                    if (isCorrect)     { bg = 'rgba(46,204,113,0.12)'; border = 'rgba(46,204,113,0.4)';  color = '#2ecc71' }
                    else if (isChosen) { bg = 'rgba(239,68,68,0.10)';  border = 'rgba(239,68,68,0.35)';  color = '#ef4444' }
                  } else if (isChosen) {
                    bg = 'rgba(100,116,245,0.12)'; border = 'rgba(100,116,245,0.4)'; color = '#6474f5'
                  }
                  return (
                    <button key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={answered}
                      className="w-full text-left p-3 rounded-xl text-sm font-medium transition-all border disabled:cursor-default"
                      style={{ background: bg, borderColor: border, color }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              {answered && questions[currentQ].explanation && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl mb-4 text-xs leading-relaxed"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  💡 {questions[currentQ].explanation}
                </motion.div>
              )}

              {answered && (
                <motion.button onClick={handleNext} disabled={submitting}
                  className="btn-glow w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                  style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {submitting ? 'Saving…' : currentQ + 1 < questions.length ? 'Next Question →' : 'Finish Quiz →'}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── RESULT phase ── */}
          {phase === 'result' && (
            <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-5xl mb-3">
                {finalScore == null ? '✅' : finalScore >= 80 ? '🏆' : finalScore >= 50 ? '👍' : '💪'}
              </div>
              <h3 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                {finalScore == null ? 'Lesson Complete!' : finalScore >= 80 ? 'Excellent!' : finalScore >= 50 ? 'Good Job!' : 'Keep Practising!'}
              </h3>
              {finalScore != null && (
                <p className="text-3xl font-black font-mono mb-1" style={{ color: '#6474f5' }}>{finalScore}%</p>
              )}
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                {hasQuiz ? `${correctCount} / ${questions.length} correct` : lesson.description}
              </p>
              {finalScore != null && (
                <p className="text-xs mb-5" style={{ color: 'var(--text-subtle)' }}>
                  Questions powered by ✨ AI
                </p>
              )}
              <button onClick={onClose}
                className="btn-glow w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
              >
                Back to Lessons ✓
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SkillDetailPage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const qc      = useQueryClient()
  const { user, isLoading: authLoading } = useAuthGuard()
  const { setUser } = useUserStore()

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  const { data: skillData, isLoading: skillLoading } = useQuery(
    ['skill', params.id],
    () => skillsAPI.getOne(params.id).then((r) => r.data),
    { staleTime: 60_000, retry: 1 }
  )

  // Merge user progress into lessons after we have both
  const { data: progressData } = useQuery(
    'userProgress',
    () => api.get('/progress/user').then((r) => r.data),
    { enabled: !!user, staleTime: 30_000, retry: 1 }
  )

  if (authLoading || skillLoading) return <PageLoader />

  if (!skillData?.skill) {
    return (
      <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8 flex flex-col items-center justify-center gap-4">
          <p className="text-4xl">🔍</p>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Skill not found</h1>
          <Link href="/skills" className="text-sm font-semibold" style={{ color: '#6474f5' }}>← Back to Skills</Link>
        </main>
      </div>
    )
  }

  const skill: Skill = skillData.skill

  // Attach progress to each lesson
  const progressByLesson: Record<string, { status: string; score?: number }> = {}
  if (progressData) {
    ;(progressData.recentActivity ?? []).forEach((a: any) => {
      if (a.lessonId) progressByLesson[a.lessonId] = { status: 'completed', score: a.score }
    })
  }

  const lessonsWithProgress: Lesson[] = (skill.lessons ?? []).map((l) => ({
    ...l,
    progress: progressByLesson[l.id] ?? null,
  }))

  const completedCount   = lessonsWithProgress.filter((l) => l.progress?.status === 'completed').length
  const completionPercent = skill.lessons.length > 0 ? Math.round((completedCount / skill.lessons.length) * 100) : 0

  // A lesson is unlocked if it's the first one OR the previous one is completed
  const isLessonUnlocked = (index: number) => {
    if (!user) return false
    if (index === 0) return true
    return lessonsWithProgress[index - 1]?.progress?.status === 'completed'
  }

  const handleLessonComplete = (xpEarned: number, score?: number) => {
    toast.success(`+${xpEarned} XP earned! 🎉`)
    // Invalidate progress so the page re-fetches updated state
    qc.invalidateQueries('userProgress')
    qc.invalidateQueries(['skill', params.id])
    // Optimistically update user XP in store
    if (user) setUser({ ...user, xp: user.xp + xpEarned })
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8 max-w-3xl">

        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </motion.div>

        {/* Skill hero card */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
              style={{ background: `${skill.color}22`, border: `2px solid ${skill.color}44` }}>
              {skill.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
                  {skill.name}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: `${skill.color}20`, color: skill.color }}>
                  {skill.category}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                {skill.description}
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                  <Star className="w-3.5 h-3.5" /> {DIFFICULTY_LABEL[skill.difficulty] ?? 'Beginner'}
                </span>
                <span className="flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                  <BookOpen className="w-3.5 h-3.5" /> {skill.lessons.length} lessons
                </span>
                <span className="flex items-center gap-1 font-semibold" style={{ color: '#6474f5' }}>
                  <Zap className="w-3.5 h-3.5" />
                  {skill.lessons.reduce((sum, l) => sum + l.xpReward, 0)} total XP
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {user && (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-subtle)' }}>
                <span>{completedCount} / {skill.lessons.length} lessons completed</span>
                <span className="font-semibold" style={{ color: skill.color }}>{completionPercent}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${skill.color}, ${skill.color}bb)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              {completionPercent === 100 && (
                <p className="text-xs mt-2 font-semibold" style={{ color: '#2ecc71' }}>
                  ⭐ Skill Mastered!
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Lessons list */}
        <motion.section
          className="glass-card p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h2 className="text-base font-bold font-display mb-4" style={{ color: 'var(--text-primary)' }}>
            Lessons
          </h2>

          {!user && (
            <div className="p-4 rounded-xl mb-4 text-sm text-center" style={{ background: 'rgba(100,116,245,0.08)', border: '1px solid rgba(100,116,245,0.2)', color: 'var(--text-muted)' }}>
              <Link href="/auth/login" className="font-semibold" style={{ color: '#6474f5' }}>Sign in</Link>
              {' '}to track your progress and earn XP.
            </div>
          )}

          <div className="space-y-2">
            {lessonsWithProgress.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--text-subtle)' }}>
                No lessons available yet.
              </p>
            ) : (
              lessonsWithProgress.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={i}
                  unlocked={isLessonUnlocked(i)}
                  onStart={setActiveLesson}
                />
              ))
            )}
          </div>
        </motion.section>
      </main>

      {/* Lesson modal */}
      <AnimatePresence>
        {activeLesson && (
          <LessonModal
            key={activeLesson.id}
            lesson={activeLesson}
            skill={skill}
            onClose={() => setActiveLesson(null)}
            onComplete={(xp, score) => {
              handleLessonComplete(xp, score)
              setActiveLesson(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
