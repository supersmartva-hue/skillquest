'use client'

/**
 * StatsCard — Animated metric card for dashboard
 * Number counts up on mount using Framer Motion's useMotionValue
 */

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { clsx } from 'clsx'

interface StatsCardProps {
  title: string
  value: number
  unit?: string
  icon: React.ReactNode
  color: string          // Tailwind gradient classes e.g. "from-brand-500 to-cyan-500"
  iconColor?: string     // hex / css color for the icon
  change?: number        // percentage change (positive = green, negative = red)
  delay?: number
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 50, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    const timer = setTimeout(() => motionVal.set(value), delay * 1000 + 200)
    return () => clearTimeout(timer)
  }, [value, delay, motionVal])

  return <motion.span>{display}</motion.span>
}

export function StatsCard({
  title,
  value,
  unit,
  icon,
  color,
  iconColor,
  change,
  delay = 0,
}: StatsCardProps) {
  const isPositiveChange = (change ?? 0) >= 0

  return (
    <motion.div
      className="glass-card p-5 relative overflow-hidden group transition-all duration-300"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
    >
      {/* Background gradient blob */}
      <div className={clsx(
        'absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity',
        `bg-gradient-to-br ${color}`
      )} />

      <div className="relative">
        {/* Icon + change row */}
        <div className="flex items-center justify-between mb-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            `bg-gradient-to-br ${color} bg-opacity-20`
          )}
            style={{ color: iconColor ?? 'white' }}
          >
            {icon}
          </div>

          {change !== undefined && (
            <div className={clsx(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
              isPositiveChange ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}>
              {isPositiveChange
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-3xl font-black font-display tabular-nums" style={{ color: 'var(--text-primary)' }}>
          <AnimatedNumber value={value} delay={delay} />
          {unit && <span className="text-lg font-semibold ml-1" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
        </div>

        {/* Label */}
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
      </div>
    </motion.div>
  )
}
