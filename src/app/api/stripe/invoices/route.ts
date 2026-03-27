export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { stripeGet, stripePost } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'no_key' })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const invoiceId = searchParams.get('id')

  try {
    if (action === 'send' && invoiceId) {
      await stripePost(`/invoices/${invoiceId}/send`, {})
      return NextResponse.json({ success: true })
    }

    const data = await stripeGet('/invoices', { limit: '50', expand: 'data.customer' })
    const invoices = (data.data ?? []).map((inv: {
      id: string; number: string | null; amount_due: number; amount_paid: number
      currency: string; status: string | null
      customer: { name?: string; email?: string } | null
      due_date: number | null; created: number
      hosted_invoice_url: string | null; invoice_pdf: string | null
      description: string | null; lines: { data: { description: string }[] }
    }) => ({
      id: inv.id,
      number: inv.number,
      amount: (inv.amount_due ?? 0) / 100,
      amountPaid: (inv.amount_paid ?? 0) / 100,
      currency: (inv.currency ?? 'aud').toUpperCase(),
      status: inv.status,
      customerName: inv.customer?.name ?? 'Unknown',
      customerEmail: inv.customer?.email ?? '',
      dueDate: inv.due_date,
      created: inv.created,
      hostedUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf,
      description: inv.description ?? inv.lines?.data?.[0]?.description ?? '',
    }))
    return NextResponse.json({ invoices })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'no_key' })

  try {
    const body = await request.json()

    // Find or create customer
    const existing = await stripeGet('/customers', { email: body.email, limit: '1' })
    let customerId: string
    if (existing.data?.length > 0) {
      customerId = existing.data[0].id
    } else {
      const customer = await stripePost('/customers', { name: body.name, email: body.email })
      customerId = customer.id
    }

    // Create invoice
    const invoiceBody: Record<string, string> = {
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: '7',
    }
    if (body.description) invoiceBody.description = body.description
    const invoice = await stripePost('/invoices', invoiceBody)

    // Add line item
    await stripePost('/invoiceitems', {
      customer: customerId,
      invoice: invoice.id,
      amount: String(Math.round(body.amount * 100)),
      currency: 'aud',
      description: body.description ?? 'Coaching services',
    })

    // Finalize
    const finalised = await stripePost(`/invoices/${invoice.id}/finalize`, {})
    return NextResponse.json({ invoice: finalised })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
