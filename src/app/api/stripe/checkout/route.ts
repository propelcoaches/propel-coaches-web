export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';


// Lazy initialization — only evaluated at request time, not during build.
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key)
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createClient(url, key)
}

function getPlanToPriceId(): Record<string, string> {
  return {
    ai_starter:    process.env.STRIPE_PRICE_AI_STARTER    ?? '',
    ai_pro:        process.env.STRIPE_PRICE_AI_PRO        ?? '',
    ai_elite:      process.env.STRIPE_PRICE_AI_ELITE      ?? '',
    coach_starter: process.env.STRIPE_PRICE_COACH_STARTER ?? '',
    coach_pro:     process.env.STRIPE_PRICE_COACH_PRO     ?? '',
    coach_scale:   process.env.STRIPE_PRICE_COACH_SCALE   ?? '',
  }
}

function isAIPlan(plan: string): boolean {
  return plan.startsWith('ai_')
}
export async function POST(request: NextRequest) {
  const stripe = getStripeClient()
  const supabaseAdmin = getSupabaseAdmin()
  const planToPriceId = getPlanToPriceId()
  try {
    const { email, name, plan, profession, password } = await request.json();

    if (!email || !name || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, plan' },
        { status: 400 }
      );
    }

    // Validate types and lengths
    if (typeof email !== 'string' || email.length > 254) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 255) {
      return NextResponse.json({ error: 'name must be a non-empty string under 255 characters' }, { status: 400 });
    }
    if (profession !== undefined && (typeof profession !== 'string' || profession.length > 100)) {
      return NextResponse.json({ error: 'profession must be a string under 100 characters' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'password must be between 8 and 128 characters' }, { status: 400 });
    }

    const normalizedPlan = plan.toLowerCase();
    const priceId = planToPriceId[normalizedPlan];
    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      );
    }

    const aiPlan = isAIPlan(normalizedPlan);
    const role = aiPlan ? 'client' : 'coach';
    const trialDays = aiPlan ? 7 : 14;

    // Get or create Supabase user
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    let supabaseUserId: string;

    if (existingUser) {
      supabaseUserId = existingUser.id;
    } else {
      // Create a new user in Supabase
      const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createAuthError || !authUser.user) {
        console.error('Supabase auth error:', createAuthError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      supabaseUserId = authUser.user.id;

      // Create profile for the new user
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: supabaseUserId,
          email,
          name,
          role,
          profession: profession || null,
        });

      if (createProfileError) {
        console.error('Supabase profile creation error:', createProfileError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        supabase_user_id: supabaseUserId,
        profession: profession || 'not_provided',
      },
    });

    // Create Checkout Session with trial days based on plan type
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?setup=complete`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=true`,
      metadata: {
        supabase_user_id: supabaseUserId,
        profession: profession || 'not_provided',
        plan: normalizedPlan,
        role,
      },
    });

    return NextResponse.json(
      { url: session.url },
      { status: 200 }
    );
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
