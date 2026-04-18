'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useThemeStore } from '@/store/themeStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { XPBar } from '@/components/ui/XPBar'
import { PageLoader } from '@/components/ui/PageLoader'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import toast from 'react-hot-toast'
import { Sun, Moon, LogOut, Trash2, User, Mail, Star, Zap, Flame, Shield } from 'lucide-react'

export default function AccountPage() {
  const router  = useRouter()
  const { user, isLoading: authLoading } = useAuthGuard()
  const { logout } = useUserStore()
  const { theme, toggle } = useThemeStore()

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  /* ── Logout ── */
  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully.')
    router.push('/')
  }

  /* ── Clear all site data ── */
  const handleClearData = () => {
    // Clear all localStorage keys used by the app
    const keysToRemove = Object.keys(localStorage).filter((k) =>
      k.startsWith('skillquest') || k.startsWith('sq-') || k.startsWith('rq-')
    )
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    // Also clear all localStorage entirely for full reset
    localStorage.clear()

    toast.success('All site data cleared. Redirecting…')
    setTimeout(() => {
      window.location.href = '/'
    }, 1200)
  }

  if (authLoading || !user) return <PageLoader />

  const STATS = [
    { icon: <Zap className="w-5 h-5" />,   label: 'Total XP',     value: user.xp.toLocaleString(),              color: '#6474f5', bg: 'rgba(100,116,245,0.10)' },
    { icon: <Star className="w-5 h-5" />,  label: 'Level',        value: `Level ${user.level}`,                  color: '#d97706', bg: 'rgba(217,119,6,0.10)' },
    { icon: <Flame className="w-5 h-5" />, label: 'Day Streak',   value: `${user.streak} days`,                  color: '#ea580c', bg: 'rgba(234,88,12,0.10)' },
    { icon: <Shield className="w-5 h-5" />,label: 'Best Streak',  value: `${user.longestStreak ?? 0} days`,      color: '#059669', bg: 'rgba(5,150,105,0.10)' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8 max-w-3xl">

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-black font-display text-gradient-brand">My Account</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage your profile and preferences</p>
        </motion.div>

        {/* Profile card */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-4xl shadow-lg">
                {user.avatar || '🧙'}
              </div>
              {user.isPremium && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs shadow-md">
                  💎
                </div>
              )}
            </div>

            {/* Name + badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
                  {user.displayName}
                </h2>
                {user.isPremium && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}>
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>

              {/* XP bar */}
              <div className="mt-3">
                <XPBar currentXP={user.xp} xpToNextLevel={user.xpToNextLevel ?? 100} level={user.level} size="sm" animated />
              </div>
            </div>
          </div>

          {/* Details rows */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <User className="w-4 h-4 flex-shrink-0" style={{ color: '#6474f5' }} />
              <span className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>Display Name</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.displayName}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#6474f5' }} />
              <span className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>Email</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.email}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="glass-card p-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.05 }}
            >
              <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Preferences */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Preferences</h3>

          {/* Theme toggle row */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(100,116,245,0.10)', color: '#6474f5' }}>
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" style={{ color: '#d97706' }} />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Click to switch theme</p>
              </div>
            </div>

            {/* Toggle pill */}
            <button
              onClick={toggle}
              className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
              style={{ background: theme === 'dark' ? '#4f56e8' : '#d97706' }}
              aria-label="Toggle theme"
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ left: theme === 'dark' ? '2px' : '26px' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              />
            </button>
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div
          className="glass-card p-6"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <h3 className="text-base font-bold mb-1" style={{ color: '#ef4444' }}>Danger Zone</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-subtle)' }}>These actions are irreversible. Proceed with care.</p>

          <div className="space-y-3">
            {/* Logout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Log Out</p>
                  <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Sign out of your account</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)' }}
              >
                Log Out
              </button>
            </div>

            {/* Clear all data */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Clear All Site Data</p>
                  <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Wipes all cached data, tokens & preferences</p>
                </div>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)' }}
              >
                Clear Data
              </button>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Logout confirm modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <ConfirmModal
            title="Log Out?"
            message="You will need to sign in again to access your account."
            confirmLabel="Yes, Log Out"
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Clear data confirm modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <ConfirmModal
            title="Clear All Site Data?"
            message="This will erase all stored tokens, preferences, and cached data. You will be logged out and redirected to the home page."
            confirmLabel="Yes, Clear Everything"
            onConfirm={handleClearData}
            onCancel={() => setShowClearConfirm(false)}
            danger
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Reusable confirm modal ── */
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="glass-card p-8 max-w-sm w-full text-center"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
          {danger ? <Trash2 className="w-7 h-7" /> : <LogOut className="w-7 h-7" />}
        </div>

        <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mb-7 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(to right, #ef4444, #dc2626)', color: '#fff' }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
