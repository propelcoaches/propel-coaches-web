import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification error:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabaseUserId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;

      if (supabaseUserId && session.customer) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: session.customer,
            subscription_status: 'trialing',
            plan: plan || null,
          })
          .eq('id', supabaseUserId);

        if (updateError) {
          console.error('Failed to update profile after checkout:', updateError);
        }
      }
    }

    // Handle customer.subscription.updated
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const newStatus = mapSubscriptionStatus(subscription.status);

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: newStatus,
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to update subscription status:', updateError);
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'canceled',
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to update subscription status to canceled:', updateError);
      }
    }

    // Handle invoice.payment_succeeded
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const paidAt = new Date(invoice.paid_at! * 1000).toISOString();

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          last_payment_date: paidAt,
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to update last payment date:', updateError);
      }
    }

    // Handle invoice.payment_failed
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'past_due',
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('Failed to update subscription status to past_due:', updateError);
      }

      // TODO: Send payment failure email notification here
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to acknowledge receipt and prevent Stripe retries
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

/**
 * Maps Stripe subscription status to our internal status strings
 */
function mapSubscriptionStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid: 'unpaid',
    paused: 'paused',
  };

  return statusMap[stripeStatus] || stripeStatus;
}
