export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all data in parallel
  const [
    profileRes,
    clientsRes,
    programsRes,
    checkInsRes,
    nutritionRes,
    weightRes,
    messagesRes,
    habitsRes,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
    supabaseAdmin.from('profiles').select('*').eq('coach_id', user.id).eq('role', 'client'),
    supabaseAdmin.from('workout_programs').select('*').eq('coach_id', user.id),
    supabaseAdmin.from('check_ins').select('*').eq('coach_id', user.id),
    supabaseAdmin.from('nutrition_logs').select('*').eq('client_id', user.id),
    supabaseAdmin.from('weight_logs').select('*').eq('client_id', user.id),
    supabaseAdmin.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabaseAdmin.from('habit_templates').select('*').eq('coach_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    clients: clientsRes.data ?? [],
    workout_programs: programsRes.data ?? [],
    check_ins: checkInsRes.data ?? [],
    nutrition_logs: nutritionRes.data ?? [],
    weight_logs: weightRes.data ?? [],
    messages: messagesRes.data ?? [],
    habit_templates: habitsRes.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="propel-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
