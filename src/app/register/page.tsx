'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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

    // Insert coach profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        email,
        role: 'coach',
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-xl border border-cb-border shadow-lg p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-cb-success/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-cb-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-cb-text mb-2">Check your email</h2>
            <p className="text-sm text-cb-muted mb-6">
              We sent a confirmation link to <strong className="text-cb-secondary">{email}</strong>. Click the link to activate your account, then sign in.
            </p>
            <Link
              href="/login"
              className="block w-full text-center bg-brand hover:bg-brand-light text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            >
              Go to Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-xl border border-cb-border shadow-lg p-8">
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

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-cb-text">Create your account</h1>
            <p className="text-sm text-cb-muted mt-1">Start coaching from your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-cb-secondary mb-1">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Charles Bettiol"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cb-secondary mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="coach@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cb-secondary mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-cb-secondary mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-cb-danger/15 border border-cb-danger/30 rounded-md px-3 py-2">
                <p className="text-sm text-cb-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-cb-muted mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-brand hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-cb-muted mt-4">
          Charles Bettiol Coaching &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
