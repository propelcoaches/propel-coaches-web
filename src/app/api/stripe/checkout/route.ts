import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const planToPriceId: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  pro: process.env.STRIPE_PRICE_PRO!,
  clinic: process.env.STRIPE_PRICE_CLINIC!,
};

export async function POST(request: NextRequest) {
  try {
    const { email, name, plan, profession } = await request.json();

    if (!email || !name || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, plan' },
        { status: 400 }
      );
    }

    const priceId = planToPriceId[plan.toLowerCase()];
    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      );
    }

    // Get or create Supabase user
    const { data: existingUser, error: getUserError } = await supabaseAdmin
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

    // Create Checkout Session with 14-day trial
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
        trial_period_days: 14,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?setup=complete`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=true`,
      metadata: {
        supabase_user_id: supabaseUserId,
        profession: profession || 'not_provided',
        plan,
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
