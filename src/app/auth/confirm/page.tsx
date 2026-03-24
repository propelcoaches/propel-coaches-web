'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('Setting up your account…')

  useEffect(() => {
    async function handleHashTokens() {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (!accessToken || !refreshToken) {
        setStatus('error')
        setMessage('Invalid invite link. Please ask your coach to resend the invitation.')
        return
      }

      const supabase = createClient()

      // Set the session from the hash tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        setStatus('error')
        setMessage('This invite link has expired or already been used. Please ask your coach to resend the invitation.')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('error')
        setMessage('Could not verify your account. Please try again.')
        return
      }

      // For invite type, set a password via update if needed
      // Check for a pending invitation
      const { data: invitation } = await supabase
        .from('client_invitations')
        .select('*')
        .eq('client_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (invitation) {
        // Update the profile
        await supabase.from('profiles').upsert({
          id: user.id,
          role: 'client',
          name: invitation.client_name,
          email: user.email,
          coach_id: invitation.coach_id,
          onboarding_completed: false,
        })

        // Mark invitation as accepted
        await supabase
          .from('client_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id)

        window.location.href = '/client-onboarding'
        return
      }

      // No invitation found — check existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'coach') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/client-onboarding'
      }
    }

    handleHashTokens()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: 16,
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: 400,
        width: '90%',
      }}>
        {status === 'loading' ? (
          <>
            <div style={{
              width: 48,
              height: 48,
              border: '3px solid #2D8C7F',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 24px',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#94a3b8', fontSize: 16, margin: 0 }}>{message}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ color: '#f87171', fontSize: 16, margin: 0 }}>{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
