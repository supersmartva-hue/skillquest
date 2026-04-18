import type { Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { QueryProvider }  from '@/components/providers/QueryProvider'
import { AuthProvider }   from '@/components/providers/AuthProvider'
import { ThemeProvider }  from '@/components/providers/ThemeProvider'
import { MobileHeader }   from '@/components/layout/MobileHeader'

const inter  = Inter({ subsets: ['latin'], variable: '--font-inter',  display: 'swap' })
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'SkillQuest — Level Up Your Skills', template: '%s | SkillQuest' },
  description: 'A gamified learning platform with XP, levels, skill trees, and achievements.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <MobileHeader />
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'var(--bg-card)',
                    color:      'var(--text-primary)',
                    border:     '1px solid var(--border)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                  },
                  success: { iconTheme: { primary: '#2ECC71', secondary: '#fff' } },
                  error:   { iconTheme: { primary: '#E74C3C', secondary: '#fff' } },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
