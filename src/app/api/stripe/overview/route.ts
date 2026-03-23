import { NextResponse } from 'next/server'
import { stripeGet } from '@/lib/stripe'

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'no_key' })

  try {
    const now = Math.floor(Date.now() / 1000)
    const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)
    const startOfLastMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime() / 1000)

    const [allCharges, thisMonth, lastMonth, openInvoices, activeSubs] = await Promise.all([
      stripeGet('/charges', { limit: '100', 'created[gte]': String(now - 365 * 86400) }),
      stripeGet('/charges', { limit: '100', 'created[gte]': String(startOfMonth), status: 'succeeded' }),
      stripeGet('/charges', { limit: '100', 'created[gte]': String(startOfLastMonth), 'created[lt]': String(startOfMonth), status: 'succeeded' }),
      stripeGet('/invoices', { limit: '100', status: 'open' }),
      stripeGet('/subscriptions', { limit: '100', status: 'active' }),
    ])

    const totalRevenue = (allCharges.data ?? [])
      .filter((c: { status: string }) => c.status === 'succeeded')
      .reduce((s: number, c: { amount: number }) => s + c.amount, 0) / 100

    const thisMonthRevenue = (thisMonth.data ?? []).reduce((s: number, c: { amount: number }) => s + c.amount, 0) / 100
    const lastMonthRevenue = (lastMonth.data ?? []).reduce((s: number, c: { amount: number }) => s + c.amount, 0) / 100
    const outstandingAmount = (openInvoices.data ?? []).reduce((s: number, i: { amount_due: number }) => s + (i.amount_due ?? 0), 0) / 100
    const monthChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null

    return NextResponse.json({
      totalRevenue, thisMonthRevenue, lastMonthRevenue, monthChange,
      outstandingAmount, outstandingCount: (openInvoices.data ?? []).length,
      activeSubscriptions: (activeSubs.data ?? []).length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
