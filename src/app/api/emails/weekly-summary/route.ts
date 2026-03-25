export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Use service role for cron jobs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// This endpoint is called by a cron job every Sunday at 8am
// Configure in vercel.json: { "crons": [{ "path": "/api/emails/weekly-summary", "schedule": "0 8 * * 0" }] }

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekStartISO = weekStart.toISOString();

    // Get all active clients with their coach info
    const { data: clients } = await supabase
      .from('profiles')
      .select('id, full_name, email, coach_id, weekly_email_enabled')
      .eq('role', 'client')
      .eq('weekly_email_enabled', true);

    if (!clients || clients.length === 0) {
      return NextResponse.json({ message: 'No clients to email', count: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const client of clients) {
      try {
        const summary = await buildClientSummary(client.id, weekStartISO);

        // Get coach info
        let coachName = 'Your Coach';
        if (client.coach_id) {
          const { data: coach } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', client.coach_id)
            .single();
          if (coach) coachName = coach.full_name;
        }

        const html = buildEmailHtml(client.full_name, coachName, summary);

        await resend.emails.send({
          from: 'Propel <noreply@propelcoach.com>',
          to: client.email,
          subject: `Your Week in Review — ${summary.workoutsCompleted} workouts, ${summary.streakDays} day streak 💪`,
          html,
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send email to ${client.email}:`, err);
        failed++;
      }
    }

    return NextResponse.json({ message: 'Weekly summaries sent', sent, failed });
  } catch (error) {
    console.error('Weekly summary error:', error);
    return NextResponse.json({ error: 'Failed to send summaries' }, { status: 500 });
  }
}

interface WeeklySummary {
  workoutsCompleted: number;
  workoutsPlanned: number;
  avgCalories: number;
  avgProtein: number;
  weightChange: string;
  currentWeight: string;
  streakDays: number;
  checkInSubmitted: boolean;
  prsHit: number;
  waterAvgLiters: number;
  topExercise: string;
}

async function buildClientSummary(clientId: string, weekStartISO: string): Promise<WeeklySummary> {
  // Parallel fetch all relevant data
  const [workoutsRes, nutritionRes, weightsRes, checkInRes, prsRes] = await Promise.all([
    // Workouts completed this week
    supabase
      .from('workout_sessions')
      .select('id, completed')
      .eq('client_id', clientId)
      .gte('created_at', weekStartISO),

    // Nutrition logs this week
    supabase
      .from('nutrition_logs')
      .select('calories, protein_g, water_ml')
      .eq('client_id', clientId)
      .gte('date', weekStartISO),

    // Weight entries this week
    supabase
      .from('weight_logs')
      .select('weight, created_at')
      .eq('client_id', clientId)
      .gte('created_at', weekStartISO)
      .order('created_at', { ascending: true }),

    // Check-in this week
    supabase
      .from('check_ins')
      .select('id')
      .eq('client_id', clientId)
      .gte('created_at', weekStartISO)
      .limit(1),

    // PRs hit this week
    supabase
      .from('personal_records')
      .select('id, exercise_name')
      .eq('client_id', clientId)
      .gte('created_at', weekStartISO),
  ]);

  const workouts = workoutsRes.data || [];
  const nutrition = nutritionRes.data || [];
  const weights = weightsRes.data || [];
  const checkIns = checkInRes.data || [];
  const prs = prsRes.data || [];

  // Calculate metrics
  const workoutsCompleted = workouts.filter((w) => w.completed).length;
  const avgCalories = nutrition.length > 0
    ? Math.round(nutrition.reduce((sum, n) => sum + (n.calories || 0), 0) / nutrition.length)
    : 0;
  const avgProtein = nutrition.length > 0
    ? Math.round(nutrition.reduce((sum, n) => sum + (n.protein_g || 0), 0) / nutrition.length)
    : 0;
  const waterAvg = nutrition.length > 0
    ? Math.round((nutrition.reduce((sum, n) => sum + (n.water_ml || 0), 0) / nutrition.length) / 100) / 10
    : 0;

  let weightChange = 'No data';
  let currentWeight = 'N/A';
  if (weights.length >= 2) {
    const first = weights[0].weight;
    const last = weights[weights.length - 1].weight;
    const diff = last - first;
    weightChange = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    currentWeight = `${last.toFixed(1)}`;
  } else if (weights.length === 1) {
    currentWeight = `${weights[0].weight.toFixed(1)}`;
    weightChange = '0.0';
  }

  // Fetch planned workouts from active program
  const { data: activeProgram } = await supabase
    .from('workout_programs')
    .select('days_per_week')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .limit(1)
    .single();
  const workoutsPlanned = activeProgram?.days_per_week || 0;

  // Streak: count consecutive days with completed workouts (working backwards from today)
  const { data: recentSessions } = await supabase
    .from('workout_sessions')
    .select('created_at')
    .eq('client_id', clientId)
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .limit(30);

  let streakDays = 0;
  if (recentSessions && recentSessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = new Set(
      recentSessions.map((s) => {
        const d = new Date(s.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (sessionDates.has(key)) {
        streakDays++;
      } else if (i > 0) {
        break; // streak broken
      }
    }
  }

  return {
    workoutsCompleted,
    workoutsPlanned,
    avgCalories,
    avgProtein,
    weightChange,
    currentWeight,
    streakDays,
    checkInSubmitted: checkIns.length > 0,
    prsHit: prs.length,
    waterAvgLiters: waterAvg,
    topExercise: prs.length > 0 ? prs[0].exercise_name : '',
  };
}

function buildEmailHtml(clientName: string, coachName: string, summary: WeeklySummary): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Summary</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:32px;text-align:center;color:white;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:24px;">Your Week in Review</h1>
      <p style="margin:0;opacity:0.9;font-size:14px;">Hey ${clientName}, here's how you did this week!</p>
    </div>

    <!-- Stats Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:white;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#4f46e5;">${summary.workoutsCompleted}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Workouts Done</div>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#7c3aed;">${summary.streakDays}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Day Streak</div>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#059669;">${summary.avgCalories}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Avg Calories</div>
      </div>
      <div style="background:white;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#0891b2;">${summary.avgProtein}g</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Avg Protein</div>
      </div>
    </div>

    <!-- Weight + Water -->
    <div style="background:white;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h2 style="margin:0 0 16px;font-size:16px;color:#111827;">Body Metrics</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">Current Weight</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-size:14px;">${summary.currentWeight} lbs</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">Weight Change</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;font-size:14px;color:${
            summary.weightChange.startsWith('+') ? '#ef4444' : summary.weightChange.startsWith('-') ? '#22c55e' : '#6b7280'
          };">${summary.weightChange} lbs</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">Avg Water Intake</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;font-size:14px;">${summary.waterAvgLiters}L / day</td>
        </tr>
        ${summary.prsHit > 0 ? `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">New PRs</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#f59e0b;font-size:14px;">🏆 ${summary.prsHit} PR${summary.prsHit > 1 ? 's' : ''}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Check-in status -->
    <div style="background:${summary.checkInSubmitted ? '#f0fdf4' : '#fef2f2'};border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:14px;color:${summary.checkInSubmitted ? '#166534' : '#991b1b'};font-weight:500;">
        ${summary.checkInSubmitted
          ? '✅ Check-in submitted this week — great job staying consistent!'
          : '📝 Don\'t forget to submit your weekly check-in!'}
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.propelcoach.com'}" style="display:inline-block;background:#4f46e5;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
        Open Propel App
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#9ca3af;font-size:12px;">
      <p>Sent by ${coachName} via Propel</p>
      <p style="margin-top:8px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color:#9ca3af;">Unsubscribe from weekly summaries</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
