'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { AI_TIERS, COACH_TIERS, formatPrice } from '@/lib/pricing';

type Audience = 'ai' | 'coach';

function useInView(options: IntersectionObserverInit = {}): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView];
}

function AnimatedSection({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const [ref, isInView] = useInView();
  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 opacity-100 ${isInView ? 'translate-y-0' : 'translate-y-4'} ${className}`}
    >
      {children}
    </div>
  );
}

function CheckItem({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <li className={`flex gap-3 text-sm leading-6 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
      <span className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-black ${dark ? 'bg-teal-300/15 text-teal-200 ring-1 ring-teal-200/20' : 'bg-teal-50 text-teal-700'}`}>✓</span>
      <span>{children}</span>
    </li>
  );
}

function FeaturePill({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm backdrop-blur ${dark ? 'border border-white/10 bg-white/10 text-slate-100' : 'border border-teal-700/15 bg-white/80 text-slate-700'}`}>
      {children}
    </span>
  );
}

function PhoneMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`phone-3d preserve-3d relative h-[560px] w-[282px] rounded-[2.7rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_48px_90px_rgba(15,23,42,0.36)] ${className}`}>
      <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
      <div className="absolute inset-[-10px] rounded-[2.7rem] bg-gradient-to-br from-white/60 via-transparent to-teal-300/30 opacity-50 blur-sm" />
      <div className="relative h-full overflow-hidden rounded-[1.9rem] bg-[#f2f7f5]">
        <div className="bg-gradient-to-b from-white to-[#e8f7f3] px-5 pb-5 pt-10">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">AI Coach</div>
          <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950">Bench day. Add 2.5kg.</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">Readiness is green and last top set moved fast. Push load, keep rest strict.</p>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400">Today plan</div>
                <div className="text-lg font-black text-slate-950">Bench press</div>
              </div>
              <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-black text-white">Start</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {['4×6', '82.5kg', '2:30'].map((value) => (
                <div key={value} className="rounded-2xl bg-slate-50 py-2 text-xs font-black text-slate-800">{value}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3 text-xs font-bold text-slate-400">Nutrition directive</div>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full border-[6px] border-teal-600 text-xs font-black text-teal-800">78%</div>
              <div>
                <div className="text-sm font-black text-slate-950">Hit protein early</div>
                <div className="text-xs text-slate-500">42g left before dinner</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-950 p-4 text-white shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-300">Why this?</div>
            <p className="mt-2 text-sm leading-5 text-slate-200">Performance is trending up. Fatigue risk is low. Progress the main lift only.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-3 shadow-sm">
            {['Home', 'Train', 'Food', 'Chat'].map((item, index) => (
              <div key={item} className={`rounded-2xl py-2 text-center text-[10px] font-bold ${index === 0 ? 'bg-teal-50 text-teal-800' : 'text-slate-400'}`}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachDashboardMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`dashboard-3d preserve-3d relative mx-auto w-full max-w-[770px] rounded-[2rem] border border-white/70 bg-white/90 p-3 shadow-[0_48px_110px_rgba(15,23,42,0.26)] backdrop-blur-xl ${className}`}>
      <div className="rounded-[1.55rem] border border-slate-200 bg-slate-950 p-3">
        <div className="mb-3 flex items-center gap-2 px-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">coach command centre</span>
        </div>
        <div className="grid gap-3 rounded-[1.25rem] bg-[#f7faf9] p-4 md:grid-cols-[0.82fr_1.2fr_0.9fr]">
          <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className="h-3 w-20 rounded-full bg-slate-200" />
            {['AI Briefing', 'Clients', 'Programs', 'Nutrition', 'Messages'].map((item, index) => (
              <div key={item} className={`rounded-xl px-3 py-2 text-xs font-semibold ${index === 0 ? 'bg-teal-50 text-teal-800' : 'bg-slate-50 text-slate-500'}`}>{item}</div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Today&apos;s decision</div>
              <div className="text-lg font-black text-slate-950">Reduce Tom&apos;s squat volume by 1 set</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Sleep 2/5 and RPE drifted above plan. Keep the top set, remove the back-off set, add 8 minutes mobility.</p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-bold text-white">Approve</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Edit</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['92%', 'adherence'],
                ['14', 'check-ins'],
                ['6', 'at risk'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="text-xl font-black text-slate-950">{value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Program builder</span>
                <span className="text-teal-700">4 week block</span>
              </div>
              <div className="space-y-2">
                {['Bench press · 4×6 @ RPE 8', 'Incline DB press · 3×10', 'Cable row · 3×12'].map((line) => (
                  <div key={line} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{line}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">AI assistant</div>
              <p className="mt-2 text-sm leading-5 text-slate-200">“Hit 140g protein before 8pm. Swap the salmon meal if appetite is low.”</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-500">Live messages</div>
              <div className="mt-3 space-y-2">
                <div className="rounded-2xl bg-teal-50 p-3 text-xs text-teal-900">Client uploaded form check video.</div>
                <div className="ml-5 rounded-2xl bg-slate-100 p-3 text-xs text-slate-700">AI drafted a response for review.</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 text-xs font-bold text-slate-500">Revenue</div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-4/5 rounded-full bg-teal-600" /></div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500">18 active clients · 4 trials</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStage() {
  return (
    <div className="perspective-stage hero-3d-stage relative min-h-[720px] lg:min-h-[660px]">
      <div className="depth-grid absolute inset-0" />
      <div className="living-halo absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <CoachDashboardMockup className="absolute left-0 top-14 z-10 w-[92%] max-w-[720px]" />
      <PhoneMockup className="absolute -bottom-4 right-2 z-30 lg:right-8" />
      <div className="floating-card-3d absolute left-3 top-4 z-40 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur" style={{ animationDelay: '0.7s' }}>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Live signal</div>
        <div className="mt-1 text-lg font-black text-slate-950">Stress 8/10</div>
        <div className="mt-2 text-xs font-bold text-orange-700">Volume adjusted</div>
      </div>
      <div className="floating-card-3d floating-card-3d-deep absolute bottom-20 left-0 z-40 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur" style={{ animationDelay: '1.2s' }}>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">AI action</div>
        <div className="mt-1 text-lg font-black text-slate-950">Draft reply ready</div>
        <div className="mt-2 text-xs font-bold text-teal-700">Approve in one tap</div>
      </div>
      <div className="depth-shadow absolute bottom-3 left-[12%] h-20 w-[72%] rounded-full bg-slate-900/20 blur-3xl" />
    </div>
  );
}

function AudienceCard({ audience, title, body, bullets, cta, href }: { audience: Audience; title: string; body: string; bullets: string[]; cta: string; href: string }) {
  const isAi = audience === 'ai';
  return (
    <Link href={href} className={`audience-card group relative overflow-hidden rounded-[2.25rem] border p-7 shadow-2xl transition duration-500 hover:-translate-y-2 ${isAi ? 'border-teal-200 bg-white text-slate-950 shadow-teal-900/10' : 'border-slate-800 bg-slate-950 text-white shadow-slate-950/25'}`}>
      <div className={`absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 ${isAi ? 'bg-[radial-gradient(circle_at_25%_10%,rgba(20,184,166,.18),transparent_38%)]' : 'bg-[radial-gradient(circle_at_25%_10%,rgba(45,212,191,.22),transparent_42%)]'}`} />
      <div className="relative">
        <div className={`mb-8 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${isAi ? 'bg-teal-50 text-teal-800' : 'bg-white/10 text-teal-200 ring-1 ring-white/10'}`}>{isAi ? 'I want coaching' : 'I coach clients'}</div>
        <h3 className={`text-3xl font-black tracking-[-0.04em] ${isAi ? 'text-slate-950' : 'text-white'}`}>{title}</h3>
        <p className={`mt-4 text-base leading-7 ${isAi ? 'text-slate-600' : 'text-slate-300'}`}>{body}</p>
        <ul className="mt-6 space-y-2">
          {bullets.map((bullet) => <CheckItem key={bullet} dark={!isAi}>{bullet}</CheckItem>)}
        </ul>
        <div className={`mt-8 inline-flex rounded-full px-5 py-3 text-sm font-black transition group-hover:scale-105 ${isAi ? 'bg-teal-700 text-white' : 'bg-white text-slate-950'}`}>{cta}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const target = new URL('/auth/reset-password', window.location.origin);
    target.searchParams.set('code', code);
    window.location.replace(target.toString());
  }, []);

  const aiFeatures = [
    ['Daily decision engine', 'Open the app and get one clear directive: train, recover, eat, or adjust.'],
    ['AI programs + meal plans', 'Strength, running, cycling, triathlon, HYROX, combat, mobility, recipes, and macro targets.'],
    ['Adaptive coaching', 'Briefings react to sleep, stress, energy, adherence, PRs, body metrics, and check-ins.'],
  ];

  const coachFeatures = [
    ['Coach command centre', 'Manage clients, programs, meal plans, messages, forms, resources, payments, and teams.'],
    ['AI as leverage', 'Draft replies, review check-ins, generate programs, create meal plans, and flag at-risk clients.'],
    ['Client app included', 'Clients get the mobile execution layer while coaches keep control from the web dashboard.'],
  ];

  const faqs = [
    {
      question: 'Is Propel for athletes or coaches?',
      answer: 'Both. Solo users can use the mobile AI Coach subscription as their daily decision engine. Human coaches can use Propel as business software for clients, programs, nutrition, check-ins, payments, and AI-assisted support.',
    },
    {
      question: 'What is the AI Coach subscription?',
      answer: 'The AI Coach path is for people who want coaching without a human coach. Propel generates plans, interprets check-ins and logs, and tells the user exactly what to do today.',
    },
    {
      question: 'What is the coach software side?',
      answer: 'The coach side is a web dashboard for personal trainers, strength coaches, online coaches, and nutrition coaches. It helps manage clients while AI handles repetitive interpretation, drafts, and plan generation.',
    },
    {
      question: 'Can a coach use AI without replacing their coaching?',
      answer: 'Yes. Coaches stay in control. AI can draft messages, suggest adjustments, generate starting points, and surface risks, but the coach can review and edit decisions before clients see them.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Paid coach plans include a 14-day free trial. The consumer AI Coach plans are priced separately for mobile users.',
    },
  ];

  return (
    <>
      <main className="min-h-screen overflow-hidden bg-[#f4f8f6] text-slate-950">
        <header className="fixed top-0 z-50 w-full border-b border-white/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/10">P</span>
              <span>
                <span className="block text-lg font-black tracking-tight text-slate-950">Propel</span>
                <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700 sm:block">AI coach + coach software</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              <Link href="#choose" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">Choose path</Link>
              <Link href="#ai-coach" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">AI Coach</Link>
              <Link href="#coach-software" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">For Coaches</Link>
              <Link href="#pricing" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">Pricing</Link>
              <Link href="#faq" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">FAQ</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden text-sm font-bold text-slate-600 transition hover:text-teal-700 sm:block">Log in</Link>
              <Link href="#choose" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-teal-800">
                Choose your path
              </Link>
            </div>
          </div>
        </header>

        <section className="relative px-5 pb-20 pt-32 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="absolute left-1/2 top-24 h-[720px] w-[960px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.20),rgba(255,255,255,0)_66%)]" />
          <div className="absolute right-[-110px] top-48 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute bottom-12 left-[-90px] h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.86fr_1.14fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-700/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-teal-800 shadow-sm backdrop-blur">
                Two products. One coaching engine.
              </div>
              <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                Coaching software for coaches. AI coaching for everyone else.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Propel splits into two clear paths: a mobile AI Coach subscription for users who want daily guidance, and a coach workspace for professionals running clients at scale.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#choose" className="rounded-full bg-teal-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800">
                  Pick your path
                </Link>
                <Link href="#ai-coach" className="rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800">
                  Explore AI Coach
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <FeaturePill>Mobile AI Coach</FeaturePill>
                <FeaturePill>Coach web dashboard</FeaturePill>
                <FeaturePill>Client app</FeaturePill>
                <FeaturePill>Training + nutrition + payments</FeaturePill>
              </div>
            </div>
            <HeroStage />
          </div>
        </section>

        <section id="choose" className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Start here</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">What are you looking for?</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">The homepage now routes visitors by intent, instead of forcing coaches and solo athletes through the same pitch.</p>
            </AnimatedSection>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <AudienceCard
                audience="ai"
                title="I want an AI coach in my pocket"
                body="For solo users who want Propel to decide the next best action: today’s session, nutrition target, recovery constraint, and why it matters."
                bullets={['Mobile subscription', 'Daily briefings and plan generation', 'Workout, nutrition, habits, progress, and chat']}
                cta="Go to AI Coach"
                href="#ai-coach"
              />
              <AudienceCard
                audience="coach"
                title="I coach clients and need software"
                body="For coaches who need a browser command centre, client app, programming, nutrition, messaging, payments, and AI assistance behind the scenes."
                bullets={['Coach web dashboard', 'Client management and branded app', 'AI drafts, check-in reviews, programs, and meal plans']}
                cta="Go to Coach Software"
                href="#coach-software"
              />
            </div>
          </div>
        </section>

        <section id="ai-coach" className="relative overflow-hidden bg-slate-950 px-5 py-24 text-white lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,.30),transparent_32%),radial-gradient(circle_at_78%_42%,rgba(45,212,191,.15),transparent_36%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            <AnimatedSection>
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">AI Coach mobile subscription</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">For people who want the app to tell them exactly what to do today.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">Not a passive tracker. The AI Coach reads the user’s training, nutrition, check-ins, habits, body metrics, and progress, then makes a specific decision.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <FeaturePill dark>Daily directive</FeaturePill>
                <FeaturePill dark>Program generation</FeaturePill>
                <FeaturePill dark>AI meal plans</FeaturePill>
                <FeaturePill dark>Check-ins + chat</FeaturePill>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="rounded-full bg-white px-7 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5">Download the app</Link>
                <Link href="#ai-pricing" className="rounded-full border border-white/15 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">See AI plans</Link>
              </div>
            </AnimatedSection>
            <AnimatedSection className="perspective-stage flex justify-center">
              <PhoneMockup className="ai-phone-showcase" />
            </AnimatedSection>
          </div>
          <div className="relative mx-auto mt-16 grid max-w-7xl gap-5 md:grid-cols-3">
            {aiFeatures.map(([title, body], index) => (
              <AnimatedSection key={title} style={{ animationDelay: `${index * 90}ms` }} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-teal-300/10 text-sm font-black text-teal-200 ring-1 ring-teal-200/20">0{index + 1}</div>
                <h3 className="text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section id="coach-software" className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
            <AnimatedSection className="perspective-stage order-2 lg:order-1">
              <CoachDashboardMockup />
            </AnimatedSection>
            <AnimatedSection className="order-1 lg:order-2">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Coach software</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">For professionals who need leverage without losing control.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Coaches get the business operating system: clients, programming, nutrition, check-ins, chat, resources, payments, teams, and AI assistance that can draft but not hijack the relationship.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <FeaturePill>Client management</FeaturePill>
                <FeaturePill>Programs + meals</FeaturePill>
                <FeaturePill>Payments</FeaturePill>
                <FeaturePill>AI assistant</FeaturePill>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-full bg-teal-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800">Start coach trial</Link>
                <Link href="#coach-pricing" className="rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800">See coach plans</Link>
              </div>
            </AnimatedSection>
          </div>
          <div className="mx-auto mt-16 grid max-w-7xl gap-5 md:grid-cols-3">
            {coachFeatures.map(([title, body], index) => (
              <AnimatedSection key={title} style={{ animationDelay: `${index * 90}ms` }} className="rounded-[2rem] border border-slate-100 bg-[#f8fbfa] p-6 shadow-xl shadow-slate-900/5">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">0{index + 1}</div>
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </AnimatedSection>
            ))}
          </div>
        </section>

        <section className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Shared engine</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">Same product brain. Different front doors.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Whether the user arrives as an athlete or a coach, the message is the same: Propel interprets data and turns it into action.</p>
            </AnimatedSection>
            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <AnimatedSection className="rounded-[2.25rem] border border-white bg-white p-8 shadow-xl shadow-slate-900/5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Client outcome</div>
                <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">“I know exactly what to do.”</h3>
                <ul className="mt-6 space-y-2">
                  {['Train, recover, eat, or adjust — one main action', 'Specific numbers like 82.5kg, 140g protein, or reduce volume by 1 set', 'Reasoning explained without turning into a dashboard'].map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                </ul>
              </AnimatedSection>
              <AnimatedSection className="rounded-[2.25rem] border border-slate-800 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/25">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-teal-300">Coach outcome</div>
                <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">“I can coach more clients without lowering quality.”</h3>
                <ul className="mt-6 space-y-2">
                  {['AI flags what needs attention first', 'Drafts and generated plans save repetitive work', 'Coach remains the authority before clients see sensitive changes'].map((item) => <CheckItem key={item} dark>{item}</CheckItem>)}
                </ul>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Pricing</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">Two pricing tracks for two buyer intents.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">AI Coach is the mobile consumer subscription. Coach plans are for professionals running client businesses.</p>
            </AnimatedSection>

            <div id="ai-pricing" className="mt-14">
              <div className="mb-6 flex items-end justify-between gap-5">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">AI Coach</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Mobile subscription</h3>
                </div>
                <Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="hidden rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white sm:inline-flex">Download app</Link>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {[
                  { tier: AI_TIERS.ai_starter, label: 'For structure', details: ['AI-generated workouts', 'AI meal plans', 'Daily decision engine', 'Habits and progress'] },
                  { tier: AI_TIERS.ai_pro, label: 'For daily support', details: ['Everything in Starter', 'AI Coach chat', 'Weekly check-in feedback', 'Full progress analytics'] },
                  { tier: AI_TIERS.ai_elite, label: 'For full AI coaching', details: ['Everything in Pro', 'Unlimited AI chat', 'Video form analysis', 'Wearable sync'] },
                ].map(({ tier, label, details }) => (
                  <AnimatedSection key={tier.name} className={`relative rounded-[2rem] border p-7 shadow-xl ${tier.popular ? 'border-teal-700 bg-slate-950 text-white shadow-teal-950/20' : 'border-slate-100 bg-[#f8fbfa] text-slate-950 shadow-slate-900/5'}`}>
                    {tier.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-xs font-black uppercase tracking-wider text-white">Most popular</div>}
                    <h4 className="text-2xl font-black">{tier.name}</h4>
                    <p className={`mt-2 text-sm ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
                    <div className="mt-7 text-5xl font-black tracking-tight">{formatPrice(tier.monthlyCents)}</div>
                    <p className={`mt-1 text-sm ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>/month</p>
                    <Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className={`mt-7 block rounded-full px-5 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${tier.popular ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>Download app</Link>
                    <ul className="mt-7 space-y-3">
                      {details.map((detail) => <CheckItem key={detail} dark={tier.popular}>{detail}</CheckItem>)}
                    </ul>
                  </AnimatedSection>
                ))}
              </div>
            </div>

            <div id="coach-pricing" className="mt-20">
              <div className="mb-6 flex items-end justify-between gap-5">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Coach software</div>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Web dashboard + client app</h3>
                </div>
                <Link href="/register" className="hidden rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white sm:inline-flex">Start trial</Link>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {[
                  { tier: COACH_TIERS.coach_starter, label: 'For new coaches', details: [`Up to ${COACH_TIERS.coach_starter.maxClients} clients`, 'Web dashboard', 'Client app', 'AI-generated plans quota'] },
                  { tier: COACH_TIERS.coach_pro, label: 'For scaling coaches', details: ['Unlimited clients', 'Payment processing', 'Advanced analytics', 'Group messaging', 'All core AI support'] },
                  { tier: COACH_TIERS.coach_scale, label: 'For teams and clinics', details: [`Up to ${COACH_TIERS.coach_scale.teamSeats} practitioners`, 'Custom branding', 'Team dashboard and permissions', 'Dedicated onboarding call'] },
                ].map(({ tier, label, details }) => (
                  <AnimatedSection key={tier.name} className={`relative rounded-[2rem] border p-7 shadow-xl ${tier.popular ? 'border-teal-700 bg-slate-950 text-white shadow-teal-950/20' : 'border-slate-100 bg-[#f8fbfa] text-slate-950 shadow-slate-900/5'}`}>
                    {tier.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-xs font-black uppercase tracking-wider text-white">Most popular</div>}
                    <h4 className="text-2xl font-black">{tier.name}</h4>
                    <p className={`mt-2 text-sm ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
                    <div className="mt-7 text-5xl font-black tracking-tight">{formatPrice(tier.monthlyCents)}</div>
                    <p className={`mt-1 text-sm ${tier.popular ? 'text-slate-300' : 'text-slate-500'}`}>/month</p>
                    <Link href="/register" className={`mt-7 block rounded-full px-5 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${tier.popular ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>Start free trial</Link>
                    <ul className="mt-7 space-y-3">
                      {details.map((detail) => <CheckItem key={detail} dark={tier.popular}>{detail}</CheckItem>)}
                    </ul>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <AnimatedSection className="text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">FAQ</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-5xl">Which Propel is right for me?</h2>
            </AnimatedSection>
            <div className="mt-12 space-y-4">
              {faqs.map((faq, i) => (
                <AnimatedSection key={faq.question} className="overflow-hidden rounded-3xl border border-white bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                    aria-expanded={activeFaq === i}
                  >
                    <span className="text-lg font-black text-slate-950">{faq.question}</span>
                    <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-teal-50 text-lg font-black text-teal-800 transition ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  <div className={`grid transition-all duration-300 ${activeFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="border-t border-slate-100 px-6 py-5 leading-7 text-slate-600">{faq.answer}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-8">
          <AnimatedSection className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-center text-white shadow-2xl shadow-slate-950/20 sm:p-14">
            <div className="mx-auto max-w-3xl">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Choose your Propel</div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Get coached by AI, or use AI to coach better.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">One brand can now speak clearly to both sides of the market without blurring the offer.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="rounded-full bg-teal-500 px-8 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-teal-400">Download AI Coach</Link>
                <Link href="/register" className="rounded-full border border-white/15 bg-white/10 px-8 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">Start coach trial</Link>
              </div>
            </div>
          </AnimatedSection>
        </section>

        <footer className="border-t border-slate-200 bg-white px-5 py-12 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
            <div>
              <div className="text-2xl font-black text-slate-950">Propel</div>
              <p className="mt-3 text-sm leading-6 text-slate-500">AI coaching for solo users and client-management software for coaches.</p>
            </div>
            <div>
              <h4 className="font-black text-slate-950">Paths</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li><Link href="#ai-coach" className="hover:text-teal-700">AI Coach</Link></li>
                <li><Link href="#coach-software" className="hover:text-teal-700">Coach Software</Link></li>
                <li><Link href="#pricing" className="hover:text-teal-700">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-950">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li><Link href="/privacy-policy" className="hover:text-teal-700">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-teal-700">Terms</Link></li>
                <li><Link href="/refund-policy" className="hover:text-teal-700">Refund policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-950">Access</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li><Link href="/login" className="hover:text-teal-700">Coach login</Link></li>
                <li><Link href="/register" className="hover:text-teal-700">Start coach trial</Link></li>
                <li><Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="hover:text-teal-700">Download AI Coach</Link></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 pt-6 text-sm text-slate-400">© 2026 Propel Coaches. All rights reserved.</div>
        </footer>
      </main>
    </>
  );
}
