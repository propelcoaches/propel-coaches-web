import Link from 'next/link'

export const dynamic = 'force-dynamic'

type SuccessProps = {
  searchParams?: { plan?: string }
}

const PLAN_DISPLAY: Record<string, string> = {
  ai_starter: 'Starter',
  ai_pro: 'Pro',
  ai_elite: 'Elite',
}

// Public reverse-link back to the mobile app via the registered URL scheme
// in mobile-app/app.config.js (`scheme: 'propel'`). Tapping this on iOS
// closes Safari / the in-app browser and re-opens the Propel app on the
// home tab; AuthContext re-fetches the profile on next focus.
const APP_DEEP_LINK = 'propel://billing-success'

export default function BillingSuccess({ searchParams }: SuccessProps) {
  const plan = searchParams?.plan ?? ''
  const planLabel = PLAN_DISPLAY[plan] ?? 'Propel AI'

  return (
    <main className="min-h-screen bg-white px-6 py-20" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="Propel" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-gray-900">Propel</span>
        </div>

        <h1 className="mb-3 text-3xl font-black text-gray-900">You&apos;re on {planLabel}.</h1>
        <p className="mb-6 text-gray-600">
          Your subscription is active. Your 7-day free trial starts now — you&apos;ll be charged when it ends unless you cancel from your billing portal.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={APP_DEEP_LINK}
            className="inline-flex justify-center rounded-xl bg-[#245CFF] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3FDB]"
          >
            Open Propel app
          </a>
          <Link
            href="/billing"
            className="inline-flex justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
          >
            Manage subscription
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          On iPhone, tap &quot;Open Propel app&quot;. If nothing happens, the app is installed but the link couldn&apos;t auto-launch — open Propel manually and your new tier will appear within a few seconds.
        </p>
      </div>
    </main>
  )
}
