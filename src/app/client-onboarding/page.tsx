'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const GOAL_OPTIONS = [
  { value: 'Fat Loss', label: 'Fat Loss' },
  { value: 'Muscle Gain', label: 'Muscle Gain' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Recomp', label: 'Recomp' },
  { value: 'General Fitness', label: 'General Fitness' },
]

export default function ClientOnboardingPage() {
  const [step, setStep] = useState<'password' | 'details'>('password')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const [goal, setGoal] = useState('')
  const [trainingDays, setTrainingDays] = useState(3)
  const [injuries, setInjuries] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSettingPassword(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSettingPassword(false)
      return
    }
    setStep('details')
    setSettingPassword(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal) {
      setError('Please select a goal.')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session not found. Please try clicking the invite link again.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        goal,
        training_days_per_week: trainingDays,
        injuries: injuries.trim() || null,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-surface border border-cb-border rounded-2xl p-8 w-full max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-cb-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-cb-teal"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-cb-text mb-2">You're all set!</h2>
          <p className="text-cb-muted text-sm mb-8">
            Download the app to get started with your coaching program.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="#"
              className="flex items-center justify-center gap-2 bg-cb-text text-bg rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-2 bg-cb-text text-bg rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.28-2.61-2.61-10.98 9.69zM.46 1.33C.17 1.64 0 2.12 0 2.74v18.51c0 .62.17 1.1.47 1.4l.07.07 10.37-10.37v-.25L.53 1.26l-.07.07zM20.93 10.34l-2.95-1.7-2.93 2.92 2.93 2.93 2.96-1.71c.85-.49.85-1.95-.01-2.44zM3.18.22L16.82 8.5l-2.61 2.61L3.18.22z" />
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'password') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-surface border border-cb-border rounded-2xl p-8 w-full max-w-md shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-cb-text mb-1">Create your password 🔒</h1>
            <p className="text-cb-muted text-sm">You'll use this to log into the app on your phone.</p>
          </div>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-cb-text mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-cb-text mb-2">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={settingPassword}
              className="w-full bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white font-semibold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {settingPassword ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface border border-cb-border rounded-2xl p-8 w-full max-w-md shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cb-text mb-1">
            Welcome to Propel! 👋
          </h1>
          <p className="text-cb-muted text-sm">
            Let's get a few details to personalise your program.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold text-cb-text mb-2">
              What is your primary goal?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGoal(option.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    goal === option.value
                      ? 'border-cb-teal bg-cb-teal/10 text-cb-teal'
                      : 'border-cb-border bg-surface text-cb-secondary hover:border-cb-teal/50 hover:text-cb-text'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Training days */}
          <div>
            <label className="block text-sm font-semibold text-cb-text mb-2">
              Training days per week
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTrainingDays((d) => Math.max(1, d - 1))}
                disabled={trainingDays <= 1}
                className="w-10 h-10 rounded-lg border border-cb-border bg-surface text-cb-text text-lg font-bold flex items-center justify-center disabled:opacity-40 hover:border-cb-teal/50 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-cb-text w-8 text-center">
                {trainingDays}
              </span>
              <button
                type="button"
                onClick={() => setTrainingDays((d) => Math.min(6, d + 1))}
                disabled={trainingDays >= 6}
                className="w-10 h-10 rounded-lg border border-cb-border bg-surface text-cb-text text-lg font-bold flex items-center justify-center disabled:opacity-40 hover:border-cb-teal/50 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-cb-muted">days / week</span>
            </div>
          </div>

          {/* Injuries */}
          <div>
            <label className="block text-sm font-semibold text-cb-text mb-2">
              Any injuries or limitations?{' '}
              <span className="text-cb-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              rows={3}
              placeholder="e.g. Lower back pain, bad left knee…"
              className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white font-semibold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
