import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_PIN_COOKIE, adminPinCookieValue } from '@/lib/admin-pin'
import AdminShell from './AdminShell'

// Server-side gate: a Supabase session with admin access is required before
// the admin shell (and its client-side PIN prompt) even renders. Mirrors the
// admin check in /api/admin/* routes.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
  if (!isAdmin) redirect('/dashboard')

  // Second factor: HttpOnly cookie issued by /api/admin/login after a
  // server-side PIN check. No ADMIN_PIN configured → gate disabled.
  const expectedCookie = adminPinCookieValue(user.id)
  const pinVerified =
    expectedCookie === null ||
    cookies().get(ADMIN_PIN_COOKIE)?.value === expectedCookie

  return <AdminShell pinVerified={pinVerified}>{children}</AdminShell>
}
