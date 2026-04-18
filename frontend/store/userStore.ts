/**
 * User Store — Global auth + gamification state via Zustand
 * Single source of truth for XP, level, achievements across the app
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
  level: number
  xp: number
  xpToNextLevel: number
  streak: number
  longestStreak: number
  isPremium: boolean
}

interface XPEvent {
  amount: number
  reason: string
  didLevelUp: boolean
  newLevel?: number
  newAchievements: Achievement[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  xpReward: number
}

interface UserStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  /** True once the initial token-validation call has completed (success or failure). */
  isAuthChecked: boolean

  // Pending XP events to animate (level-up modal, achievement unlocks)
  pendingXPEvent: XPEvent | null

  // Actions
  setUser: (user: User) => void
  setTokens: (access: string, refresh: string) => void
  updateXP: (xpEvent: XPEvent) => void
  clearPendingEvent: () => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setAuthChecked: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthChecked: false,
      pendingXPEvent: null,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      /**
       * Called after any XP-earning action (lesson complete, challenge, etc.)
       * Immediately updates XP in the UI and queues the animation event.
       */
      updateXP: (xpEvent) => {
        const { user } = get()
        if (!user) return

        const newXP = user.xp + xpEvent.amount
        const newLevel = xpEvent.didLevelUp ? (xpEvent.newLevel ?? user.level) : user.level

        set({
          user: { ...user, xp: newXP, level: newLevel },
          pendingXPEvent: xpEvent,
        })
      },

      clearPendingEvent: () => set({ pendingXPEvent: null }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          pendingXPEvent: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setAuthChecked: () => set({ isAuthChecked: true }),
    }),
    {
      name: 'skillquest-user',
      // Only persist auth tokens and minimal user data
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)
