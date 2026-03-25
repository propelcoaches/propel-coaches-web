import type { Metadata } from 'next'
import Link from 'next/link'
import { Star, MapPin, Users, Zap, MessageSquare } from 'lucide-react'

const COACH_DATA = {
  'james-khoury': {
    name: 'James Khoury',
    title: 'Online Fitness Coach & Accredited Dietitian',
    location: 'Sydney, AU',
    rating: 4.9,
    avatar: 'JK',
    bio: `James Khoury is an accredited dietitian and certified strength & conditioning coach with over 3 years of experience helping clients achieve sustainable results through nutrition and training. He specializes in working with busy professionals who want to transform their bodies without restrictive dieting.

Based in Sydney, James works with clients globally via online coaching. His approach combines evidence-based nutrition science with progressive resistance training, adapted to each client's schedule and preferences. He believes sustainable transformation comes from consistency, not perfection.

When James isn't coaching, you'll find him training, experimenting with new recipes, or exploring Sydney's coffee scene. He's passionate about making coaching accessible and working with clients who are ready to invest in their long-term health.`,
    specialties: ['Fat Loss', 'Muscle Gain', 'Nutrition Coaching', 'Online Coaching'],
    stats: [
      { label: 'Clients Coached', value: '47' },
      { label: 'Years Experience', value: '3' },
      { label: 'Check-in Compliance', value: '96%' },
      { label: 'Average Rating', value: '4.9★' },
    ],
    services: [
      {
        name: '1:1 Online Coaching',
        price: '$249 AUD',
        period: '/month',
        description: 'Fully customized training programmes, nutrition coaching, weekly check-ins, and direct messaging access.',
        features: ['Custom workout plans', 'Nutrition coaching', 'Weekly check-ins', 'Direct messaging', 'Progress tracking'],
      },
      {
        name: 'Nutrition Only',
        price: '$149 AUD',
        period: '/month',
        description: 'If you already have a training programme, James can provide macro targets, meal planning, and nutrition accountability.',
        features: ['Macro targets', 'Meal plan suggestions', 'Weekly check-ins', 'Nutrition guidance', 'Food logging support'],
      },
      {
        name: 'Programme Only',
        price: '$79 AUD',
        period: '/month',
        description: 'Custom training programme with exercise videos, form cues, and monthly programming adjustments.',
        features: ['Custom workout plans', 'Exercise videos', 'Monthly adjustments', 'Form cues', 'Progress tracking'],
      },
    ],
    testimonials: [
      {
        name: 'Sarah Mitchell',
        goal: 'Fat Loss',
        quote: 'James made nutrition coaching so simple. I\'ve lost 8kg in 12 weeks without feeling like I\'m on a diet. His weekly check-ins keep me accountable without being judgmental.',
      },
      {
        name: 'Marcus Johnson',
        goal: 'Muscle Gain',
        quote: 'As someone who travels a lot, I needed a flexible coach. James adapted my programme week-to-week and his AI coach handle my questions when he wasn\'t available. Best investment I\'ve made.',
      },
      {
        name: 'Emma Wilson',
        goal: 'Body Recomposition',
        quote: 'I\'ve worked with 3 coaches before. James is different — he actually listens, explains the science, and doesn\'t just give generic advice. Worth every penny.',
      },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const coach = COACH_DATA[slug as keyof typeof COACH_DATA]

  if (!coach) {
    return {
      title: 'Coach Not Found | Propel',
      description: 'This coach profile does not exist.',
    }
  }

  return {
    title: `${coach.name} — Online Fitness Coach | Propel`,
    description: `Work with ${coach.name}, ${coach.title} based in ${coach.location}. ${coach.stats[0].value} happy clients. Book a consultation today.`,
  }
}

export default async function CoachProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const coach = COACH_DATA[slug as keyof typeof COACH_DATA]

  if (!coach) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚡</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Propel</span>
            </Link>
          </div>
        </header>
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Coach not found</h1>
            <p className="text-lg text-gray-500 mb-10">This coach profile doesn't exist, or the URL might be incorrect.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    )
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
            <span className="font-bold text-gray-900 text-lg">Propel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6">
              {coach.avatar}
            </div>

            {/* Coach Info */}
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{coach.name}</h1>
            <p className="text-xl text-gray-600 mb-4">{coach.title}</p>

            {/* Location & Rating */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} className="text-[#0F7B8C]" />
                <span className="font-semibold">{coach.location}</span>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.floor(coach.rating) ? 'text-amber-400 fill-amber-400' : i < coach.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}
                  />
                ))}
                <span className="ml-2 font-bold text-gray-900">{coach.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">About {coach.name.split(' ')[0]}</h2>
          <div className="space-y-6 text-gray-600 leading-relaxed">
            {coach.bio.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specialties ─────────────────────── */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Specialties</h2>
          <div className="flex flex-wrap gap-3">
            {coach.specialties.map(specialty => (
              <div
                key={specialty}
                className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700"
              >
                {specialty}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {coach.stats.map(stat => (
              <div key={stat.label} className="bg-gradient-to-br from-[#0F7B8C]/10 to-transparent border border-[#0F7B8C]/20 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black text-[#0F7B8C] mb-1">{stat.value}</div>
                <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Coaching Packages</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {coach.services.map(service => (
              <div key={service.name} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-[#0F7B8C] transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-500 text-sm mb-6">{service.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">{service.price}</span>
                    <span className="text-gray-500">{service.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {service.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Zap size={14} className="text-[#0F7B8C] flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?coach=${slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Choose package →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Client Testimonials</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {coach.testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{testimonial.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Ready to work with {coach.name.split(' ')[0]}?</h2>
          <p className="text-white/80 text-lg mb-10">Start your transformation today. Choose a package and get started with your first check-in.</p>
          <Link
            href={`/register?coach=${slug}`}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#0F7B8C] font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg"
          >
            Work with {coach.name.split(' ')[0]} →
          </Link>
          <p className="text-white/60 text-sm mt-4">14-day free trial included</p>
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
