import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/program-templates
 * Returns templates the coach owns + any public templates.
 * Query params: goal, difficulty, is_public
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const goal       = searchParams.get('goal')
  const difficulty = searchParams.get('difficulty')
  const isPublic   = searchParams.get('is_public')

  // Own + public (RLS handles this via OR policy)
  let query = supabase
    .from('program_templates')
    .select('id, name, description, duration_weeks, days_per_week, goal, difficulty, is_public, coach_id, ai_generated, created_at, updated_at')
    .order('name')

  if (goal)       query = query.eq('goal', goal)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (isPublic)   query = query.eq('is_public', isPublic === 'true')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ templates: data })
}

/**
 * POST /api/program-templates
 * Coach-only. Creates a reusable template.
 *
 * To create from an existing program, pass `from_program_id` and the
 * handler will snapshot the program's workouts + exercises into `structure`.
 *
 * Body: {
 *   name, description?, duration_weeks?, days_per_week?,
 *   goal?, difficulty?, is_public?,
 *   from_program_id?   // snapshot an existing program
 *   structure?         // or provide structure directly
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name, description, duration_weeks, days_per_week,
    goal, difficulty, is_public, from_program_id, structure,
  } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  let resolvedStructure = structure ?? {}

  // Snapshot an existing program into the template structure
  if (from_program_id) {
    const { data: prog, error: progErr } = await supabase
      .from('programs')
      .select(`
        name, description, duration_weeks, days_per_week, goal, difficulty, notes,
        workouts:program_workouts(
          week_number, day_number, name, notes,
          exercises:program_workout_exercises(
            order_index, sets, reps_min, reps_max, weight, weight_unit,
            rest_seconds, rpe, tempo, notes,
            exercise:exercises(id, name, category, muscle_groups, equipment, movement_type)
          )
        )
      `)
      .eq('id', from_program_id)
      .eq('coach_id', user.id)
      .single()

    if (progErr || !prog) {
      return NextResponse.json({ error: 'Program not found or not yours' }, { status: 404 })
    }

    resolvedStructure = prog
  }

  const { data, error } = await supabase
    .from('program_templates')
    .insert({
      coach_id:       user.id,
      name,
      description:    description    ?? null,
      duration_weeks: duration_weeks ?? resolvedStructure.duration_weeks ?? 4,
      days_per_week:  days_per_week  ?? resolvedStructure.days_per_week  ?? 3,
      goal:           goal           ?? resolvedStructure.goal           ?? 'general_fitness',
      difficulty:     difficulty     ?? resolvedStructure.difficulty     ?? 'intermediate',
      is_public:      is_public      ?? false,
      structure:      resolvedStructure,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
