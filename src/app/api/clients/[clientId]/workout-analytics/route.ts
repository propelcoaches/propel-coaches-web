import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, addDays, format, subWeeks, differenceInDays } from 'date-fns'

export const dynamic = 'force-dynamic'

function epley1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg
  return parseFloat((weightKg * (1 + reps / 30)).toFixed(2))
}

function weekKey(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/**
 * GET /api/clients/[clientId]/workout-analytics?weeks=12
 *
 * Returns aggregated training analytics for a client:
 *   exercise_history, weekly_volume, adherence, session_feed,
 *   prescribed_vs_actual, personal_bests, inactivity_days
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = params

  // Verify coach relationship (or self-access)
  if (clientId !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', clientId)
      .single()
    if (!profile || profile.coach_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { searchParams } = new URL(req.url)
  const weeks = Math.min(parseInt(searchParams.get('weeks') ?? '12'), 52)
  const cutoff = subWeeks(new Date(), weeks).toISOString()

  // ── Fetch all workout logs in range ──────────────────────────
  const { data: logs, error: logsError } = await supabase
    .from('workout_logs')
    .select(`
      id, logged_at, duration_minutes, workout_id, notes,
      workout:program_workouts(
        id, name, week_number, day_number,
        exercises:program_workout_exercises(
          exercise_id, sets, reps_min, reps_max, weight_kg, weight_unit,
          exercise:exercises(id, name)
        )
      ),
      sets:workout_log_sets(
        id, exercise_id, set_number, reps_completed, weight_kg, is_warmup,
        exercise:exercises(id, name)
      )
    `)
    .eq('client_id', clientId)
    .gte('logged_at', cutoff)
    .order('logged_at', { ascending: false })
    .limit(200)

  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 })

  // ── Personal bests ────────────────────────────────────────────
  const { data: pbs } = await supabase
    .from('personal_bests')
    .select('*, exercise:exercises(id, name)')
    .eq('client_id', clientId)
    .order('estimated_1rm_kg', { ascending: false })

  // ── Active program for adherence schedule ─────────────────────
  const { data: activeProgram } = await supabase
    .from('programs')
    .select('id, name, started_at, workouts:program_workouts(id, name, week_number, day_number)')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single()

  const safeLogs: any[] = logs ?? []

  // ── Exercise history ──────────────────────────────────────────
  // Best e1RM per exercise per calendar day
  const exerciseMap = new Map<string, { name: string; data: Map<string, { date: string; e1rm: number; weight_kg: number; reps: number }> }>()

  for (const log of safeLogs) {
    const dateKey = format(new Date(log.logged_at), 'yyyy-MM-dd')
    for (const s of (log.sets ?? []) as any[]) {
      if (s.is_warmup || !s.weight_kg || !s.reps_completed) continue
      const exId = s.exercise_id
      const exName = (s.exercise as any)?.name ?? 'Unknown'
      const e1rm = epley1RM(s.weight_kg, s.reps_completed)
      if (!exerciseMap.has(exId)) exerciseMap.set(exId, { name: exName, data: new Map() })
      const exData = exerciseMap.get(exId)!
      const existing = exData.data.get(dateKey)
      if (!existing || e1rm > existing.e1rm) {
        exData.data.set(dateKey, { date: dateKey, e1rm, weight_kg: s.weight_kg, reps: s.reps_completed })
      }
    }
  }

  const exercise_history = Array.from(exerciseMap.entries())
    .map(([id, ex]) => ({
      exercise_id: id,
      exercise_name: ex.name,
      data: Array.from(ex.data.values()).sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.data.length - a.data.length)

  // ── Weekly volume ─────────────────────────────────────────────
  const weekVolumeMap = new Map<string, { total_sets: number; tonnage_kg: number; week_label: string }>()
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = startOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 })
    const key = format(weekStart, 'yyyy-MM-dd')
    weekVolumeMap.set(key, { total_sets: 0, tonnage_kg: 0, week_label: format(weekStart, 'MMM d') })
  }
  for (const log of safeLogs) {
    const wk = weekKey(new Date(log.logged_at))
    const entry = weekVolumeMap.get(wk)
    if (!entry) continue
    for (const s of (log.sets ?? []) as any[]) {
      if (s.is_warmup) continue
      entry.total_sets++
      if (s.weight_kg && s.reps_completed) {
        entry.tonnage_kg = parseFloat((entry.tonnage_kg + s.weight_kg * s.reps_completed).toFixed(1))
      }
    }
  }
  const weekly_volume = Array.from(weekVolumeMap.entries()).map(([week, v]) => ({ week, ...v }))

  // ── Adherence calendar ────────────────────────────────────────
  const today = new Date()
  const calStart = subWeeks(today, weeks)
  const logDates = new Set(safeLogs.map((l) => format(new Date(l.logged_at), 'yyyy-MM-dd')))

  const scheduledDates = new Set<string>()
  if (activeProgram?.started_at && (activeProgram.workouts as any[])?.length) {
    const programStart = new Date(activeProgram.started_at)
    for (const wo of (activeProgram.workouts as any[])) {
      const offset = (wo.week_number - 1) * 7 + (wo.day_number - 1)
      const d = addDays(programStart, offset)
      if (d >= calStart && d <= today) scheduledDates.add(format(d, 'yyyy-MM-dd'))
    }
  }

  const totalDays = differenceInDays(today, calStart)
  const adherence: { date: string; status: string }[] = []
  for (let i = 0; i <= totalDays; i++) {
    const date = addDays(calStart, i)
    const ds = format(date, 'yyyy-MM-dd')
    const isPast = date <= today
    const isScheduled = scheduledDates.has(ds)
    const isLogged = logDates.has(ds)
    let status = 'rest'
    if (!isPast) status = isScheduled ? 'upcoming' : 'rest'
    else if (isLogged) status = 'completed'
    else if (isScheduled) status = 'missed'
    adherence.push({ date: ds, status })
  }

  // ── Session feed ──────────────────────────────────────────────
  const session_feed = safeLogs.slice(0, 20).map((log: any) => {
    const exMap = new Map<string, { name: string; sets: any[] }>()
    for (const s of (log.sets ?? []) as any[]) {
      const name = (s.exercise as any)?.name ?? 'Unknown'
      if (!exMap.has(s.exercise_id)) exMap.set(s.exercise_id, { name, sets: [] })
      exMap.get(s.exercise_id)!.sets.push({
        set_number: s.set_number,
        reps: s.reps_completed,
        weight_kg: s.weight_kg,
        is_warmup: s.is_warmup,
      })
    }
    return {
      id: log.id,
      logged_at: log.logged_at,
      duration_minutes: log.duration_minutes,
      workout_name: (log.workout as any)?.name ?? null,
      exercises: Array.from(exMap.values()),
    }
  })

  // ── Prescribed vs actual ──────────────────────────────────────
  const prescribed_vs_actual = safeLogs
    .filter((log: any) => {
      const wo = log.workout as any
      return Array.isArray(wo?.exercises) && wo.exercises.length > 0
    })
    .slice(0, 10)
    .map((log: any) => {
      const wo = log.workout as any
      const exercises = (wo.exercises as any[]).map((pwe: any) => {
        const actualSets = ((log.sets ?? []) as any[]).filter(
          (s: any) => s.exercise_id === pwe.exercise_id && !s.is_warmup
        )
        const reps = actualSets.filter((s: any) => s.reps_completed != null).map((s: any) => s.reps_completed as number)
        const wts = actualSets.filter((s: any) => s.weight_kg != null).map((s: any) => s.weight_kg as number)
        return {
          exercise_name: (pwe.exercise as any)?.name ?? 'Unknown',
          prescribed: {
            sets: pwe.sets ?? 0,
            reps_min: pwe.reps_min ?? 0,
            reps_max: pwe.reps_max ?? pwe.reps_min ?? 0,
            weight_kg: pwe.weight_kg ?? null,
          },
          actual: {
            sets_completed: actualSets.length,
            avg_reps: reps.length > 0 ? parseFloat((reps.reduce((a, b) => a + b, 0) / reps.length).toFixed(1)) : null,
            avg_weight_kg: wts.length > 0 ? parseFloat((wts.reduce((a, b) => a + b, 0) / wts.length).toFixed(1)) : null,
          },
        }
      })
      return {
        workout_name: wo.name ?? 'Unknown',
        logged_at: log.logged_at,
        exercises,
      }
    })

  // ── Personal bests ────────────────────────────────────────────
  const personal_bests = (pbs ?? []).map((pb: any) => ({
    exercise_name: (pb.exercise as any)?.name ?? 'Unknown',
    reps: pb.reps,
    weight_kg: pb.weight_kg,
    estimated_1rm_kg: pb.estimated_1rm_kg,
    achieved_at: pb.achieved_at,
  }))

  // ── Inactivity ────────────────────────────────────────────────
  const lastLog = safeLogs[0]
  const last_session_date = lastLog ? format(new Date(lastLog.logged_at), 'yyyy-MM-dd') : null
  const inactivity_days = last_session_date
    ? differenceInDays(today, new Date(last_session_date))
    : 999

  return NextResponse.json({
    exercise_history,
    weekly_volume,
    adherence,
    session_feed,
    prescribed_vs_actual,
    personal_bests,
    inactivity_days,
    last_session_date,
  })
}
