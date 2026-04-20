import Link from 'next/link'

export const metadata = {
  title: 'Refund & Cancellation Policy — Propel',
  description: 'How to cancel your Propel subscription, request a refund, and manage billing.',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Propel" className="w-8 h-8" />
            <span className="font-semibold text-gray-900">Propel</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Back to home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Free Trial</h2>
            <p>All Propel subscription plans include a 7-day free trial. You will not be charged during the trial period. If you do not cancel before the trial ends, your subscription will automatically convert to a paid subscription at the plan price you selected and your payment method will be charged.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Auto-Renewal</h2>
            <p>Propel subscriptions renew automatically at the end of each billing period (monthly or annual) unless cancelled beforehand. Your payment method on file will be charged the current plan price at each renewal. Pricing may change with at least 30 days&apos; notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How to Cancel</h2>
            <p>You can cancel your Propel subscription at any time. Your access continues until the end of the current billing period; no further charges are made after cancellation.</p>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">In the Propel iOS app</h3>
            <p>Open <strong>Settings → Manage Subscription</strong> and follow the prompts. If you subscribed through the App Store, the app will take you to your iOS subscription settings. You can also open those settings directly:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>On your iPhone, open the <strong>Settings</strong> app, tap your name at the top, then tap <strong>Subscriptions</strong>.</li>
              <li>Select Propel and tap <strong>Cancel Subscription</strong>.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">On the web</h3>
            <p>If you subscribed through our website, you can manage or cancel your subscription from the Propel web dashboard at <Link href="/dashboard/settings" className="text-[#0F7B8C] underline">Settings → Billing</Link>, which opens the Stripe customer portal. Alternatively, email <a href="mailto:support@propelcoaches.com" className="text-[#0F7B8C] underline">support@propelcoaches.com</a> and we will cancel on your behalf within 2 business days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Partial billing periods:</strong> Propel does not provide refunds or credits for unused time in a billing period. When you cancel, you retain access until the end of the period you paid for.</li>
              <li><strong>Annual subscriptions:</strong> We do not pro-rate refunds for cancelled annual subscriptions. Consider the monthly plan if you would prefer shorter commitments.</li>
              <li><strong>Technical issues:</strong> If a technical problem prevented you from using Propel for an extended period and our team cannot resolve it, contact us and we will evaluate a refund on a case-by-case basis.</li>
              <li><strong>Apple App Store purchases:</strong> Refund requests for subscriptions purchased through the App Store must be made directly to Apple via <a href="https://reportaproblem.apple.com" className="text-[#0F7B8C] underline" target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a>. Apple makes the final decision on App Store refunds; Propel cannot issue them on Apple&apos;s behalf.</li>
              <li><strong>Stripe (web) purchases:</strong> To request a refund for a web subscription, email <a href="mailto:support@propelcoaches.com" className="text-[#0F7B8C] underline">support@propelcoaches.com</a> within 7 days of the charge and include your account email and the reason for the request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Failed Payments</h2>
            <p>If a renewal payment fails, we will notify you by email and retry the charge for up to 7 days. If payment cannot be collected, your subscription will be paused and you will lose access to paid features until payment is resolved. You will not be charged for the period during which access was paused.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Changing Plans</h2>
            <p>You can upgrade or downgrade your plan at any time from Settings. Upgrades take effect immediately and you will be charged a prorated amount for the remainder of the current period. Downgrades take effect at the next renewal.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Australian Consumer Law</h2>
            <p>If you are a consumer in Australia, nothing in this Refund &amp; Cancellation Policy excludes, restricts, or modifies any consumer guarantees, rights, or remedies you have under the Australian Consumer Law or similar statutes that cannot be excluded, restricted, or modified by agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>Questions about billing, cancellations, or refunds? Email <a href="mailto:support@propelcoaches.com" className="text-[#0F7B8C] underline">support@propelcoaches.com</a>. We aim to respond within 2 business days.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© 2026 Propel. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/refund-policy" className="hover:text-gray-600 font-medium text-gray-900">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
