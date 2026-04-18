// Server component — not-found cannot use 'use client' in Next.js App Router
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="text-center">
        <div className="text-8xl font-black mb-4" style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>This zone is unexplored</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>The page you&apos;re looking for doesn&apos;t exist yet.</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(to right, #6474f5, #00D2FF)' }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
