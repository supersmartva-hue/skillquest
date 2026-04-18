'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Moon, Zap, LogOut, Settings, X,
  LayoutDashboard, Network, BookOpen, Trophy, Award, Gem, UserCircle, Sparkles,
} from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useThemeStore } from '@/store/themeStore'
import { useSidebarStore } from '@/store/sidebarStore'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/skills',       icon: Network,         label: 'Skill Tree'   },
  { href: '/lessons',      icon: BookOpen,        label: 'Lessons'      },
  { href: '/handouts',     icon: Sparkles,        label: 'AI Handouts'  },
  { href: '/leaderboard',  icon: Trophy,          label: 'Leaderboard'  },
  { href: '/achievements', icon: Award,           label: 'Achievements' },
  { href: '/pricing',      icon: Gem,             label: 'Premium'      },
  { href: '/account',      icon: UserCircle,      label: 'Account'      },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout }   = useUserStore()
  const { theme, toggle }  = useThemeStore()
  const { isOpen, close }  = useSidebarStore()

  const handleLogout = () => {
    close()
    logout()
    router.push('/')
  }

  const handleNavClick = () => {
    // Close drawer when a nav item is tapped on mobile
    close()
  }

  const sidebarContent = (
    <aside
      className="flex flex-col h-full w-64 border-r transition-colors duration-300"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-md flex-shrink-0">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-xl font-black font-display text-gradient-brand">SkillQuest</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <motion.div
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group"
                style={{
                  background: isActive ? 'rgba(100,116,245,0.12)' : 'transparent',
                  color:      isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: '#6474f5' }}
                    layoutId="activeNav"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {item.href === '/pricing' && !user?.isPremium && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                    PRO
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom — theme toggle + user */}
      <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <motion.div key={theme} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
            {theme === 'dark'
              ? <Sun  className="w-5 h-5 text-yellow-400" />
              : <Moon className="w-5 h-5 text-brand-400" />}
          </motion.div>
          <span className="text-sm font-medium">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User card */}
        {user && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Link href="/account" onClick={handleNavClick} className="flex items-center gap-3 p-3 group">
              <div className="relative w-9 h-9 flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-lg">
                  {user.avatar || '🧙'}
                </div>
                {user.isPremium && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[9px]">💎</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Level {user.level} • {user.xp.toLocaleString()} XP</p>
              </div>
              <Settings className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-subtle)' }} />
            </Link>
            <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
              <Link href="/account" onClick={handleNavClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#6474f5' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
              >
                <Settings className="w-3.5 h-3.5" /> Account
              </Link>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-64 z-30 flex-col">
        {sidebarContent}
      </div>

      {/* ── Mobile: slide-in drawer + backdrop ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            {/* Drawer */}
            <motion.div
              className="lg:hidden fixed left-0 top-0 h-full z-50 flex flex-col w-72 shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
