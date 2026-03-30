export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const GOAL_LABELS: Record<string, string> = {
  fat_loss:        'Fat Loss',
  hypertrophy:     'Hypertrophy / Muscle Building',
  strength:        'Strength & Power',
  endurance:       'Endurance',
  general_fitness: 'General Fitness',
  athletic_performance: 'Athletic Performance',
}

/**
 * POST /api/marketplace/generate-listing
 * Body: { program_id }
 * Returns: { title, short_description, description, tags }
 *
 * Generates a compelling marketplace listing copy from a coach's program details.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { program_id } = await req.json()
  if (!program_id) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  const { data: program, error: progErr } = await supabase
    .from('programs')
    .select(`
      name, description, goal, difficulty, duration_weeks, days_per_week, notes,
      workouts:program_workouts(
        week_number, day_number, name,
        exercises:program_workout_exercises(
          sets, reps_min, reps_max, weight,
          exercise:exercises(name, category, muscle_groups, equipment)
        )
      )
    `)
    .eq('id', program_id)
    .eq('coach_id', user.id)
    .single()

  if (progErr || !program) {
    return NextResponse.json({ error: 'Program not found or not yours' }, { status: 404 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  // Build compact workout summary (top 3 workouts, top 4 exercises each)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workoutSummary = ((program.workouts as any[]) ?? [])
    .slice(0, 3)
    .map((w: any) => {
      const exList = (w.exercises ?? []).slice(0, 4)
        .map((e: any) => e.exercise?.name ?? '?')
        .join(', ')
      return `Week ${w.week_number} Day ${w.day_number} – ${w.name}: ${exList}`
    })
    .join('\n')

  const prompt = `You are a conversion copywriter for fitness products. Write compelling marketplace copy for this training program.

PROGRAM DETAILS:
Name: ${program.name}
Goal: ${GOAL_LABELS[program.goal] ?? program.goal}
Duration: ${program.duration_weeks} weeks, ${program.days_per_week} days/week
Difficulty: ${program.difficulty ?? 'intermediate'}
${program.description ? `Description: ${program.description}` : ''}
${program.notes ? `Coach notes: ${program.notes}` : ''}

SAMPLE WORKOUTS:
${workoutSummary || 'No workouts added yet'}

Write this as a JSON object with EXACTLY these fields:
{
  "title": "<compelling 6-12 word title that includes the key benefit>",
  "short_description": "<one punchy sentence, max 120 chars, for the listing card>",
  "description": "<3-4 paragraphs: 1) what problem it solves + who it's for, 2) what makes it unique, 3) what results to expect, 4) what's included>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"]
}

Be specific, evidence-based, and motivating. No fluff. No generic phrases like "take your training to the next level".`

  try {
    const anthropic = new Anthropic()
    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages:  [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (err) {
    console.error('[generate-listing] Error:', err)
    return NextResponse.json({ error: 'Failed to generate listing copy' }, { status: 500 })
  }
}
