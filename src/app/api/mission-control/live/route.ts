export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { buildReviewActivityItems } from '@/lib/mission-control/actions.mjs'
import {
  hasMissionControlCookieAccess,
  missionControlAccessErrorResponse,
  resolveMissionControlOwner,
} from '@/lib/mission-control/server'
import {
  buildAuditActivityItems,
  buildAuditDecisionItems,
  buildCommitActivityItems,
  buildTaskDecisionItems,
  buildTaskStaleItems,
  normalizeLiveTask,
} from '@/lib/mission-control/normalizers.mjs'
import type { LiveTask, MissionControlLivePayload } from '@/lib/mission-control/types'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Mission Control live source unavailable' }, { status: 503 })
  }

  if (!hasMissionControlCookieAccess()) return missionControlAccessErrorResponse()

  const ownerResult = await resolveMissionControlOwner(url, key)
  if (ownerResult.ok === false) return ownerResult.response

  const coachId = encodeURIComponent(ownerResult.owner.id)
  const [tasks, audits, commits, reviews] = await Promise.all([
    fetchSupabase(url, key, `tasks?select=*,client:profiles!tasks_client_id_fkey(id,name,email)&coach_id=eq.${coachId}&order=created_at.desc&limit=100`),
    fetchSupabase(url, key, 'audit_reports?select=*&order=created_at.desc&limit=30'),
    fetchSupabase(url, key, 'commit_events?select=*&order=created_at.desc&limit=50'),
    fetchSupabase(url, key, `mission_control_reviews?select=id,review_key,source,outcome,note,created_at&coach_id=eq.${coachId}&order=created_at.desc&limit=50`),
  ])

  const liveTasks = tasks.map(normalizeLiveTask) as LiveTask[]
  const reviewedKeys = new Set(reviews.map(review => String(review.review_key || '')).filter(Boolean))
  const reviewed = buildReviewActivityItems(reviews)
  const decisions = [
    ...buildTaskDecisionItems(liveTasks),
    ...buildAuditDecisionItems(audits),
  ]
    .filter(item => !reviewedKeys.has(item.review_key))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))

  const payload: MissionControlLivePayload = {
    generated_at: new Date().toISOString(),
    tasks: liveTasks,
    decisions,
    activity: [
      ...reviewed,
      ...buildAuditActivityItems(audits),
      ...buildCommitActivityItems(commits),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 80),
    stale: buildTaskStaleItems(liveTasks),
    reviewed,
  }

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
}

async function fetchSupabase(url: string, key: string, path: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
