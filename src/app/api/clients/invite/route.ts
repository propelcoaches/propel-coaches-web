export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, goal, coachId } = body

    if (!clientEmail || !clientName || !coachId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the requesting coach is authenticated using the SSR server client
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure the authenticated user matches the coachId
    if (user.id !== coachId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create admin client using service role key
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    // Send the invite email via Supabase Auth
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(clientEmail, {
      redirectTo: `${siteUrl}/auth/confirm`,
      data: {
        name: clientName,
        role: 'client',
        coach_id: coachId,
      },
    })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    // Upsert a row into client_invitations
    const { error: insertError } = await supabaseAdmin
      .from('client_invitations')
      .upsert({
        coach_id: coachId,
        client_email: clientEmail,
        client_name: clientName,
        goal: goal ?? null,
        status: 'pending',
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
