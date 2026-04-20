import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Propel',
  description: 'Terms and conditions for using the Propel coaching platform.',
}

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using the Propel platform, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>Propel provides software tools for fitness and health coaches to manage clients, deliver training programs and nutrition plans, track progress, communicate, and run their coaching business. The platform is provided on a subscription basis.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information when registering.</li>
              <li>You are responsible for keeping your password secure.</li>
              <li>You must be at least 18 years old to create an account.</li>
              <li>One person or entity may not maintain more than one free account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Subscriptions & Billing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed monthly or annually, in advance.</li>
              <li>You may cancel at any time; your access continues until the end of the billing period.</li>
              <li>We reserve the right to change pricing with 30 days' notice.</li>
              <li>Refunds are not provided for partial billing periods.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the platform for any illegal purpose</li>
              <li>Upload malicious code or attempt to compromise the security of the platform</li>
              <li>Resell or sublicense access to the platform without written permission</li>
              <li>Use the AI features to generate medical diagnoses or replace professional medical advice</li>
              <li>Harvest or scrape user data from the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Data</h2>
            <p>You own the data you upload to Propel. By using the platform, you grant us a limited licence to store and process that data solely for the purpose of providing the service. See our <Link href="/privacy-policy" className="text-[#0F7B8C] underline">Privacy Policy</Link> for full details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. AI-Generated Content</h2>
            <p>Propel uses AI (powered by OpenAI) to generate workout programs, meal plans, and form feedback. This content is provided as a starting point and should be reviewed by a qualified professional before delivery to clients. Propel is not liable for the accuracy or suitability of AI-generated content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p>The Propel platform, including its design, features, and code, is owned by Propel and protected by intellectual property laws. You may not copy, modify, or distribute any part of the platform without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Propel is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid us in the 12 months prior to the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may close your account at any time from your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to These Terms</h2>
            <p>We may update these terms from time to time. We will notify you by email at least 14 days before any material changes take effect. Continued use of the platform after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
            <p>Questions? Email <a href="mailto:hello@propelcoaches.com" className="text-[#0F7B8C] underline">hello@propelcoaches.com</a>.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© 2026 Propel. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 font-medium text-gray-900">Terms</Link>
            <Link href="/refund-policy" className="hover:text-gray-600">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
