'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Dumbbell,
  UtensilsCrossed,
  ClipboardCheck,
  HeartPulse,
  ListTodo,
  BookOpen,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react'

type Profession =
  | 'personal_trainer'
  | 'nutritionist'
  | 'dietitian'
  | 'exercise_physiologist'
  | 'strength_coach'
  | 'online_fitness_coach'
  | 'physiotherapist'
  | 'other'

interface ClientFeatures {
  training: boolean
  nutrition: boolean
  check_ins: boolean
  habits: boolean
  tasks: boolean
  resources: boolean
  messaging: boolean
  progress: boolean
}

const PROFESSIONS = [
  { id: 'personal_trainer', label: 'Personal Trainer' },
  { id: 'nutritionist', label: 'Nutritionist' },
  { id: 'dietitian', label: 'Dietitian' },
  { id: 'exercise_physiologist', label: 'Exercise Physiologist' },
  { id: 'strength_coach', label: 'Strength & Conditioning Coach' },
  { id: 'online_fitness_coach', label: 'Online Fitness Coach' },
  { id: 'physiotherapist', label: 'Physiotherapist' },
  { id: 'other', label: 'Other' },
] as const

const PROFESSION_DEFAULTS: Record<Profession, ClientFeatures> = {
  personal_trainer: {
    training: true,
    nutrition: true,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  nutritionist: {
    training: false,
    nutrition: true,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  dietitian: {
    training: false,
    nutrition: true,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  exercise_physiologist: {
    training: true,
    nutrition: false,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  strength_coach: {
    training: true,
    nutrition: false,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  online_fitness_coach: {
    training: true,
    nutrition: true,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  physiotherapist: {
    training: true,
    nutrition: false,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
  other: {
    training: true,
    nutrition: true,
    check_ins: true,
    habits: true,
    tasks: true,
    resources: true,
    messaging: true,
    progress: true,
  },
}

const FEATURES_DISPLAY = [
  { key: 'training' as const, label: 'Training / Workouts', icon: Dumbbell },
  { key: 'nutrition' as const, label: 'Nutrition Plans', icon: UtensilsCrossed },
  { key: 'check_ins' as const, label: 'Check-ins', icon: ClipboardCheck },
  { key: 'habits' as const, label: 'Habits', icon: HeartPulse },
  { key: 'tasks' as const, label: 'Tasks', icon: ListTodo },
  { key: 'resources' as const, label: 'Resources', icon: BookOpen },
  { key: 'messaging' as const, label: 'Messaging', icon: MessageSquare },
  { key: 'progress' as const, label: 'Progress Tracking', icon: TrendingUp },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [profession, setProfession] = useState<Profession | null>(null)
  const [features, setFeatures] = useState<ClientFeatures>(PROFESSION_DEFAULTS.personal_trainer)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleProfessionSelect(profId: Profession) {
    setProfession(profId)
    setFeatures(PROFESSION_DEFAULTS[profId])
  }

  function toggleFeature(key: keyof ClientFeatures) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleNext() {
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your full name')
        return
      }
      if (!email.trim()) {
        setError('Please enter your email address')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      if (password !== confirm) {
        setError('Passwords do not match')
        return
      }
      setError(null)
      setStep(2)
    } else if (step === 2) {
      if (!profession) {
        setError('Please select a profession')
        return
      }
      setError(null)
      setStep(3)
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1)
      setError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!profession) {
      setError('Please select a profession')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: 'coach' },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        email,
        role: 'coach',
        profession,
        client_features: features,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cb-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-cb-surface rounded-xl border border-cb-border shadow-lg p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-cb-success/15 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-cb-success" />
            </div>
            <h2 className="text-lg font-semibold text-cb-text mb-2">Check your email</h2>
            <p className="text-sm text-cb-muted mb-6">
              We sent a confirmation link to <strong className="text-cb-text-secondary">{email}</strong>. Click the link to activate your account, then sign in.
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            >
              Go to Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cb-bg flex items-center justify-center p-4">
      <div className={`w-full ${step === 1 ? 'max-w-sm' : 'max-w-lg'}`}>
        <div className="bg-cb-surface rounded-xl border border-cb-border shadow-lg p-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="bg-[#2B2B2B] rounded-xl p-6 flex justify-center">
              <img
                src="/logo/full-dark.png"
                alt="CB Coaching"
                style={{ width: 180, height: 'auto' }}
              />
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s <= step ? 'bg-[var(--brand)]' : 'bg-cb-border'
                }`}
              />
            ))}
          </div>

          <div className="text-center mb-6">
            {step === 1 && (
              <>
                <h1 className="text-xl font-bold text-cb-text">Create your account</h1>
                <p className="text-sm text-cb-muted mt-1">Step 1 of 3 — Account details</p>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="text-xl font-bold text-cb-text">What's your profession?</h1>
                <p className="text-sm text-cb-muted mt-1">Step 2 of 3 — Select your role</p>
              </>
            )}
            {step === 3 && (
              <>
                <h1 className="text-xl font-bold text-cb-text">What can your clients access?</h1>
                <p className="text-sm text-cb-muted mt-1">Step 3 of 3 — Customize features</p>
              </>
            )}
          </div>

          {/* Step 1: Account details */}
          {step === 1 && (
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-cb-text-secondary mb-1">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-cb-surface-light focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  placeholder="Charles Bettiol"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cb-text-secondary mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-cb-surface-light focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  placeholder="coach@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-cb-text-secondary mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-cb-surface-light focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-cb-text-secondary mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-cb-surface-light focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-cb-danger/15 border border-cb-danger/30 rounded-md px-3 py-2">
                  <p className="text-sm text-cb-danger">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </form>
          )}

          {/* Step 2: Profession selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {PROFESSIONS.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => handleProfessionSelect(prof.id as Profession)}
                    className={`p-4 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                      profession === prof.id
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-cb-text'
                        : 'border-cb-border bg-cb-surface-light text-cb-text-secondary hover:border-cb-border/70'
                    }`}
                  >
                    {prof.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-cb-danger/15 border border-cb-danger/30 rounded-md px-3 py-2">
                  <p className="text-sm text-cb-danger">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-cb-surface-light hover:bg-cb-border text-cb-text font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Feature selection */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {FEATURES_DISPLAY.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      features[key]
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10'
                        : 'border-cb-border bg-cb-surface-light'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon
                          size={20}
                          className={features[key] ? 'text-[var(--brand)]' : 'text-cb-muted'}
                        />
                        <span className="text-sm font-medium text-cb-text">{label}</span>
                      </div>
                      <div
                        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                          features[key] ? 'bg-[var(--brand)]' : 'bg-cb-border'
                        }`}
                        style={{ height: '22px', width: '40px' }}
                      >
                        <span
                          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                            features[key] ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-cb-danger/15 border border-cb-danger/30 rounded-md px-3 py-2">
                  <p className="text-sm text-cb-danger">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-cb-surface-light hover:bg-cb-border text-cb-text font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand)]/90 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account <Check size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-cb-muted mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--brand)] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>

        {step === 1 && (
          <p className="text-center text-xs text-cb-muted mt-4">
            Charles Bettiol Coaching &copy; {new Date().getFullYear()}
          </p>
        )}
      </div>
    </div>
  )
}
