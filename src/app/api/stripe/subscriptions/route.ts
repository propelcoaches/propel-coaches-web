import { NextResponse } from 'next/server'
import { stripeGet } from '@/lib/stripe'

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'no_key' })

  try {
    const data = await stripeGet('/subscriptions', { limit: '50', status: 'active', expand: 'data.customer' })
    const subscriptions = (data.data ?? []).map((sub: {
      id: string; status: string
      customer: { name?: string; email?: string } | null
      items: { data: { price: { nickname: string | null; id: string; unit_amount: number; currency: string; recurring: { interval: string } } }[] }
      current_period_end: number; cancel_at_period_end: boolean; created: number
    }) => ({
      id: sub.id,
      status: sub.status,
      customerName: sub.customer?.name ?? 'Unknown',
      customerEmail: sub.customer?.email ?? '',
      plan: sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? 'Plan',
      amount: (sub.items.data[0]?.price?.unit_amount ?? 0) / 100,
      currency: (sub.items.data[0]?.price?.currency ?? 'aud').toUpperCase(),
      interval: sub.items.data[0]?.price?.recurring?.interval ?? 'month',
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      created: sub.created,
    }))
    return NextResponse.json({ subscriptions })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
