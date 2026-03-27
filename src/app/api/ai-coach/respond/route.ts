import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!
const webhookSecret = process.env.AI_WEBHOOK_SECRET!

function adminClient() {
  return createClient(supabaseUrl, serviceRoleKey)
}

function buildSystemPrompt(
  coachName: string,
  aiProfile: any,
  clientProfile: any,
  checkIns: any[],
  mealPlan: any,
  program: any,
) {
  const sampleMessages = aiProfile?.sample_messages ?? []
  const toneKeywords = aiProfile?.tone_keywords ?? []

  const checkInLines = checkIns.length > 0
    ? checkIns.map((c: any) =>
        `Energy: ${c.energy ?? '?'}, Stress: ${c.stress ?? '?'}, Sleep: ${c.sleep_quality ?? '?'}, Wins: ${c.wins ?? 'none'}, Struggles: ${c.struggles ?? 'none'}`
      ).join('\n')
    : 'None yet'

  let sampleBlock = ''
  if (sampleMessages.length > 0) {
    const samples = sampleMessages.slice(0, 10).map((m: any) => `You: ${m.content}`).join('\n')
    sampleBlock = `\nHere are examples of how you write messages — match this style closely:\n${samples}\n`
  }

  return `You are ${coachName}, a dietitian and fitness coach. You are texting one of your clients.

Your coaching style: ${aiProfile?.bio || 'Evidence-based, practical, and supportive.'}
Your tone: ${toneKeywords.length > 0 ? toneKeywords.join(', ') : 'direct, encouraging, professional'}
${sampleBlock}
Client context:
- Name: ${clientProfile?.name || clientProfile?.full_name || 'your client'}
- Goals: ${clientProfile?.goal || 'Not specified'}
- Current program: ${program?.name || 'Not assigned'}
- Current meal plan: ${mealPlan?.name || 'Not assigned'}
- Recent check-in summary:
${checkInLines}

CRITICAL RULES:
- You are a REAL human coach, NOT an AI. NEVER mention AI, chatbot, or automation.
- Keep responses SHORT — like real text messages, 1-3 sentences max.
- Be warm, human, and direct. Sound like you're texting, not writing an email.
- Only reference meal plan or program if directly relevant to their message.
- Never use overly formal language.`
}

export async function POST(request: NextRequest) {
  // 1. Verify webhook secret
  const incomingSecret = request.headers.get('x-webhook-secret')
  if (!incomingSecret || incomingSecret !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse Supabase webhook payload
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const record = body?.record
  if (!record) {
    return NextResponse.json({ error: 'Missing record' }, { status: 400 })
  }

  const { id: messageId, coach_id, client_id, content, sender_role, created_at } = record

  // 3. Only proceed for client messages
  if (sender_role !== 'client') {
    return NextResponse.json({ handled: false, reason: 'Not a client message' })
  }

  const admin = adminClient()

  // 4. Check for active AI session
  const { data: sessions, error: sessionError } = await admin
    .from('ai_mode_sessions')
    .select('*')
    .eq('client_id', client_id)
    .eq('coach_id', coach_id)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .limit(1)

  if (sessionError) {
    console.error('[ai-coach/respond] Session query error:', sessionError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // 5. If no active session, return early
  if (!sessions || sessions.length === 0) {
    // Check for expired session that hasn't been summarised yet
    const { data: expiredSessions } = await admin
      .from('ai_mode_sessions')
      .select('*')
      .eq('client_id', client_id)
      .eq('coach_id', coach_id)
      .eq('is_active', true)
      .lt('ends_at', new Date().toISOString())
      .eq('summary_generated', false)
      .limit(1)

    // 6. Handle expired session — deactivate and trigger summary
    if (expiredSessions && expiredSessions.length > 0) {
      const expiredSession = expiredSessions[0]
      await admin
        .from('ai_mode_sessions')
        .update({ is_active: false })
        .eq('id', expiredSession.id)

      // Fire summarise internally (non-blocking attempt)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
      fetch(`${siteUrl}/api/ai-coach/summarise`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify({ sessionId: expiredSession.id }),
      }).catch((err) => console.error('[ai-coach/respond] summarise trigger error:', err))
    }

    return NextResponse.json({ handled: false })
  }

  const session = sessions[0]

  // 7. Fetch all context in parallel
  const [
    profileResult,
    coachProfileResult,
    clientProfileResult,
    checkInsResult,
    mealPlanResult,
    programResult,
    messagesResult,
  ] = await Promise.all([
    admin.from('coach_ai_profiles').select('*').eq('coach_id', coach_id).single(),
    admin.from('profiles').select('*').eq('id', coach_id).single(),
    admin.from('profiles').select('*').eq('id', client_id).single(),
    admin
      .from('check_ins')
      .select('*')
      .eq('client_id', client_id)
      .order('date', { ascending: false })
      .limit(3),
    admin
      .from('meal_plans')
      .select('*')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    admin
      .from('workout_programs')
      .select('*')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    admin
      .from('messages')
      .select('*')
      .eq('coach_id', coach_id)
      .eq('client_id', client_id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const aiProfile = profileResult.data
  const coachProfile = coachProfileResult.data
  const clientProfile = clientProfileResult.data
  const checkIns = checkInsResult.data ?? []
  const mealPlan = mealPlanResult.data
  const program = programResult.data

  // Reverse messages so they are chronological (oldest first)
  const recentMessages = (messagesResult.data ?? []).reverse()

  const coachName = coachProfile?.name || coachProfile?.full_name || 'Coach'

  // 8. Build system prompt
  const systemPrompt = buildSystemPrompt(coachName, aiProfile, clientProfile, checkIns, mealPlan, program)

  // Build messages array for Anthropic — map history then append new message
  const anthropicMessages = [
    ...recentMessages.map((msg: any) => ({
      role: msg.sender_role === 'client' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content },
  ]

  // 9. Call Anthropic API via fetch (no SDK)
  let aiResponse: string
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[ai-coach/respond] Anthropic error:', anthropicRes.status, errText)
      return NextResponse.json({ error: 'Anthropic API error' }, { status: 500 })
    }

    const anthropicData = await anthropicRes.json()
    aiResponse = anthropicData?.content?.[0]?.text ?? ''

    if (!aiResponse) {
      console.error('[ai-coach/respond] Empty response from Anthropic:', anthropicData)
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
    }
  } catch (err) {
    console.error('[ai-coach/respond] Anthropic fetch error:', err)
    return NextResponse.json({ error: 'Anthropic request failed' }, { status: 500 })
  }

  // 10. Insert AI response into messages table
  const { error: insertError } = await admin.from('messages').insert({
    coach_id,
    client_id,
    sender_id: coach_id,
    sender_role: 'coach',
    content: aiResponse,
    is_ai_generated: true,
    ai_session_id: session.id,
    read: false,
  })

  if (insertError) {
    console.error('[ai-coach/respond] Message insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 })
  }

  // 11. Return success
  return NextResponse.json({ handled: true, response: aiResponse })
}
