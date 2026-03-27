export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify this client belongs to the coach
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, coach_id, email')
      .eq('id', params.clientId)
      .single()

    if (!profile || profile.coach_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete profile and auth user
    await supabaseAdmin.from('profiles').delete().eq('id', params.clientId)
    // Only delete invitations for this specific client, not all of the coach's invitations
    await supabaseAdmin.from('client_invitations').delete()
      .eq('coach_id', user.id)
      .eq('invited_email', profile.email)
    await supabaseAdmin.auth.admin.deleteUser(params.clientId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
