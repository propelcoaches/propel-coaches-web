import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Plan pricing map (in cents)
const planPricing: Record<string, number> = {
  starter: 4900, // $49.00
  pro: 9900, // $99.00
  clinic: 19900, // $199.00
};

interface CoachData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  plan?: string;
  subscription_status?: string;
  subscription_id?: string;
  stripe_customer_id?: string;
  clients_count: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization via header
    const adminSecret = request.headers.get('x-admin-secret');
    const adminPassword = process.env.ADMIN_PASSWORD || 'propel-admin-2026';

    if (adminSecret !== adminPassword) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all coaches with their profile and subscription data
    const { data: coaches, error: coachError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        plan,
        subscription_status,
        subscription_id,
        stripe_customer_id,
        created_at
      `)
      .eq('role', 'coach')
      .order('created_at', { ascending: false });

    if (coachError) {
      console.error('Error fetching coaches:', coachError);
      return NextResponse.json(
        { error: 'Failed to fetch coaches' },
        { status: 500 }
      );
    }

    // For each coach, get their clients count
    const coachesWithClients = await Promise.all(
      (coaches || []).map(async (coach) => {
        const { count, error: countError } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', coach.id);

        if (countError) {
          console.error(`Error counting clients for coach ${coach.id}:`, countError);
        }

        return {
          ...coach,
          clients_count: count || 0,
        } as CoachData;
      })
    );

    // Calculate stats
    const totalCoaches = coachesWithClients.length;
    const activeSubscriptions = coachesWithClients.filter(
      (c) => c.subscription_status === 'active' || c.subscription_status === 'trialing'
    ).length;
    const trialCoaches = coachesWithClients.filter(
      (c) => c.subscription_status === 'trialing'
    ).length;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = coachesWithClients
      .filter((c) => c.subscription_status === 'active' || c.subscription_status === 'trialing')
      .reduce((sum, coach) => {
        const plan = coach.plan?.toLowerCase() || 'starter';
        const monthlyPrice = planPricing[plan] || planPricing['starter'];
        return sum + monthlyPrice / 100; // Convert cents to dollars
      }, 0);

    // Fetch recent activity (signups in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSignups } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at, role')
      .eq('role', 'coach')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalCoaches,
        activeSubscriptions,
        mrr: parseFloat(mrr.toFixed(2)),
        trialCoaches,
      },
      coaches: coachesWithClients,
      recentSignups: recentSignups || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
