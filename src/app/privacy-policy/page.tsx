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
        <p className="text-gray-500 mb-10">Last updated: 20 April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <p>Propel Coaches ("we", "our", "us") is a fitness and coaching platform operated by Charles Bettiol, based in Australia. This Privacy Policy explains what personal information we collect when you use the Propel mobile app or coach web dashboard, how we use it, who we share it with, and the rights you have over it.</p>
            <p className="mt-3">We are bound by the <strong>Privacy Act 1988 (Cth)</strong> and the <strong>Australian Privacy Principles (APPs)</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What we collect</h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.1 Account information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name, email address, password</li>
              <li>Subscription plan and payment method (Stripe processes the payment — we never see your full card number)</li>
              <li>Date of birth (used to verify you are 16 or older and to calculate appropriate calorie targets)</li>
              <li>Gender, height, weight, target weight</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.2 Health information (sensitive information under APP 3)</h3>
            <p>When you use Propel as a client, you choose to share information classified as <strong>sensitive information</strong> under the Privacy Act:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Medical conditions you flag during onboarding (e.g. hypertension, diabetes, cardiac, thyroid)</li>
              <li>Pregnancy or postpartum status</li>
              <li>History of an eating disorder</li>
              <li>Recent surgery</li>
              <li>Current medications</li>
              <li>Allergies and dietary restrictions</li>
              <li>Injuries and physical limitations</li>
              <li>Workout logs (exercises, sets, reps, weights, RPE)</li>
              <li>Nutrition logs (food items, calories, macronutrients, fibre)</li>
              <li>Body measurements and progress photos</li>
              <li>Weekly check-in responses (energy, sleep quality, stress, mood, training difficulty, body weight)</li>
              <li>Mental wellbeing context you share with the AI coach during conversations</li>
            </ul>
            <p className="mt-3"><strong>You provide this sensitive information voluntarily, and by submitting it you give us your explicit consent</strong> to handle it for the purposes in section 2. You can withdraw consent at any time by deleting your account (see section 8). Withdrawing consent will limit or end your ability to use the service.</p>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.3 Communications</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Messages you send through in-app chat with your human coach (if assigned) or the AI coach</li>
              <li>Support emails you send us</li>
              <li>Push notification preferences</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.4 Device and usage data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device type, operating system version, app version</li>
              <li>Push notification tokens (if you opt in)</li>
              <li>Screens viewed, features used, session duration (used to improve the service)</li>
              <li>IP address (only logged transiently for security purposes)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">1.5 Coach-side information (web dashboard)</h3>
            <p>If you sign up as a coach, we additionally collect:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Business name, branding preferences</li>
              <li>Information you enter about your clients (the client owns this data, but we store it)</li>
              <li>Booking and appointment details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How we use your information</h2>
            <p>We use your information only for these purposes:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Create and manage your account</li>
              <li>Generate personalised AI workout programs and meal plans (see section 4)</li>
              <li>Provide AI coaching responses based on your data (see section 4)</li>
              <li>Track your progress over time and provide insights</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send transactional notifications you've opted into (workout reminders, check-in prompts, weekly summaries)</li>
              <li>Operate the platform safely (see section 5 on AI safety monitoring)</li>
              <li>Improve the service based on aggregated usage</li>
              <li>Respond to support requests</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">We <strong>do not sell</strong> your personal information to anyone.<br />We <strong>do not use</strong> your data for advertising or marketing profiling.<br />Your data is <strong>not used to train any AI provider's models</strong> — see section 4.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Who we share with</h2>
            <p>We share information only with the following parties, and only as needed to provide the service:</p>
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Provider</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Purpose</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Where they store data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Supabase</strong></td><td className="px-3 py-2">Database hosting, authentication</td><td className="px-3 py-2"><strong>Singapore</strong></td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Stripe</strong></td><td className="px-3 py-2">Payment processing</td><td className="px-3 py-2">United States</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Apple</strong></td><td className="px-3 py-2">App distribution, in-app subscriptions, push notifications</td><td className="px-3 py-2">United States</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Expo</strong></td><td className="px-3 py-2">Push notification delivery</td><td className="px-3 py-2">United States</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Resend</strong></td><td className="px-3 py-2">Transactional email delivery</td><td className="px-3 py-2">United States</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Anthropic</strong></td><td className="px-3 py-2">AI features (coach chat, program generation, meal plan generation, form check)</td><td className="px-3 py-2">United States</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>OpenAI</strong></td><td className="px-3 py-2">AI features (recipe generation, food photo recognition)</td><td className="px-3 py-2">United States</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2"><strong>Vercel</strong></td><td className="px-3 py-2">Web dashboard hosting</td><td className="px-3 py-2">United States / global edge</td></tr>
                  <tr><td className="px-3 py-2"><strong>Sentry</strong></td><td className="px-3 py-2">Error monitoring</td><td className="px-3 py-2">United States</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">If you are assigned to a human coach, that coach will see your workout logs, nutrition logs, check-ins, progress photos, messages, and the safety concerns flagged by the AI coach. They are bound by their own professional obligations.</p>
            <p className="mt-3">We may disclose information when required by law (e.g. subpoena, court order, lawful government request) or where necessary to protect a person's life or physical safety.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. AI processing</h2>
            <p>Our AI features (program generation, meal plan generation, AI coach chat, food photo analysis, exercise form analysis, recipe generation) send the relevant subset of your fitness, nutrition, health, and conversation data to AI providers (Anthropic and OpenAI) so they can generate a personalised response.</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>AI providers process your data <strong>only to fulfil the request</strong>.</li>
              <li>Your data is <strong>not used to train any AI provider's foundation models</strong> — both Anthropic and OpenAI provide this commitment under their commercial API terms.</li>
              <li>We retain a copy of every AI-generated decision (workout adjustments, macro changes, etc.) in our internal audit log so you and we can see what the AI changed and why.</li>
              <li>AI outputs are generated by automated systems and may contain mistakes. They are general fitness information, <strong>not medical advice</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. AI safety monitoring</h2>
            <p>The AI coach is instructed to flag certain client messages for human review. Specifically, if you mention self-harm or suicidal thoughts, restrictive eating or other disordered eating patterns, a serious injury that may need medical attention, substance abuse problems, or domestic violence or abuse, the AI will:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Respond with empathy and direct you to the appropriate Australian crisis service (Lifeline 13 11 14, Beyond Blue 1300 22 4636, NEDC nedc.com.au, 1800RESPECT 1800 737 732).</li>
              <li>Record a flag in our safety database.</li>
              <li>Email a notification to our safety operator inbox so a human can review the conversation.</li>
            </ul>
            <p className="mt-3">This monitoring exists to protect you. The records we keep for safety reviews are retained for <strong>7 years</strong> to meet incident-records-keeping standards.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Storage, security, and cross-border transfers</h2>
            <p>Your data is stored on Supabase infrastructure in <strong>Singapore</strong>. We rely on Supabase's certifications (SOC 2 Type II, GDPR-aligned controls) and use:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>TLS / HTTPS encryption in transit</li>
              <li>AES-256 encryption at rest</li>
              <li>Row-level security policies enforcing per-user data isolation</li>
              <li>Service role keys held server-side only</li>
            </ul>
            <p className="mt-3">By using Propel you consent to your information being transferred to and processed in Singapore and the other countries listed in section 3. APP 8 limits this transfer; we have selected providers that adopt substantially similar privacy protections.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. How long we keep your data (retention)</h2>
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Data</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Retention period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">Active account data</td><td className="px-3 py-2">For as long as your account is active</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">Personal data after account deletion</td><td className="px-3 py-2">Deleted within 30 days</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">AI conversations</td><td className="px-3 py-2">Deleted with your account</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">AI safety concern flags</td><td className="px-3 py-2">7 years (incident records)</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">AI decision audit log</td><td className="px-3 py-2">7 years</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">Email send logs</td><td className="px-3 py-2">12 months</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-3 py-2">Stripe payment records</td><td className="px-3 py-2">As required by Australian tax / accounting law (typically 7 years)</td></tr>
                  <tr><td className="px-3 py-2">Anonymised, aggregated analytics</td><td className="px-3 py-2">Indefinite</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">If we are legally required to retain specific records longer (e.g. for a regulatory investigation), we will.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your rights</h2>
            <p>Under the Privacy Act and the APPs, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Access</strong> your personal data — most of it is visible inside the app at any time. To request a complete export, use the <strong>Settings → Privacy → Export my data</strong> button or email us.</li>
              <li><strong>Correct</strong> inaccurate data — update your profile in the app, or contact us.</li>
              <li><strong>Delete your account</strong> — go to <strong>Settings → Delete account</strong>. This is self-serve and takes effect immediately. We then purge your data within 30 days. (Records we are required to keep for safety, audit, or tax purposes are retained for the periods in section 7.)</li>
              <li><strong>Withdraw consent</strong> for data processing at any time (this will end your ability to use the service).</li>
              <li><strong>Opt out</strong> of push notifications via your device settings.</li>
              <li><strong>Lodge a complaint</strong> with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au or 1300 363 992 if you believe your privacy has been breached.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children</h2>
            <p>Propel is not designed for and not available to anyone under the age of 16. We block users from completing onboarding if their date of birth shows they are under 16. If we discover an account belongs to someone under 16, we will close it and delete the data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Data breach notification</h2>
            <p>Australia's <strong>Notifiable Data Breaches scheme</strong> (Privacy Act, Part IIIC) requires us to notify both the OAIC and affected individuals if your personal information is involved in a data breach likely to cause serious harm. If this happens, you will be notified by email as soon as practicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Cookies (web dashboard only)</h2>
            <p>The Propel web dashboard uses <strong>only essential cookies</strong> for authentication and session management. We do not use advertising cookies, analytics cookies, or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. If the changes are material (for example, adding a new processor, changing what we collect, or changing how we use data), we will notify active users by in-app notification or email at least 14 days before the changes take effect. The "Last updated" date at the top of this page will always reflect the current version.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. About the operator</h2>
            <p>Propel Coaches is operated by <strong>Charles Bettiol</strong>, a former Personal Trainer based in Australia. Propel is a software platform — Charles is not a registered health practitioner under the Health Practitioner Regulation National Law. Propel does not provide registered-practitioner services (such as those of an Accredited Practising Dietitian, Physiotherapist, or Exercise Physiologist). When you need clinical care, please see a registered practitioner.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact</h2>
            <p>If you have questions about this Privacy Policy, want to access or correct your data, or have a complaint:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Email: <a href="mailto:support@propelcoaches.com" className="text-[#245CFF] underline">support@propelcoaches.com</a></li>
              <li>Mail: Charles Bettiol, Propel Coaches, Australia</li>
            </ul>
            <p className="mt-3">If you are not satisfied with our response, you can contact the OAIC at oaic.gov.au or 1300 363 992.</p>
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
