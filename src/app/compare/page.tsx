import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const TEAL = '#0FA89C'
const TEAL_INK = '#2BD4C5'

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
    <div className="min-h-screen bg-[#0A0E11] text-slate-200 antialiased" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0D1216]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src="/logo.svg" alt="Propel" className="w-8 h-8" />
            <span className="font-black text-white text-lg tracking-tight">Propel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">Sign in</Link>
            <Link
              href="/register"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              style={{ backgroundColor: TEAL }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-sm font-bold uppercase tracking-[0.24em]" style={{ color: TEAL_INK }}>
            Comparisons
          </div>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-[-0.03em] text-white mb-4">See how Propel compares</h1>
          <p className="text-xl leading-8 text-slate-400">We've built Propel from the ground up for coaches. Here's how we stack up against other platforms.</p>
        </div>
      </section>

      {/* ── Comparison Cards ────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-5">
          {comparisons.map(comparison => (
            <Link key={comparison.name} href={comparison.href}>
              <div className="group rounded-3xl border border-white/10 bg-[#10151A] p-8 transition-colors duration-300 hover:border-teal-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black tracking-tight text-white">Propel vs {comparison.name}</h2>
                  <ArrowRight size={24} className="text-slate-600 transition-colors group-hover:text-[#2BD4C5]" />
                </div>
                <p className="leading-7 text-slate-400 mb-6">{comparison.description}</p>
                <div className="text-sm font-bold" style={{ color: TEAL_INK }}>View full comparison →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6 border-y border-white/5 bg-[#0D1216]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black tracking-[-0.03em] text-white mb-4">Ready to upgrade your coaching?</h2>
          <p className="text-lg leading-8 text-slate-400 tabular-nums mb-10">Start your 14-day free trial of Propel today.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full px-10 py-4 text-base font-black text-white shadow-[0_16px_48px_rgba(15,168,156,0.35)] transition hover:brightness-110"
            style={{ backgroundColor: TEAL }}
          >
            Start for free →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#0D1216] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Propel" className="w-7 h-7" />
            <span className="font-bold text-slate-300">Propel</span>
          </div>
          <p className="tabular-nums">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6">
            <a href="/privacy-policy" className="transition-colors hover:text-white">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-white">Terms</a>
            <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
