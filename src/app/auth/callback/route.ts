import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  const email = user.email

  // Look up a pending invitation for this email
  const { data: invitation } = await supabase
    .from('client_invitations')
    .select('*')
    .eq('client_email', email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (invitation) {
    // Create the client profile
    await supabase.from('profiles').upsert({
      id: user.id,
      role: 'client',
      name: invitation.client_name,
      email: user.email,
      coach_id: invitation.coach_id,
      onboarding_completed: false,
    })

    // Mark the invitation as accepted
    await supabase
      .from('client_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return NextResponse.redirect(`${origin}/client-onboarding`)
  }

  // No invitation found — create a minimal profile using user metadata if available
  const metadata = user.user_metadata ?? {}
  const role = metadata.role ?? 'client'
  await supabase.from('profiles').upsert({
    id: user.id,
    role,
    name: metadata.full_name ?? metadata.name ?? null,
    email: user.email,
    coach_id: metadata.coach_id ?? null,
    onboarding_completed: false,
  })

  // Coaches go to their dashboard (middleware will redirect to /onboarding if needed)
  // Clients with no invitation go to the landing page
  return NextResponse.redirect(`${origin}${role === 'coach' ? '/dashboard' : '/'}`)
}
