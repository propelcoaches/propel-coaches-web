import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { title, body, coachId, audience } = await req.json()

    // Get client push tokens
    let query = supabase.from('profiles').select('id, push_token, full_name').not('push_token', 'is', null)
    if (audience === 'active') {
      // Would filter by last_active in production
    }

    const { data: clients } = await query

    if (!clients || clients.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    // Send via Expo push notification service
    const messages = clients
      .filter((c: any) => c.push_token)
      .map((c: any) => ({
        to: c.push_token,
        title,
        body,
        data: { type: 'broadcast', coachId },
      }))

    if (messages.length > 0) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        })
      } catch (e) {
        console.error('Push send error:', e)
      }
    }

    // Log broadcast
    try {
      await supabase.from('notification_broadcasts').insert({
        coach_id: coachId,
        title,
        body,
        audience,
        recipient_count: messages.length,
        sent_at: new Date().toISOString(),
      })
    } catch (e) {
      // table may not exist yet, non-fatal
    }

    return NextResponse.json({ sent: messages.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
