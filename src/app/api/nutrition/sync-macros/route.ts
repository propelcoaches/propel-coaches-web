export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// ─── Evidence-based macro computation ────────────────────────────────────────
// Based on ISSN Position Stand (2017) and ACSM/AND/DC Joint Position Statement

interface MacroTargets {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
}

interface SyncContext {
  program_goal: string
  days_per_week: number
  body_weight_kg: number
  current_calories: number
}

function computeRecommendedMacros(ctx: SyncContext): MacroTargets {
  const { program_goal, days_per_week, body_weight_kg, current_calories } = ctx

  const volumeMultiplier = days_per_week >= 5 ? 1.0 : days_per_week >= 4 ? 0.9 : 0.8

  let calories: number
  let proteinPerKg: number
  let fatPct: number

  switch (program_goal) {
    case 'fat_loss':
      calories     = Math.round(Math.max(current_calories - 450, 1400))
      proteinPerKg = 2.3
      fatPct       = 0.25
      break
    case 'hypertrophy':
      calories     = Math.round(current_calories + 300 * volumeMultiplier)
      proteinPerKg = 2.0
      fatPct       = 0.25
      break
    case 'strength':
      calories     = Math.round(current_calories + 100 * volumeMultiplier)
      proteinPerKg = 2.2
      fatPct       = 0.30
      break
    case 'endurance':
      calories     = Math.round(current_calories + 150 * volumeMultiplier)
      proteinPerKg = 1.6
      fatPct       = 0.22
      break
    case 'general_fitness':
    default:
      calories     = current_calories
      proteinPerKg = 1.8
      fatPct       = 0.28
      break
  }

  const protein_g = Math.round(body_weight_kg * proteinPerKg)
  const fat_g     = Math.round((calories * fatPct) / 9)
  const carbs_g   = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
  const fibre_g   = Math.round(calories / 1000 * 14)

  return { calories, protein_g, carbs_g: Math.max(carbs_g, 20), fat_g, fibre_g }
}

const GOAL_LABELS: Record<string, string> = {
  fat_loss:        'Fat Loss',
  hypertrophy:     'Hypertrophy',
  strength:        'Strength',
  endurance:       'Endurance',
  general_fitness: 'General Fitness',
}

// ─── POST — compute recommendation ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nutrition_plan_id, client_id, body_weight_kg } = await req.json()
  if (!nutrition_plan_id || !client_id) {
    return NextResponse.json({ error: 'Missing nutrition_plan_id or client_id' }, { status: 400 })
  }

  const { data: plan, error: planErr } = await supabase
    .from('nutrition_plans_v2')
    .select('id, name, calories_target, protein_target, carbs_target, fat_target, fibre_target')
    .eq('id', nutrition_plan_id)
    .eq('coach_id', user.id)
    .single()

  if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { data: program, error: progErr } = await supabase
    .from('programs')
    .select('id, name, goal, duration_weeks, days_per_week')
    .eq('client_id', client_id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (progErr || !program) {
    return NextResponse.json({ error: 'No active program found for this client' }, { status: 404 })
  }

  let bwKg = body_weight_kg
  if (!bwKg) {
    const { data: bwRow } = await supabase
      .from('weight_logs')
      .select('weight_kg')
      .eq('client_id', client_id)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    bwKg = bwRow?.weight_kg ?? 75
  }

  const recommended = computeRecommendedMacros({
    program_goal:     program.goal,
    days_per_week:    program.days_per_week ?? 3,
    body_weight_kg:   bwKg,
    current_calories: plan.calories_target ?? 2000,
  })

  const current = {
    calories:  plan.calories_target,
    protein_g: plan.protein_target,
    carbs_g:   plan.carbs_target,
    fat_g:     plan.fat_target,
    fibre_g:   plan.fibre_target,
  }

  let sync_notes: string | null = null
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic()
      const calDelta = recommended.calories - current.calories
      const msg = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role:    'user',
          content: `A client weighing ${bwKg} kg is on a ${GOAL_LABELS[program.goal] ?? program.goal} training program (${program.days_per_week} days/week, ${program.duration_weeks} weeks).

Current macros: ${current.calories} kcal | ${current.protein_g}g protein | ${current.carbs_g}g carbs | ${current.fat_g}g fat
Recommended: ${recommended.calories} kcal (${calDelta >= 0 ? '+' : ''}${calDelta}) | ${recommended.protein_g}g protein | ${recommended.carbs_g}g carbs | ${recommended.fat_g}g fat

Write 2 sentences for the coach: (1) why these macros suit the training goal based on evidence, (2) one key implementation tip. Be specific. No preamble.`,
        }],
      })
      sync_notes = msg.content[0].type === 'text' ? msg.content[0].text.trim() : null
    } catch (err) {
      console.warn('[sync-macros] AI note failed:', err)
    }
  }

  return NextResponse.json({
    program: {
      id: program.id, name: program.name, goal: program.goal,
      goal_label: GOAL_LABELS[program.goal] ?? program.goal,
      days_per_week: program.days_per_week, duration_weeks: program.duration_weeks,
    },
    current,
    recommended,
    body_weight_kg: bwKg,
    sync_notes,
    delta: {
      calories:  recommended.calories  - current.calories,
      protein_g: recommended.protein_g - current.protein_g,
      carbs_g:   recommended.carbs_g   - current.carbs_g,
      fat_g:     recommended.fat_g     - current.fat_g,
    },
  })
}

// ─── PATCH — apply the sync ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nutrition_plan_id, program_id, calories, protein_g, carbs_g, fat_g, fibre_g, sync_notes } = await req.json()
  if (!nutrition_plan_id) return NextResponse.json({ error: 'Missing nutrition_plan_id' }, { status: 400 })

  const { error: updateErr } = await supabase
    .from('nutrition_plans_v2')
    .update({
      calories_target:   calories,
      protein_target:    protein_g,
      carbs_target:      carbs_g,
      fat_target:        fat_g,
      fibre_target:      fibre_g,
      linked_program_id: program_id ?? null,
      sync_notes:        sync_notes ?? null,
      last_synced_at:    new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })
    .eq('id', nutrition_plan_id)
    .eq('coach_id', user.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
