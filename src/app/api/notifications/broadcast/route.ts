export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Lazy initialization — only evaluated at request time, not during build.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key)
}


export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  // Verify authenticated coach session
  const serverClient = createServerClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, body, audience } = await req.json()
    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const coachId = user.id

    // Fetch this coach's clients with push tokens
    const { data: allClients, error: clientsError } = await admin
      .from('profiles')
      .select('id, push_token, full_name')
      .eq('coach_id', coachId)
      .eq('role', 'client')
      .not('push_token', 'is', null)

    if (clientsError) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    if (!allClients || allClients.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    // Apply audience filter
    let targetClients = allClients as { id: string; push_token: string; full_name: string }[]

    if (audience === 'active' || audience === 'at_risk') {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - (audience === 'active' ? 30 : 14))
      const cutoff = cutoffDate.toISOString()

      // Clients with a recent check-in
      const { data: recentActivity } = await admin
        .from('check_ins')
        .select('client_id')
        .in('client_id', allClients.map(c => c.id))
        .gte('created_at', cutoff)

      const activeIds = new Set((recentActivity ?? []).map((r: any) => r.client_id))

      targetClients = audience === 'active'
        ? allClients.filter(c => activeIds.has(c.id))
        : allClients.filter(c => !activeIds.has(c.id))
    }

    if (targetClients.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const messages = targetClients.map(c => ({
      to: c.push_token,
      title,
      body,
      data: { type: 'broadcast', coachId },
    }))

    // Send via Expo push notification service
    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })

    if (!pushRes.ok) {
      const errText = await pushRes.text()
      console.error('[broadcast] Expo push error:', pushRes.status, errText)
      return NextResponse.json({ error: 'Push notification service failed' }, { status: 502 })
    }

    // Log broadcast
    await admin.from('notification_broadcasts').insert({
      coach_id: coachId,
      title,
      body,
      audience: audience ?? 'all',
      recipient_count: messages.length,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ sent: messages.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
