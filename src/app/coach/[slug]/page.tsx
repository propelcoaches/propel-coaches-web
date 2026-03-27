import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star, MapPin, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Service = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
}

type Testimonial = {
  name: string
  goal: string
  quote: string
}

type CoachProfile = {
  slug: string
  title: string
  location: string
  bio: string
  avatar_initials: string
  rating: number
  specialties: string[]
  services: Service[]
  testimonials: Testimonial[]
  profiles: {
    full_name: string
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient()

  const { data } = await supabase
    .from('coach_public_profiles')
    .select('title, location, profiles(full_name)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) {
    return {
      title: 'Coach Not Found | Propel Coaches',
      description: 'This coach profile does not exist.',
    }
  }

  const name = (data.profiles as any)?.full_name ?? ''
  return {
    title: `${name} — ${data.title} | Propel Coaches`,
    description: `Work with ${name}, ${data.title} based in ${data.location}. Book a consultation today.`,
  }
}

export default async function CoachProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient()

  const { data: coach } = await supabase
    .from('coach_public_profiles')
    .select('*, profiles(full_name)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!coach) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <img src="/logo.svg" alt="Propel Coaches" className="w-8 h-8" />
              <span className="font-bold text-gray-900 text-lg">Propel Coaches</span>
            </Link>
          </div>
        </header>
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Coach not found</h1>
            <p className="text-lg text-gray-500 mb-10">This coach profile doesn&apos;t exist, or the URL might be incorrect.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const name = (coach.profiles as any)?.full_name ?? ''
  const firstName = name.split(' ')[0]
  const services: Service[] = Array.isArray(coach.services) ? coach.services : []
  const testimonials: Testimonial[] = Array.isArray(coach.testimonials) ? coach.testimonials : []
  const specialties: string[] = Array.isArray(coach.specialties) ? coach.specialties : []

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <img src="/logo.svg" alt="Propel Coaches" className="w-8 h-8" />
            <span className="font-bold text-gray-900 text-lg">Propel Coaches</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6">
              {coach.avatar_initials || name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{name}</h1>
            <p className="text-xl text-gray-600 mb-4">{coach.title}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              {coach.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={18} className="text-[#0F7B8C]" />
                  <span className="font-semibold">{coach.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.floor(coach.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}
                  />
                ))}
                <span className="ml-2 font-bold text-gray-900">{Number(coach.rating).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {coach.bio && (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">About {firstName}</h2>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              {coach.bio.split('\n\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Specialties</h2>
            <div className="flex flex-wrap gap-3">
              {specialties.map(specialty => (
                <div key={specialty} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700">
                  {specialty}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Coaching Packages</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {services.map(service => (
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
                    {(service.features ?? []).map(feature => (
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
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Client Testimonials</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{testimonial.goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Ready to work with {firstName}?</h2>
          <p className="text-white/80 text-lg mb-10">Start your transformation today. Choose a package and get started with your first check-in.</p>
          <Link
            href={`/register?coach=${slug}`}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#0F7B8C] font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg"
          >
            Work with {firstName} →
          </Link>
          <p className="text-white/60 text-sm mt-4">14-day free trial included</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Propel Coaches" className="w-7 h-7" />
            <span className="font-bold text-gray-900">Propel Coaches</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Propel Coaches. Built for coaches, by coaches.</p>
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
