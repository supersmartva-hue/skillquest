'use client'

/**
 * AchievementBadge — Displays a single achievement with unlock animation
 * Locked badges show as grayscale with a lock overlay.
 * Unlocking triggers a shine + scale animation.
 */

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import * as Tooltip from '@radix-ui/react-tooltip'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xpReward: number
  earned: boolean
  unlockedAt?: string | null
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  showUnlockAnimation?: boolean
}

const RARITY_STYLES = {
  common:    '',
  rare:      'bg-blue-900/30 border-blue-500/60',
  epic:      'bg-purple-900/30 border-purple-500/60',
  legendary: 'bg-yellow-900/30 border-yellow-500/60',
}

const RARITY_GLOW = {
  common:    '',
  rare:      'shadow-[0_0_16px_rgba(59,130,246,0.4)]',
  epic:      'shadow-[0_0_16px_rgba(168,85,247,0.4)]',
  legendary: 'shadow-[0_0_24px_rgba(255,215,0,0.5)]',
}

const RARITY_LABEL = {
  common:    { text: 'Common',    color: '' },
  rare:      { text: 'Rare',      color: 'text-blue-400' },
  epic:      { text: 'Epic',      color: 'text-purple-400' },
  legendary: { text: 'Legendary', color: 'text-yellow-400' },
}

const sizes = {
  sm: { outer: 'w-12 h-12', icon: 'text-xl', name: 'text-xs' },
  md: { outer: 'w-16 h-16', icon: 'text-2xl', name: 'text-sm' },
  lg: { outer: 'w-24 h-24', icon: 'text-4xl', name: 'text-base' },
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showUnlockAnimation = false,
}: AchievementBadgeProps) {
  const s = sizes[size]
  const rarity = achievement.rarity as keyof typeof RARITY_STYLES

  const badge = (
    <motion.div
      className="flex flex-col items-center gap-1.5 group"
      initial={showUnlockAnimation ? { scale: 0, opacity: 0 } : false}
      animate={showUnlockAnimation ? { scale: 1, opacity: 1 } : {}}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 15,
        delay: 0.1,
      }}
    >
      {/* Badge circle */}
      <motion.div
        className={clsx(
          'relative rounded-2xl border-2 flex items-center justify-center transition-all duration-300',
          s.outer,
          achievement.earned
            ? [RARITY_STYLES[rarity], RARITY_GLOW[rarity]]
            : 'border-2 grayscale opacity-40',
          achievement.earned && 'group-hover:scale-110 cursor-pointer'
        )}
        whileHover={achievement.earned ? { scale: 1.1 } : {}}
        whileTap={achievement.earned ? { scale: 0.95 } : {}}
      >
        {/* Icon */}
        <span className={s.icon}>{achievement.icon}</span>

        {/* Lock overlay for unearned */}
        {!achievement.earned && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <span className="text-lg" style={{ color: 'var(--text-subtle)' }}>🔒</span>
          </div>
        )}

        {/* Legendary sparkle animation */}
        {achievement.earned && rarity === 'legendary' && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: [0, (i % 2 === 0 ? 1 : -1) * 20 * Math.cos((i * Math.PI) / 2)],
                  y: [0, 20 * Math.sin((i * Math.PI) / 2)],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Achievement name */}
      <span
        className={clsx(s.name, 'font-medium text-center leading-tight max-w-[80px]')}
        style={{ color: achievement.earned ? 'var(--text-primary)' : 'var(--text-subtle)' }}
      >
        {achievement.name}
      </span>

      {/* Rarity label */}
      <span
        className={clsx('text-xs font-semibold', RARITY_LABEL[rarity].color)}
        style={rarity === 'common' ? { color: 'var(--text-subtle)' } : {}}
      >
        {RARITY_LABEL[rarity].text}
      </span>
    </motion.div>
  )

  // Wrap with tooltip for description
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 max-w-xs rounded-xl p-3 shadow-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            sideOffset={8}
          >
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{achievement.name}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{achievement.description}</p>
            {achievement.xpReward > 0 && (
              <p className="text-xs mt-2" style={{ color: '#6474f5' }}>+{achievement.xpReward} XP reward</p>
            )}
            {achievement.earned && achievement.unlockedAt && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}
            <Tooltip.Arrow style={{ fill: 'var(--bg-secondary)' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
