export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY')
const stripe = new Stripe(stripeKey)

const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  elite: {
    monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ELITE_ANNUAL,
  },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, billing } = await req.json()
    const email = user.email
    const coachId = user.id

    const priceId = PRICE_IDS[plan]?.[billing]
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for plan=${plan} billing=${billing}` }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { coachId, plan },
      },
      success_url: `${siteUrl}/dashboard?subscription=success`,
      cancel_url: `${siteUrl}/pricing?cancelled=true`,
      metadata: { coachId, plan },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
