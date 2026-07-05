'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Zap, Check, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { COACH_TIERS, COACH_TIER_FEATURE_COPY, formatPrice, type CoachTier } from '@/lib/pricing'

const TEAL = '#0FA89C'
const TEAL_INK = '#2BD4C5'

const PROFESSIONS = [
  { id: 'personal_trainer', label: 'Personal Trainer' },
  { id: 'nutritionist', label: 'Nutritionist' },
  { id: 'strength_coach', label: 'Strength Coach' },
  { id: 'exercise_physiologist', label: 'Exercise Physiologist' },
]

const CLIENT_RANGES = [
  { id: '1-5', label: '1-5 clients' },
  { id: '6-15', label: '6-15 clients' },
  { id: '16-30', label: '16-30 clients' },
  { id: '30+', label: '30+ clients' },
]

// Slug → canonical CoachTier. Slugs are the URL-facing names linked from /pricing.
const SLUG_TO_TIER: Record<string, CoachTier> = {
  starter: 'coach_starter',
  pro:     'coach_pro',
  scale:   'coach_scale',
}

function planDetailsForSlug(slug: string) {
  const tier = SLUG_TO_TIER[slug] ?? 'coach_pro'
  const def = COACH_TIERS[tier]
  return {
    name: def.name,
    price: formatPrice(def.monthlyCents),
    period: '/month',
    features: COACH_TIER_FEATURE_COPY[tier],
  }
}

function TrialSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan') || 'pro'

  const [currentStep, setCurrentStep] = useState(1)
  const [profession, setProfession] = useState('')
  const [clientCount, setClientCount] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)

  const plan = planDetailsForSlug(planParam)

  const handleStep1Continue = () => {
    if (profession && clientCount) {
      setCurrentStep(2)
    }
  }

  const handleStep3Submit = async () => {
    if (!name || !email || !password || !termsAccepted) return

    setIsLoading(true)
    setSignupError('')

    const supabase = createClient()

    // Create Supabase auth account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (signUpError) {
      setSignupError(signUpError.message)
      setIsLoading(false)
      return
    }

    // Insert profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        full_name: name,
        email,
        role: 'coach',
        profession,
        subscription_tier: planParam,
        subscription_status: 'trialing',
        onboarding_completed: false,
      })
    }

    // If email confirmation is required, session will be null — show confirmation screen
    if (!data.session) {
      setEmailConfirmationSent(true)
      setIsLoading(false)
      return
    }

    router.push('/onboarding')
  }

  if (emailConfirmationSent) {
    return (
      <div className="min-h-screen bg-[#0A0E11] text-slate-200 antialiased flex items-center justify-center px-6" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-6">
            <Check size={32} style={{ color: TEAL_INK }} />
          </div>
          <h2 className="text-3xl font-black tracking-[-0.03em] text-white mb-3">Check your email</h2>
          <p className="text-slate-400 leading-7 mb-2">
            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
          </p>
          <p className="text-slate-400 leading-7 mb-8">
            Click the link in the email to activate your account and get started.
          </p>
          <p className="text-sm text-slate-500">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => setEmailConfirmationSent(false)}
              className="font-bold transition hover:brightness-125"
              style={{ color: TEAL_INK }}
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    )
  }

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
            <Link href="/pricing" className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">Back to pricing</Link>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────── */}
      <div className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* ── Progress ────────────────────────── */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tabular-nums transition-all ${
                      currentStep === step
                        ? 'text-white'
                        : currentStep > step
                        ? 'bg-teal-500/15 text-[#2BD4C5]'
                        : 'bg-white/5 text-slate-500'
                    }`}
                    style={currentStep === step ? { backgroundColor: TEAL } : undefined}
                  >
                    {currentStep > step ? <Check size={18} /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 transition-all ${
                        currentStep > step ? 'bg-teal-500/30' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 tabular-nums text-center">
              Step {currentStep} of 3
            </p>
          </div>

          {/* ── Step 1: About You ────────────────── */}
          {currentStep === 1 && (
            <div className="rounded-3xl border border-white/10 bg-[#10151A] p-8">
              <h2 className="text-3xl font-black tracking-[-0.03em] text-white mb-2">Tell us about you</h2>
              <p className="text-slate-400 mb-8">This helps us customize your experience.</p>

              <div className="mb-8">
                <label className="block font-bold text-white mb-4">What best describes you?</label>
                <div className="space-y-3">
                  {PROFESSIONS.map(prof => (
                    <label key={prof.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer transition-all hover:border-teal-500/40 hover:bg-white/[0.06]">
                      <input
                        type="radio"
                        name="profession"
                        value={prof.id}
                        checked={profession === prof.id}
                        onChange={e => setProfession(e.target.value)}
                        className="w-5 h-5 accent-[#0FA89C]"
                      />
                      <span className="font-medium text-slate-200">{prof.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block font-bold text-white mb-4">How many clients do you currently have?</label>
                <div className="grid grid-cols-2 gap-3">
                  {CLIENT_RANGES.map(range => (
                    <label key={range.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer transition-all hover:border-teal-500/40 hover:bg-white/[0.06]">
                      <input
                        type="radio"
                        name="clientCount"
                        value={range.id}
                        checked={clientCount === range.id}
                        onChange={e => setClientCount(e.target.value)}
                        className="w-5 h-5 accent-[#0FA89C]"
                      />
                      <span className="font-medium tabular-nums text-slate-200">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStep1Continue}
                disabled={!profession || !clientCount}
                className="w-full rounded-full py-3.5 font-black text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: TEAL }}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Step 2: Plan Summary ────────────── */}
          {currentStep === 2 && (
            <div className="rounded-3xl border border-white/10 bg-[#10151A] p-8">
              <h2 className="text-3xl font-black tracking-[-0.03em] text-white mb-2">Your selected plan</h2>
              <p className="text-slate-400 tabular-nums mb-8">14-day coach trial, cancel anytime.</p>

              <div className="rounded-2xl border border-teal-500/40 bg-[#0A0E11] p-8 mb-8 shadow-[0_20px_60px_rgba(15,168,156,0.1)]">
                <h3 className="text-2xl font-black tracking-tight text-white mb-2">{plan.name} Plan</h3>
                <p className="leading-7 text-slate-400 tabular-nums mb-4">Every feature in this plan is unlocked for your 14-day trial. You&apos;ll add card details before your paid subscription begins.</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black tabular-nums tracking-tight text-white">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-white mb-4">What you'll get on day 1:</h4>
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 leading-7 text-slate-300">
                      <Check size={20} className="flex-shrink-0 mt-0.5" style={{ color: TEAL_INK }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 rounded-full border border-white/15 bg-white/5 py-3.5 font-bold text-white transition hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-full py-3.5 font-black text-white transition hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ backgroundColor: TEAL }}
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Create Account ──────────── */}
          {currentStep === 3 && (
            <div className="rounded-3xl border border-white/10 bg-[#10151A] p-8">
              <h2 className="text-3xl font-black tracking-[-0.03em] text-white mb-2">Create your account</h2>
              <p className="text-slate-400 tabular-nums mb-8">Set up your Propel coach account in 60 seconds.</p>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0FA89C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0FA89C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0FA89C]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 mb-8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 accent-[#0FA89C] mt-0.5"
                />
                <span className="text-sm text-slate-400">
                  By signing up you agree to our{' '}
                  <a href="/terms" className="font-bold transition hover:brightness-125" style={{ color: TEAL_INK }}>
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="font-bold transition hover:brightness-125" style={{ color: TEAL_INK }}>
                    Privacy Policy
                  </a>
                </span>
              </label>

              {signupError && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10">
                  <p className="text-sm text-red-400">{signupError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 rounded-full border border-white/15 bg-white/5 py-3.5 font-bold text-white transition hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  onClick={handleStep3Submit}
                  disabled={!name || !email || !password || !termsAccepted || isLoading}
                  className="flex-1 rounded-full py-3.5 font-black text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: TEAL }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : 'Start your free trial'}
                </button>
              </div>

              <p className="text-xs text-slate-500 tabular-nums text-center mt-5">
                14-day coach trial · Cancel anytime · No lock-in contracts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrialSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0E11]" />}>
      <TrialSetupContent />
    </Suspense>
  )
}
