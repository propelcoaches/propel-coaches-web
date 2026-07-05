import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession } from '@/lib/stripe'
import { classifyTier } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

type BillingPageProps = {
  searchParams?: {
    source?: string
  }
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://propelcoaches.com'
}

function BillingError({ message }: { message: string }) {
  const supportEmail = process.env.SUPPORT_EMAIL_ADDRESS ?? process.env.SUPPORT_EMAIL ?? 'support@propelcoaches.com'

  return (
    <main className="min-h-screen bg-white px-6 py-20" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="Propel" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-gray-900">Propel</span>
        </div>
        <h1 className="mb-3 text-3xl font-black text-gray-900">Billing is unavailable</h1>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/billing"
            className="inline-flex justify-center rounded-xl bg-[#245CFF] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3FDB]"
          >
            Try again
          </Link>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
          >
            Contact support
          </a>
        </div>
      </div>
    </main>
  )
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const source = searchParams?.source
  if (source) console.log('[billing] source', source)

  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login?redirect=/billing')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id, subscription_tier, subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[billing] profile lookup failed', profileError)
    return <BillingError message="We could not load your billing profile. Try again, or contact support if this keeps happening." />
  }

  const stripeCustomerId = (profile as any)?.stripe_customer_id as string | null | undefined
  const subscriptionTier = (profile as any)?.subscription_tier as string | null | undefined

  if (stripeCustomerId) {
    let portalUrl: string | null = null

    try {
      const session = await createBillingPortalSession({
        customerId: stripeCustomerId,
        returnUrl: `${getSiteUrl()}/billing`,
      })
      portalUrl = session.url
    } catch (error) {
      console.error('[billing] portal session failed', error)
      return <BillingError message="We could not open the Stripe billing portal. Try again, or contact support if this keeps happening." />
    }

    redirect(portalUrl)
  }

  if (classifyTier(subscriptionTier) === 'ai') {
    redirect('/pricing?source=ios-billing&plan=ai')
  }

  redirect('/pricing?source=billing')
}
