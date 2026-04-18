'use client'

/**
 * useAuthGuard — Redirects unauthenticated users to /auth/login.
 *
 * Returns { user, isLoading } for convenience.
 * Pages should render nothing (or a spinner) while isLoading is true.
 * Once isAuthChecked=true and user=null the redirect fires automatically.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'

export function useAuthGuard() {
  const router        = useRouter()
  const user          = useUserStore((s) => s.user)
  const isLoading     = useUserStore((s) => s.isLoading)
  const isAuthChecked = useUserStore((s) => s.isAuthChecked)

  useEffect(() => {
    // Wait until the initial auth check has completed
    if (!isAuthChecked) return
    // If no user after the check is done — send to login
    if (!user) {
      router.replace('/auth/login')
    }
  }, [isAuthChecked, user, router])

  return { user, isLoading: !isAuthChecked || isLoading }
}
