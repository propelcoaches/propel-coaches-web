export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// ── Claude form-check analyser ────────────────────────────────────────────────
// Uses claude-sonnet-4-6 with vision when a thumbnail is available,
// otherwise falls back to text-based biomechanical analysis.

const SYSTEM_PROMPT = `You are an expert strength coach and biomechanics specialist with 20+ years of experience. You analyse exercise form and provide precise, actionable feedback grounded in evidence-based practice.

Your feedback must be:
- Specific (reference exact body segments, joint angles, bar path, tempo)
- Constructive (frame corrections positively, suggest drills)
- Prioritised (call out safety issues first)
- Concise (coaches read this quickly)

Always return valid JSON matching the exact schema requested.`

function buildUserContent(
  formCheck: {
    exercise_name: string
    weight_used: string | null
    reps_performed: number | null
    set_number: number | null
    thumbnail_url: string | null
  }
): Anthropic.MessageParam['content'] {
  const contextLines = [
    `EXERCISE: ${formCheck.exercise_name}`,
    formCheck.weight_used   ? `WEIGHT: ${formCheck.weight_used}`              : null,
    formCheck.reps_performed ? `REPS: ${formCheck.reps_performed}`            : null,
    formCheck.set_number    ? `SET: ${formCheck.set_number}`                  : null,
  ].filter(Boolean).join('\n')

  const jsonSchema = `{
  "overall_score": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": [{"cue": "<strength>", "detail": "<specific explanation>"}],
  "improvements": [{"cue": "<area to improve>", "detail": "<specific explanation>", "priority": "<high|medium|low>", "drill": "<corrective drill or cue>"}],
  "safety_concerns": [{"concern": "<issue>", "recommendation": "<action>"}],
  "coaching_cues": ["<short memorable cue>"],
  "recommended_deload": <boolean>
}`

  if (formCheck.thumbnail_url) {
    return [
      {
        type: 'image',
        source: { type: 'url', url: formCheck.thumbnail_url },
      },
      {
        type: 'text',
        text: `${contextLines}\n\nAnalyse the exercise form shown in this image and return JSON matching this schema exactly:\n${jsonSchema}`,
      },
    ]
  }

  return `${contextLines}\n\nProvide a thorough biomechanical form analysis for this exercise submission. Return JSON matching this schema exactly:\n${jsonSchema}`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { form_check_id } = await req.json()
  if (!form_check_id) {
    return NextResponse.json({ error: 'Missing form_check_id' }, { status: 400 })
  }

  const { data: formCheck, error: fetchError } = await supabase
    .from('form_checks')
    .select('*')
    .eq('id', form_check_id)
    .single()

  if (fetchError || !formCheck) {
    return NextResponse.json({ error: 'Form check not found' }, { status: 404 })
  }

  if (formCheck.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('form_checks')
    .update({ ai_status: 'processing' })
    .eq('id', form_check_id)

  let analysis: Record<string, unknown>
  const aiModel = 'claude-sonnet-4-6'

  try {
    const anthropic = new Anthropic()
    const msg = await anthropic.messages.create({
      model:      aiModel,
      max_tokens: 1500,
      system:     SYSTEM_PROMPT,
      messages: [{
        role:    'user',
        content: buildUserContent(formCheck),
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
    // Strip markdown fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    analysis = JSON.parse(cleaned)
  } catch (err) {
    console.error('[form-check] Analysis failed:', err)
    await supabase
      .from('form_checks')
      .update({ ai_status: 'failed' })
      .eq('id', form_check_id)
    return NextResponse.json({ error: 'Failed to analyse form' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('form_checks')
    .update({
      ai_analysis:     analysis,
      ai_status:       'completed',
      ai_model:        aiModel,
      ai_processed_at: new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    })
    .eq('id', form_check_id)

  if (updateError) {
    console.error('[form-check] Error saving analysis:', updateError)
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
  }

  // Coach notification — non-fatal, fire and forget
  void Promise.resolve(
    supabase.from('coach_notifications').insert({
      coach_id:  user.id,
      type:      'form_check_completed',
      title:     `Form check ready: ${formCheck.exercise_name}`,
      body:      `AI analysis complete. Score: ${analysis.overall_score ?? '?'}/10. ${analysis.summary ?? ''}`,
      client_id: formCheck.client_id ?? null,
      read:      false,
    })
  ).catch(() => {})

  return NextResponse.json({ analysis, form_check_id })
}

// GET: Fetch form checks for a coach
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  const status   = searchParams.get('status')

  let query = supabase
    .from('form_checks')
    .select('*, client:profiles!form_checks_client_id_fkey(full_name, avatar_url)')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (status)   query = query.eq('ai_status', status)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: 'Failed to fetch form checks' }, { status: 500 })

  return NextResponse.json({ form_checks: data })
}
