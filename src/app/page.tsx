import Link from 'next/link'
import type { Metadata } from 'next'
import { PricingSection } from './pricing-section'

export const metadata: Metadata = {
  title: 'Propel Coaches — The All-in-One Coaching Platform',
  description:
    'Manage your coaching business in one place. Client management, workout programming, nutrition plans, payments, and AI-powered tools for personal trainers and fitness coaches.',
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Propel Coaches',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'The all-in-one coaching platform for personal trainers, nutritionists, and fitness coaches.',
    url: 'https://propelcoaches.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen bg-white font-sans">

      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900 font-display">
            <img src="/logo.svg" alt="Propel" className="w-8 h-8" />
            Propel
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#demo" className="hover:text-gray-900 transition-colors font-medium text-brand">Watch Demo</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-brand hover:text-brand-light transition-colors hidden sm:block">
              Coach login
            </Link>
            <Link href="/register" className="bg-brand hover:bg-brand-light text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-brand/20">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="hero-gradient pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="brand-pill mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" aria-hidden="true" />
                Built for health &amp; fitness professionals
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Stop juggling tools.<br />
                <span className="text-brand">Start coaching more.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg">
                The all-in-one platform for fitness coaches — and AI-powered personal coaching for everyone else.
                Programs, nutrition, check-ins, messaging, and an AI coach that works 24/7.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary">
                  Start free — coaches
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center gap-2.5 border border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-2xl text-base transition-all hover:border-brand/30 hover:bg-brand-bg">
                  Try AI Coach
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    {['#0F7B8C20','#0F7B8C35','#0F7B8C50','#0F7B8C70'].map((c, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-brand" style={{backgroundColor: c}}>
                        {['S','J','M','L'][i]}
                      </div>
                    ))}
                  </div>
                  <span><strong className="text-gray-700">500+</strong> coaches on Propel</span>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-gray-400">
                  <svg className="w-3.5 h-3.5 text-brand" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  14-day free trial
                </span>
              </div>
            </div>

            {/* Right — Phone Mockups */}
            <div className="relative h-[580px] hidden md:block">
              {/* Left phone — Nutrition */}
              <div className="absolute left-4 top-12 w-[180px] z-10 transform -rotate-3">
                <div className="bg-gray-900 rounded-[28px] p-[5px] shadow-2xl" style={{aspectRatio: '9/19'}}>
                  <div className="bg-white rounded-[24px] overflow-hidden h-full flex flex-col">
                    <div className="bg-[#0F7B8C] px-4 py-3 flex-shrink-0">
                      <p className="text-white text-[11px] font-semibold">Nutrition</p>
                    </div>
                    <div className="p-3 space-y-2.5 flex-1">
                      <div className="text-center py-1">
                        <p className="text-xl font-bold text-gray-900">1,220</p>
                        <p className="text-[9px] text-gray-400">kcal · 980 remaining</p>
                      </div>
                      <div className="space-y-2">
                        {[['Protein','133/180g','74','#0F7B8C'],['Carbs','118/220g','54','#f59e0b'],['Fat','24/70g','34','#f43f5e']].map(([n,v,w,c]) => (
                          <div key={n}>
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[9px] text-gray-500">{n}</span>
                              <span className="text-[9px] font-semibold text-gray-700">{v}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full">
                              <div className="h-1.5 rounded-full" style={{width:`${w}%`,backgroundColor:c}} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-600">🥣 Breakfast · 420 kcal</div>
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-600">🍛 Lunch · 510 kcal</div>
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-600">🍽️ Dinner · 290 kcal</div>
                        <div className="bg-gray-50 rounded-lg px-2.5 py-2 text-[9px] text-gray-400">🍫 Snacks · Log food</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center phone — Home / Dashboard */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[210px] z-20">
                <div className="bg-gray-900 rounded-[30px] p-[5px] shadow-2xl shadow-black/30" style={{aspectRatio: '9/19'}}>
                  <div className="rounded-[26px] overflow-hidden bg-white h-full flex flex-col">
                    <div className="relative bg-white pt-2 pb-1 flex-shrink-0">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-[5px] bg-gray-900 rounded-full z-10" />
                      <div className="flex justify-between px-4 pt-3">
                        <span className="text-[8px] text-gray-400">9:41</span>
                        <div className="flex gap-1 items-center">
                          <div className="w-3 h-1.5 border border-gray-400 rounded-sm"><div className="w-2 h-full bg-gray-400 rounded-sm" /></div>
                        </div>
                      </div>
                    </div>
                    <div className="px-3.5 pb-4 flex-1">
                      <p className="text-[9px] text-gray-400 mb-0.5">Good morning</p>
                      <p className="text-[13px] font-bold text-gray-900 mb-3">Emma Wilson</p>
                      <div className="bg-brand/5 rounded-xl p-2.5 border border-brand/10">
                        <p className="text-[9px] font-semibold text-brand mb-0.5">Today&apos;s Workout</p>
                        <p className="text-[11px] font-bold text-gray-900">Upper Body Push</p>
                        <p className="text-[9px] text-gray-400">5 exercises · ~55 min</p>
                        <div className="mt-1.5 bg-[#0F7B8C] rounded-lg py-1.5 text-center">
                          <span className="text-[9px] font-semibold text-white">Start Workout</span>
                        </div>
                      </div>
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[15px] font-bold text-gray-900">1,220</p>
                          <p className="text-[8px] text-gray-400">kcal today</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[15px] font-bold text-gray-900">8,432</p>
                          <p className="text-[8px] text-gray-400">steps</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-semibold text-gray-500 mt-2.5 mb-1">Daily Habits</p>
                      <div className="space-y-1">
                        {[['Drink 3L water',true],['10,000 steps',false],['8hrs sleep',true]].map(([h,done]) => (
                          <div key={h as string} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${done ? 'bg-green-100' : 'bg-gray-100 text-gray-300'}`}>{done ? '✓' : '○'}</div>
                            <span className="text-[9px] text-gray-600">{h}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-around border-t border-gray-100 pt-2">
                        <div className="text-center"><div className="text-[10px]">🏠</div><p className="text-[7px] text-brand font-semibold">Home</p></div>
                        <div className="text-center"><div className="text-[10px]">🏋️</div><p className="text-[7px] text-gray-400">Train</p></div>
                        <div className="text-center"><div className="text-[10px]">🍎</div><p className="text-[7px] text-gray-400">Nutrition</p></div>
                        <div className="text-center"><div className="text-[10px]">💬</div><p className="text-[7px] text-gray-400">Chat</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right phone — Training */}
              <div className="absolute right-4 top-12 w-[180px] z-10 transform rotate-3">
                <div className="bg-gray-900 rounded-[28px] p-[5px] shadow-2xl" style={{aspectRatio: '9/19'}}>
                  <div className="bg-white rounded-[24px] overflow-hidden h-full flex flex-col">
                    <div className="bg-[#0F7B8C] px-4 py-3 flex-shrink-0">
                      <p className="text-white text-[11px] font-semibold">Training</p>
                    </div>
                    <div className="p-3 space-y-2 flex-1">
                      <p className="text-[11px] font-bold text-gray-900">My Program</p>
                      <p className="text-[9px] text-gray-400">1/4 sessions this week</p>
                      <div className="flex gap-1 mt-1">
                        {['M','T','W','T','F','S','S'].map((d, i) => (
                          <div key={i} className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[7px] font-medium ${i === 2 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>{d}</div>
                        ))}
                      </div>
                      <div className="mt-1.5 bg-gray-50 rounded-xl p-2.5">
                        <span className="text-[9px] font-semibold text-brand">TODAY</span>
                        <p className="text-[10px] font-bold text-gray-900 mt-0.5">Upper Body Push</p>
                        <p className="text-[8px] text-gray-400">~55 min · 5 exercises</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5 border-l-4 border-[#0F7B8C]">
                        <p className="text-[9px] font-semibold text-gray-800">Coach Note</p>
                        <p className="text-[8px] text-gray-500 mt-0.5">Focus on controlled tempo. 3-1-2 on all presses.</p>
                      </div>
                      <div className="bg-[#0F7B8C] rounded-xl py-2 text-center">
                        <span className="text-[9px] font-semibold text-white">▶ Start Workout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Stats Bar ─── */}
      <section className="py-10 bg-brand">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: 'Coaches on Propel' },
              { value: '10,000+', label: 'Clients coached' },
              { value: '97%', label: 'Check-in compliance' },
              { value: '4.9★', label: 'Average coach rating' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-extrabold text-white">{stat.value}</p>
                <p className="text-sm text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Professions bar ─── */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-5">Built for every health profession</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              { label: 'Personal Trainers', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M3.5 10a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm6.5-5a.75.75 0 01.75.75v4.25h2.5a.75.75 0 010 1.5H10a.75.75 0 01-.75-.75V5.75A.75.75 0 0110 5z"/></svg> },
              { label: 'Nutritionists', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg> },
              { label: 'Dietitians', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
              { label: 'Exercise Physiologists', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg> },
              { label: 'Strength Coaches', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"/></svg> },
              { label: 'Online Coaches', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"/></svg> },
              { label: 'Physiotherapists', icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
            ].map(({ label, icon }, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-brand-bg rounded-full text-sm font-medium text-gray-600 hover:text-brand border border-gray-200 hover:border-brand/25 shadow-sm transition-all cursor-default">
                <span className="text-brand" aria-hidden="true">{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Demo Video Section ─── */}
      <section id="demo" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">See Propel in action</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">Watch how coaches use Propel to run their entire practice — from onboarding a new client to delivering programs, tracking nutrition, and getting paid.</p>
          </div>
          {/* Video embed placeholder */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/60 bg-gray-900 aspect-video group cursor-pointer">
            {/* Gradient thumbnail background */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand via-[#0a5a68] to-gray-900" />
            {/* Fake screenshot overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-6 left-6 right-6 h-8 bg-white/10 rounded-xl" />
              <div className="absolute top-20 left-6 w-40 bg-white/10 rounded-xl h-full" />
              <div className="absolute top-20 left-52 right-6 h-48 bg-white/5 rounded-xl" />
            </div>
            {/* Play button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg width="22" height="26" viewBox="0 0 22 26" fill="var(--brand)">
                  <path d="M1 1.5l20 11L1 23.5V1.5z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">Watch the 3-minute overview</p>
                <p className="text-white/60 text-sm mt-1">See how Propel works from signup to coaching</p>
              </div>
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-lg">3:24</div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-400">
            <span>✓ No sign up required to watch</span>
            <span>✓ Covers all core features</span>
            <span>✓ Updated March 2026</span>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 1: Training Programs ─── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-brand tracking-wide mb-3">Training Programs</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Build programs your clients will actually complete
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Design personalised workout programs in minutes, not hours. Drag and drop exercises from a library of thousands, set sets, reps, tempo, and rest — then assign it to a client with one click.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Thousands of exercises with video demos',
                  'Supersets, circuits, and warmup blocks',
                  'Clients log sets and reps live in the app',
                  'Coach sees completed vs skipped in real time',
                  'Progress auto-tracked over every session',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coach dashboard mockup */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
              <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
                <div className="ml-3 flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-400 border border-gray-200">app.propelcoaches.com/training</div>
              </div>
              <div className="bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Hypertrophy Block A</p>
                    <p className="text-xs text-gray-400">Emma Wilson · Week 3 of 8 · 4 days/week</p>
                  </div>
                  <span className="px-2 py-0.5 bg-brand/10 text-brand text-xs font-semibold rounded-full">Active</span>
                </div>
                {/* Day tabs */}
                <div className="flex gap-1 mb-4">
                  {['Day 1','Day 2','Day 3','Day 4'].map((d,i) => (
                    <button key={d} className={`px-3 py-1 rounded-lg text-xs font-medium ${i===0?'bg-brand text-white':'bg-gray-100 text-gray-500'}`}>{d}</button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Upper Body Push</p>
                <div className="space-y-2">
                  {[
                    ['Bench Press','4','8-10','75kg'],
                    ['Incline DB Press','3','10-12','30kg'],
                    ['Cable Lateral Raise','4','15','12kg'],
                    ['Tricep Pushdown','3','12-15','25kg'],
                  ].map(([ex,sets,reps,weight],i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand">{i+1}</div>
                        <span className="font-medium text-gray-800">{ex}</span>
                      </div>
                      <div className="flex gap-4 text-gray-400">
                        <span>{sets} × {reps}</span>
                        <span className="text-gray-600 font-medium">{weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F7B8C] rounded-full" style={{width:'62%'}}/>
                  </div>
                  <span className="text-xs text-gray-400">Week 3/8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 2: Nutrition ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="w-[220px]">
                <div className="bg-gray-900 rounded-[30px] p-[5px] shadow-2xl shadow-black/20" style={{aspectRatio:'9/19'}}>
                  <div className="bg-white rounded-[26px] overflow-hidden h-full flex flex-col">
                    <div className="bg-[#0F7B8C] px-4 py-3">
                      <p className="text-white text-[11px] font-bold">Meal Plan — Monday</p>
                      <p className="text-white/70 text-[9px]">Assigned by coach</p>
                    </div>
                    <div className="p-3 space-y-2 flex-1 overflow-hidden">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold text-gray-700 mb-1">🥣 Breakfast · 520 kcal</p>
                        <p className="text-[8px] text-gray-500">Greek Yoghurt Parfait</p>
                        <p className="text-[8px] text-gray-400">38g P · 52g C · 12g F</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold text-gray-700 mb-1">🍛 Lunch · 680 kcal</p>
                        <p className="text-[8px] text-gray-500">Chicken Rice Bowl</p>
                        <p className="text-[8px] text-gray-400">52g P · 72g C · 14g F</p>
                      </div>
                      <div className="bg-brand/5 rounded-xl p-2.5 border border-brand/15">
                        <p className="text-[9px] font-bold text-brand mb-1.5">Daily Totals</p>
                        {[['Calories','2,050 kcal','88'],['Protein','165g','92'],['Carbs','210g','84'],['Fat','62g','89']].map(([l,v,p]) => (
                          <div key={l} className="mb-1">
                            <div className="flex justify-between text-[8px] mb-0.5">
                              <span className="text-gray-500">{l}</span>
                              <span className="font-semibold text-gray-700">{v}</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full">
                              <div className="h-full bg-[#0F7B8C] rounded-full" style={{width:`${p}%`}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-brand tracking-wide mb-3">Nutrition & Meal Plans</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Nutrition coaching without the spreadsheets
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Build complete meal plans, set macro targets, or use AI to generate personalised plans in seconds. Clients see their full plan in the app and log food instantly.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'AI-generated meal plans in under 30 seconds',
                  'Full macro breakdowns per meal and per day',
                  'Clients log food by barcode, photo, or search',
                  'Weekly nutrition compliance tracking for coaches',
                  'Adjust targets week-by-week as clients progress',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 3: Check-ins & Progress ─── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-brand tracking-wide mb-3">Check-ins & Progress Tracking</p>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Know exactly how every client is doing, every week
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Automated weekly check-ins land in your client&apos;s app. Review responses, leave feedback, and track every metric — weight, body measurements, progress photos, sleep, energy, and more.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Custom check-in forms with any question type',
                  'Progress photos with side-by-side comparison',
                  'Auto-scheduled weekly, biweekly, or monthly',
                  'Leave coach feedback directly on each check-in',
                  'Spot compliance trends across all clients at once',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Check-in mockup */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white">
              <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
                <div className="ml-3 flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-400 border border-gray-200">app.propelcoaches.com/check-ins</div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Weekly Check-In</p>
                    <p className="text-xs text-gray-400">Emma Wilson · 25 March 2026</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-full">Submitted</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[['Energy','8','bg-green-50 text-green-600'],['Sleep','7','bg-yellow-50 text-yellow-600'],['Stress','4','bg-red-50 text-red-500'],['Training','9','bg-green-50 text-green-600']].map(([l,v,c]) => (
                    <div key={l} className={`rounded-xl p-2.5 text-center ${c}`}>
                      <p className="text-lg font-bold">{v}</p>
                      <p className="text-[9px] mt-0.5 opacity-80">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 text-xs">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="font-semibold text-gray-500 mb-1">Wins this week</p>
                    <p className="text-gray-700">Hit a new squat PR — 95kg for 5! Nutrition was on point all week too.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="font-semibold text-gray-500 mb-1">Coach feedback</p>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#0F7B8C] flex-shrink-0 flex items-center justify-center text-[8px] text-white font-bold mt-0.5">JK</div>
                      <p className="text-gray-600">Amazing work on the squat PR! Let&apos;s push to 100kg by end of the block. Keep that nutrition consistency going 💪</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-brand/15 overflow-hidden flex items-center justify-center text-[8px] text-brand font-bold">EW</div>
                      <p className="text-gray-400">Current weight: <span className="font-semibold text-gray-600">78.2 kg</span></p>
                    </div>
                    <span className="text-brand text-[10px] font-medium">↓ 0.8kg from last week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Secondary Features Grid ─── */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything in one platform
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Turn features on or off per client. A dietitian doesn&apos;t need workout sections. A PT might not need meal plans. You choose what each client sees.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {title:'AI Coach Assistant',desc:'Responds to clients 24/7 in your tone and style',path:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'},
              {title:'Habit Tracking',desc:'Daily habits with streaks, charts, and reminders',path:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'},
              {title:'Client Messaging',desc:'Real-time chat with voice notes and canned replies',path:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'},
              {title:'Payments & Billing',desc:'Invoicing, subscriptions, and Stripe integration',path:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'},
              {title:'Autoflow Scheduling',desc:'Automate program delivery, check-ins, and messages',path:'M13 10V3L4 14h7v7l9-11h-7z'},
              {title:'White Label Branding',desc:'Your logo, colours, and brand — not ours',path:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'},
              {title:'Progress Photos',desc:'Side-by-side comparison with date overlays',path:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'},
              {title:'Video Exercise Library',desc:'Upload your own exercise demos for every movement',path:'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'},
              {title:'Wearable Sync',desc:'Apple Watch, Fitbit, and Garmin data auto-synced',path:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'},
              {title:'AI Form Check',desc:'Clients upload videos for instant technique feedback',path:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'},
              {title:'Group Coaching',desc:'Channels for challenges, groups, and communities',path:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'},
              {title:'Marketplace',desc:'Sell programs and templates to earn passive income',path:'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'},
            ].map((f, i) => (
              <div key={i} className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-brand/30 hover:shadow-md transition-all cursor-default">
                <div className="w-9 h-9 rounded-xl bg-brand/8 group-hover:bg-brand/12 flex items-center justify-center mb-3.5 transition-colors">
                  <svg className="w-4.5 h-4.5 text-brand" style={{width:'1.125rem',height:'1.125rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.path}/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Section ─── */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand to-[#0a5a68] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-4">
                <span className="text-xs font-semibold text-white/80">AI-powered coaching</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your AI coach works while you sleep</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Clients don&apos;t stop needing support at 5pm. Your AI coaching assistant handles messages around the clock — in your voice, with your knowledge.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Responds instantly to client questions, 24/7',
                  'Trained on your communication style and cues',
                  'Hands off to you when something needs a human',
                  'Toggle on or off per client, any time',
                  'Generates meal plans and programs on demand',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                  <p className="text-xs font-semibold text-white/50">Live conversation example</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-white/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">Hey, I missed my session today. Feeling really guilty 😔</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-700">Don&apos;t be too hard on yourself — one missed session won&apos;t undo your progress. How are you feeling? Want to make it up tomorrow?</p>
                      <p className="text-[10px] text-brand font-semibold mt-1">🤖 AI Coach (James K.)</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-white/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm">Yeah, work was crazy. I&apos;ll make it up tomorrow 🙏</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                      <p className="text-sm text-gray-700">That&apos;s the spirit. Tomorrow is upper body — sleep well tonight and get a good breakfast in. You&apos;ve got this 💪</p>
                      <p className="text-[10px] text-brand font-semibold mt-1">🤖 AI Coach (James K.)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Coaches love Propel</h2>
            <p className="mt-4 text-gray-500">Join hundreds of health professionals who&apos;ve simplified their coaching business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {quote:'Propel replaced three separate tools I was juggling. My clients love the app, my admin time is down 80%, and I actually enjoy coaching again.',name:'Sarah Mitchell',role:'Online Personal Trainer',location:'Sydney, NSW',initials:'SM'},
              {quote:'As a dietitian, I only needed the nutrition and check-in features. Being able to hide the workout section keeps it clean for my clients. Game changer.',name:'James Khoury',role:'Accredited Dietitian',location:'Melbourne, VIC',initials:'JK'},
              {quote:'The AI coach handles all my after-hours messages now. I used to spend 45 minutes every night replying to clients. That time is mine back.',name:'Mia Torres',role:'Exercise Physiologist',location:'Brisbane, QLD',initials:'MT'},
              {quote:'I was hesitant to move platforms but the Propel team made it so easy. Clients were onboarded within a day and the feedback has been incredibly positive.',name:'Alex Chen',role:'Strength & Conditioning Coach',location:'Perth, WA',initials:'AC'},
              {quote:'The check-in forms have completely transformed how I understand my clients. I know exactly how they&apos;re feeling before our calls — saves so much time.',name:'Emma Wilson',role:'Nutritionist',location:'Adelaide, SA',initials:'EW'},
              {quote:'The white-label branding was a big one for me. My clients see my brand everywhere, not a third-party platform. It makes me look so much more professional.',name:'Daniel Park',role:'Online Fitness Coach',location:'Gold Coast, QLD',initials:'DP'},
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/15 transition-all">
                <div className="flex gap-0.5 mb-4" aria-label="5 out of 5 stars">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Propel Promise (Guarantee) ─── */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand/8 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">The Propel Promise</h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                We&apos;re confident Propel will transform how you coach. That&apos;s why we offer a 30-day money-back guarantee — no forms to fill out, no waiting around.
              </p>
              <p className="mt-3 text-gray-500 leading-relaxed">
                If Propel isn&apos;t the best coaching platform you&apos;ve used within your first 30 days, email us and you&apos;ll get a full refund the same day. Simple as that.
              </p>
              <Link href="/register" className="mt-6 inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md shadow-brand/20">
                Start your free trial →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                {path:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',title:'Free trial on every plan',desc:'Try every feature with no credit card required until your trial ends.'},
                {path:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',title:'30-day money-back guarantee',desc:'If you\'re not happy, we refund you that day. No questions, no forms.'},
                {path:'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',title:'No lock-in contracts',desc:'Month-to-month. Cancel any time, instantly, with no cancellation fees.'},
                {path:'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',title:'Onboarding support included',desc:'Every new coach gets a walkthrough call to get set up the right way.'},
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-brand/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.path}/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Up and running in under an hour</h2>
            <p className="mt-4 text-gray-500">No lengthy setup, no tech expertise needed. Just you and your clients, coaching.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {step:'1',title:'Sign up',desc:'Create your account in 60 seconds. Choose your profession and which features your clients can access.'},
              {step:'2',title:'Set up your profile',desc:'Add your branding, create your first check-in form, and build a workout program template.'},
              {step:'3',title:'Invite your clients',desc:'Send clients an invite link. They download the app, complete onboarding, and connect to you instantly.'},
              {step:'4',title:'Start coaching',desc:'Assign programs, send check-ins, chat in real time, and let your AI assistant handle the rest.'},
            ].map((s, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-[60%] right-0 h-0.5 bg-brand/20" />
                )}
                <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-base font-bold text-white">{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <PricingSection />

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand to-[#0a5a68]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Ready to propel your practice?</h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto text-lg">
            Join 500+ health professionals who&apos;ve simplified their entire coaching business with one platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-brand font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg">
              Start free trial <span aria-hidden="true">→</span>
            </Link>
            <a href="#demo" className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
              Watch the demo
            </a>
          </div>
          <p className="mt-5 text-white/50 text-sm">Free trial on every plan · 30-day money-back guarantee · Cancel anytime</p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="Propel" className="w-8 h-8" />
                <span className="text-base font-bold text-white">Propel</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">The coaching platform for health &amp; fitness professionals. Built by coaches, for coaches.</p>
              <div className="flex gap-3">
                {/* Instagram */}
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors" aria-label="Instagram">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                {/* Facebook */}
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors" aria-label="Facebook">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                {/* YouTube */}
                <a href="#" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors" aria-label="YouTube">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Watch Demo</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Start free trial</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Coach login</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">Company</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help & Support</Link></li>
                <li><Link href="/compare" className="hover:text-white transition-colors">Compare</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Download */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">Download the app</p>
              <p className="text-sm text-gray-500 mb-4">Your clients download the Propel Coaches app to log workouts, track nutrition, and stay connected.</p>
              <div className="space-y-2">
                <a href="#" className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2.5 transition-colors">
                  <svg width="18" height="18" fill="white" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-161-39.5c-74 0-89.2 40.7-161.1 40.7s-106.1-58.4-155.8-127.4C46 790.3 2 651.4 2 526.2c0-185.7 120.4-284.1 238.8-284.1 63.1 0 115.6 41.6 155.3 41.6 38.1 0 97.9-43.8 166.1-43.8 27.4 0 109.9 2.6 163.7 73.1zm-209.6-19.4c-28.9-36.3-72-63.7-121.5-63.7-71.3 0-130.5 48-170 94-36.4 42.7-63.9 106.9-63.9 172 0 8.8 1.3 17.6 1.9 20.5 4.5.6 11.7 1.3 19 1.3 64.4 0 135.2-43.1 178.7-91.4 40.4-45.5 74.1-112.5 75.8-172.7z"/></svg>
                  <div>
                    <p className="text-[9px] text-gray-400">Download on the</p>
                    <p className="text-xs font-semibold text-white">App Store</p>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2.5 transition-colors">
                  <svg width="18" height="18" fill="white" viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l2.7 1.5 247.2-247v-5.8L47 0zm425.2 225L381.7 195l-64.8 64.8L381.7 324l90.6-52.1c25.9-14.8 25.9-38.7.9-46.9zm-138.9 80L232.1 497.3l280.1-161.2-64.8-64.8-113.1 34.8z"/></svg>
                  <div>
                    <p className="text-[9px] text-gray-400">Get it on</p>
                    <p className="text-xs font-semibold text-white">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© 2026 Propel Coaches. All rights reserved. Built for coaches, by coaches.</p>
            <p className="text-xs text-gray-600">🇦🇺 Made in Australia</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
