'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useUserStore } from '@/store/userStore'
import toast from 'react-hot-toast'

interface FormState {
  email:       string
  username:    string
  displayName: string
  password:    string
}

const INITIAL: FormState = { email: '', username: '', displayName: '', password: '' }

const validate = (form: FormState) => {
  const e: Partial<FormState> = {}
  if (!form.displayName.trim() || form.displayName.length < 2)
    e.displayName = 'At least 2 characters'
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
    e.username = '3-20 characters, letters/numbers/underscores only'
  if (!form.email.includes('@') || !form.email.includes('.'))
    e.email = 'Enter a valid email address'
  if (form.password.length < 8)
    e.password = 'Password must be at least 8 characters'
  return e
}

export default function SignupPage() {
  const router = useRouter()
  const { setUser, setTokens } = useUserStore()
  const [form, setForm]                 = useState<FormState>(INITIAL)
  const [errors, setErrors]             = useState<Partial<FormState>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setIsLoading(true)
    try {
      const { data } = await authAPI.signup(form)
      setUser(data.user)
      setTokens(data.accessToken, data.refreshToken)
      toast.success(`Welcome to SkillQuest, ${data.user.displayName}! 🎉`)
      router.push('/dashboard')
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Signup failed. Please try again.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (key: keyof FormState) =>
    `sq-input${errors[key] ? ' error' : ''}`

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-16 left-20 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: '#6474f5' }} />
        <div className="absolute bottom-16 right-20 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: '#00D2FF' }} />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-black font-display text-gradient-brand">SkillQuest</span>
          </Link>
          <p className="mt-3" style={{ color: 'var(--text-muted)' }}>Create your account and start your quest</p>
        </div>

        {/* Card */}
        <div className="glass-card p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={set('displayName')}
                placeholder="Hero of the Realm"
                className={inputClass('displayName')}
              />
              {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none" style={{ color: 'var(--text-subtle)' }}>@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="coolhero123"
                  className={`${inputClass('username')} pl-8`}
                />
              </div>
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="hero@skillquest.io"
                className={inputClass('email')}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password with show/hide toggle */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 characters"
                  className={`${inputClass('password')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5" />
                    : <Eye    className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              {/* Password strength hint */}
              {form.password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map((n) => (
                    <div
                      key={n}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: form.password.length >= n * 3
                          ? n <= 1 ? '#ef4444' : n <= 2 ? '#f59e0b' : n <= 3 ? '#3b82f6' : '#10b981'
                          : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              By signing up you agree to our{' '}
              <span className="cursor-pointer hover:underline" style={{ color: '#6474f5' }}>Terms</span>
              {' '}and{' '}
              <span className="cursor-pointer hover:underline" style={{ color: '#6474f5' }}>Privacy Policy</span>.
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-glow rounded-xl py-3.5 font-bold text-base text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
            >
              {isLoading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                : 'Begin Your Quest →'
              }
            </motion.button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#6474f5' }}>
              Sign in
            </Link>
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {[['⚡','Earn XP'],['🏆','Leaderboards'],['🏅','60+ Badges']].map(([icon, label]) => (
            <motion.div
              key={label}
              className="glass-card p-3 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
