export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { ADMIN_PIN_COOKIE, adminPinCookieValue } from '@/lib/admin-pin'

/**
 * POST /api/admin/login — verify the admin PIN server-side.
 * Compares against the server-only ADMIN_PIN env (never NEXT_PUBLIC_) and
 * issues an HttpOnly cookie that admin/layout.tsx checks before rendering.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Same admin gate as app/admin/layout.tsx
  const adminIds = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  let isAdmin = adminIds.includes(user.id)
  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminPin = process.env.ADMIN_PIN
  if (!adminPin) {
    return NextResponse.json({ error: 'Admin PIN not configured' }, { status: 500 })
  }

  // PINs are low-entropy — throttle guesses hard.
  if (!checkRateLimit(`admin-pin:${user.id}`, 5, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 })
  }

  const { pin } = await req.json()
  const submitted = createHash('sha256').update(String(pin ?? '')).digest()
  const expected = createHash('sha256').update(adminPin).digest()
  if (!timingSafeEqual(submitted, expected)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_PIN_COOKIE, adminPinCookieValue(user.id)!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  })
  return res
}
