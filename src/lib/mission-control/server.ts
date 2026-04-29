import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  MISSION_CONTROL_COOKIE_NAME,
  isMissionControlAccessKey,
  isMissionControlAccessKeyConfigured,
  missionControlOwnerEmail,
} from '@/lib/mission-control/auth.mjs'

export type MissionControlOwner = {
  id: string
  email: string | null
}

export function missionControlAccessErrorResponse() {
  if (!isMissionControlAccessKeyConfigured()) {
    return NextResponse.json({ error: 'Mission Control access key is not configured' }, { status: 503 })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function hasMissionControlCookieAccess() {
  return isMissionControlAccessKey(cookies().get(MISSION_CONTROL_COOKIE_NAME)?.value)
}

export async function resolveMissionControlOwner(
  url: string,
  serviceKey: string,
): Promise<{ ok: true; owner: MissionControlOwner } | { ok: false; response: NextResponse }> {
  const configuredOwnerId = process.env.MISSION_CONTROL_OWNER_ID?.trim()
  if (configuredOwnerId) {
    return { ok: true, owner: { id: configuredOwnerId, email: missionControlOwnerEmail() } }
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const email = missionControlOwnerEmail()
  const { data, error } = await admin
    .from('profiles')
    .select('id,email')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (error) return { ok: false, response: NextResponse.json({ error: error.message }, { status: 500 }) }
  if (!data?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: `Mission Control owner not found for ${email}` }, { status: 503 }),
    }
  }

  return { ok: true, owner: { id: String(data.id), email: typeof data.email === 'string' ? data.email : email } }
}
