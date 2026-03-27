export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { stripeGet } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'no_key' })

  try {
    const data = await stripeGet('/charges', { limit: '50', expand: 'data.customer' })
    const payments = (data.data ?? []).map((c: {
      id: string; amount: number; currency: string; status: string
      description: string; customer: { name?: string; email?: string } | null
      billing_details: { name?: string; email?: string }
      created: number; receipt_url: string | null
    }) => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency.toUpperCase(),
      status: c.status,
      description: c.description,
      customerName: c.customer?.name ?? c.billing_details?.name ?? 'Unknown',
      customerEmail: c.customer?.email ?? c.billing_details?.email ?? '',
      date: c.created,
      receiptUrl: c.receipt_url,
    }))
    return NextResponse.json({ payments })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
