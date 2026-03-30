import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coaching Blog — Insights for Fitness Coaches',
  description:
    'Expert articles for personal trainers, nutritionists and health professionals. Learn how to build better programmes, improve client retention, and grow your coaching practice.',
  openGraph: {
    title: 'Propel Coaching Blog',
    description: 'Expert articles for fitness coaches — programmes, nutrition, check-ins and business growth.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Propel Coaching Blog',
    description: 'Expert articles for fitness coaches, nutritionists and PTs.',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
