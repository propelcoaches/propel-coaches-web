export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Lazy initialization — only evaluated at request time, not during build
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key)
}

// Price IDs keyed by plan → billing period
// Supports both separate monthly/annual env vars and a single fallback per plan
function getPriceIds(): Record<string, Record<string, string>> {
  return {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? process.env.STRIPE_PRICE_STARTER ?? '',
      annual:  process.env.STRIPE_PRICE_STARTER_ANNUAL  ?? process.env.STRIPE_PRICE_STARTER ?? '',
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? process.env.STRIPE_PRICE_PRO ?? '',
      annual:  process.env.STRIPE_PRICE_PRO_ANNUAL  ?? process.env.STRIPE_PRICE_PRO ?? '',
    },
    team: {
      monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? process.env.STRIPE_PRICE_CLINIC ?? '',
      annual:  process.env.STRIPE_PRICE_TEAM_ANNUAL  ?? process.env.STRIPE_PRICE_CLINIC ?? '',
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, billing = 'monthly' } = await req.json()
    const coachId = user.id

    const PRICE_IDS = getPriceIds()
    const priceId = PRICE_IDS[plan]?.[billing]
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for plan=${plan} billing=${billing}` }, { status: 400 })
    }

    const stripe = getStripeClient()
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { coachId, plan },
      },
      success_url: `${siteUrl}/dashboard?subscription=success`,
      cancel_url:  `${siteUrl}/pricing?cancelled=true`,
      metadata: { coachId, plan },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
