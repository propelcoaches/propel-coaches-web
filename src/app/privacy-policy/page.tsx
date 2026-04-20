import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Propel',
  description: 'How Propel collects, uses, and protects your data.',
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
            <p>Propel is a coaching management platform for fitness coaches, personal trainers, dietitians, and exercise physiologists. We provide tools for managing clients, delivering programs, tracking nutrition, and communicating — all in one place.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account information:</strong> Name, email address, and password when you register.</li>
              <li><strong>Profile data:</strong> Business name, branding preferences, and coaching details you provide.</li>
              <li><strong>Client data:</strong> Information coaches enter about their clients (check-ins, measurements, programs, notes). This data belongs to the coach and their clients.</li>
              <li><strong>Payment information:</strong> Processed securely via Stripe. We do not store card numbers.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and actions taken within the platform to help us improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and operate the Propel platform</li>
              <li>To process payments and manage your subscription</li>
              <li>To send transactional emails (receipts, password resets, weekly summaries)</li>
              <li>To improve the platform based on aggregated usage patterns</li>
              <li>To respond to support requests</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Storage & Security</h2>
            <p>Your data is stored on Supabase infrastructure hosted in secure data centres. We use industry-standard encryption (TLS in transit, AES-256 at rest). Access to production data is restricted to authorised personnel only.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services to operate Propel:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Supabase</strong> — database and authentication</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>OpenAI</strong> — AI-powered features (workout and meal plan generation, form analysis)</li>
              <li><strong>Vercel</strong> — application hosting</li>
            </ul>
            <p className="mt-3">Each provider has their own privacy policy governing how they handle data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:hello@propelcoaches.com" className="text-[#0F7B8C] underline">hello@propelcoaches.com</a> or use the Privacy &amp; Data section in your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. When we do, we'll update the date at the top and notify active users by email if the changes are material.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:hello@propelcoaches.com" className="text-[#0F7B8C] underline">hello@propelcoaches.com</a>.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© 2026 Propel. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600 font-medium text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/refund-policy" className="hover:text-gray-600">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
