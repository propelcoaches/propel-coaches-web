import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Propel',
  description: 'The terms for using the Propel training and nutrition app.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/brand/propel-mark-graphite.png" alt="Propel" className="w-8 h-8" />
            <span className="font-semibold text-gray-900">Propel</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Back to home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: 28 September 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <p>These terms are an agreement between you and Charles Bettiol, trading as Propel Coaches (&quot;Propel&quot;, &quot;we&quot;, &quot;us&quot;), in Australia. They cover the Propel app and website. By creating an account or using Propel, you agree to them. If you don&apos;t agree, please don&apos;t use Propel.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What Propel is</h2>
            <p>Propel builds you a training plan, a meal plan and daily habits from your answers. An AI coach helps you follow them and adjusts them as you go. Propel is general fitness and nutrition information. It is not medical care, and our AI coach is not a doctor, dietitian, physiotherapist or psychologist.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Your health and safety</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Check with a doctor before starting if any of these apply:
                <ul className="list-disc pl-6 space-y-1 mt-1">
                  <li>you have a medical condition, an injury, or are pregnant or postpartum;</li>
                  <li>you take medication that affects exercise or eating;</li>
                  <li>you are unsure whether exercise or a change in diet is safe for you.</li>
                </ul>
              </li>
              <li>Stop a session and seek help if you feel pain, chest discomfort, dizziness, or shortness of breath beyond what&apos;s normal for hard exercise.</li>
              <li>Calorie and macro targets are estimates for healthy adults. Don&apos;t follow them if you have, or have had, an eating disorder. Tell us in the app, and speak with a health professional.</li>
              <li>In an emergency, call 000. For support with your mental health, call Lifeline on 13 11 14.</li>
            </ul>
            <p className="mt-3">You&apos;re responsible for how you use Propel&apos;s suggestions. Only train within what feels safe for you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Your account</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be 18 or older.</li>
              <li>Give accurate details, particularly your date of birth, health answers and body measurements. Your plans are built from them.</li>
              <li>Keep your sign-in details private. You&apos;re responsible for activity on your account.</li>
              <li>One account per person.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Membership, free trial and billing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Propel is a paid membership. It may start with a free trial; the length is shown before you subscribe.</li>
              <li>Subscriptions are sold through Apple&apos;s App Store and billed to your Apple Account. They renew automatically at the end of each period unless you cancel at least 24 hours before it ends.</li>
              <li>To cancel, go to your iPhone&apos;s Settings › your name › Subscriptions. You keep access until the end of the period you&apos;ve paid for.</li>
              <li>Refunds for App Store purchases are handled by Apple under its policies. Our <Link href="/refund-policy" className="text-[#0F7B8C] underline">Refund &amp; Cancellation Policy</Link> has the details.</li>
              <li>We may change membership prices. We&apos;ll tell you at least 30 days before a change affects your renewal, and you can cancel before it does.</li>
              <li>Nothing in these terms limits your rights under the Australian Consumer Law. Those guarantees can&apos;t be excluded.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. The AI coach and generated plans</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Propel uses AI providers (Anthropic, and OpenAI for some food and recipe features) to generate plans and coach replies from the information you give us. Our <Link href="/privacy-policy" className="text-[#0F7B8C] underline">Privacy Policy</Link> explains what&apos;s shared and how it&apos;s protected.</li>
              <li>AI output can be wrong or unsuitable for you. Use your judgement. Tell us, or tell the coach, when something doesn&apos;t fit, and don&apos;t follow advice that seems unsafe.</li>
              <li>Propel may flag messages about self-harm, disordered eating or serious injury for human review, as described in our Privacy Policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Acceptable use</h2>
            <p>Don&apos;t:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>use Propel for anything illegal or harmful;</li>
              <li>try to break, overload or get around Propel&apos;s security;</li>
              <li>copy, resell or scrape Propel or its content;</li>
              <li>use Propel to harass anyone;</li>
              <li>enter someone else&apos;s personal information without their permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your content and data</h2>
            <p>You own what you put into Propel: logs, photos, messages. You give us permission to store and process it only to run Propel for you, as set out in our <Link href="/privacy-policy" className="text-[#0F7B8C] underline">Privacy Policy</Link>. You can export your data or delete your account from Settings at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Our content</h2>
            <p>Propel&apos;s app, design, programmes, recipes, photos and text belong to us or our licensors. You can use them for your own personal training only.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to Propel and to these terms</h2>
            <p>We improve Propel all the time, so features may change. If we make a material change to these terms, we&apos;ll tell you in the app or by email at least 14 days before it applies. If you keep using Propel after that, the new terms apply.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Ending your membership</h2>
            <p>You can stop using Propel and delete your account at any time from Settings. We may suspend or close an account that breaks these terms or puts others at risk. If we close your account without a good reason under these terms, we&apos;ll refund any unused prepaid period.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Liability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                To the extent the law allows, we aren&apos;t liable for:
                <ul className="list-disc pl-6 space-y-1 mt-1">
                  <li>indirect or consequential loss;</li>
                  <li>injury or loss from exercise or diet choices you make, including following a plan against the safety guidance in section 2.</li>
                </ul>
              </li>
              <li>
                Where the law allows us to limit our liability for a failure to meet a consumer guarantee, it is limited to:
                <ul className="list-disc pl-6 space-y-1 mt-1">
                  <li>supplying the service again; or</li>
                  <li>paying the cost of having it supplied again.</li>
                </ul>
              </li>
              <li>Nothing here excludes liability that can&apos;t legally be excluded.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing law</h2>
            <p>These terms are governed by the laws of Queensland, Australia, and the courts there can hear any dispute.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact</h2>
            <p>Questions? Email <a href="mailto:support@propelcoaches.com" className="text-[#0F7B8C] underline">support@propelcoaches.com</a>.</p>
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
