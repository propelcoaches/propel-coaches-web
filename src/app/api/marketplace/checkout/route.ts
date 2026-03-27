export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY')
const stripe = new Stripe(stripeKey)

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { listing_id } = await req.json()
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const admin = createAdminClient(supabaseUrl, supabaseKey)

  const { data: listing, error: listingErr } = await admin
    .from('marketplace_listings')
    .select('id, title, price_cents, status')
    .eq('id', listing_id)
    .eq('status', 'published')
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if (listing.price_cents === 0) {
    return NextResponse.json({ error: 'Use /api/marketplace/clone for free programs' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: listing.price_cents,
            product_data: { name: listing.title },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'marketplace',
        listing_id: listing.id,
        coach_id: user.id,
      },
      success_url: `${siteUrl}/marketplace?purchase_success=1`,
      cancel_url: `${siteUrl}/marketplace`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
