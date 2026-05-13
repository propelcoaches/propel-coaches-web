'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { COACH_TIERS, formatPrice } from '@/lib/pricing';

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

function FeaturePill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-teal-700/15 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-slate-700">
      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-700">✓</span>
      <span>{children}</span>
    </li>
  );
}

function DashboardMockup() {
  return (
    <div className="preserve-3d relative mx-auto w-full max-w-[760px] animate-dashboard-float rounded-[2rem] border border-white/70 bg-white/90 p-3 shadow-[0_35px_90px_rgba(15,23,42,0.20)] backdrop-blur-xl">
      <div className="rounded-[1.55rem] border border-slate-200 bg-slate-950 p-3">
        <div className="mb-3 flex items-center gap-2 px-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">coach command centre</span>
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
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">Today&apos;s decision</div>
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
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">AI coach</div>
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
              <div className="mb-2 text-xs font-bold text-slate-500">Nutrition</div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-4/5 rounded-full bg-teal-600" /></div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500">Protein target 118 / 150g</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`preserve-3d relative h-[560px] w-[280px] rounded-[2.6rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_32px_70px_rgba(15,23,42,0.35)] ${className}`}>
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
      <div className="h-full overflow-hidden rounded-[1.85rem] bg-[#f3f7f5]">
        <div className="bg-gradient-to-b from-white to-[#edf8f5] px-5 pb-4 pt-10">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Today</div>
          <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">Bench day. Add 2.5kg.</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">Readiness is green. Last top set moved fast, so push the load and keep rest strict.</p>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400">Today plan</div>
                <div className="text-lg font-black text-slate-950">Bench press</div>
              </div>
              <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-bold text-white">Start</span>
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
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Coach note</div>
            <p className="mt-2 text-sm leading-5 text-slate-200">“Keep reps smooth. Stop if bar speed drops.”</p>
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

  const platformCards = [
    {
      eyebrow: 'For coaches',
      title: 'Coach workspace',
      body: 'Run clients, programs, meals, messages, forms, payments, resources, teams, and AI reviews from one browser dashboard.',
      items: ['Client CRM and notes', 'Program builder and templates', 'Check-ins, forms, resources', 'Payments, packages, referrals'],
    },
    {
      eyebrow: 'For clients',
      title: 'Mobile decision engine',
      body: 'Clients open the app and immediately know what to do: today’s workout, nutrition directive, habit focus, progress trend, and coach message.',
      items: ['Home directive card', 'Training, nutrition, habits, progress', 'Chat with coach or AI', 'Offline-first logging paths'],
    },
    {
      eyebrow: 'For scale',
      title: 'AI coach layer',
      body: 'Propel analyses signals, drafts responses, generates plans, adapts training, and keeps clients supported when the coach is busy.',
      items: ['Daily briefing', 'Reactive nudges', 'Coach reply drafts', 'Signal-gated decisions'],
    },
  ];

  const featureGroups = [
    {
      title: 'AI coaching engine',
      items: [
        'Daily coaching briefing with one directive, adjustments, constraints, focus, and reasoning',
        'Five-pillar decision logic: stimulus, fatigue, adherence, time horizon, and risk',
        'Autonomous solo AI coach mode plus coach-assisted mode',
        'AI response drafts, check-in reviews, scheduled nudges, and voice-note tone support',
        'Provider fallback diagnostics for live AI proof and safer failure handling',
      ],
    },
    {
      title: 'Training and workout delivery',
      items: [
        'Program generation for strength, running, cycling, triathlon, HYROX, combat, and mobility flows',
        'Live workout logger with set completion, RPE, rest timer, exercise rail, and finish ratings',
        'Exercise swaps, previous-session history, PR detection, Epley 1RM estimates, and adaptive adjustments',
        'Training calendar, manage programs, performance profile, workout history, and external-session logging',
        'Exercise media catalogue wiring for demos without placeholder dependence',
      ],
    },
    {
      title: 'Nutrition intelligence',
      items: [
        'Macro targets, food logs, water tracking, weekly macro history, and nutrition insight cards',
        'Meal plans with named meals, recipes, per-meal macros, alternatives, and log-meal flows',
        'AI food vision, food accuracy feedback, meal swaps, weekly adjustments, and nutrition decision engine',
        'Recipe media mapping, recent meals, smart suggestions, and safe coach nutrition guardrails',
      ],
    },
    {
      title: 'Client accountability',
      items: [
        'Structured daily and weekly check-ins with sleep, stress, energy, digestion, hunger, wins, and struggles',
        'Habit tracking with completion haptics, contribution calendar, current streak, best streak, and freeze support',
        'Body metrics, weight logs, measurements, progress photos, HealthKit-style health data, and progress reports',
        'Real-time chat, suggested replies, file attachments, voice messages, read states, and fallback observability',
      ],
    },
    {
      title: 'Coach business tools',
      items: [
        'Client directory, client detail tabs, overview, training, nutrition, check-ins, chat, resources, and notes',
        'Program templates, meal plans, resource collections, recipe books, video library, forms, tags, tasks, groups, and community surfaces',
        'Branding, packages, marketplace, payments, referrals, reviews, teams, notifications, email sequences, and AI coach configuration',
        'Admin, billing, privacy, settings, client invite, onboarding, and coach-client role separation',
      ],
    },
    {
      title: 'Platform quality',
      items: [
        'Shared Supabase backend across mobile and web with auth, RLS-aware queries, storage, and edge functions',
        'Offline cache patterns, auth self-healing, safer query hardening, and defensive fallback UI',
        'Accessibility work across logger controls, rest overlay, exercise rail, finish ratings, and tab navigation',
        'Maestro smoke coverage for authenticated tab flows plus targeted Deno and unit tests around AI/provider behavior',
      ],
    },
  ];

  const faqs = [
    {
      question: 'What is Propel Coaches?',
      answer: 'Propel Coaches is a two-sided coaching platform: a web workspace for coaches and a mobile daily decision engine for clients. It is designed to tell clients exactly what to do next, not just display passive dashboards.',
    },
    {
      question: 'Who is it for?',
      answer: 'Propel is built for personal trainers, strength coaches, online coaches, and nutrition coaches who want one platform for programming, nutrition, messaging, check-ins, progress, payments, and AI-assisted support.',
    },
    {
      question: 'How is the AI different from a chatbot?',
      answer: 'The AI layer is tied to training, nutrition, check-in, habit, progress, and adherence signals. It can draft coach replies, generate plans, adapt decisions, and explain why the client should take a specific action today.',
    },
    {
      question: 'Can clients use it without a human coach?',
      answer: 'Yes. Propel supports an autonomous AI coach path for solo users, while also supporting human-coach businesses that want AI assistance behind the scenes.',
    },
    {
      question: 'Is everything on this page live?',
      answer: 'This page lists the product surfaces and features built into the app and dashboard codebase. Some AI and launch-hardening paths still require deployed live smoke proof before they should be marketed as generally available.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Paid coach plans include a 14-day free trial. Stripe collects your card at signup, and you are not charged until the trial ends.',
    },
  ];

  const professions = ['Personal trainers', 'Strength coaches', 'Online coaches', 'Nutrition coaches'];

  return (
    <>
      <main className="min-h-screen overflow-hidden bg-[#f4f8f6] text-slate-950">
        <header className="fixed top-0 z-50 w-full border-b border-white/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-950/10">P</span>
              <span>
                <span className="block text-lg font-black tracking-tight text-slate-950">Propel Coaches</span>
                <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700 sm:block">Daily decision engine</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              <Link href="#platform" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">Platform</Link>
              <Link href="#features" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">Features</Link>
              <Link href="#ai" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">AI Coach</Link>
              <Link href="#pricing" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">Pricing</Link>
              <Link href="#faq" className="text-sm font-semibold text-slate-600 transition hover:text-teal-700">FAQ</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden text-sm font-bold text-slate-600 transition hover:text-teal-700 sm:block">Log in</Link>
              <Link href="/register" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-teal-800">
                Start free trial
              </Link>
            </div>
          </div>
        </header>

        <section className="relative px-5 pb-24 pt-32 lg:px-8 lg:pb-32 lg:pt-40">
          <div className="absolute left-1/2 top-24 h-[680px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18),rgba(255,255,255,0)_66%)]" />
          <div className="absolute right-[-110px] top-48 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute bottom-12 left-[-90px] h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-700/15 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-teal-800 shadow-sm backdrop-blur">
                Built for coaches. Felt by clients.
              </div>
              <h1 className="max-w-4xl text-5xl font-black tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                Make your coaching app feel alive.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Propel turns training, nutrition, check-ins, habits, progress, and messages into one clear directive: what the client should do right now.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-full bg-teal-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800">
                  Start your free trial
                </Link>
                <Link href="#platform" className="rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-800">
                  See the platform
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <FeaturePill>AI coaching engine</FeaturePill>
                <FeaturePill>Coach web dashboard</FeaturePill>
                <FeaturePill>Client iOS app</FeaturePill>
                <FeaturePill>Training + nutrition + payments</FeaturePill>
              </div>
            </div>

            <div className="perspective-stage relative min-h-[680px] lg:min-h-[620px]">
              <div className="living-halo absolute left-1/2 top-1/2 z-0 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <DashboardMockup />
              <PhoneMockup className="absolute -bottom-10 right-2 z-20 animate-card-orbit lg:right-8" />
              <div className="absolute left-4 top-10 z-30 animate-card-orbit rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur" style={{ '--tilt': '-2deg', animationDelay: '0.8s' } as CSSProperties}>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Live signal</div>
                <div className="mt-1 text-lg font-black text-slate-950">Stress 8/10</div>
                <div className="mt-2 text-xs font-semibold text-orange-700">Training volume adjusted</div>
              </div>
              <div className="absolute bottom-20 left-0 z-30 animate-card-orbit rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur" style={{ '--tilt': '3deg', animationDelay: '1.4s' } as CSSProperties}>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">AI action</div>
                <div className="mt-1 text-lg font-black text-slate-950">Draft reply ready</div>
                <div className="mt-2 text-xs font-semibold text-teal-700">Coach can approve in one tap</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-teal-900/10 bg-white/70 px-5 py-8 backdrop-blur lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 text-center md:grid-cols-4">
            {[
              ['One directive', 'Every client screen answers what to do next'],
              ['Two-sided', 'Coach dashboard plus client mobile app'],
              ['AI-assisted', 'Autonomous or coach-supervised workflows'],
              ['Built wide', 'Training, nutrition, habits, chat, payments'],
            ].map(([title, body]) => (
              <div key={title} className="feature-line rounded-3xl bg-white/75 p-5 shadow-sm">
                <div className="text-xl font-black text-slate-950">{title}</div>
                <div className="mt-1 text-sm text-slate-500">{body}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Platform</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Three products working as one coaching system.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">The website should not undersell the app. Propel already spans the full coaching loop: prescribe, execute, adapt, communicate, and prove progress.</p>
            </AnimatedSection>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {platformCards.map((card, index) => (
                <AnimatedSection key={card.title} style={{ animationDelay: `${index * 90}ms` }} className="group rounded-[2rem] border border-white bg-white p-7 shadow-xl shadow-slate-900/5 transition hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-900/10">
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-xl font-black text-teal-800 transition group-hover:rotate-6 group-hover:scale-105">0{index + 1}</div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">{card.eyebrow}</div>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{card.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{card.body}</p>
                  <ul className="mt-6 space-y-2">
                    {card.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                  </ul>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section id="ai" className="relative overflow-hidden bg-slate-950 px-5 py-24 text-white lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(20,184,166,.28),transparent_32%),radial-gradient(circle_at_80%_55%,rgba(45,212,191,.16),transparent_34%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <AnimatedSection>
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">AI coach</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Not another chatbot. A decision layer for the whole coaching business.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">Propel uses client context to make coaching specific: load, reps, protein, sleep, stress, adherence, risk, and next action. It can support solo users autonomously or assist a human coach behind the scenes.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {['Daily briefings', 'Signal-gated nudges', 'Coach reply drafts', 'Program generation', 'Nutrition adjustments', 'Check-in reviews'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100 backdrop-blur">{item}</div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[1.5rem] bg-[#071311] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">Today&apos;s generated output</div>
                    <div className="mt-1 text-2xl font-black">Keep intensity. Reduce volume.</div>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-teal-400/15 text-sm font-black text-teal-200 ring-1 ring-teal-300/30">LIVE</div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Directive', 'Bench top set stays at 82.5kg. Remove one back-off set because sleep is 2/5.'],
                    ['Nutrition', 'Hit 140g protein before 8pm. Use the Greek yoghurt meal if appetite drops.'],
                    ['Constraint', 'No conditioning today. Keep shoulder work under RPE 7.'],
                    ['Reasoning', 'Performance is trending up, but fatigue risk is elevated from sleep and stress.'],
                  ].map(([label, body]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">{label}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-200">{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section id="features" className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="max-w-3xl">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Feature inventory</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Showcase everything that has been built.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">A fuller picture of Propel: not just workouts, not just macros, and not just messaging. It is the operating system for a modern coaching practice.</p>
            </AnimatedSection>
            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {featureGroups.map((group, index) => (
                <AnimatedSection key={group.title} style={{ animationDelay: `${index * 60}ms` }} className="rounded-[2rem] border border-white bg-white p-7 shadow-xl shadow-slate-900/5">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">{String(index + 1).padStart(2, '0')}</div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-950">{group.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {group.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                  </ul>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <AnimatedSection>
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Client experience</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Clients do not open Propel to browse. They open it to act.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Every major surface is designed around coaching clarity: one dominant next action, supporting adjustments, and a reason why.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {['Start today’s workout', 'Log meal or swap it', 'Complete habit', 'Send check-in', 'Review progress', 'Message coach'].map((item) => (
                  <div key={item} className="rounded-2xl bg-[#f4f8f6] px-4 py-4 text-sm font-black text-slate-800">{item}</div>
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection className="perspective-stage flex justify-center gap-5">
              <PhoneMockup className="animate-card-orbit" />
              <div className="hidden translate-y-12 lg:block"><PhoneMockup className="scale-90 animate-card-orbit opacity-90" /></div>
            </AnimatedSection>
          </div>
        </section>

        <section className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Built for</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Serious coaches who want leverage.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Toggle the right surfaces for each client. Keep the human relationship, but let software handle the repetitive interpretation.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                {professions.map((profession) => <FeaturePill key={profession}>{profession}</FeaturePill>)}
              </div>
            </AnimatedSection>
          </div>
        </section>

        <section id="pricing" className="bg-white px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection className="mx-auto max-w-3xl text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Pricing</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Simple plans for solo coaches and teams.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Start free, invite clients, and scale when the business needs it.</p>
            </AnimatedSection>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {[
                { tier: COACH_TIERS.coach_starter, label: 'For new coaches', featured: false, details: [`Up to ${COACH_TIERS.coach_starter.maxClients} clients`, 'Web dashboard', 'Coach mobile app', 'Branded client experience', 'AI coach assistant'] },
                { tier: COACH_TIERS.coach_pro, label: 'For scaling coaches', featured: true, details: ['Unlimited clients', 'Payment processing', 'Advanced analytics', 'Group messaging', 'All core AI support'] },
                { tier: COACH_TIERS.coach_scale, label: 'For teams and clinics', featured: false, details: [`Up to ${COACH_TIERS.coach_scale.teamSeats} practitioners`, 'Custom branding', 'Team dashboard and permissions', 'Dedicated onboarding call', 'Everything in Pro'] },
              ].map(({ tier, label, featured, details }) => (
                <AnimatedSection key={tier.name} className={`relative rounded-[2rem] border p-7 shadow-xl ${featured ? 'border-teal-700 bg-slate-950 text-white shadow-teal-950/20' : 'border-slate-100 bg-[#f8fbfa] text-slate-950 shadow-slate-900/5'}`}>
                  {featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-xs font-black uppercase tracking-wider text-white">Most popular</div>}
                  <h3 className="text-2xl font-black">{tier.name}</h3>
                  <p className={`mt-2 text-sm ${featured ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
                  <div className="mt-7 text-5xl font-black tracking-tight">{formatPrice(tier.monthlyCents)}</div>
                  <p className={`mt-1 text-sm ${featured ? 'text-slate-300' : 'text-slate-500'}`}>/month</p>
                  <Link href="/register" className={`mt-7 block rounded-full px-5 py-3 text-center text-sm font-black transition hover:-translate-y-0.5 ${featured ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>Start free trial</Link>
                  <ul className="mt-7 space-y-3">
                    {details.map((detail) => (
                      <li key={detail} className={`flex gap-3 text-sm ${featured ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className={`mt-1 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-xs font-black ${featured ? 'bg-teal-400/20 text-teal-200' : 'bg-teal-50 text-teal-700'}`}>✓</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-5 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <AnimatedSection className="text-center">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">FAQ</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">Questions coaches ask.</h2>
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
              <div className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Launch ready positioning</div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Show coaches the product is bigger than a dashboard.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">Propel is the coaching operating system: plan, coach, adapt, message, measure, and monetise from one connected platform.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="rounded-full bg-teal-500 px-8 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-teal-400">Start free trial</Link>
                <Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="rounded-full border border-white/15 bg-white/10 px-8 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">Download client app</Link>
              </div>
            </div>
          </AnimatedSection>
        </section>

        <footer className="border-t border-slate-200 bg-white px-5 py-12 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
            <div>
              <div className="text-2xl font-black text-slate-950">Propel Coaches</div>
              <p className="mt-3 text-sm leading-6 text-slate-500">A daily decision engine for clients and a client-management workspace for coaches.</p>
            </div>
            <div>
              <h4 className="font-black text-slate-950">Product</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li><Link href="#platform" className="hover:text-teal-700">Platform</Link></li>
                <li><Link href="#features" className="hover:text-teal-700">Features</Link></li>
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
                <li><Link href="/register" className="hover:text-teal-700">Start free trial</Link></li>
                <li><Link href="https://apps.apple.com/app/propel-coaching/id6744426938" target="_blank" className="hover:text-teal-700">Client app</Link></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 pt-6 text-sm text-slate-400">© 2026 Propel Coaches. All rights reserved.</div>
        </footer>
      </main>
    </>
  );
}
