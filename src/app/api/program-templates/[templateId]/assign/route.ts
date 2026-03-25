import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/program-templates/[templateId]/assign
 *
 * Quick-assigns a template to a client by:
 *  1. Expanding the template structure into real program_workouts + exercises
 *  2. Deactivating any current active program for the client
 *  3. Returning the newly created program
 *
 * Body: { clientId, programName?, startDate? }
 */
export async function POST(req: NextRequest, { params }: { params: { templateId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { clientId, programName, startDate } = body

  if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

  // Verify client belongs to this coach
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('coach_id, full_name')
    .eq('id', clientId)
    .single()

  if (!clientProfile || clientProfile.coach_id !== user.id) {
    return NextResponse.json({ error: 'Client not found or not yours' }, { status: 403 })
  }

  // Fetch template (own or public)
  const { data: template, error: tErr } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', params.templateId)
    .single()

  if (tErr || !template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  if (template.coach_id !== user.id && !template.is_public) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const structure: {
    notes?: string
    workouts?: {
      week_number: number
      day_number: number
      name: string
      notes?: string
      exercises?: {
        order_index: number
        sets: number
        reps_min: number
        reps_max: number
        weight?: number | null
        weight_unit?: string
        rest_seconds?: number
        rpe?: number | null
        tempo?: string | null
        notes?: string | null
        exercise: { id: string; name: string }
      }[]
    }[]
  } = template.structure ?? {}

  // ── 1. Deactivate existing active program ──────────────────────
  await supabase
    .from('programs')
    .update({ status: 'completed' })
    .eq('client_id', clientId)
    .eq('status', 'active')

  // ── 2. Create the program record ──────────────────────────────
  const { data: program, error: progErr } = await supabase
    .from('programs')
    .insert({
      coach_id:          user.id,
      client_id:         clientId,
      template_id:       template.id,
      name:              programName ?? template.name,
      description:       template.description,
      duration_weeks:    template.duration_weeks,
      days_per_week:     template.days_per_week,
      goal:              template.goal,
      difficulty:        template.difficulty,
      status:            'active',
      started_at:        startDate ?? new Date().toISOString(),
      notes:             structure.notes ?? null,
    })
    .select()
    .single()

  if (progErr || !program) {
    return NextResponse.json({ error: progErr?.message ?? 'Failed to create program' }, { status: 500 })
  }

  // ── 3. Create workouts + exercises ────────────────────────────
  const workouts = structure.workouts ?? []

  for (const wo of workouts) {
    const { data: workout, error: woErr } = await supabase
      .from('program_workouts')
      .insert({
        program_id:  program.id,
        week_number: wo.week_number,
        day_number:  wo.day_number,
        name:        wo.name,
        notes:       wo.notes ?? null,
      })
      .select('id')
      .single()

    if (woErr || !workout) continue

    const exercises = wo.exercises ?? []
    if (exercises.length === 0) continue

    const exerciseRows = exercises.map((ex, i) => ({
      workout_id:   workout.id,
      exercise_id:  ex.exercise.id,
      order_index:  ex.order_index ?? i,
      sets:         ex.sets,
      reps_min:     ex.reps_min,
      reps_max:     ex.reps_max,
      weight_kg:    ex.weight ?? null,
      weight_unit:  ex.weight_unit ?? 'kg',
      rest_seconds: ex.rest_seconds ?? 90,
      rpe:          ex.rpe ?? null,
      tempo:        ex.tempo ?? null,
      notes:        ex.notes ?? null,
    }))

    await supabase.from('program_workout_exercises').insert(exerciseRows)
  }

  return NextResponse.json({ program }, { status: 201 })
}
