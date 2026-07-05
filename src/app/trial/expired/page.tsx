import Link from 'next/link'
import { Check, CalendarClock } from 'lucide-react'
import {
  COACH_TIERS,
  COACH_TIER_FEATURE_COPY,
  formatPrice,
  type CoachTier,
} from '@/lib/pricing'

const TEAL = '#0FA89C'
const TEAL_INK = '#2BD4C5'

export const metadata = {
  title: 'Trial Expired',
  description: 'Your Propel trial has ended. Choose a plan to continue.',
}

const coachPlanIds = ['coach_starter', 'coach_pro', 'coach_scale'] as const satisfies readonly CoachTier[]

const PRICING_PLANS = coachPlanIds.map((id) => {
  const tier = COACH_TIERS[id]
  return {
    name: tier.name,
    slug: id.replace('coach_', ''),
    price: formatPrice(tier.monthlyCents),
    period: '/month',
    highlight: tier.popular,
    features: COACH_TIER_FEATURE_COPY[id],
  }
})

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen bg-[#0A0E11] text-slate-200 antialiased" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0D1216]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Propel" className="w-8 h-8 rounded-lg" />
            <span className="font-black text-white text-lg tracking-tight">Propel</span>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 bg-white/5 mb-6">
            <CalendarClock size={28} style={{ color: TEAL_INK }} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-[-0.03em] text-white mb-4">Your free trial has ended</h1>
          <p className="text-xl leading-8 text-slate-400 tabular-nums mb-12">You had 14 days of full access. Ready to continue?</p>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PRICING_PLANS.map(plan => (
              <div
                key={plan.slug}
                className={`relative rounded-3xl border transition-all ${
                  plan.highlight
                    ? 'border-teal-500/40 bg-[#10181A] shadow-[0_30px_90px_rgba(15,168,156,0.12)]'
                    : 'border-white/10 bg-[#10151A] hover:border-white/20'
                }`}
              >
                <div className="p-8">
                  {plan.highlight && (
                    <div
                      className="inline-flex items-center text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4"
                      style={{ backgroundColor: TEAL }}
                    >
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-black tracking-tight text-white mb-6">
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1 mb-8">
                    <span className="text-5xl font-black tabular-nums tracking-tight text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm mb-2 text-slate-500">
                      {plan.period}
                    </span>
                  </div>

                  <Link
                    href="/register"
                    className={`w-full font-black py-3 px-6 rounded-full text-sm transition mb-8 block text-center ${
                      plan.highlight
                        ? 'text-white hover:brightness-110'
                        : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                    }`}
                    style={plan.highlight ? { backgroundColor: TEAL } : undefined}
                  >
                    Choose {plan.name}
                  </Link>

                  <ul className="space-y-4">
                    {plan.features.map(feature => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                      >
                        <Check
                          size={18}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: TEAL_INK }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support Link ────────────────────── */}
      <section className="py-16 px-6 border-y border-white/5 bg-[#0D1216]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 mb-4">Questions about which plan is right for you?</p>
          <Link
            href="/help/contact"
            className="font-bold underline decoration-teal-500/50 underline-offset-4 transition hover:brightness-125"
            style={{ color: TEAL_INK }}
          >
            Talk to us
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#0A0E11] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Propel" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-slate-300">Propel</span>
          </div>
          <p className="tabular-nums">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6">
            <a href="/privacy-policy" className="transition-colors hover:text-white">Privacy</a>
            <a href="/terms" className="transition-colors hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
