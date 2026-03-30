export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/team/analytics
 * Returns aggregate metrics for the coach's team.
 * Only coaches who are a member of a team can call this.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve team membership
  const { data: memberRow } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('coach_id', user.id)
    .limit(1)
    .single()

  if (!memberRow) return NextResponse.json({ error: 'Not a team member' }, { status: 403 })

  const { team_id } = memberRow

  // All coach IDs in this team
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('coach_id')
    .eq('team_id', team_id)

  const coachIds = (teamMembers ?? []).map(m => m.coach_id)

  if (coachIds.length === 0) {
    return NextResponse.json({ total_clients: 0, active_clients: 0, active_programs: 0, checkins_7d: 0, per_coach: [] })
  }

  // Run all queries in parallel
  const [clientsRes, programsRes, checkinsRes, perCoachClientsRes] = await Promise.all([
    // Total clients across all coaches
    supabase
      .from('profiles')
      .select('id, coach_id', { count: 'exact', head: false })
      .in('coach_id', coachIds)
      .eq('role', 'client'),

    // Active programs across all coaches
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .in('coach_id', coachIds)
      .eq('status', 'active'),

    // Check-ins in last 7 days
    supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .in('coach_id', coachIds)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    // Per-coach client count (for breakdown)
    supabase
      .from('profiles')
      .select('coach_id')
      .in('coach_id', coachIds)
      .eq('role', 'client'),
  ])

  // Build per-coach breakdown
  const clientCountByCoach: Record<string, number> = {}
  for (const row of perCoachClientsRes.data ?? []) {
    clientCountByCoach[row.coach_id] = (clientCountByCoach[row.coach_id] ?? 0) + 1
  }

  // Fetch coach display names for the breakdown
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', coachIds)

  const per_coach = coachIds.map(id => ({
    coach_id:    id,
    name:        profiles?.find(p => p.id === id)?.full_name ?? 'Coach',
    avatar_url:  profiles?.find(p => p.id === id)?.avatar_url ?? null,
    client_count: clientCountByCoach[id] ?? 0,
  })).sort((a, b) => b.client_count - a.client_count)

  return NextResponse.json({
    total_clients:   clientsRes.count ?? 0,
    active_programs: programsRes.count ?? 0,
    checkins_7d:     checkinsRes.count ?? 0,
    per_coach,
  })
}
