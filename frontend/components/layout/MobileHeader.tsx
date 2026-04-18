'use client'

import Link from 'next/link'
import { Menu, Zap } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'
import { useUserStore } from '@/store/userStore'

export function MobileHeader() {
  const { toggle } = useSidebarStore()
  const { user }   = useUserStore()

  return (
    <header
      className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 border-b"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
    >
      {/* Hamburger */}
      <button
        onClick={toggle}
        className="p-2 rounded-xl transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <span className="text-lg font-black font-display text-gradient-brand">SkillQuest</span>
      </Link>

      {/* Avatar shortcut */}
      <Link href="/account" className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-base">
        {user?.avatar || '🧙'}
      </Link>
    </header>
  )
}
