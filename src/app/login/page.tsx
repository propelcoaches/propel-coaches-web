'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/clients')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-xl border border-cb-border shadow-lg p-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="w-12 h-12 bg-[#0F7B8C] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-cb-text">Welcome back</h1>
            <p className="text-sm text-cb-muted mt-1">Sign in to your Propel dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-brand hover:underline">
                Forgot password?
              </a>
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-cb-muted mt-5">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-brand hover:underline font-medium">
              Create one
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-cb-muted mt-4">
          Propel &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
