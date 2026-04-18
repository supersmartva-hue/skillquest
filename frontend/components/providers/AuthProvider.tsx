'use client'

/**
 * AuthProvider — Validates persisted token on app load.
 * Clears stale auth state if the token is expired or user no longer exists.
 * Always marks isAuthChecked=true so pages can decide whether to redirect.
 */

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { authAPI } from '@/lib/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, setUser, logout, setLoading, setAuthChecked } = useUserStore()

  useEffect(() => {
    // No token stored — user is not logged in, mark check as done immediately
    if (!accessToken) {
      setAuthChecked()
      return
    }

    // Token exists — validate it against the server
    setLoading(true)
    authAPI
      .getMe()
      .then(({ data }) => setUser(data.user))
      .catch(() => logout())            // expired / invalid token — clear state
      .finally(() => {
        setLoading(false)
        setAuthChecked()               // always mark done, success or failure
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
