import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sendAiCoachSummaryEmail } from '@/lib/email'


export const dynamic = 'force-dynamic'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createSupabaseClient(url, key)
}

export async function POST(request: NextRequest) {
  // Auth check: accept either webhook secret header OR valid coach session
  const incomingSecret = request.headers.get('x-webhook-secret')
  const isWebhookCall = incomingSecret && incomingSecret === (process.env.WEBHOOK_SECRET ?? '')

  if (!isWebhookCall) {
    // Try to verify via coach auth session
    try {
      const serverClient = createClient()
      const { data: { user }, error } = await serverClient.auth.getUser()
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Parse body
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { sessionId } = body
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const admin = adminClient()

  // 1. Fetch the session
  const { data: session, error: sessionError } = await admin
    .from('ai_mode_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    console.error('[ai-coach/summarise] Session not found:', sessionError)
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // 2. Return early if already summarised
  if (session.summary_generated) {
    return NextResponse.json({ success: true, summary: session.summary_text, alreadyGenerated: true })
  }

  // 3. Fetch all messages in the thread during the session period
  const { data: messages, error: msgError } = await admin
    .from('messages')
    .select('*')
    .eq('coach_id', session.coach_id)
    .eq('client_id', session.client_id)
    .gte('created_at', session.started_at)
    .lte('created_at', session.ends_at ?? new Date().toISOString())
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('[ai-coach/summarise] Messages query error:', msgError)
    return NextResponse.json({ error: 'DB error fetching messages' }, { status: 500 })
  }

  // 4. Fetch coach and client names
  const [coachProfileResult, clientProfileResult] = await Promise.all([
    admin.from('profiles').select('name, full_name').eq('id', session.coach_id).single(),
    admin.from('profiles').select('name, full_name').eq('id', session.client_id).single(),
  ])

  const coachName =
    coachProfileResult.data?.name ||
    coachProfileResult.data?.full_name ||
    'Coach'
  const clientName =
    clientProfileResult.data?.name ||
    clientProfileResult.data?.full_name ||
    'Client'

  const conversationText = (messages ?? [])
    .map((m: any) => {
      const speaker = m.sender_role === 'client' ? clientName : coachName
      return `${speaker}: ${m.content}`
    })
    .join('\n')

  const durationDays = session.duration_days ?? 7

  // 5. Build Anthropic prompt and call API
  const userMessage = `Below is a conversation between an AI coach (acting as ${coachName}) and their client (${clientName}) over the past ${durationDays} days. Summarise this for the real coach.

Include:
- Key themes and topics the client raised
- Any concerns, struggles or red flags mentioned
- Compliance signals (did they mention following the meal plan? workouts?)
- Client mood and motivation level
- Questions the client asked that need a real answer
- Recommended actions for the coach to take this week

Be concise. Use bullet points. Write as a briefing TO the coach, not to the client.

Conversation:
${conversationText}`

  let aiSummary: string
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are a coaching assistant helping a coach review an AI-assisted conversation.',
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[ai-coach/summarise] Anthropic error:', anthropicRes.status, errText)
      return NextResponse.json({ error: 'Anthropic API error' }, { status: 500 })
    }

    const anthropicData = await anthropicRes.json()
    aiSummary = anthropicData?.content?.[0]?.text ?? ''

    if (!aiSummary) {
      console.error('[ai-coach/summarise] Empty response from Anthropic:', anthropicData)
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }
  } catch (err) {
    console.error('[ai-coach/summarise] Anthropic fetch error:', err)
    return NextResponse.json({ error: 'Anthropic request failed' }, { status: 500 })
  }

  const now = new Date().toISOString()

  // 7. Update the session record
  const { error: updateError } = await admin
    .from('ai_mode_sessions')
    .update({
      summary_generated: true,
      summary_text: aiSummary,
      summary_sent_at: now,
      is_active: false,
    })
    .eq('id', sessionId)

  if (updateError) {
    console.error('[ai-coach/summarise] Session update error:', updateError)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }

  // 8. Insert coach notification
  const { error: notifError } = await admin.from('coach_notifications').insert({
    coach_id: session.coach_id,
    type: 'ai_summary',
    title: `AI Coach Summary — ${clientName}`,
    body: aiSummary.slice(0, 300) + (aiSummary.length > 300 ? '...' : ''),
    client_id: session.client_id,
    session_id: sessionId,
  })

  if (notifError) {
    console.error('[ai-coach/summarise] Notification insert error:', notifError)
    // Non-fatal — summary is saved, just log the error
  }

  // 9. Send email notification to coach
  const coachEmailResult = await admin
    .from('profiles')
    .select('email')
    .eq('id', session.coach_id)
    .single()

  if (coachEmailResult.data?.email) {
    await sendAiCoachSummaryEmail(coachEmailResult.data.email, coachName, clientName, aiSummary)
  }

  // 10. Return success
  return NextResponse.json({ success: true, summary: aiSummary })
}
