'use client'

/**
 * XPBar — Animated experience points progress bar
 * Uses CSS custom property + Framer Motion for smooth fills
 */

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { clsx } from 'clsx'

interface XPBarProps {
  currentXP: number
  xpToNextLevel: number
  level: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

export function XPBar({
  currentXP,
  xpToNextLevel,
  level,
  size = 'md',
  showLabel = true,
  animated = true,
  className,
}: XPBarProps) {
  // Guard against undefined props during initial render before user data loads
  const safeXP = currentXP ?? 0
  const safeXpToNext = xpToNextLevel ?? 100
  const safeLevel = level ?? 1

  // Mirrors server-side xpForLevel / xpToReachLevel in xpService.js
  const xpForLevel = (l: number) => Math.floor(100 * Math.pow(l, 1.5))
  const xpToReachLevel = (targetLevel: number) => {
    let total = 0
    for (let l = 1; l < targetLevel; l++) total += xpForLevel(l)
    return total
  }

  // XP accumulated within the current level only (not lifetime total)
  const xpInLevel = Math.max(0, safeXP - xpToReachLevel(safeLevel))
  const rawPercent = safeXpToNext > 0 ? Math.min((xpInLevel / safeXpToNext) * 100, 100) : 0

  // Spring-animated percentage value
  const motionPercent = useMotionValue(0)
  const springPercent = useSpring(motionPercent, {
    stiffness: 60,
    damping: 20,
    mass: 1,
  })

  useEffect(() => {
    if (animated) {
      // Small delay so animation plays after mount
      const timer = setTimeout(() => motionPercent.set(rawPercent), 300)
      return () => clearTimeout(timer)
    } else {
      motionPercent.set(rawPercent)
    }
  }, [rawPercent, animated, motionPercent])

  // Transform spring value into a display string
  const displayPercent = useTransform(springPercent, (v) => `${v.toFixed(1)}%`)
  const barWidth = useTransform(springPercent, (v) => `${v}%`)

  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' }
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className={clsx('flex justify-between items-center mb-1.5', textSizes[size])}>
          <div className="flex items-center gap-2">
            {/* Level badge */}
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-xs font-bold">
              {safeLevel}
            </div>
            <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Level {safeLevel}</span>
          </div>
          <motion.span className="text-brand-300 font-mono font-semibold tabular-nums">
            {displayPercent}
          </motion.span>
        </div>
      )}

      {/* Track */}
      <div
        className={clsx('w-full rounded-full overflow-hidden', heights[size])}
        style={{ background: 'var(--border)' }}
        role="progressbar"
        aria-valuenow={rawPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Fill — uses spring animation */}
        <motion.div
          style={{ width: barWidth }}
          className={clsx(
            'h-full rounded-full relative',
            // Multi-color gradient for visual richness
            'bg-gradient-to-r from-brand-500 via-accent-cyan to-brand-400'
          )}
        >
          {/* Shimmer highlight on top */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

          {/* Pulsing glow at the tip */}
          {rawPercent > 5 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 blur-sm animate-pulse-slow" />
          )}
        </motion.div>
      </div>

      {/* XP numbers */}
      {showLabel && size !== 'sm' && (
        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
          <span>{xpInLevel.toLocaleString()} XP</span>
          <span>{safeXpToNext.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  )
}
