import { createHash } from 'crypto'

export const ADMIN_PIN_COOKIE = 'admin_pin_session'

/**
 * Value stored in the HttpOnly PIN cookie. Derived from the server-only
 * ADMIN_PIN, so it can't be forged without knowing the PIN. Returns null
 * when no ADMIN_PIN is configured (PIN gate disabled — the Supabase admin
 * check in admin/layout.tsx remains the lock).
 */
export function adminPinCookieValue(userId: string): string | null {
  const pin = process.env.ADMIN_PIN
  if (!pin) return null
  return createHash('sha256').update(`${pin}:${userId}`).digest('hex')
}
