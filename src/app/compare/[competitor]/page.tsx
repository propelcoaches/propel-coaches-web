import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, AlertCircle, ArrowLeft } from 'lucide-react'

const COMPETITOR_DATA = {
  trainerize: {
    name: 'Trainerize',
    fullName: 'Trainerize',
    comparisons: [
      { feature: 'AI Coach Assistant', propel: true, competitor: false },
      { feature: 'Progress Photos', propel: true, competitor: true },
      { feature: 'Loom Video Feedback', propel: true, competitor: false },
      { feature: 'Custom Macro Targets', propel: true, competitor: 'limited' },
      { feature: 'Program Templates', propel: true, competitor: 'limited' },
      { feature: 'Client Web Portal', propel: true, competitor: true },
      { feature: 'Habit Tracking', propel: true, competitor: false },
      { feature: 'Body Metrics Dashboard', propel: true, competitor: 'basic' },
      { feature: 'Push Notifications', propel: true, competitor: true },
      { feature: 'Free Trial', propel: '14 days', competitor: '30 days' },
      { feature: 'Starting Price', propel: 'Free tier + $29/mo', competitor: '$99/mo' },
    ],
    quotes: [
      {
        name: 'Emma Wilson',
        role: 'Online PT, Melbourne',
        quote: 'Switched from Trainerize to Propel and immediately loved the AI coach feature. It handles 80% of my after-hours messages while I sleep. I save 5+ hours per week.',
      },
      {
        name: 'David Chen',
        role: 'Strength Coach',
        quote: 'Trainerize was solid but expensive for what we needed. Propel does everything and costs less than half. Plus, the UI is actually enjoyable to use.',
      },
      {
        name: 'Lisa Patel',
        role: 'Nutrition Coach, London',
        quote: 'The customizable check-ins in Propel are unmatched. I can tailor every question to my client\'s goals. Trainerize felt rigid by comparison.',
      },
    ],
  },
  truecoach: {
    name: 'TrueCoach',
    fullName: 'TrueCoach',
    comparisons: [
      { feature: 'AI Coach Assistant', propel: true, competitor: false },
      { feature: 'Progress Photos', propel: true, competitor: true },
      { feature: 'Loom Video Feedback', propel: true, competitor: false },
      { feature: 'Custom Macro Targets', propel: true, competitor: 'limited' },
      { feature: 'Program Templates', propel: true, competitor: true },
      { feature: 'Client Web Portal', propel: true, competitor: true },
      { feature: 'Habit Tracking', propel: true, competitor: false },
      { feature: 'Body Metrics Dashboard', propel: true, competitor: 'basic' },
      { feature: 'Push Notifications', propel: true, competitor: true },
      { feature: 'Free Trial', propel: '14 days', competitor: '14 days' },
      { feature: 'Starting Price', propel: 'Free tier + $29/mo', competitor: '$79/mo' },
    ],
    quotes: [
      {
        name: 'Marcus Johnson',
        role: 'CrossFit Coach, Austin',
        quote: 'Used TrueCoach for 2 years. Switched to Propel for the AI coach and it\'s a game-changer. My clients feel more supported, and I\'m not burning out.',
      },
      {
        name: 'Sophie Brown',
        role: 'Online Coach, Dublin',
        quote: 'TrueCoach was fine, but Propel\'s nutrition integration is superior. No more juggling apps. Everything is in one place.',
      },
      {
        name: 'Alex Rodriguez',
        role: 'Fitness Entrepreneur',
        quote: 'Propel\'s pricing is aggressive, but the value is clear. AI coach, unlimited clients on Pro plan, and better UX. Worth every penny.',
      },
    ],
  },
}

type CompetitorKey = keyof typeof COMPETITOR_DATA

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params
  const data = COMPETITOR_DATA[competitor.toLowerCase() as CompetitorKey]

  if (!data) {
    return {
      title: 'Comparison Not Found | Propel',
      description: 'This comparison page does not exist.',
    }
  }

  return {
    title: `Propel vs ${data.fullName}: Full Comparison 2026`,
    description: `See how Propel compares to ${data.fullName} for serious fitness coaches. AI coaching, progress tracking, and more.`,
  }
}

export default async function ComparisonPage({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params
  const data = COMPETITOR_DATA[competitor.toLowerCase() as CompetitorKey]

  if (!data) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <Link href="/compare" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Propel</span>
            </Link>
          </div>
        </header>
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Link href="/compare" className="inline-flex items-center gap-2 text-[#0F7B8C] hover:text-[#0d6b7a] font-semibold mb-8 transition-colors">
              <ArrowLeft size={16} /> Back to comparisons
            </Link>
            <h1 className="text-4xl font-black text-gray-900 mb-4">Comparison not found</h1>
            <p className="text-lg text-gray-500 mb-10">This competitor comparison doesn't exist yet.</p>
            <Link href="/compare" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-6 py-3 rounded-xl transition-colors">
              See all comparisons
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const FeatureCell = ({ value }: { value: boolean | string }) => {
    if (value === true) {
      return <div className="flex items-center justify-center"><Check size={20} className="text-emerald-600" /></div>
    }
    if (value === false) {
      return <div className="flex items-center justify-center"><X size={20} className="text-red-500" /></div>
    }
    if (value === 'limited' || value === 'basic') {
      return <div className="flex items-center justify-center gap-2"><AlertCircle size={20} className="text-amber-500" /></div>
    }
    return <div className="text-sm font-semibold text-gray-900">{value}</div>
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Propel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/compare" className="inline-flex items-center gap-2 text-[#0F7B8C] hover:text-[#0d6b7a] font-semibold mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to all comparisons
          </Link>
          <h1 className="text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
            Propel vs {data.name}
          </h1>
          <p className="text-xl text-gray-500">See how Propel compares to {data.name} for serious fitness coaches</p>
        </div>
      </section>

      {/* ── Comparison Table ─────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 font-bold text-gray-900">Feature</th>
                    <th className="text-center px-6 py-4 font-bold text-gray-900">Propel</th>
                    <th className="text-center px-6 py-4 font-bold text-gray-900">{data.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.comparisons.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="text-left px-6 py-4 font-semibold text-gray-900">{row.feature}</td>
                      <td className="text-center px-6 py-4">
                        <FeatureCell value={row.propel} />
                      </td>
                      <td className="text-center px-6 py-4">
                        <FeatureCell value={row.competitor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Legend ──────────────────────── */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-600" />
              <span className="text-gray-600">Included</span>
            </div>
            <div className="flex items-center gap-2">
              <X size={16} className="text-red-500" />
              <span className="text-gray-600">Not available</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-gray-600">Limited or basic</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Why coaches switch to Propel</h2>
            <p className="text-lg text-gray-500">Real feedback from coaches who migrated from {data.name}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {data.quotes.map((quote, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{quote.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{quote.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{quote.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to make the switch?</h2>
          <p className="text-lg text-gray-500 mb-10">Join coaches who've upgraded to a platform that actually understands their needs.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
            Start free trial →
          </Link>
          <p className="text-sm text-gray-400 mt-4">14-day free trial · Cancel anytime · No lock-in contracts</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚡</span>
            </div>
            <span className="font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
