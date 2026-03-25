import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore - stripe package not installed, using placeholder
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
})

const PRICE_IDS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual',
  },
  elite: {
    monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY || 'price_elite_monthly',
    annual: process.env.STRIPE_PRICE_ELITE_ANNUAL || 'price_elite_annual',
  },
}

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, email, coachId } = await req.json()

    const priceId = PRICE_IDS[plan]?.[billing] || PRICE_IDS.pro.monthly

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { coachId, plan },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?cancelled=true`,
      metadata: { coachId, plan },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
