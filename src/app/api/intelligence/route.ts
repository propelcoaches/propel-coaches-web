export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// ─── Signal thresholds ────────────────────────────────────────────────────────

const THRESHOLDS = {
  noCheckin:       7,   // days — amber alert
  noCheckinRed:   14,   // days — red alert
  noMessage:      14,   // days — client has gone quiet
  energyDrop:    1.5,   // points — meaningful energy decline
  highStress:      7,   // /10 — stress concern
  poorSleep:       5,   // /10 — sleep concern
  churnSignals:    2,   // how many signals to flag as "at risk"
}

type SignalKey =
  | 'no_checkin_7d'
  | 'no_checkin_14d'
  | 'declining_energy'
  | 'high_stress'
  | 'poor_sleep'
  | 'gone_quiet'
  | 'no_active_program'

type RiskLevel = 'green' | 'amber' | 'red'

export interface ClientSignal {
  client_id: string
  full_name: string
  avatar_url: string | null
  risk_level: RiskLevel
  signals: SignalKey[]
  metrics: {
    days_since_checkin: number
    checkins_last_14d: number
    avg_energy_last_7d: number | null
    avg_energy_prev_7d: number | null
    avg_stress_last_7d: number | null
    avg_sleep_last_7d: number | null
    days_since_message: number
    has_active_program: boolean
    latest_bodyweight_kg: number | null
    bodyweight_delta_kg: number | null
  }
  ai_insight: string | null
}

// ─── Signal computation ───────────────────────────────────────────────────────

function computeSignals(row: Record<string, unknown>): SignalKey[] {
  const signals: SignalKey[] = []
  const daysSince  = Number(row.days_since_checkin  ?? 999)
  const daysMsg    = Number(row.days_since_message   ?? 999)
  const energy7d   = row.avg_energy_last_7d   != null ? Number(row.avg_energy_last_7d)   : null
  const energyPrev = row.avg_energy_prev_7d   != null ? Number(row.avg_energy_prev_7d)   : null
  const stress7d   = row.avg_stress_last_7d   != null ? Number(row.avg_stress_last_7d)   : null
  const sleep7d    = row.avg_sleep_last_7d    != null ? Number(row.avg_sleep_last_7d)    : null
  const hasProgram = Boolean(row.has_active_program)

  if (daysSince >= THRESHOLDS.noCheckinRed)  signals.push('no_checkin_14d')
  else if (daysSince >= THRESHOLDS.noCheckin) signals.push('no_checkin_7d')

  if (energy7d != null && energyPrev != null && (energyPrev - energy7d) >= THRESHOLDS.energyDrop) {
    signals.push('declining_energy')
  }
  if (stress7d != null && stress7d >= THRESHOLDS.highStress)  signals.push('high_stress')
  if (sleep7d  != null && sleep7d  <= THRESHOLDS.poorSleep)   signals.push('poor_sleep')
  if (daysMsg  >= THRESHOLDS.noMessage)                        signals.push('gone_quiet')
  if (!hasProgram)                                             signals.push('no_active_program')

  return signals
}

function riskLevel(signals: SignalKey[]): RiskLevel {
  const hasRed = signals.includes('no_checkin_14d') ||
    (signals.includes('gone_quiet') && signals.includes('declining_energy')) ||
    signals.length >= THRESHOLDS.churnSignals
  if (hasRed) return 'red'
  if (signals.length > 0) return 'amber'
  return 'green'
}

// ─── Optional AI insight generation ──────────────────────────────────────────

async function generateInsight(client: Omit<ClientSignal, 'ai_insight'>): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (client.signals.length === 0) return null

  const anthropic = new Anthropic()

  const signalDescriptions: Record<SignalKey, string> = {
    no_checkin_7d:     `No check-in submitted in ${client.metrics.days_since_checkin} days`,
    no_checkin_14d:    `Missing check-ins for ${client.metrics.days_since_checkin} days — significant gap`,
    declining_energy:  `Energy dropped from ${client.metrics.avg_energy_prev_7d}/10 to ${client.metrics.avg_energy_last_7d}/10 this week`,
    high_stress:       `Average stress is ${client.metrics.avg_stress_last_7d}/10 — above optimal threshold`,
    poor_sleep:        `Average sleep quality is ${client.metrics.avg_sleep_last_7d}/10 — may be affecting recovery`,
    gone_quiet:        `No message from this client in ${client.metrics.days_since_message} days`,
    no_active_program: `No active training program assigned`,
  }

  const signalList = client.signals
    .map(s => `• ${signalDescriptions[s]}`)
    .join('\n')

  const prompt = `You are a coaching assistant. A fitness coach needs a brief, actionable insight about a client.

Client: ${client.full_name}
Risk level: ${client.risk_level.toUpperCase()}

Signals detected:
${signalList}

Write 1-2 sentences: first a concise interpretation of what may be happening, then one specific action the coach should take. Be direct and practical. Do not use the client's name. No preamble.`

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages:   [{ role: 'user', content: prompt }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : null
  } catch {
    return null
  }
}

// ─── GET /api/intelligence ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const withInsights = req.nextUrl.searchParams.get('insights') === 'true'

  // Run signal computation via DB function
  const { data: rows, error: fnError } = await supabase.rpc('get_client_signals', {
    p_coach_id: user.id,
  })

  if (fnError) {
    console.error('[intelligence] DB error:', fnError)
    return NextResponse.json({ error: fnError.message }, { status: 500 })
  }

  // Compute signals and risk levels
  const clients: Omit<ClientSignal, 'ai_insight'>[] = (rows ?? []).map((row: Record<string, unknown>) => {
    const signals = computeSignals(row)
    return {
      client_id:  String(row.client_id),
      full_name:  String(row.full_name ?? ''),
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      risk_level: riskLevel(signals),
      signals,
      metrics: {
        days_since_checkin:    Number(row.days_since_checkin  ?? 999),
        checkins_last_14d:     Number(row.checkins_last_14d   ?? 0),
        avg_energy_last_7d:    row.avg_energy_last_7d   != null ? Number(row.avg_energy_last_7d)  : null,
        avg_energy_prev_7d:    row.avg_energy_prev_7d   != null ? Number(row.avg_energy_prev_7d)  : null,
        avg_stress_last_7d:    row.avg_stress_last_7d   != null ? Number(row.avg_stress_last_7d)  : null,
        avg_sleep_last_7d:     row.avg_sleep_last_7d    != null ? Number(row.avg_sleep_last_7d)   : null,
        days_since_message:    Number(row.days_since_message  ?? 999),
        has_active_program:    Boolean(row.has_active_program),
        latest_bodyweight_kg:  row.latest_bodyweight_kg != null ? Number(row.latest_bodyweight_kg) : null,
        bodyweight_delta_kg:   row.bodyweight_delta_kg  != null ? Number(row.bodyweight_delta_kg)  : null,
      },
    }
  })

  // Optionally generate AI insights (only for amber/red clients, uses Haiku for speed)
  let results: ClientSignal[]
  if (withInsights) {
    const insightPromises = clients.map(async c => ({
      ...c,
      ai_insight: c.risk_level !== 'green' ? await generateInsight(c) : null,
    }))
    results = await Promise.all(insightPromises)
  } else {
    results = clients.map(c => ({ ...c, ai_insight: null }))
  }

  // Summary counts for the dashboard widget
  const summary = {
    total:  results.length,
    red:    results.filter(c => c.risk_level === 'red').length,
    amber:  results.filter(c => c.risk_level === 'amber').length,
    green:  results.filter(c => c.risk_level === 'green').length,
  }

  return NextResponse.json({ clients: results, summary })
}
