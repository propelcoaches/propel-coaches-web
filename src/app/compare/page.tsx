import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Compare Propel to Other Platforms',
  description: 'See how Propel stacks up against other coaching software platforms.',
}

export default function ComparePage() {
  const comparisons = [
    {
      name: 'Trainerize',
      href: '/compare/trainerize',
      description: 'Popular platform for online trainers with workout tracking and client management.',
    },
    {
      name: 'TrueCoach',
      href: '/compare/truecoach',
      description: 'Focused on remote coaching with programme delivery and progress tracking.',
    },
  ]

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
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">See how Propel compares</h1>
          <p className="text-xl text-gray-500">We've built Propel from the ground up for coaches. Here's how we stack up against other platforms.</p>
        </div>
      </section>

      {/* ── Comparison Cards ────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {comparisons.map(comparison => (
            <Link key={comparison.name} href={comparison.href}>
              <div className="group bg-white border border-gray-100 rounded-2xl p-8 hover:border-[#0F7B8C] hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Propel vs {comparison.name}</h2>
                  <ArrowRight size={24} className="text-gray-300 group-hover:text-[#0F7B8C] transition-colors" />
                </div>
                <p className="text-gray-500 mb-6">{comparison.description}</p>
                <div className="text-sm font-semibold text-[#0F7B8C]">View full comparison →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to upgrade your coaching?</h2>
          <p className="text-lg text-gray-500 mb-10">Start your 14-day free trial of Propel today.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
            Start for free →
          </Link>
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
