/**
 * API Client — Axios instance with auth interceptors and token refresh
 */

import axios from 'axios'
import { useUserStore } from '@/store/userStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─── Request interceptor — attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle token refresh ────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, logout } = useUserStore.getState()

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })
        const { accessToken: newAccess, refreshToken: newRefresh } = data
        setTokens(newAccess, newRefresh)
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Typed API helpers ───────────────────────────────────────────────────────

export const authAPI = {
  signup: (data: { email: string; username: string; displayName: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

export const skillsAPI = {
  getAll: (category?: string) =>
    api.get('/skills', { params: { category } }),
  getOne: (id: string) => api.get(`/skills/${id}`),
  getCategories: () => api.get('/skills/meta/categories'),
}

export const progressAPI = {
  completeLesson: (lessonId: string, score?: number) =>
    api.post('/progress/complete-lesson', { lessonId, score }),
  getUserProgress: () => api.get('/progress/user'),
  getXPHistory: (days = 30) =>
    api.get('/progress/xp-history', { params: { days } }),
}

export const leaderboardAPI = {
  getGlobal: (page = 1) =>
    api.get('/leaderboard/global', { params: { page } }),
  getWeekly: () => api.get('/leaderboard/weekly'),
  getBySkill: (skillId: string) =>
    api.get(`/leaderboard/skill/${skillId}`),
}

export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
}

export const challengesAPI = {
  getToday: () => api.get('/challenges/today'),
  complete: (id: string) => api.post(`/challenges/${id}/complete`),
}

export const stripeAPI = {
  createCheckout: () => api.post('/stripe/create-checkout'),
}

export const generateAPI = {
  generate: (topic: string) =>
    api.post('/generate', { topic }),
  getHistory: (page = 1) =>
    api.get('/generate/history', { params: { page } }),
  getById: (id: string) =>
    api.get(`/generate/${id}`),
}
