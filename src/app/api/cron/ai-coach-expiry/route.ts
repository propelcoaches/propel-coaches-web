import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}
const cronSecret = process.env.CRON_SECRET!
const webhookSecret = process.env.AI_WEBHOOK_SECRET!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

function adminClient() {
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: NextRequest) {
  // 1. Verify Vercel cron Authorization header
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${cronSecret}`

  if (!authHeader || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()

  // 2. Query for expired sessions that haven't been summarised
  const { data: expiredSessions, error } = await admin
    .from('ai_mode_sessions')
    .select('*')
    .eq('is_active', true)
    .lt('ends_at', new Date().toISOString())
    .eq('summary_generated', false)

  if (error) {
    console.error('[cron/ai-coach-expiry] Query error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const sessions = expiredSessions ?? []

  // 3. For each expired session, trigger summarise endpoint
  const results = await Promise.allSettled(
    sessions.map(async (session: any) => {
      const res = await fetch(`${siteUrl}/api/ai-coach/summarise`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify({ sessionId: session.id }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Session ${session.id} summarise failed: ${res.status} ${errText}`)
      }

      return session.id
    })
  )

  // Log any failures
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error('[cron/ai-coach-expiry] Failed to summarise session:', result.reason)
    }
  })

  const processed = results.filter((r) => r.status === 'fulfilled').length

  // 4. Return count
  return NextResponse.json({ processed, total: sessions.length })
}
