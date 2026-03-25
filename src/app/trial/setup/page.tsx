'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Zap, Check, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: '$0',
    period: '/month',
    features: [
      'Up to 5 active clients',
      'Training program builder',
      'Weekly check-ins with progress photos',
      'Nutrition & macro tracking',
      'Habit tracking with streaks',
      'Client messaging',
      'Basic progress metrics',
      'iOS & Android apps',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$29 AUD',
    period: '/month',
    features: [
      'Up to 30 active clients',
      'Everything in Starter',
      'AI Coach Assistant (24/7)',
      'Video feedback via Loom',
      'Body composition tracking',
      'Custom branding (logo & colours)',
      'Advanced analytics & reports',
      'Stripe payments built-in',
      'Priority support',
    ],
  },
  team: {
    name: 'Team',
    price: '$79 AUD',
    period: '/month',
    features: [
      'Unlimited active clients',
      'Up to 5 coaches / practitioners',
      'Everything in Pro',
      'Team dashboard & permissions',
      'Shared exercise & template library',
      'Revenue analytics',
      'Dedicated onboarding call',
      'Phone support',
    ],
  },
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

  const plan = PLAN_DETAILS[planParam as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.pro

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
      <div className="min-h-screen bg-white flex items-center justify-center px-6" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#0F7B8C]/10 flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-[#0F7B8C]" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Check your email</h2>
          <p className="text-gray-500 mb-2">
            We&apos;ve sent a confirmation link to <strong className="text-gray-900">{email}</strong>.
          </p>
          <p className="text-gray-500 mb-8">
            Click the link in the email to activate your account and get started.
          </p>
          <p className="text-sm text-gray-400">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => setEmailConfirmationSent(false)}
              className="text-[#0F7B8C] hover:underline font-medium"
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
            <Link href="/pricing" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Back to pricing</Link>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────── */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* ── Progress ────────────────────────── */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      currentStep === step
                        ? 'bg-[#0F7B8C] text-white'
                        : currentStep > step
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {currentStep > step ? <Check size={18} /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 transition-all ${
                        currentStep > step ? 'bg-emerald-200' : 'bg-gray-100'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center">
              Step {currentStep} of 3
            </p>
          </div>

          {/* ── Step 1: About You ────────────────── */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Tell us about you</h2>
              <p className="text-gray-500 mb-8">This helps us customize your experience.</p>

              <div className="mb-8">
                <label className="block font-bold text-gray-900 mb-4">What best describes you?</label>
                <div className="space-y-3">
                  {PROFESSIONS.map(prof => (
                    <label key={prof.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-[#0F7B8C] hover:bg-[#0F7B8C]/5 transition-all">
                      <input
                        type="radio"
                        name="profession"
                        value={prof.id}
                        checked={profession === prof.id}
                        onChange={e => setProfession(e.target.value)}
                        className="w-5 h-5 text-[#0F7B8C]"
                      />
                      <span className="font-medium text-gray-900">{prof.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block font-bold text-gray-900 mb-4">How many clients do you currently have?</label>
                <div className="grid grid-cols-2 gap-3">
                  {CLIENT_RANGES.map(range => (
                    <label key={range.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-[#0F7B8C] hover:bg-[#0F7B8C]/5 transition-all">
                      <input
                        type="radio"
                        name="clientCount"
                        value={range.id}
                        checked={clientCount === range.id}
                        onChange={e => setClientCount(e.target.value)}
                        className="w-5 h-5 text-[#0F7B8C]"
                      />
                      <span className="font-medium text-gray-900">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStep1Continue}
                disabled={!profession || !clientCount}
                className="w-full bg-[#0F7B8C] hover:bg-[#0d6b7a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Step 2: Plan Summary ────────────── */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Your selected plan</h2>
              <p className="text-gray-500 mb-8">14-day free trial, cancel anytime.</p>

              <div className="bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] text-white rounded-2xl p-8 mb-8">
                <h3 className="text-2xl font-black mb-2">{plan.name} Plan</h3>
                <p className="text-white/80 mb-4">Your 14-day free trial includes full access to all features.</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-white/70">{plan.period}</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4">What you'll get on day 1:</h4>
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-gray-700">
                      <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Create Account ──────────── */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Create your account</h2>
              <p className="text-gray-500 mb-8">Set up your Propel coach account in 60 seconds.</p>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F7B8C]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 mb-8 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 text-[#0F7B8C] mt-0.5"
                />
                <span className="text-sm text-gray-600">
                  By signing up you agree to our{' '}
                  <a href="/terms" className="text-[#0F7B8C] hover:underline font-medium">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" className="text-[#0F7B8C] hover:underline font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>

              {signupError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{signupError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStep3Submit}
                  disabled={!name || !email || !password || !termsAccepted || isLoading}
                  className="flex-1 bg-[#0F7B8C] hover:bg-[#0d6b7a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : 'Start your free trial'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                14-day free trial · Cancel anytime · No lock-in contracts
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
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TrialSetupContent />
    </Suspense>
  )
}
