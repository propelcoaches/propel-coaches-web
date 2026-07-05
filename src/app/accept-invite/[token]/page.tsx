'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type State =
  | { kind: 'loading' }
  | { kind: 'needs_login'; invitedEmail: string }
  | { kind: 'accepting' }
  | { kind: 'accepted'; teamId: string }
  | { kind: 'error'; code: string; message: string }

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = Array.isArray(params?.token) ? params.token[0] : (params?.token as string)
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', code: 'BAD_TOKEN', message: 'No invite token in URL.' })
      return
    }
    ;(async () => {
      const supabase = createClient()

      // Fetch the invite so we can display the invited email even before login.
      // RLS blocks authenticated-for-other-coach SELECT; the invite row is
      // readable to any authed user because we also want the recipient to
      // see it before they accept. We rely on the token being non-guessable
      // (server generates via randomBytes).
      // If the user isn't logged in yet, show a CTA to log in.
      const { data: { user } } = await supabase.auth.getUser()

      // Read the invite (anon role allowed via public read policy on
      // team_invitations — we add that policy below if missing).
      const { data: invite, error: inviteErr } = await supabase
        .from('team_invitations')
        .select('email, status, expires_at')
        .eq('id', token)
        .maybeSingle()
      if (inviteErr || !invite) {
        setState({ kind: 'error', code: 'NOT_FOUND', message: 'This invite link is invalid or has been revoked.' })
        return
      }
      if (invite.status !== 'pending') {
        setState({ kind: 'error', code: 'ALREADY_USED', message: 'This invite has already been used.' })
        return
      }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setState({ kind: 'error', code: 'EXPIRED', message: 'This invite has expired. Ask your team lead to resend.' })
        return
      }

      if (!user) {
        setState({ kind: 'needs_login', invitedEmail: invite.email })
        return
      }

      // Logged in — accept it.
      setState({ kind: 'accepting' })
      const res = await fetch(`/api/team/accept/${token}`, { method: 'POST' })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        setState({
          kind: 'error',
          code: data.error ?? 'ACCEPT_FAILED',
          message: data.message ?? 'Could not accept the invitation.',
        })
        return
      }
      setState({ kind: 'accepted', teamId: data.teamId })
      setTimeout(() => router.replace('/dashboard'), 2000)
    })().catch((e) => {
      setState({ kind: 'error', code: 'UNEXPECTED', message: e instanceof Error ? e.message : 'Unexpected error' })
    })
  }, [token, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      <div className="max-w-md w-full">
        {state.kind === 'loading' && (
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#245CFF] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading invitation…</p>
          </div>
        )}

        {state.kind === 'needs_login' && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#245CFF]/10 flex items-center justify-center mb-5">
              <UserPlus size={24} className="text-[#245CFF]" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">You&apos;re invited to a Propel team</h1>
            <p className="text-sm text-gray-500 mb-8">
              This invite was sent to <strong>{state.invitedEmail}</strong>. Sign in with that email to accept.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/accept-invite/${token}`)}`}
              className="inline-flex items-center gap-2 bg-[#245CFF] hover:opacity-90 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Sign in to accept →
            </Link>
            <p className="text-xs text-gray-400 mt-6">
              New to Propel?{' '}
              <Link
                href={`/register?team_invite=${token}&email=${encodeURIComponent(state.invitedEmail)}`}
                className="text-[#245CFF] underline"
              >
                Create an account
              </Link>{' '}
              — use <strong>{state.invitedEmail}</strong>.
            </p>
          </div>
        )}

        {state.kind === 'accepting' && (
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#245CFF] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Accepting invitation…</p>
          </div>
        )}

        {state.kind === 'accepted' && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">You&apos;re on the team</h1>
            <p className="text-sm text-gray-500 mb-6">Redirecting to your dashboard…</p>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Invite problem</h1>
            <p className="text-sm text-gray-500 mb-2">{state.message}</p>
            <p className="text-xs text-gray-400 mb-6">Code: {state.code}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[#245CFF] font-semibold text-sm hover:underline"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
