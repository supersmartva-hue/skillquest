'use client'

/**
 * LevelUpModal — Full-screen celebration overlay
 * Triggers when user gains a level. Uses Framer Motion + react-confetti.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/store/userStore'

// Dynamic import — confetti is large and not needed until level-up
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

export function LevelUpModal() {
  const { pendingXPEvent, clearPendingEvent } = useUserStore()
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(false)

  const isLevelUp = pendingXPEvent?.didLevelUp ?? false
  const newLevel = pendingXPEvent?.newLevel

  // Get window dimensions for confetti canvas
  useEffect(() => {
    const update = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (isLevelUp) {
      setShowConfetti(true)
      // Stop confetti after 4 seconds
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isLevelUp])

  const handleClose = () => {
    clearPendingEvent()
  }

  return (
    <AnimatePresence>
      {isLevelUp && (
        <>
          {/* Confetti layer */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              colors={['#6474f5', '#00D2FF', '#FFD700', '#9B59B6', '#2ECC71']}
              numberOfPieces={300}
              recycle={false}
              style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
            />
          )}

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            {/* Modal card */}
            <motion.div
              className="relative mx-4 max-w-md w-full rounded-3xl border border-brand-500/40 p-10 text-center overflow-hidden"
              style={{ background: 'var(--bg-secondary)' }}
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: {
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                },
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-radial from-brand-600/20 to-transparent" />

              {/* Level ring animation */}
              <motion.div
                className="relative mx-auto mb-6 w-32 h-32"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-brand-400/40" />
                {/* Inner level display */}
                <motion.div
                  className="absolute inset-3 rounded-full bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-glow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3, stiffness: 300 }}
                >
                  <motion.span
                    className="text-4xl font-black font-display"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {newLevel}
                  </motion.span>
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-3xl font-black font-display text-gradient-brand mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Level Up! 🎉
              </motion.h2>

              <motion.p
                className="mb-8 text-lg"
                style={{ color: 'var(--text-muted)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                You&apos;ve reached <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Level {newLevel}</span>.
                Keep it up!
              </motion.p>

              {/* XP earned */}
              <motion.div
                className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-500/30 px-4 py-2 rounded-full mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
              >
                <span className="text-accent-gold text-xl">⚡</span>
                <span className="font-semibold text-brand-300">
                  +{pendingXPEvent?.amount} XP earned
                </span>
              </motion.div>

              {/* Continue button */}
              <motion.button
                onClick={handleClose}
                className="w-full btn-glow bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-bold py-4 rounded-2xl text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Quest →
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
