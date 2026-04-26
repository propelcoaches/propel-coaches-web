export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendDay3Email,
  sendDay7Email,
  sendTrialExpiring3DayEmail,
  sendTrialExpiring1DayEmail,
  sendTrialExpiredEmail,
} from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function adminClient() {
  return createClient(supabaseUrl, serviceRoleKey);
}

function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[email-sequences] Missing CRON_SECRET');
    return NextResponse.json({ error: 'Missing CRON_SECRET' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

function daysAgo(n: number): { start: string; end: string } {
  const end = new Date();
  end.setDate(end.getDate() - n);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function alreadySent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  email: string,
  emailType: string
): Promise<boolean> {
  const { data } = await supabase
    .from('email_logs')
    .select('id')
    .eq('recipient', email)
    .eq('email_type', emailType)
    .limit(1)
    .single();
  return !!data;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const supabase = adminClient();
  let sent = 0;
  let errors = 0;

  // Fetch all coaches with email, name, and signup date
  const { data: coaches, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at, subscription_status')
    .eq('role', 'coach')
    .not('email', 'is', null);

  if (fetchError || !coaches) {
    console.error('[email-sequences] Failed to fetch coaches:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch coaches' }, { status: 500 });
  }

  for (const coach of coaches) {
    if (!coach.email) continue;
    const name = coach.full_name || 'Coach';
    const signupDate = new Date(coach.created_at);
    const now = new Date();
    const daysSinceSignup = Math.floor(
      (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
      // Day 3 email
      if (daysSinceSignup === 3) {
        if (!(await alreadySent(supabase, coach.email, 'day3'))) {
          await sendDay3Email(coach.email, name);
          sent++;
        }
      }

      // Day 7 email (includes client count)
      if (daysSinceSignup === 7) {
        if (!(await alreadySent(supabase, coach.email, 'day7'))) {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('coach_id', coach.id)
            .eq('role', 'client');
          await sendDay7Email(coach.email, name, count ?? 0);
          sent++;
        }
      }

      // Trial expiring in 3 days (day 11)
      if (daysSinceSignup === 11) {
        const isActive = coach.subscription_status === 'active';
        if (!isActive && !(await alreadySent(supabase, coach.email, 'trial_3day'))) {
          await sendTrialExpiring3DayEmail(coach.email, name);
          sent++;
        }
      }

      // Trial expiring tomorrow (day 13)
      if (daysSinceSignup === 13) {
        const isActive = coach.subscription_status === 'active';
        if (!isActive && !(await alreadySent(supabase, coach.email, 'trial_1day'))) {
          await sendTrialExpiring1DayEmail(coach.email, name);
          sent++;
        }
      }

      // Trial expired (day 15+, not yet subscribed)
      if (daysSinceSignup === 15) {
        const isActive = ['active', 'trialing'].includes(coach.subscription_status ?? '');
        if (!isActive && !(await alreadySent(supabase, coach.email, 'trial_expired'))) {
          await sendTrialExpiredEmail(coach.email, name);
          sent++;
        }
      }
    } catch (err) {
      console.error(`[email-sequences] Error processing coach ${coach.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ sent, errors, total_coaches: coaches.length });
}
