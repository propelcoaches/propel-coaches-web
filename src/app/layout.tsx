import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ChatbotWrapper from '@/components/ChatbotWrapper'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Propel — Coaching Platform for PTs & Nutritionists', template: '%s | Propel' },
  description: 'The all-in-one platform for personal trainers, nutritionists and fitness coaches. Build programs, send check-ins, track progress and grow your coaching business.',
  keywords: ['personal trainer app', 'coaching platform', 'online coaching software', 'fitness coach app', 'PT software', 'check-in app', 'nutrition coaching'],
  authors: [{ name: 'Propel' }],
  openGraph: {
    title: 'Propel — Coaching Platform',
    description: 'Programs, check-ins, nutrition, AI coaching and payments — all in one place.',
    url: 'https://propelcoach.app',
    siteName: 'Propel',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Propel — Coaching Platform', description: 'The all-in-one platform for fitness coaches.' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          {children}
          <ChatbotWrapper />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
