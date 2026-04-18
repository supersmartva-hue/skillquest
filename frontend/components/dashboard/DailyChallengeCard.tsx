'use client'

/**
 * DailyChallengeCard — Countdown timer + challenge completion
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Swords, Zap, CheckCircle2 } from 'lucide-react'
import { challengesAPI } from '@/lib/api'
import { useUserStore } from '@/store/userStore'
import toast from 'react-hot-toast'

interface Challenge {
  id: string
  task: string
  xpReward: number
  completed: boolean
}

interface DailyChallengeCardProps {
  challenge: Challenge
  secondsRemaining: number
  onComplete: () => void
}

function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(initial)

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function DailyChallengeCard({ challenge, secondsRemaining, onComplete }: DailyChallengeCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(challenge.completed)
  const { updateXP } = useUserStore()
  const countdown = useCountdown(secondsRemaining)

  const handleComplete = async () => {
    if (isCompleted || isCompleting) return
    setIsCompleting(true)
    try {
      const { data } = await challengesAPI.complete(challenge.id)
      setIsCompleted(true)
      updateXP(data)
      toast.success(`Daily challenge complete! +${challenge.xpReward} XP`)
      onComplete()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete challenge.')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <motion.div
      className="glass-card p-6 relative overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-400" />

      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>
          <Swords className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm font-display" style={{ color: 'var(--text-primary)' }}>Daily Challenge</h3>
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Resets in {countdown}</p>
        </div>
      </div>

      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{challenge.task}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-accent-gold" />
          <span className="font-semibold text-accent-gold text-sm">+{challenge.xpReward} XP</span>
        </div>

        <button
          onClick={handleComplete}
          disabled={isCompleted || isCompleting}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
              : 'btn-glow bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
          }`}
        >
          {isCompleted
            ? <><CheckCircle2 className="w-4 h-4" /> Done!</>
            : isCompleting ? 'Saving…' : 'Complete'}
        </button>
      </div>
    </motion.div>
  )
}
