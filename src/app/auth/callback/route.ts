import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = createClient()

  // Handle PKCE code flow (standard login/signup)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
    }
  }

  // Handle token_hash flow (invite links, magic links)
  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'invite' | 'magiclink' | 'recovery' | 'email',
    })
    if (verifyError) {
      return NextResponse.redirect(`${origin}/login?error=verify_failed`)
    }
  }

  // Get the current user (session should now be set)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  const email = user.email

  // Check for a pending invitation for this email
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: invitation } = await supabaseAdmin
    .from('client_invitations')
    .select('*')
    .eq('client_email', email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (invitation) {
    // Create/update the client profile
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      role: 'client',
      name: invitation.client_name,
      email: user.email,
      coach_id: invitation.coach_id,
      onboarding_completed: false,
    })

    // Mark the invitation as accepted
    await supabaseAdmin
      .from('client_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return NextResponse.redirect(`${origin}/client-onboarding`)
  }

  // No invitation — check existing profile or create one from metadata
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    if (existingProfile.role === 'coach') {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
    return NextResponse.redirect(`${origin}/client-onboarding`)
  }

  // Brand new user with no profile — create one from metadata
  const metadata = user.user_metadata ?? {}
  const role = metadata.role ?? 'client'
  await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    role,
    name: metadata.full_name ?? metadata.name ?? null,
    email: user.email,
    coach_id: metadata.coach_id ?? null,
    onboarding_completed: false,
  })

  return NextResponse.redirect(`${origin}${role === 'coach' ? '/dashboard' : '/client-onboarding'}`)
}
