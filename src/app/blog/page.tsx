'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'

const BLOG_ARTICLES = [
  {
    id: 1,
    title: 'How to structure a 12-week body transformation programme',
    excerpt: 'Learn the principles of progressive overload and periodisation to deliver results...',
    author: 'Propel Team',
    date: 'Mar 15, 2026',
    readTime: '7 min read',
    content: `A 12-week body transformation programme is one of the most popular coaching offerings, but structuring it correctly is what separates mediocre results from life-changing ones.

The foundation of any successful programme is progressive overload — the principle of gradually increasing the demands placed on your client's body. Without it, clients plateau. With it, they see consistent progress week after week.

Here's how to structure your 12-week programme:

**Weeks 1-4: Foundation Phase**
Start with moderate weights and higher rep ranges (8-12 reps). Focus on form, movement quality, and building the neural patterns. Clients should feel challenged but not maxed out. Include 3-4 training days per week. Many coaches make the mistake of starting too heavy here — resist that urge. A solid foundation prevents injury and enables better progress later.

**Weeks 5-8: Strength & Hypertrophy Phase**
Increase weight by 5-10% and drop rep ranges to 6-10. Add one extra training day (4-5 per week total). This is where clients start seeing noticeable changes in the mirror. Check-ins should show progress on key lifts. Progressive overload is non-negotiable here — track every weight, rep count, and rest period.

**Weeks 9-12: Peak & Deload Phase**
Weeks 9-11 represent your peak intensity block. Go heavy (3-6 reps on main lifts) or high volume depending on your client's goals. Week 12 is a deload week — reduce volume by 40-50% while maintaining intensity. This allows CNS recovery and prevents burnout.

**Check-in Cadence**
Weekly check-ins are critical. Each check-in should capture: bodyweight, progress photos (same angles, lighting, time of day), subjective energy levels, and compliance. For nutrition, track average daily calories and macros. For training, log the key lifts and perceived effort.

Many coaches check in every 2 weeks and miss crucial momentum. Weekly check-ins cost you nothing in a platform like Propel but give you real-time visibility into what's working. When a client isn't progressing, you know it immediately, not after 2 weeks of wasted effort.

The magic of a 12-week programme isn't the arbitrary duration — it's the structured progression, consistent check-ins, and ability to adjust based on feedback. Structure it right, and your clients will see transformation. More importantly, they'll come back for the next block.`,
  },
  {
    id: 2,
    title: 'Why weekly check-ins are the #1 predictor of client retention',
    excerpt: 'Research shows weekly check-ins drive accountability and keep clients engaged...',
    author: 'Propel Team',
    date: 'Mar 10, 2026',
    readTime: '6 min read',
    content: `Here's a stat that might surprise you: clients who submit weekly check-ins are 3x more likely to stay with their coach for 12+ months. This isn't magic — it's psychology.

When clients submit a check-in, three things happen:

**1. Accountability increases**
The act of documenting progress (weight, photos, energy, compliance) creates accountability. Clients know they'll be sharing it with you. Even if results are small or non-existent, the ritual reinforces the commitment to the process. Skipped check-ins? That's the first red flag of a client about to quit.

**2. Progress becomes visible**
Without check-ins, progress is intangible. A client might feel stronger or leaner, but without data, doubt creeps in. When you can show them side-by-side progress photos from week 1 to week 12, when you can show them strength gains on paper, that's when the magic happens. Propel's body metrics dashboard makes this effortless.

**3. Coaching becomes personal**
Weekly check-ins give you real data to coach on. You're not guessing about energy or sleep — you have numbers. You can see patterns (e.g., "Energy dips every Friday"). This allows you to provide targeted advice, adjust programming, or pivot nutrition. Clients feel seen, heard, and coached. That builds trust and loyalty.

**The Compliance Effect**
Here's the coaching psychology insight: clients who check in weekly show higher programme compliance rates (96%+ vs 70% for non-checkers). Why? Because you're regularly commenting, adjusting, and reinforcing behaviours. You're not checking in once a month and discovering they've been skipping workouts for 3 weeks.

Some coaches worry that weekly check-ins are too much friction. In reality, Propel's check-in tool takes clients 2-3 minutes. If friction is the problem, it's not the check-ins — it's the tool.

**The Revenue Angle**
Retention is your business's growth engine. A client who stays 24 months is worth 2x a client who quits at month 12. Weekly check-ins don't just improve outcomes — they directly impact your revenue. Every percentage point increase in retention is thousands of dollars per year in recurring revenue.

If you're not doing weekly check-ins, start tomorrow. Make it non-negotiable. You'll see the difference in 4 weeks.`,
  },
  {
    id: 3,
    title: 'Setting macro targets for different client goals: a coach\'s guide',
    excerpt: 'Master protein, carbs, and fats for fat loss, muscle gain, and body recomposition...',
    author: 'Propel Team',
    date: 'Mar 5, 2026',
    readTime: '8 min read',
    content: `Macro targets are one of the most misunderstood elements of nutrition coaching. Many coaches copy generic templates and wonder why clients don't get results.

The truth: macro targets should be completely individualized based on the client's goal, activity level, current body composition, and adherence patterns. Here's how to set them right.

**Step 1: Establish Total Daily Energy Expenditure (TDEE)**
TDEE = Resting Metabolic Rate (RMR) × Activity Factor. For most clients, estimate RMR using the Mifflin-St Jeor equation, then multiply by their activity factor (1.2-1.5 for most). If a client is sedentary and only trains 3x/week, use 1.3. If they're active daily with 5+ training days, use 1.5.

Example: 80kg male, 25 years old, 5x/week training = ~2,600 TDEE.

**Goal 1: Fat Loss**
Caloric Deficit: 300-500 below TDEE (not more — this destroys muscle and adherence)
Protein: 1.6-2.2g per kg bodyweight (high to preserve muscle during deficit)
Fat: 0.8-1.2g per kg (essential for hormone health)
Carbs: Fill the remainder

Example: 80kg male, 2,600 TDEE, -400 deficit = 2,200 calories
Protein: 160g (2.0g/kg)
Fat: 80g
Carbs: 240g

Why so high on protein? Protein is most satiating and muscle-sparing. During a deficit, muscle loss is your enemy. High protein keeps clients fuller longer and preserves lean mass.

**Goal 2: Muscle Gain (Lean Bulk)**
Caloric Surplus: 200-400 above TDEE (not more — excess goes to fat, not muscle)
Protein: 1.6-2.2g per kg bodyweight
Fat: 0.8-1.2g per kg
Carbs: Fill the remainder

Example: 80kg male, 2,600 TDEE, +300 surplus = 2,900 calories
Protein: 160g
Fat: 80g
Carbs: 340g

The surplus needs to be small. Gaining more than 0.5-1kg per month usually means excess fat gain. Slow and steady wins the muscle-building game. More importantly, a small surplus is more adherent — clients don't feel stuffed or bloated.

**Goal 3: Body Recomposition**
This is the holy grail goal: lose fat and gain muscle simultaneously. It's possible, especially in newer lifters or those returning to training.

Caloric Approach: Maintenance calories (0 deficit/surplus)
Protein: 2.0-2.2g per kg (even more critical here to support muscle building while in a deficit)
Fat: 0.8-1.2g per kg
Carbs: Fill the remainder

Example: 80kg male, 2,600 TDEE, maintenance
Protein: 170g (2.1g/kg)
Fat: 80g
Carbs: 300g

Recomp relies on progressive overload in training and high protein. Without these two pillars, it won't work. Track progress via photos and strength, not just the scale (body composition changes, weight might stay similar).

**The Adherence Factor**
Here's what separates good coaches from great ones: knowing the science is table stakes. The real skill is setting macros that clients will actually follow.

A client who eats 2,100 calories of food they enjoy is better than a client who hits 2,200 perfectly for 2 weeks then quits. Adjust macros based on foods they like. If they hate chicken, find another protein source. If carbs are hard to hit, reduce slightly and increase fats.

Propel's macro tracking tool shows exactly where clients struggle. Use that data to refine targets.

**Common Mistakes**
1. Setting protein too low (under 1.6g/kg) — clients lose muscle and feel hungry
2. Creating deficits/surpluses that are too aggressive — leads to non-adherence
3. Not adjusting macros as client's body changes — every 5kg of fat loss warrants a recalculation
4. Ignoring individual tolerance — some clients thrive on high carbs, others on high fat

Get the fundamentals right, track compliance weekly, and adjust. That's the formula.`,
  },
  {
    id: 4,
    title: 'The best personal trainer software in 2026: what to look for',
    excerpt: 'We break down the essential features that separate good coaching apps from great ones...',
    author: 'Propel Team',
    date: 'Feb 28, 2026',
    readTime: '7 min read',
    content: `The personal trainer software space has exploded. There are dozens of platforms claiming to be "the all-in-one solution." So which one should you actually use?

We've helped hundreds of coaches evaluate tools. Here's what separates the best from the rest.

**Core Feature 1: Programme Building & Delivery**
You need to build workouts once and reuse them across clients. The best platforms let you:
- Create exercises with video, sets, reps, and rest periods
- Assign programmes to multiple clients simultaneously
- Modify programmes per client without affecting the template
- Track workout completion and allow clients to log weights/RPE in real time

Bonus: AI-powered programme suggestions that adapt based on client feedback.

**Core Feature 2: Nutrition & Macro Tracking**
Not every client needs this, but those who do need it to be seamless:
- Clients log food via barcode scanning or food database search
- Automatic macro calculation
- Weekly compliance tracking
- Ability to set custom macro targets per client

Propel's nutrition module integrates this directly — no third-party app required.

**Core Feature 3: Weekly Check-ins**
This is where the best platforms differentiate themselves. You need:
- Customizable check-in templates (energy, sleep, stress, weight, photos)
- Client-facing check-in submission (simple, mobile-friendly)
- Coach-side analytics (compliance %, trends over time)
- Ability to comment and give feedback instantly

If check-ins are clunky, clients won't do them. If clients don't do them, your visibility into progress is gone.

**Core Feature 4: Progress Tracking & Analytics**
Clients want to see progress. Coaches want data to make decisions. You need:
- Weight trends with weekly/monthly averages
- Body composition (body fat % if available)
- Side-by-side progress photos with date stamping
- Strength progression charts for key lifts
- Habit tracking (if relevant to your coaching style)

This should all be visible on a single dashboard. No hunting through multiple screens.

**Core Feature 5: AI Coach Assistant**
This is new and increasingly expected. The best AI coaches:
- Respond to client messages 24/7 in the coach's tone
- Handle repetitive questions (form checks, nutrition questions)
- Escalate complex issues to the coach
- Learn from coach feedback to improve over time

An AI coach doesn't replace you — it amplifies you. It handles the 3am message so you can sleep. It answers the "Can I do legs today instead of arms?" question instantly. It frees you up to do high-leverage coaching work.

**Core Feature 6: Payments & Invoicing**
You should be able to:
- Invoice clients for programmes, nutrition plans, or ongoing coaching
- Set up recurring subscription payments
- Track revenue by client
- Integrate with Stripe (industry standard)

If payment processing is separate from your coaching platform, you're creating friction.

**The Verdict**
The best platforms combine simplicity (easy to use, not bloated) with power (everything you need in one place). They save you time, keep clients engaged, and make coaching more enjoyable.

When evaluating a platform, ask: Would my clients actually use this? Would I actually use this daily? If the answer to either is no, it's not the right fit.

The market is competitive, which is good for coaches. Demand excellence. Demand a platform that respects your time and your clients' experience.

Your coaching is only as good as the tools that enable it.`,
  },
]

export default function BlogPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">⚡</span>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Propel</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/#features" className="hover:text-gray-900 transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-gray-900 transition-colors text-[#0F7B8C]">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[#0F7B8C] hover:text-[#0d6b7a] font-semibold mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <h1 className="text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">Coaching insights & industry trends</h1>
          <p className="text-xl text-gray-500 leading-relaxed">Expert articles for fitness coaches, nutritionists and health professionals building their practice.</p>
        </div>
      </section>

      {/* ── Articles Grid ───────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          {BLOG_ARTICLES.map(article => (
            <div key={article.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#0F7B8C]/30 transition-all">
              {/* Card Header */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{article.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{article.excerpt}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
                  <span className="font-medium text-gray-700">{article.author}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {article.readTime}
                  </div>
                </div>

                {/* Buttons */}
                <button
                  onClick={() => toggleExpanded(article.id)}
                  className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  {expandedId === article.id ? 'Collapse' : 'Read article'} →
                </button>
              </div>

              {/* Expanded Content */}
              {expandedId === article.id && (
                <div className="border-t border-gray-100 px-8 py-8 bg-gray-50">
                  <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
                    {article.content.split('\n\n').map((paragraph, i) => {
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return (
                          <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">
                            {paragraph.replace(/\*\*/g, '')}
                          </h3>
                        )
                      }
                      if (paragraph.startsWith('- ')) {
                        const items = paragraph.split('\n').filter(line => line.startsWith('- '))
                        return (
                          <ul key={i} className="list-disc list-inside space-y-2 text-gray-700">
                            {items.map((item, idx) => (
                              <li key={idx}>{item.replace('- ', '')}</li>
                            ))}
                          </ul>
                        )
                      }
                      return (
                        <p key={i} className="text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setExpandedId(null)}
                    className="mt-8 inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-6 py-3 rounded-xl transition-colors"
                  >
                    Collapse ↑
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to level up your coaching?</h2>
          <p className="text-lg text-gray-500 mb-10">Propel gives you all the tools to build programmes, track progress, and grow your practice. Start your free trial today.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
            Start for free →
          </Link>
          <p className="text-sm text-gray-400 mt-4">14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚡</span>
            </div>
            <span className="font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
