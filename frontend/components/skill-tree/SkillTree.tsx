'use client'

/**
 * SkillTree — Interactive SVG-based skill tree visualization
 * Renders skills as nodes connected by edges, with zoom + pan.
 * GSAP handles the entrance animations; Framer Motion handles hover states.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { clsx } from 'clsx'
import { useThemeStore } from '@/store/themeStore'

interface Skill {
  id: string
  name: string
  icon: string
  color: string
  category: string
  positionX: number
  positionY: number
  prerequisites: string[]
  completedLessons: number
  totalLessons: number
  completionPercent: number
  mastered: boolean
  unlocked: boolean
}

interface SkillTreeProps {
  skills: Skill[]
  onSkillClick: (skill: Skill) => void
  selectedSkillId?: string | null
}

const NODE_RADIUS = 40
const CANVAS_W = 1200
const CANVAS_H = 800

export function SkillTree({ skills, onSkillClick, selectedSkillId }: SkillTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ skill: Skill; x: number; y: number } | null>(null)
  const { theme } = useThemeStore()
  const isLight = theme === 'light'

  // ── Theme-aware colour tokens ──────────────────────────────────────────────
  const colors = isLight ? {
    canvasBg:       'url(#lightGrid)',
    gridStroke:     'rgba(100,116,245,0.10)',
    edgeLocked:     'rgba(100,116,245,0.20)',
    edgeUnlocked:   'rgba(100,116,245,0.55)',
    nodeFillLocked: 'rgba(100,116,245,0.06)',
    nodeStrokeLocked:'rgba(100,116,245,0.25)',
    labelUnlocked:  '#12152e',
    labelLocked:    'rgba(18,21,46,0.35)',
    tooltipName:    '#12152e',
  } : {
    canvasBg:       'url(#darkGrid)',
    gridStroke:     'rgba(255,255,255,0.04)',
    edgeLocked:     'rgba(255,255,255,0.12)',
    edgeUnlocked:   'rgba(100,116,245,0.50)',
    nodeFillLocked: 'rgba(255,255,255,0.05)',
    nodeStrokeLocked:'rgba(255,255,255,0.18)',
    labelUnlocked:  'rgba(255,255,255,0.92)',
    labelLocked:    'rgba(255,255,255,0.28)',
    tooltipName:    '#ffffff',
  }

  // Zoom + pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1 })
  const scaleRef = useRef(1)
  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  // Keep scaleRef in sync with state so native event closures can read it
  useEffect(() => { scaleRef.current = viewBox.scale }, [viewBox.scale])

  // ── Build edge data (prerequisite connections) ──────────────────────────
  const edges = skills.flatMap((skill) =>
    skill.prerequisites.map((prereqId) => {
      const from = skills.find((s) => s.id === prereqId)
      return from ? { from, to: skill } : null
    }).filter(Boolean)
  ) as Array<{ from: Skill; to: Skill }>

  // ── GSAP entrance animation ────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return

    const nodes = svgRef.current.querySelectorAll('.skill-node-group')
    const lines = svgRef.current.querySelectorAll('.skill-edge')

    // Animate edges first (draw from center outward)
    gsap.fromTo(
      lines,
      { opacity: 0, strokeDashoffset: 200 },
      {
        opacity: 1,            // full opacity — colour is already set per edge
        strokeDashoffset: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: 'power2.out',
      }
    )

    // Then nodes pop in with spring effect
    gsap.fromTo(
      nodes,
      { scale: 0, opacity: 0, transformOrigin: 'center center' },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: 'back.out(1.7)',
        delay: 0.3,
      }
    )
  }, [skills])

  // ── Pan handlers (mouse) ────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.skill-node-group')) return
    isPanning.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = (e.clientX - lastMouse.current.x) / viewBox.scale
    const dy = (e.clientY - lastMouse.current.y) / viewBox.scale
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }))
  }

  const handleMouseUp = () => { isPanning.current = false }

  // ── Zoom + touch handlers via native listeners (non-passive) ───────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewBox((v) => ({
      ...v,
      scale: Math.max(0.4, Math.min(2.5, v.scale * delta)),
    }))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      if ((e.target as SVGElement).closest?.('.skill-node-group')) return
      isPanning.current = true
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isPanning.current || e.touches.length !== 1) return
      e.preventDefault()
      const dx = (e.touches[0].clientX - lastMouse.current.x) / scaleRef.current
      const dy = (e.touches[0].clientY - lastMouse.current.y) / scaleRef.current
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }))
    }

    const onTouchEnd = () => { isPanning.current = false }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [handleWheel])

  // ── Edge color based on unlock state ────────────────────────────────────
  const edgeColor = (to: Skill) =>
    to.unlocked ? colors.edgeUnlocked : colors.edgeLocked

  const vbX = viewBox.x
  const vbY = viewBox.y
  const vbW = CANVAS_W / viewBox.scale
  const vbH = CANVAS_H / viewBox.scale

  return (
    <div className="relative w-full" style={{ height: 'clamp(380px, 60vh, 600px)' }}>
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {[
          { label: '+', action: () => setViewBox((v) => ({ ...v, scale: Math.min(2.5, v.scale * 1.2) })) },
          { label: '−', action: () => setViewBox((v) => ({ ...v, scale: Math.max(0.4, v.scale * 0.8) })) },
          { label: '⟳', action: () => setViewBox({ x: 0, y: 0, scale: 1 }) },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-9 h-9 glass-card flex items-center justify-center transition-all font-bold text-lg rounded-xl"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="w-full h-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f0f7ff 100%)'
            : '#0b0d1a',
          boxShadow: isLight ? 'inset 0 0 80px rgba(100,116,245,0.06)' : undefined,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="w-full h-full"
          style={{ transition: 'none' }}
        >
          {/* Background grid */}
          <defs>
            {/* Dark grid */}
            <pattern id="darkGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            </pattern>
            {/* Light grid — coloured dots */}
            <pattern id="lightGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(100,116,245,0.10)" strokeWidth="0.8"/>
              <circle cx="0" cy="0" r="1.5" fill="rgba(100,116,245,0.18)"/>
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Light-mode glow — softer */}
            <filter id="glowLight">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Radial gradient fill for light mode locked nodes */}
            <radialGradient id="lockedNodeLight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(100,116,245,0.12)"/>
              <stop offset="100%" stopColor="rgba(100,116,245,0.04)"/>
            </radialGradient>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill={colors.canvasBg} />

          {/* ── Edges ───────────────────────────────────────────────── */}
          {edges.map(({ from, to }, i) => (
            <line
              key={i}
              className="skill-edge"
              x1={from.positionX}
              y1={from.positionY}
              x2={to.positionX}
              y2={to.positionY}
              stroke={edgeColor(to)}
              strokeWidth={to.unlocked ? 2 : 1.5}
              strokeDasharray={to.unlocked ? 'none' : '6 4'}
              style={{ strokeDashoffset: 0 }}
            />
          ))}

          {/* ── Nodes ───────────────────────────────────────────────── */}
          {skills.map((skill) => {
            const isSelected = selectedSkillId === skill.id
            const circumference = 2 * Math.PI * (NODE_RADIUS - 4)
            const progress = (skill.completionPercent / 100) * circumference

            return (
              <g
                key={skill.id}
                className="skill-node-group"
                transform={`translate(${skill.positionX}, ${skill.positionY})`}
                onClick={() => skill.unlocked && onSkillClick(skill)}
                onMouseEnter={(e) => {
                  const rect = containerRef.current!.getBoundingClientRect()
                  setTooltip({
                    skill,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top - 10,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: skill.unlocked ? 'pointer' : 'not-allowed' }}
              >
                {/* Light mode: ambient glow halo */}
                {isLight && skill.unlocked && (
                  <circle
                    r={NODE_RADIUS + 10}
                    fill={`${skill.color}12`}
                    stroke="none"
                  />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke={skill.color}
                    strokeWidth={isLight ? 2.5 : 2}
                    opacity={isLight ? 0.8 : 0.6}
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                )}

                {/* Progress ring */}
                {skill.unlocked && (
                  <circle
                    r={NODE_RADIUS - 4}
                    fill="none"
                    stroke={skill.color}
                    strokeWidth={3}
                    strokeDasharray={`${progress} ${circumference}`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                    opacity={0.8}
                  />
                )}

                {/* Main circle */}
                <circle
                  r={NODE_RADIUS}
                  fill={skill.unlocked
                    ? `${skill.color}${isLight ? '28' : '22'}`
                    : isLight ? 'url(#lockedNodeLight)' : colors.nodeFillLocked}
                  stroke={skill.unlocked ? skill.color : colors.nodeStrokeLocked}
                  strokeWidth={skill.mastered ? 3 : isLight ? 1.8 : 1.5}
                  filter={skill.mastered ? (isLight ? 'url(#glowLight)' : 'url(#glow)') : undefined}
                />

                {/* Mastered star crown */}
                {skill.mastered && (
                  <text x="0" y={-NODE_RADIUS - 6} textAnchor="middle" fontSize="12">
                    ⭐
                  </text>
                )}

                {/* Lock icon for locked skills */}
                {!skill.unlocked && (
                  <text x="0" y="6" textAnchor="middle" fontSize="20">🔒</text>
                )}

                {/* Skill icon */}
                {skill.unlocked && (
                  <text x="0" y="8" textAnchor="middle" fontSize="22">
                    {skill.icon}
                  </text>
                )}

                {/* Skill name */}
                <text
                  x="0"
                  y={NODE_RADIUS + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill={skill.unlocked ? colors.labelUnlocked : colors.labelLocked}
                  fontWeight={isLight ? '700' : '600'}
                >
                  {skill.name}
                </text>

                {/* Light mode: coloured progress pill below name */}
                {isLight && skill.unlocked && skill.completionPercent > 0 && (
                  <>
                    <rect
                      x={-22} y={NODE_RADIUS + 20}
                      width={44} height={13}
                      rx={6} ry={6}
                      fill={`${skill.color}22`}
                      stroke={`${skill.color}55`}
                      strokeWidth={0.8}
                    />
                    <text
                      x="0" y={NODE_RADIUS + 30}
                      textAnchor="middle"
                      fontSize="8"
                      fill={skill.color}
                      fontWeight="700"
                    >
                      {skill.completionPercent}%
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="absolute z-20 pointer-events-none glass-card p-3 max-w-[200px]"
            style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{tooltip.skill.icon}</span>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{tooltip.skill.name}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {tooltip.skill.completedLessons}/{tooltip.skill.totalLessons} lessons
            </div>
            {!tooltip.skill.unlocked && (
              <div className="text-xs text-red-400 mt-1">Complete prerequisites first</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
