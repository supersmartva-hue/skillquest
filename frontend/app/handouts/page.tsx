'use client'

/**
 * Handouts Page  /handouts
 *
 * - Lists all AI-generated notes the user has created
 * - Lets users generate a new handout by typing any topic
 * - Click a handout to read the full notes + MCQs
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from 'react-query'
import { generateAPI } from '@/lib/api'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageLoader } from '@/components/ui/PageLoader'
import toast from 'react-hot-toast'
import {
  Sparkles, BookOpen, ChevronDown, ChevronUp,
  Clock, HelpCircle, CheckCircle2, XCircle, Send, RefreshCw,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface MCQ {
  id: number
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface Handout {
  id: string
  topic: string
  model: string
  notes: string
  mcqs: MCQ[]
  createdAt: string
}

interface HistoryRecord {
  id: string
  topic: string
  model: string
  createdAt: string
}

// ── Notes renderer ────────────────────────────────────────────────────────────
function NotesBody({ notes }: { notes: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
      {notes.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        const isHeading = /^#+\s|^\d+\.\s[A-Z]/.test(line.trim())
        return isHeading ? (
          <p key={i} className="font-bold text-base mt-5 first:mt-0" style={{ color: 'var(--text-primary)' }}>
            {line.replace(/^#+\s*/, '')}
          </p>
        ) : (
          <p key={i}>{line}</p>
        )
      })}
    </div>
  )
}

// ── Inline MCQ quiz ───────────────────────────────────────────────────────────
function MCQQuiz({ mcqs }: { mcqs: MCQ[] }) {
  const [current, setCurrent]   = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore]       = useState(0)
  const [done, setDone]         = useState(false)

  const handleAnswer = (opt: string) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    if (opt === mcqs[current].correct_answer) setScore((s) => s + 1)
  }

  const handleNext = () => {
    if (current + 1 < mcqs.length) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setDone(true)
    }
  }

  const handleRetry = () => {
    setCurrent(0); setSelected(null)
    setAnswered(false); setScore(0); setDone(false)
  }

  if (done) {
    const pct = Math.round((score / mcqs.length) * 100)
    return (
      <motion.div className="text-center py-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <p className="text-4xl mb-3">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</p>
        <p className="text-2xl font-black font-mono mb-1" style={{ color: '#6474f5' }}>{pct}%</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{score}/{mcqs.length} correct</p>
        <button onClick={handleRetry}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(100,116,245,0.12)', color: '#6474f5' }}>
          <RefreshCw className="w-4 h-4" /> Retry Quiz
        </button>
      </motion.div>
    )
  }

  const q = mcqs[current]
  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(current / mcqs.length) * 100}%`, background: '#6474f5' }} />
        </div>
        <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>
          {current + 1}/{mcqs.length}
        </span>
      </div>

      <p className="text-sm font-semibold mb-3 leading-snug" style={{ color: 'var(--text-primary)' }}>
        {q.question}
      </p>

      <div className="space-y-2 mb-4">
        {q.options.map((opt) => {
          const isCorrect = opt === q.correct_answer
          const isChosen  = opt === selected
          let bg = 'var(--bg-primary)', border = 'var(--border)', color = 'var(--text-muted)'
          if (answered) {
            if (isCorrect)     { bg = 'rgba(46,204,113,0.10)'; border = 'rgba(46,204,113,0.4)'; color = '#2ecc71' }
            else if (isChosen) { bg = 'rgba(239,68,68,0.08)';  border = 'rgba(239,68,68,0.35)'; color = '#ef4444' }
          } else if (isChosen) {
            bg = 'rgba(100,116,245,0.10)'; border = 'rgba(100,116,245,0.4)'; color = '#6474f5'
          }
          return (
            <button key={opt} onClick={() => handleAnswer(opt)} disabled={answered}
              className="w-full text-left p-3 rounded-xl text-sm font-medium border transition-all disabled:cursor-default flex items-center gap-2"
              style={{ background: bg, borderColor: border, color }}>
              {answered && isCorrect && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {answered && isChosen && !isCorrect && <XCircle className="w-4 h-4 flex-shrink-0" />}
              {opt}
            </button>
          )
        })}
      </div>

      {answered && q.explanation && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl mb-4 text-xs leading-relaxed"
          style={{ background: 'rgba(100,116,245,0.07)', color: 'var(--text-muted)', border: '1px solid rgba(100,116,245,0.15)' }}>
          💡 {q.explanation}
        </motion.div>
      )}

      {answered && (
        <motion.button onClick={handleNext}
          className="w-full py-2.5 rounded-xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          {current + 1 < mcqs.length ? 'Next →' : 'See Result →'}
        </motion.button>
      )}
    </div>
  )
}

// ── Expanded handout card ─────────────────────────────────────────────────────
function HandoutCard({ record, index }: { record: HistoryRecord; index: number }) {
  const [open, setOpen]             = useState(false)
  const [tab, setTab]               = useState<'notes' | 'quiz'>('notes')
  const [handout, setHandout]       = useState<Handout | null>(null)
  const [loading, setLoading]       = useState(false)

  const toggle = async () => {
    if (!open && !handout) {
      setLoading(true)
      try {
        const { data } = await generateAPI.getById(record.id as any)
        if (data.success) setHandout(data.data)
      } catch {
        toast.error('Could not load handout.')
      } finally {
        setLoading(false)
      }
    }
    setOpen((o) => !o)
  }

  const date = new Date(record.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Header row — always visible */}
      <button onClick={toggle}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors group"
        style={{ background: open ? 'rgba(100,116,245,0.04)' : 'transparent' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(100,116,245,0.12)', border: '1px solid rgba(100,116,245,0.2)' }}>
          <BookOpen className="w-5 h-5" style={{ color: '#6474f5' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {record.topic}
          </p>
          <p className="text-xs flex items-center gap-2 mt-0.5" style={{ color: 'var(--text-subtle)' }}>
            <Clock className="w-3 h-3" /> {date}
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-subtle)' }}>
              {record.model}
            </span>
          </p>
        </div>
        <div className="flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t" style={{ borderColor: 'var(--border)' }}>
              {loading ? (
                <div className="p-6 space-y-3 animate-pulse">
                  {[80, 100, 60, 90, 70].map((w, i) => (
                    <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: 'var(--border)' }} />
                  ))}
                </div>
              ) : handout ? (
                <div className="p-6">
                  {/* Tab switcher */}
                  <div className="flex gap-2 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)' }}>
                    {(['notes', 'quiz'] as const).map((t) => (
                      <button key={t} onClick={() => setTab(t)}
                        className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                        style={{
                          background: tab === t ? 'rgba(100,116,245,0.2)' : 'transparent',
                          color:      tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}>
                        {t === 'notes'
                          ? <><BookOpen className="w-3.5 h-3.5" /> Notes</>
                          : <><HelpCircle className="w-3.5 h-3.5" /> Quiz ({handout.mcqs.length}Q)</>}
                      </button>
                    ))}
                  </div>

                  {tab === 'notes' && <NotesBody notes={handout.notes} />}
                  {tab === 'quiz'  && <MCQQuiz mcqs={handout.mcqs} />}
                </div>
              ) : (
                <p className="p-6 text-sm" style={{ color: 'var(--text-subtle)' }}>Failed to load.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Tabs wrapper for freshly generated handout ───────────────────────────────
function NewHandoutTabs({ handout }: { handout: Handout }) {
  const [tab, setTab] = useState<'notes' | 'quiz'>('notes')
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)' }}>
        {(['notes', 'quiz'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
            style={{
              background: tab === t ? 'rgba(100,116,245,0.2)' : 'transparent',
              color:      tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
            {t === 'notes'
              ? <><BookOpen className="w-3.5 h-3.5" /> Notes</>
              : <><HelpCircle className="w-3.5 h-3.5" /> Quiz ({handout.mcqs.length}Q)</>}
          </button>
        ))}
      </div>
      {tab === 'notes' && <NotesBody notes={handout.notes} />}
      {tab === 'quiz'  && <MCQQuiz mcqs={handout.mcqs} />}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HandoutsPage() {
  const { user, isLoading: authLoading } = useAuthGuard()
  const qc = useQueryClient()

  const [topic, setTopic]       = useState('')
  const [generating, setGenerating] = useState(false)
  const [newHandout, setNewHandout] = useState<Handout | null>(null)

  const { data, isLoading: historyLoading } = useQuery(
    'handoutsHistory',
    () => generateAPI.getHistory().then((r) => r.data),
    { enabled: !!user, staleTime: 30_000 }
  )

  const handleGenerate = async () => {
    if (!topic.trim()) return toast.error('Enter a topic first.')
    if (topic.trim().length < 2) return toast.error('Topic is too short.')
    setGenerating(true)
    setNewHandout(null)
    try {
      const { data: res } = await generateAPI.generate(topic.trim())
      if (res.success) {
        setNewHandout(res.data)
        setTopic('')
        qc.invalidateQueries('handoutsHistory')
        toast.success('Handout generated!')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to generate. Check your OpenAI key.'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  const records: HistoryRecord[] = data?.data?.records ?? []

  if (authLoading) return <PageLoader />

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8 max-w-3xl">

        {/* Page header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black font-display text-gradient-brand flex items-center gap-2">
            <Sparkles className="w-7 h-7" /> AI Handouts
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Generate structured notes + quiz questions for any topic using AI
          </p>
        </motion.div>

        {/* Generate box */}
        <motion.div
          className="glass-card p-5 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Generate a new handout
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !generating && handleGenerate()}
              placeholder="e.g. Binary Search Trees, React Hooks, SQL Joins…"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background:   'var(--bg-secondary)',
                border:       '1px solid var(--border)',
                color:        'var(--text-primary)',
              }}
              disabled={generating}
            />
            <motion.button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
              whileHover={{ scale: generating ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {generating
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Send className="w-4 h-4" /> Generate</>}
            </motion.button>
          </div>

          {/* Generating skeleton */}
          {generating && (
            <motion.div className="mt-5 space-y-2.5 animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: '#6474f5' }} />
                <span className="text-xs font-semibold" style={{ color: '#6474f5' }}>
                  AI is writing your handout…
                </span>
              </div>
              {[90, 75, 100, 60, 85, 70].map((w, i) => (
                <div key={i} className="h-3 rounded-full" style={{ width: `${w}%`, background: 'var(--border)' }} />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Freshly generated handout */}
        <AnimatePresence>
          {newHandout && (
            <motion.div
              className="glass-card overflow-hidden mb-6"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {/* New badge header */}
              <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(100,116,245,0.12)', border: '1px solid rgba(100,116,245,0.2)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#6474f5' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {newHandout.topic}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
                    ✨ Just generated
                  </span>
                </div>
                <button onClick={() => setNewHandout(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <NewHandoutTabs handout={newHandout} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* History list */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Your Handouts {records.length > 0 && <span style={{ color: 'var(--text-subtle)' }}>({records.length})</span>}
          </h2>

          {!user ? (
            <div className="text-center py-12" style={{ color: 'var(--text-subtle)' }}>
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-sm">Sign in to view your saved handouts.</p>
            </div>
          ) : historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 shimmer rounded-2xl" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 glass-card"
              style={{ color: 'var(--text-subtle)' }}>
              <p className="text-4xl mb-3">📄</p>
              <p className="text-sm font-medium">No handouts yet.</p>
              <p className="text-xs mt-1">Generate your first one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r, i) => (
                <HandoutCard key={r.id} record={r} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
