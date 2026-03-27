export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  const serverClient = createClient()
  const { data: { user }, error } = await serverClient.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey)

  // Scope logs to this coach's own email + their clients' emails
  const [coachProfile, clientsResult] = await Promise.all([
    serverClient.from('profiles').select('email').eq('id', user.id).single(),
    admin.from('profiles').select('email').eq('coach_id', user.id).eq('role', 'client'),
  ])

  const scopedEmails = [
    coachProfile.data?.email,
    ...(clientsResult.data ?? []).map((c: { email: string }) => c.email),
  ].filter(Boolean) as string[]

  const [logsResult, countResult] = await Promise.all([
    admin
      .from('email_logs')
      .select('*')
      .in('recipient', scopedEmails)
      .order('sent_at', { ascending: false })
      .limit(50),
    admin
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .in('recipient', scopedEmails),
  ])

  return NextResponse.json({
    logs: logsResult.data ?? [],
    total: countResult.count ?? 0,
  })
}
