export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { resolveTierFeatures, type TierFeatures } from '@/lib/tier-features'
import { COACH_TIERS } from '@/lib/pricing'
import { sendEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

/**
 * POST /api/team/invite
 *
 * Owner (Scale-tier coach) invites an additional coach to their team.
 * Tier-gated (Scale only) and capped at `COACH_TIERS.coach_scale.teamSeats`.
 *
 * Body: { email: string, role?: 'coach' | 'admin' }
 *
 * Behaviour:
 *   1. Verify caller is on coach_scale tier.
 *   2. Ensure a `teams` row exists for them (lazy-create).
 *   3. Count current members + pending invitations. Reject if cap reached.
 *   4. Create a team_invitations row with a 7-day expiry.
 *   5. Send an invitation email with a signup link carrying the invite token.
 */

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createAdmin(url, key)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, role = 'coach' } = (await req.json().catch(() => ({}))) as {
    email?: string
    role?: 'coach' | 'admin'
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (!['coach', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const admin = adminClient()

  // 1. Tier gate — Scale only
  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_tier, name, full_name, email')
    .eq('id', user.id)
    .maybeSingle()
  const tf: TierFeatures = resolveTierFeatures((profile as any)?.subscription_tier ?? null)
  if (tf.coachTier !== 'coach_scale') {
    return NextResponse.json({
      error: 'TIER_LOCKED',
      message: 'Team seats are a Scale plan feature. Upgrade to add team coaches.',
      tier: (profile as any)?.subscription_tier ?? null,
    }, { status: 402 })
  }

  // 2. Ensure the caller has a teams row (lazy-create on first invite).
  let { data: team } = await admin
    .from('teams')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!team) {
    const ownerName = (profile as any)?.name || (profile as any)?.full_name || 'Coach'
    const { data: newTeam, error: createErr } = await admin
      .from('teams')
      .insert({
        name: `${ownerName}'s Team`,
        owner_id: user.id,
        plan: 'coach_scale',
        max_coaches: COACH_TIERS.coach_scale.teamSeats,
      })
      .select()
      .single()
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
    team = newTeam
    // Make the owner themselves a member as role=owner
    await admin.from('team_members').insert({
      team_id: team.id,
      coach_id: user.id,
      role: 'owner',
    })
  }

  // 3. Cap check — current members + open invites must be < max_coaches.
  const [{ count: memberCount }, { count: pendingInviteCount }] = await Promise.all([
    admin.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', team.id),
    admin.from('team_invitations').select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString()),
  ])

  const cap = team.max_coaches ?? COACH_TIERS.coach_scale.teamSeats
  const used = (memberCount ?? 0) + (pendingInviteCount ?? 0)
  if (used >= cap) {
    return NextResponse.json({
      error: 'TEAM_SEAT_CAP_REACHED',
      message: `Your team already has ${used} of ${cap} seats filled (members + pending invites).`,
      cap,
      used,
    }, { status: 409 })
  }

  // 4. Block duplicate invites to the same email.
  const { data: existingInvite } = await admin
    .from('team_invitations')
    .select('id, status, expires_at')
    .eq('team_id', team.id)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (existingInvite) {
    return NextResponse.json({
      error: 'INVITE_ALREADY_PENDING',
      message: 'An active invitation already exists for this email.',
    }, { status: 409 })
  }

  // 5. Create invitation (7-day expiry). Token goes in the email link.
  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: invite, error: inviteErr } = await admin
    .from('team_invitations')
    .insert({
      id: token,  // schema uses the id as the token for simplicity
      team_id: team.id,
      email: email.toLowerCase(),
      invited_by: user.id,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select()
    .single()
  if (inviteErr) {
    return NextResponse.json({ error: inviteErr.message }, { status: 500 })
  }

  // 6. Send the invite email.
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.propelcoaches.com'}/accept-invite/${token}`
  const ownerName = (profile as any)?.name || (profile as any)?.full_name || 'Your colleague'
  const teamName = team.name
  try {
    await sendEmail({
      to: email,
      subject: `You're invited to join ${teamName} on Propel`,
      html: `
        <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">You've been invited to join a Propel team</h1>
        <p style="color:#6b7280;font-size:15px;line-height:1.6;">${ownerName} has invited you to join <strong>${teamName}</strong> as a ${role} on Propel Coaches.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#245CFF;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;margin-top:8px;">Accept invitation →</a>
        <p style="color:#9ca3af;font-size:13px;margin-top:16px;">This invitation expires in 7 days. If you didn't expect this email you can safely ignore it.</p>
      `,
      emailType: 'team_invite',
    })
  } catch (e) {
    // Email failure is non-fatal — the invitation row exists; owner can resend.
    console.error('[team/invite] email send failed:', e)
  }

  return NextResponse.json({ invite, team })
}
