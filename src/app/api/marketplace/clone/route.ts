export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id } = await req.json()
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, supabaseKey)

  // Fetch the listing
  const { data: listing, error: listingErr } = await admin
    .from('marketplace_listings')
    .select('*, program:programs(id, name, description, goal, difficulty, duration_weeks, days_per_week)')
    .eq('id', listing_id)
    .eq('status', 'published')
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Only allow free cloning via this endpoint
  if (listing.price_cents !== 0) {
    return NextResponse.json({ error: 'Paid programs require checkout' }, { status: 400 })
  }

  const sourceProgram = listing.program
  if (!sourceProgram) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  // Clone program header (no client assignment — coach adds to their library)
  const { data: newProgram, error: progErr } = await admin
    .from('programs')
    .insert({
      coach_id: user.id,
      name: sourceProgram.name,
      description: sourceProgram.description,
      goal: sourceProgram.goal,
      difficulty: sourceProgram.difficulty,
      duration_weeks: sourceProgram.duration_weeks,
      days_per_week: sourceProgram.days_per_week,
      status: 'draft',
      marketplace_source_id: listing_id,
    })
    .select('id')
    .single()

  if (progErr || !newProgram) {
    console.error('Clone program error:', progErr)
    return NextResponse.json({ error: 'Failed to clone program' }, { status: 500 })
  }

  // Fetch workouts from source program
  const { data: workouts } = await admin
    .from('program_workouts')
    .select('id, week_number, day_number, name, notes')
    .eq('program_id', sourceProgram.id)
    .order('week_number')
    .order('day_number')

  if (workouts && workouts.length > 0) {
    // Clone each workout
    for (const workout of workouts) {
      const { data: newWorkout } = await admin
        .from('program_workouts')
        .insert({
          program_id: newProgram.id,
          week_number: workout.week_number,
          day_number: workout.day_number,
          name: workout.name,
          notes: workout.notes,
        })
        .select('id')
        .single()

      if (!newWorkout) continue

      // Clone exercises for this workout
      const { data: exercises } = await admin
        .from('program_workout_exercises')
        .select('*')
        .eq('workout_id', workout.id)
        .order('order_index')

      if (exercises && exercises.length > 0) {
        await admin.from('program_workout_exercises').insert(
          exercises.map(({ id: _id, workout_id: _wid, ...ex }) => ({
            ...ex,
            workout_id: newWorkout.id,
          }))
        )
      }
    }
  }

  // Increment purchase_count on the listing
  await admin
    .from('marketplace_listings')
    .update({ purchase_count: (listing.purchase_count ?? 0) + 1 })
    .eq('id', listing_id)

  return NextResponse.json({ success: true, program_id: newProgram.id })
}
