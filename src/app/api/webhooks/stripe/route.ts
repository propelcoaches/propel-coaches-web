export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeKey = process.env.STRIPE_SECRET_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!stripeKey || !supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables')
}

const stripe = new Stripe(stripeKey)
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0]?.price.id || ''
          const tier = getPlanTier(priceId)
          await supabase.from('profiles').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_tier: tier,
            subscription_end_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
          }).eq('stripe_customer_id', customerId)
          await logBillingEvent(customerId, 'subscription_started', session.amount_total || 0)
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const tier = getPlanTier(sub.items.data[0]?.price.id || '')
        await supabase.from('profiles').update({
          subscription_status: sub.status === 'active' ? 'active' : sub.status,
          subscription_tier: tier,
          subscription_end_date: new Date((sub as any).current_period_end * 1000).toISOString(),
        }).eq('stripe_customer_id', sub.customer as string)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase.from('profiles').update({
          subscription_status: 'cancelled',
          subscription_tier: null,
          subscription_end_date: null,
        }).eq('stripe_customer_id', sub.customer as string)
        await logBillingEvent(sub.customer as string, 'subscription_cancelled', 0)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if ((invoice as any).subscription) {
          const sub = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
          await supabase.from('profiles').update({
            subscription_status: 'active',
            subscription_end_date: new Date((sub as any).current_period_end * 1000).toISOString(),
          }).eq('stripe_customer_id', invoice.customer as string)
        }
        await logBillingEvent(invoice.customer as string, 'payment_succeeded', invoice.amount_paid || 0)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', invoice.customer as string)
        await logBillingEvent(invoice.customer as string, 'payment_failed', invoice.amount_due || 0)
        break
      }
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        console.log(`Trial ending soon for customer: ${sub.customer}`)
        await logBillingEvent(sub.customer as string, 'trial_ending_soon', 0)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  return NextResponse.json({ received: true })
}

function getPlanTier(priceId: string): string {
  const tierMap: Record<string, string> = {}
  if (process.env.STRIPE_PRICE_STARTER) tierMap[process.env.STRIPE_PRICE_STARTER] = 'starter'
  if (process.env.STRIPE_PRICE_PRO) tierMap[process.env.STRIPE_PRICE_PRO] = 'pro'
  if (process.env.STRIPE_PRICE_ELITE) tierMap[process.env.STRIPE_PRICE_ELITE] = 'elite'
  return tierMap[priceId] ?? 'unknown'
}

async function logBillingEvent(customerId: string, eventType: string, amount: number) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    await supabase.from('billing_events').insert({
      coach_id: profile.id,
      event_type: eventType,
      amount_cents: amount,
      stripe_customer_id: customerId,
      created_at: new Date().toISOString(),
    })
  }
}
