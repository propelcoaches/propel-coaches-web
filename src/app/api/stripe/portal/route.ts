import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const { customerId, userId } = await request.json();

    let stripeCustomerId = customerId;

    // If customerId not provided, look up from authenticated user's profile
    if (!stripeCustomerId && userId) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.stripe_customer_id) {
        return NextResponse.json(
          { error: 'No Stripe customer found for this user' },
          { status: 404 }
        );
      }

      stripeCustomerId = profile.stripe_customer_id;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'Missing customerId or userId' },
        { status: 400 }
      );
    }

    // Create Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json(
      { url: session.url },
      { status: 200 }
    );
  } catch (error) {
    console.error('Billing portal session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
