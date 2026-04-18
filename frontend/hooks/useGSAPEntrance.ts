/**
 * useGSAPEntrance — Reusable GSAP entrance animation hook
 * Applies staggered "from below" reveal to a container's children.
 *
 * Usage:
 *   const ref = useGSAPEntrance()
 *   <div ref={ref}>children auto-animate on mount</div>
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface EntranceOptions {
  selector?: string          // child selector to animate (default: '*')
  stagger?: number           // seconds between each child animation
  y?: number                 // initial y offset in px
  duration?: number          // animation duration
  delay?: number             // initial delay before sequence starts
  ease?: string              // GSAP ease string
  scrollTrigger?: boolean    // whether to tie animation to scroll
}

export function useGSAPEntrance<T extends HTMLElement>(options: EntranceOptions = {}) {
  const {
    selector = '[data-gsap]',
    stagger = 0.08,
    y = 30,
    duration = 0.6,
    delay = 0,
    ease = 'power3.out',
    scrollTrigger: useScrollTrigger = false,
  } = options

  const ref = useRef<T>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = ref.current?.querySelectorAll(selector)
      if (!elements?.length) return

      const animConfig: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        delay,
        ease,
      }

      if (useScrollTrigger && ref.current) {
        animConfig.scrollTrigger = {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        }
      }

      gsap.fromTo(
        elements,
        { opacity: 0, y },
        animConfig
      )
    }, ref)

    // Cleanup — kills all GSAP tweens created in this context
    return () => ctx.revert()
  }, [selector, stagger, y, duration, delay, ease, useScrollTrigger])

  return ref
}

/**
 * useXPAnimation — Fires a GSAP tween on XP number change
 * Creates a "+XP" floating label that rises and fades out
 */
export function useXPAnimation(container: React.RefObject<HTMLElement>) {
  const showXPGain = (amount: number, x = 0, y = 0) => {
    if (!container.current) return

    const label = document.createElement('div')
    label.textContent = `+${amount} XP`
    label.className =
      'absolute pointer-events-none font-black text-brand-400 text-lg z-50 select-none'
    label.style.cssText = `left: ${x}px; top: ${y}px; position: absolute;`
    container.current.appendChild(label)

    gsap.fromTo(
      label,
      { opacity: 1, y: 0, scale: 1 },
      {
        opacity: 0,
        y: -60,
        scale: 1.3,
        duration: 1.2,
        ease: 'power2.out',
        onComplete: () => label.remove(),
      }
    )
  }

  return { showXPGain }
}

/**
 * useLevelUpAnimation — Triggers a full-screen "ripple" effect on level-up
 */
export function useLevelUpAnimation() {
  const trigger = (color = '#6474f5') => {
    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: fixed; inset: 0; z-index: 9990; pointer-events: none;
      border-radius: 50%; transform: scale(0);
      background: radial-gradient(circle, ${color}40 0%, transparent 70%);
    `
    document.body.appendChild(ripple)

    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 0.8 },
      {
        scale: 4,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      }
    )
  }

  return { trigger }
}
