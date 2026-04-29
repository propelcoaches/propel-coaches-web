export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  hasMissionControlCookieAccess,
  missionControlAccessErrorResponse,
  resolveMissionControlOwner,
} from '@/lib/mission-control/server'
import {
  extractTaskIdFromReviewKey,
  validateMissionControlAction,
} from '@/lib/mission-control/actions.mjs'

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Mission Control actions unavailable' }, { status: 503 })
  }

  if (!hasMissionControlCookieAccess()) return missionControlAccessErrorResponse()

  const ownerResult = await resolveMissionControlOwner(url, serviceKey)
  if (ownerResult.ok === false) return ownerResult.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = validateMissionControlAction(body)
  if (action.ok === false) return NextResponse.json({ error: action.error }, { status: action.status })
  const { reviewKey, source, outcome, note } = action.value

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (source === 'supabase_task' && outcome === 'approved') {
    const taskId = extractTaskIdFromReviewKey(reviewKey)
    if (!taskId) return NextResponse.json({ error: 'Invalid task review key' }, { status: 400 })

    const { data: updatedTask, error: taskError } = await admin
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId)
      .eq('coach_id', ownerResult.owner.id)
      .select('id')
      .maybeSingle()

    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 })
    if (!updatedTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const { error } = await admin
    .from('mission_control_reviews')
    .upsert({
      coach_id: ownerResult.owner.id,
      review_key: reviewKey,
      source,
      outcome,
      note,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id,review_key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
