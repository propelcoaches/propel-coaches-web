export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  sendWelcomeEmail, sendDay3Email, sendDay7Email,
  sendTrialExpiring3DayEmail, sendTrialExpiring1DayEmail,
  sendTrialExpiredEmail, sendPaymentFailedEmail, sendWinBackEmail
} from '@/lib/email'

const emailHandlers: Record<string, (to: string, name: string, extra?: any) => Promise<boolean>> = {
  welcome: sendWelcomeEmail,
  day3: sendDay3Email,
  day7: (to, name, extra) => sendDay7Email(to, name, extra?.clientCount),
  trial_expiring_3day: sendTrialExpiring3DayEmail,
  trial_expiring_1day: sendTrialExpiring1DayEmail,
  trial_expired: sendTrialExpiredEmail,
  payment_failed: sendPaymentFailedEmail,
  win_back: sendWinBackEmail,
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, email, name, extra } = await req.json()
    const handler = emailHandlers[type]
    if (!handler) {
      return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    // Recipient must be the caller or one of their own clients — automated
    // sends to anyone else go through cron/email-sequences (CRON_SECRET).
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const [coachProfile, clientsResult] = await Promise.all([
      supabase.from('profiles').select('email').eq('id', user.id).single(),
      admin.from('profiles').select('email').eq('coach_id', user.id).eq('role', 'client'),
    ])
    const allowedRecipients = new Set(
      [user.email, coachProfile.data?.email, ...(clientsResult.data ?? []).map((c: { email: string }) => c.email)]
        .filter(Boolean)
        .map((e) => (e as string).toLowerCase())
    )
    if (typeof email !== 'string' || !allowedRecipients.has(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Recipient must be your own email or one of your clients' },
        { status: 403 }
      )
    }

    const success = await handler(email, name, extra)
    return NextResponse.json({ success })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
