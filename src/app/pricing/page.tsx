import Link from 'next/link'
import { Suspense } from 'react'
import { Check, Zap } from 'lucide-react'
import PricingClient, { PricingBanner } from './pricing-client'
import {
  AI_TIERS,
  AI_TIER_FEATURE_COPY,
  COACH_TIERS,
  COACH_TIER_FEATURE_COPY,
  formatPrice,
  type AITier,
  type CoachTier,
} from '@/lib/pricing'

const TEAL = '#0FA89C'
const TEAL_INK = '#2BD4C5'

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Propel coaching platform.',
}

// Derived from canonical COACH_TIERS (web-dashboard/src/lib/pricing.ts).
// Free tier is handled via signup, not shown as a column here.
const PAID_TIERS: { tier: CoachTier; slug: string; description: string; highlight: boolean }[] = [
  { tier: 'coach_starter', slug: 'starter', description: 'For new coaches with a small client base', highlight: false },
  { tier: 'coach_pro',     slug: 'pro',     description: 'For established coaches scaling their business', highlight: true },
  { tier: 'coach_scale',   slug: 'scale',   description: 'For multi-practitioner clinics and teams', highlight: false },
]

const COACH_PRICING_PLANS = PAID_TIERS.map(({ tier, slug, description, highlight }) => ({
  name: COACH_TIERS[tier].name,
  slug,
  checkoutPlan: slug,
  monthlyPrice: formatPrice(COACH_TIERS[tier].monthlyCents),
  annualPrice: formatPrice(COACH_TIERS[tier].annualCents),
  period: '/month',
  description,
  highlight,
  trial: `${COACH_TIERS[tier].trialDays}-day free trial`,
  features: COACH_TIER_FEATURE_COPY[tier],
}))

const AI_TIER_IDS: AITier[] = ['ai_starter', 'ai_pro', 'ai_elite']

const AI_PRICING_PLANS = AI_TIER_IDS.map((tier) => ({
  name: AI_TIERS[tier].name,
  slug: tier,
  checkoutPlan: tier,
  monthlyPrice: formatPrice(AI_TIERS[tier].monthlyCents),
  annualPrice: formatPrice(AI_TIERS[tier].annualCents),
  period: '/month',
  description: AI_TIERS[tier].tagline,
  highlight: AI_TIERS[tier].popular,
  trial: `${AI_TIERS[tier].trialDays}-day free trial`,
  features: AI_TIER_FEATURE_COPY[tier],
}))

const FAQ = [
  {
    question: 'Do I need a credit card for the trial?',
    answer: 'Coach plans are billed via Stripe — a credit card is required to start your 14-day free trial. You will not be charged until the trial ends. AI Client subscriptions on iPhone are billed via Apple in-app purchase and use the payment method on your Apple ID — no manual card entry needed. Cancel anytime before the trial is up and you will not be billed.',
  },
  {
    question: 'What happens after the trial ends?',
    answer: 'Your account and all client data remain safe. You can extend your trial by 7 additional days, upgrade to a paid plan, or let your account expire. Either way, your clients are never locked in to your account.',
  },
  {
    question: 'Can I change plans later?',
    answer: 'Absolutely! Switch plans at any time. If you upgrade mid-month, you\'ll only pay the pro-rata difference. If you downgrade, the change takes effect on your next billing cycle.',
  },
  {
    question: 'How do I cancel?',
    answer: 'Cancel anytime from your billing settings — one click, no questions asked. You\'ll retain access until the end of your billing cycle. There are no lock-in contracts or cancellation fees.',
  },
  {
    question: 'Can I have multiple coaches on one account?',
    answer: 'Yes! The Scale plan supports up to 5 coaches with separate logins and role-based permissions. Each coach can manage their own client list or collaborate on shared clients.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'Nope. No setup fees, no hidden charges, no per-client fees. You only pay for your plan. If you want dedicated onboarding support, that\'s included on the Scale plan.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0E11] text-slate-200 antialiased" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0D1216]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Propel" className="w-8 h-8 rounded-lg" />
            <span className="font-black text-white text-lg tracking-tight">Propel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">Sign in</Link>
            <Link
              href="/pricing"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              style={{ backgroundColor: TEAL }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <PricingBanner />
      </Suspense>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-sm font-bold uppercase tracking-[0.24em]" style={{ color: TEAL_INK }}>
            Pricing
          </div>
          <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-[-0.03em] text-white mb-6">Simple, transparent pricing</h1>
          <p className="text-xl leading-8 text-slate-400 tabular-nums mb-8">Start free for 14 days. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={null}>
            <PricingClient coachPlans={COACH_PRICING_PLANS} aiPlans={AI_PRICING_PLANS} />
          </Suspense>

          <p className="text-center text-sm text-slate-500 tabular-nums mt-12">
            Coach plans include a 14-day free trial. AI plans include a 7-day free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section className="py-24 px-6 border-y border-white/5 bg-[#0D1216]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-bold uppercase tracking-[0.24em]" style={{ color: TEAL_INK }}>
              Straight answers
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white mb-4">Frequently asked questions</h2>
            <p className="text-lg leading-8 text-slate-400">Everything you need to know about Propel pricing.</p>
          </div>

          <div className="space-y-5">
            {FAQ.map((item, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-[#10151A] p-8">
                <h3 className="font-bold text-white text-lg mb-3">{item.question}</h3>
                <p className="leading-7 text-slate-400 tabular-nums">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black tracking-[-0.03em] text-white mb-4">Ready to get started?</h2>
          <p className="text-lg leading-8 text-slate-400 tabular-nums mb-10">
            Pick a plan above and start your 14-day free trial.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full px-10 py-4 text-base font-black text-white shadow-[0_16px_48px_rgba(15,168,156,0.35)] transition hover:brightness-110"
            style={{ backgroundColor: TEAL }}
          >
            Start free trial
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#0D1216] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Propel" className="w-7 h-7 rounded-lg" />
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
