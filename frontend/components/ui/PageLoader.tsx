'use client'

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  )
}
