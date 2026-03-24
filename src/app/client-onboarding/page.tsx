'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClientOnboardingPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    setError(null)

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired. Please click the invite link again.')
      setSaving(false)
      return
    }

    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setError(pwError.message)
      setSaving(false)
      return
    }

    // Mark onboarding as pending (app will complete it)
    await supabase.from('profiles').update({ onboarding_completed: false }).eq('id', user.id)

    setDone(true)
    setSaving(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-surface border border-cb-border rounded-2xl p-8 w-full max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-cb-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-cb-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-cb-text mb-2">Password created! 🎉</h2>
          <p className="text-cb-muted text-sm mb-2">
            Download the <strong className="text-cb-text">CB Coaching</strong> app from TestFlight, then log in with:
          </p>
          <div className="bg-surface-light border border-cb-border rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-xs text-cb-muted mb-1">Your login details</p>
            <p className="text-sm text-cb-text font-medium">Email: your invite email</p>
            <p className="text-sm text-cb-text font-medium">Password: the one you just created</p>
          </div>
          <a
            href="https://testflight.apple.com"
            className="flex items-center justify-center gap-2 bg-cb-text text-bg rounded-xl px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity w-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Download on TestFlight
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface border border-cb-border rounded-2xl p-8 w-full max-w-md shadow-lg">
        <div className="mb-6">
          <div className="w-12 h-12 bg-cb-teal rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-cb-text mb-1">Welcome to Propel! 👋</h1>
          <p className="text-cb-muted text-sm">
            Your coach has set up an account for you. Create a password to get started — you'll use it to log into the app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-cb-text mb-2">Create a password</label>
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
            <label className="block text-sm font-semibold text-cb-text mb-2">Confirm password</label>
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
            disabled={saving}
            className="w-full bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white font-semibold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Create Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
