import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import PricingClient from './pricing-client'

export const metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Propel coaching platform.',
}

const PRICING_PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    price: '0',
    period: '/month',
    description: 'Perfect for coaches just getting started',
    highlight: false,
    features: [
      'Up to 10 clients',
      'Training programs with templates',
      'Weekly check-ins with photos',
      'Nutrition tracking',
      'Habit tracking with streaks',
      'Client messaging',
      'Basic progress metrics',
      'Email support',
      'iOS & Android apps',
      'No credit card required',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: '29',
    period: '/month',
    description: 'For established coaches scaling their business',
    highlight: true,
    features: [
      'Unlimited clients',
      'All Starter features',
      'AI Coach Assistant (24/7)',
      'Loom video feedback',
      'Body fat % tracking',
      'Custom brand colours & logo',
      'Advanced progress reports',
      'Priority support',
      'Stripe payments built-in',
      'Early access to new features',
    ],
  },
  {
    name: 'Team',
    slug: 'team',
    price: '79',
    period: '/month',
    description: 'For multi-practitioner clinics and teams',
    highlight: false,
    features: [
      'Unlimited clients',
      'Up to 5 coaches/practitioners',
      'All Pro features',
      'Team dashboard & permissions',
      'Shared client library',
      'Dedicated onboarding call',
      'Custom contracts template',
      'Phone support',
      'Revenue analytics',
      'Team activity logs',
    ],
  },
]

const FAQ = [
  {
    question: 'Do I need a credit card for the trial?',
    answer: 'No! Your 14-day free trial requires zero credit card information. You get full access to all features with no strings attached. When your trial ends, you can choose to upgrade to a paid plan.',
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
    answer: 'Yes! The Team plan supports up to 5 coaches with separate logins and role-based permissions. Each coach can manage their own client list or collaborate on shared clients.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'Nope. No setup fees, no hidden charges, no per-client fees. You only pay for your plan. If you want dedicated onboarding support, that\'s included on Team plans.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Propel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/pricing" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get started free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-500 mb-8">Start free for 14 days. No credit card required.</p>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <PricingClient plans={PRICING_PLANS} />

          <p className="text-center text-sm text-gray-500 mt-12">
            All plans include 14-day free trial, iOS & Android apps, and cancel anytime with no lock-in contracts.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Frequently asked questions</h2>
            <p className="text-lg text-gray-500">Everything you need to know about Propel pricing.</p>
          </div>

          <div className="space-y-6">
            {FAQ.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-3">{item.question}</h3>
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-lg text-gray-500 mb-10">
            Pick a plan above and start your free trial. No credit card required.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20"
          >
            Start free trial
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
