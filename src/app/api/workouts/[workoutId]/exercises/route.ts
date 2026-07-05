import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { workoutId: string } }

/** Resolve whether the caller (coach or client) can access this workout */
async function resolveAccess(
  supabase: ReturnType<typeof createClient>,
  workoutId: string,
  userId: string
): Promise<{ allowed: boolean; isCoach: boolean }> {
  const { data } = await supabase
    .from('program_workouts')
    .select('program:programs(coach_id, client_id, status)')
    .eq('id', workoutId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (data as any)?.program
  const isCoach  = p?.coach_id === userId
  const isClient = p?.client_id === userId && ['active', 'completed'].includes(p?.status)

  return { allowed: isCoach || isClient, isCoach }
}

/**
 * GET /api/workouts/:workoutId/exercises
 * Returns all exercises for this workout, ordered by order_index.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = await resolveAccess(supabase, params.workoutId, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

  const { data, error } = await supabase
    .from('program_workout_exercises')
    .select('*, exercise:exercises(*)')
    .eq('workout_id', params.workoutId)
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercises: data })
}

/**
 * POST /api/workouts/:workoutId/exercises
 * Coach-only. Adds an exercise to the workout.
 *
 * Body: {
 *   exercise_id, order_index?, sets?, reps_min?, reps_max?,
 *   weight?, weight_unit?, rest_seconds?, rpe?, tempo?, notes?,
 *   superset_id?
 * }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { isCoach } = await resolveAccess(supabase, params.workoutId, user.id)
  if (!isCoach) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    exercise_id, superset_id, order_index,
    sets, reps_min, reps_max,
    weight, weight_unit, rest_seconds, rpe, tempo, notes,
  } = body

  if (!exercise_id) {
    return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 })
  }

  // Auto-assign order_index if not provided
  let resolvedOrder = order_index
  if (resolvedOrder == null) {
    const { count } = await supabase
      .from('program_workout_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', params.workoutId)
    resolvedOrder = count ?? 0
  }

  const { data, error } = await supabase
    .from('program_workout_exercises')
    .insert({
      workout_id:   params.workoutId,
      exercise_id,
      superset_id:  superset_id  ?? null,
      order_index:  resolvedOrder,
      sets:         sets         ?? 3,
      reps_min:     reps_min     ?? 8,
      reps_max:     reps_max     ?? 12,
      weight:       weight       ?? null,
      weight_unit:  weight_unit  ?? 'kg',
      rest_seconds: rest_seconds ?? 90,
      rpe:          rpe          ?? null,
      tempo:        tempo        ?? null,
      notes:        notes        ?? null,
    })
    .select('*, exercise:exercises(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercise: data }, { status: 201 })
}
