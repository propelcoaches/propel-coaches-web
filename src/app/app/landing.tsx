'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AI_TIERS, formatPrice } from '@/lib/pricing';

const TEAL = '#0FA89C';
const TEAL_INK = '#2BD4C5';

/* ---------------------------------- data ---------------------------------- */

const MODALITIES = [
  {
    name: 'Strength',
    detail: 'Hypertrophy, powerlifting, or general strength splits with sets, reps, RPE, tempo, and progressive overload tracking.',
    sample: 'Bench 4×6 @ 82.5kg · RPE 8',
  },
  {
    name: 'Running',
    detail: '5K through marathon plans with easy, threshold, interval, and long-run prescriptions and pace targets.',
    sample: 'Threshold 3×10min @ 4:45/km',
  },
  {
    name: 'Cycling',
    detail: 'Road, gravel, or indoor plans with zone-based intervals and weekly TSS targets.',
    sample: 'Z4 intervals · 4×8min @ 260W',
  },
  {
    name: 'Triathlon',
    detail: 'Sprint through 70.3 builds that periodise swim, bike, and run together — not three apps fighting for your week.',
    sample: 'Week 6: 2 swims · 3 rides · 3 runs',
  },
  {
    name: 'Hyrox',
    detail: 'Race-specific blocks: sled, sandbag, ski-erg, run intervals, and the compromised-running work the event actually demands.',
    sample: 'Sled push 4×25m + 400m run',
  },
  {
    name: 'Combat',
    detail: 'Strength and conditioning around your sparring schedule, fight camps, and weight-cut windows.',
    sample: 'S&C 2×/wk around Thu spar',
  },
  {
    name: 'Mobility',
    detail: 'Daily 10–20 minute flows for movement quality, pre-hab, or working around an injury.',
    sample: '12min hip flow · post-session',
  },
];

const FEATURES = [
  {
    title: 'Smart logging across sports',
    body: 'Sets, reps, RPE for lifts. Pace, distance, HR for runs. Power and zones for rides. Rounds for combat. One log, one history.',
  },
  {
    title: 'Weekly check-ins that change the plan',
    body: 'Energy, sleep, stress, adherence. Your coach reads the data and adjusts next week’s program. The loop is the product.',
  },
  {
    title: 'Progress that speaks',
    body: 'Strength curves, pace charts, FTP trends, body metrics, photos. Whatever the sport tracks, Propel tracks.',
  },
  {
    title: 'Form check',
    body: 'On Pro and Elite: upload a lift, a running gait, or a swim clip. The AI flags common cues from a key frame.',
  },
];

const FAQS = [
  {
    q: 'Is an AI coach right for me?',
    a: 'Propel builds structured plans on well-established principles — progressive overload, periodisation, Mifflin-St Jeor macros, zone-based endurance frameworks. It’s for self-directed people who want plan and tracking in one app. It is not a substitute for a qualified PT, physio, dietitian, or doctor — especially with injuries, medical conditions, or eating disorder history. You can also work with a human coach on the platform.',
  },
  {
    q: 'How does it compare to Hevy, Runna, TrainerRoad, or MacroFactor?',
    a: 'Each of those is excellent at one thing. Propel covers all of them in one app, plus nutrition, plus weekly AI adjustments. If you only ever lift, Hevy is great. If you train across sports, that’s where Propel makes sense.',
  },
  {
    q: 'Is Propel only for lifters?',
    a: 'No. Propel programs strength, running, cycling, triathlon, Hyrox, combat sports, and mobility. You can train for one or combine several in the same plan.',
  },
  {
    q: 'Can I change my program?',
    a: 'Yes. Swap any exercise, run, or session. Or regenerate the whole block with updated inputs.',
  },
  {
    q: 'When does it launch?',
    a: 'On the App Store on 3 August 2026, Australia first. The waitlist gets first access and launch pricing.',
  },
];

const TIER_DETAILS: Record<string, string[]> = {
  ai_starter: [
    'AI program for any one sport',
    'AI meal plan with shopping list',
    'Workout, run, ride, and nutrition logging',
    'Progress tracking',
    '7-day free trial',
  ],
  ai_pro: [
    'Everything in Starter',
    'Multi-sport programming in one plan',
    'AI coach chat, unlimited',
    'Weekly check-in with AI adjustments',
    'Exercise and meal swapping',
    '7-day free trial',
  ],
  ai_elite: [
    'Everything in Pro',
    'AI form check: lift, run gait, swim',
    'Equipment-adaptive workouts',
    'Wearable integration as it ships',
    '7-day free trial',
  ],
};

/* -------------------------------- components ------------------------------- */

function PhoneFrame({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative aspect-[1206/2622] overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#0D1216] shadow-[0_40px_120px_rgba(0,0,0,0.6)] ring-1 ring-white/5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-sm font-bold uppercase tracking-[0.24em]" style={{ color: TEAL_INK }}>
      {children}
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

export default function PropelAILanding() {
  const root = useRef<HTMLDivElement>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  /* MailerLite universal script for the waitlist embed. The stub + account
     call must be queued BEFORE the script loads (official snippet order),
     or the embed scanner never picks up the account. */
  useEffect(() => {
    if (document.getElementById('ml-universal')) return;
    const w = window as unknown as { ml?: { (...args: unknown[]): void; q?: unknown[] } };
    if (!w.ml) {
      const stub = ((...args: unknown[]) => {
        (stub.q = stub.q || []).push(args);
      }) as { (...args: unknown[]): void; q?: unknown[] };
      w.ml = stub;
    }
    w.ml('account', '2222968');
    const s = document.createElement('script');
    s.id = 'ml-universal';
    s.async = true;
    s.src = 'https://assets.mailerlite.com/js/universal.js';
    document.body.appendChild(s);
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (process.env.NODE_ENV !== 'production') {
      // Lets headless preview tooling drive the ticker while the tab is hidden.
      (window as unknown as { gsap: typeof gsap }).gsap = gsap;
    }

    // In a hidden tab rAF never fires, so tweens freeze on their first-applied
    // from-states and the page sits half-invisible (this also hits SEO/social
    // prerenderers). Defer ALL animation setup until the tab is visible; until
    // then the page renders fully static and readable.
    let ctx: ReturnType<typeof gsap.context> | undefined;
    const onVisible = () => {
      if (document.hidden || ctx) return;
      document.removeEventListener('visibilitychange', onVisible);
      ctx = buildAnimations();
    };

    const buildAnimations = () => gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)' },
        (mctx) => {
          const { motion } = mctx.conditions as { motion: boolean };
          if (!motion) return;

          /* Hero entrance — fromTo with explicit end states so a strict-mode
             double mount can never freeze elements mid-tween */
          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .fromTo('[data-hero-line]', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.12 })
            .fromTo('[data-hero-sub]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
            .fromTo('[data-hero-cta]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, '-=0.4')
            .fromTo('[data-hero-phone]', { opacity: 0, y: 120, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power2.out' }, '-=0.7');

          /* Hero phone drifts up slower than scroll */
          gsap.to('[data-hero-phone]', {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
          });

          /* Problem statement: word-by-word scrubbed reveal */
          gsap.fromTo(
            '[data-word]',
            { opacity: 0.12 },
            {
              opacity: 1,
              stagger: 0.4,
              ease: 'none',
              scrollTrigger: { trigger: '[data-problem]', start: 'top 75%', end: 'center 40%', scrub: true },
            },
          );

          gsap.utils.toArray<HTMLElement>('[data-modality-card]').forEach((card) => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 60 },
              { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: card, start: 'top 88%' } },
            );
          });

          /* Daily brief lines stagger in */
          gsap.fromTo(
            '[data-brief-line]',
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              stagger: 0.12,
              scrollTrigger: { trigger: '[data-brief]', start: 'top 70%' },
            },
          );

          /* Chat bubbles stagger in */
          gsap.fromTo(
            '[data-chat-line]',
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power2.out',
              stagger: 0.15,
              scrollTrigger: { trigger: '[data-chat]', start: 'top 70%' },
            },
          );

          /* Nutrition cards stagger in */
          gsap.fromTo(
            '[data-nutrition-line]',
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
              stagger: 0.15,
              scrollTrigger: { trigger: '[data-nutrition]', start: 'top 70%' },
            },
          );

          /* Screenshot gallery: scale + fade in as they enter */
          gsap.utils.toArray<HTMLElement>('[data-screen]').forEach((el, i) => {
            gsap.fromTo(
              el,
              { opacity: 0, scale: 0.86, y: 80 },
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.9,
                delay: i * 0.06,
                ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 90%' },
              },
            );
          });

          /* Generic section reveals */
          gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
            gsap.fromTo(
              el,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' } },
            );
          });
        },
      );
    }, root);

    if (document.hidden) document.addEventListener('visibilitychange', onVisible);
    else ctx = buildAnimations();

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      ctx?.revert();
      ctx = undefined;
    };
  }, []);

  const problemWords =
    'Most apps coach one thing. Most people train more than one thing. If you lift on Monday, run on Wednesday, and ride on Saturday, you’re paying three subscriptions, logging in three places, and getting nutrition advice from none of them.'.split(' ');

  const tiers = [
    { def: AI_TIERS.ai_starter, featured: false },
    { def: AI_TIERS.ai_pro, featured: true },
    { def: AI_TIERS.ai_elite, featured: false },
  ];

  return (
    <div ref={root} className="bg-[#0A0E11] text-slate-200 antialiased">
      <main className="w-full max-w-full overflow-x-hidden">
        {/* Floating pill nav */}
        <header className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#0D1216]/80 py-2 pl-5 pr-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <Link href="/app" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: TEAL }}>
                P
              </span>
              <span className="text-base font-black tracking-tight text-white">Propel</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-400 md:flex">
              <a href="#ai-coach" className="transition hover:text-white">AI Coach</a>
              <a href="#sports" className="transition hover:text-white">Sports</a>
              <a href="#pricing" className="transition hover:text-white">Pricing</a>
              <Link href="/" className="transition hover:text-white">For coaches</Link>
            </nav>
            <a
              href="#waitlist"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              style={{ backgroundColor: TEAL }}
            >
              Join the waitlist
            </a>
          </div>
        </header>

        {/* Hero — cinematic centre */}
        <section data-hero className="relative flex flex-col items-center px-5 pb-8 pt-32 lg:pt-36">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-10%] h-[70vh] w-[120vw] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(15,168,156,0.16),transparent_60%)]" />
            <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl text-center">
            <h1 className="font-black leading-[1.02] tracking-[-0.045em] text-white" style={{ fontSize: 'clamp(2.9rem, 7vw, 5.6rem)' }}>
              <span className="block overflow-hidden"><span data-hero-line className="block">An AI coach that</span></span>
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  actually <span style={{ color: TEAL_INK }}>coaches</span>.
                </span>
              </span>
            </h1>
            <p data-hero-sub className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-400 sm:text-xl">
              It reads your training, meals, sleep, and check-ins — then tells you the one thing to do today, and why.
              Built for every sport you train.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                data-hero-cta
                href="#waitlist"
                className="rounded-full px-8 py-4 text-sm font-black text-white shadow-[0_16px_48px_rgba(15,168,156,0.35)] transition hover:brightness-110"
                style={{ backgroundColor: TEAL }}
              >
                Join the waitlist
              </a>
              <a
                data-hero-cta
                href="#ai-coach"
                className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>
            <p data-hero-cta className="mt-5 text-sm font-semibold tabular-nums text-slate-500">
              Launching on the App Store 3 August 2026 · Australia first
            </p>
          </div>

          <div data-hero-phone className="relative mt-10 w-[240px] sm:w-[300px]">
            <PhoneFrame src="/screens/home.png" alt="Propel home screen showing the day&rsquo;s coaching directive" />
            <div className="pointer-events-none absolute inset-x-[-40%] bottom-[-18%] h-[45%] bg-[radial-gradient(ellipse_at_center,rgba(15,168,156,0.25),transparent_65%)] blur-2xl" />
          </div>
        </section>

        {/* Sport marquee */}
        <div className="relative border-y border-white/5 bg-[#0D1216] py-6">
          <div className="marquee flex w-max items-center gap-10 whitespace-nowrap text-sm font-bold uppercase tracking-[0.3em] text-slate-600">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-10" aria-hidden={row === 1}>
                {[...MODALITIES, ...MODALITIES].map((m, i) => (
                  <span key={`${row}-${i}`} className="flex items-center gap-10">
                    {m.name}
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: TEAL }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* AI coach — the daily brief */}
        <section id="ai-coach" data-brief className="border-y border-white/5 bg-[#0D1216] px-5 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div data-reveal>
              <SectionKicker>The AI coach</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                You open the app. It has already done the thinking.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">
                No dashboard to interpret. Propel reads your sleep, your last sessions, your check-ins and your logs, then
                gives you one call for the day — with the reasoning attached.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-[#0A0E11] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-9">
              <div data-brief-line className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Tuesday · readiness high
              </div>
              <div data-brief-line className="mt-3 text-3xl font-black tracking-tight text-white">
                Bench day. Add 2.5kg.
              </div>
              {[
                ['Plan', 'Top set 82.5kg for 6. Last week it moved fast — push the load, keep rest strict at 2:30.'],
                ['Nutrition', 'Hit 140g protein before 8pm. Swap the salmon meal if appetite is low.'],
                ['Constraint', 'No conditioning today. Keep shoulder accessories under RPE 7.'],
                ['Why', 'Performance is trending up and sleep was 8 hours. Fatigue risk is low, so today is the day to progress.'],
              ].map(([label, body]) => (
                <div key={label} data-brief-line className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL_INK }}>
                    {label}
                  </div>
                  <p className="mt-2 text-[15px] leading-7 text-slate-300 tabular-nums">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI coach — chat */}
        <section data-chat className="px-5 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div data-reveal className="lg:order-2">
              <SectionKicker>Talk to it, not around it</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                Ask anything. It already knows your program.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">
                Every answer references your actual training, your logs, and your sport — not a generic result stapled
                onto a tracker. Chat is unlimited on Pro and Elite.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-[#10151A] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:p-8 lg:order-1">
              <div className="space-y-4">
                <div data-chat-line className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-white/10 px-5 py-3.5 text-[15px] leading-6 text-slate-100">
                  Legs are dead from yesterday&rsquo;s squats. Still do intervals today?
                </div>
                <div data-chat-line className="flex max-w-[85%] gap-3">
                  <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: TEAL }}>P</span>
                  <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-5 py-3.5 text-[15px] leading-6 text-slate-300 tabular-nums">
                    Your top set hit RPE 9 yesterday and sleep was 5.5 hours. Swap today&rsquo;s intervals for an easy
                    30-minute zone 2 spin — keep intervals for Thursday, once you&rsquo;re recovered.
                  </div>
                </div>
                <div data-chat-line className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-white/10 px-5 py-3.5 text-[15px] leading-6 text-slate-100">
                  Can I have pizza tonight?
                </div>
                <div data-chat-line className="flex max-w-[85%] gap-3">
                  <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: TEAL }}>P</span>
                  <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-5 py-3.5 text-[15px] leading-6 text-slate-300 tabular-nums">
                    You&rsquo;re 40g protein short and 300 calories under target today. Have it — log it, and I&rsquo;ll
                    trim tomorrow&rsquo;s carbs slightly to compensate.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI coach — nutrition */}
        <section data-nutrition className="border-y border-white/5 bg-[#0D1216] px-5 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div data-reveal>
              <SectionKicker>Nutrition that moves with training</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                Macros that change when your training does.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">
                A flat macro target isn&rsquo;t nutrition — a heavy squat day and a rest day aren&rsquo;t the same day.
                Propel shifts calories and carbs around your training load automatically, and holds protein steady.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  label: 'Heavy squat day',
                  kcal: '2,850 kcal',
                  macros: 'Protein 190g · Carbs 340g · Fats 75g',
                  note: "Carb-loaded to fuel and recover from today's session.",
                },
                {
                  label: 'Rest day',
                  kcal: '2,300 kcal',
                  macros: 'Protein 190g · Carbs 190g · Fats 80g',
                  note: 'Protein held steady. Carbs pulled back — no training to fuel.',
                },
              ].map((card) => (
                <div key={card.label} data-nutrition-line className="rounded-[1.75rem] border border-white/10 bg-[#0A0E11] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL_INK }}>
                    {card.label}
                  </div>
                  <div className="mt-3 text-2xl font-black tabular-nums text-white">{card.kcal}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-slate-400">{card.macros}</div>
                  <p className="mt-4 text-sm leading-6 text-slate-400">{card.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem — scrubbed statement */}
        <section data-problem className="px-5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl md:text-[2rem] md:leading-[1.3]">
              {problemWords.map((w, i) => (
                <span key={i} data-word className="inline">
                  {w}{' '}
                </span>
              ))}
            </p>
            <p data-reveal className="mt-6 text-base font-semibold text-slate-500">
              — Charles, founder. Ex-PT, 8 years coaching. Built Propel because one coach should see the whole picture.
            </p>
          </div>
        </section>

        {/* And it covers your sport — compact gallery */}
        <section id="sports" className="px-5 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-2xl text-center">
              <SectionKicker>And it covers your sport</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                Whatever you train for.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-400">
                Strength, running, cycling, triathlon, Hyrox, combat, mobility — programmed properly and adjusted
                weekly, not bolted on as a generic tag.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {MODALITIES.map((m) => (
                <div
                  key={m.name}
                  data-modality-card
                  className="group rounded-2xl border border-white/10 bg-[#10151A] p-5 transition-colors duration-500 hover:border-teal-500/30"
                >
                  <h3 className="text-base font-black tracking-tight text-white sm:text-lg">{m.name}</h3>
                  <div className="mt-2 text-[11px] font-bold tabular-nums text-slate-500 sm:text-xs">{m.sample}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Real screens */}
        <section className="border-y border-white/5 bg-[#0D1216] px-5 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-3xl text-center">
              <SectionKicker>The app itself</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                Real screens. Not renders.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-400">
                Everything below is the actual product — training, nutrition, progress and chat, captured from the app.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 items-end gap-4 sm:gap-6 lg:grid-cols-4">
              {[
                ['/screens/training.png', 'Training tab with the week’s sessions', 'lg:translate-y-6'],
                ['/screens/nutrition.png', 'Nutrition tab with calories and protein remaining', ''],
                ['/screens/progress.png', 'Progress tab with strength and body trends', 'lg:translate-y-10'],
                ['/screens/chat.png', 'Coach chat conversation', 'lg:translate-y-2'],
              ].map(([src, alt, cls]) => (
                <div key={src} data-screen className={cls}>
                  <PhoneFrame src={src} alt={alt} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-5 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="max-w-2xl">
              <SectionKicker>Everything you need</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                Nothing you don&rsquo;t.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div key={f.title} data-reveal className="rounded-3xl border border-white/10 bg-[#10151A] p-6 transition-colors duration-500 hover:border-teal-500/30 sm:p-8">
                  <h3 className="text-lg font-black tracking-tight text-white">{f.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-slate-400">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-y border-white/5 bg-[#0D1216] px-5 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="mx-auto max-w-2xl text-center">
              <SectionKicker>Pricing</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                One AI coach. One subscription.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-400 tabular-nums">
                Australian pricing. 7-day free trial on every plan. Cancel anytime.
              </p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {tiers.map(({ def, featured }) => (
                <div
                  key={def.id}
                  data-reveal
                  className={`relative rounded-[2rem] border p-6 sm:p-8 ${
                    featured ? 'border-teal-500/40 bg-[#10181A] shadow-[0_30px_90px_rgba(15,168,156,0.12)]' : 'border-white/10 bg-[#10151A]'
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider text-white" style={{ backgroundColor: TEAL }}>
                      Most popular
                    </div>
                  )}
                  <h3 className="text-xl font-black tracking-tight text-white">{def.name}</h3>
                  <div className="mt-5 text-5xl font-black tabular-nums tracking-tight text-white">
                    {formatPrice(def.monthlyCents)}
                    <span className="text-base font-bold text-slate-500">/mo</span>
                  </div>
                  <a
                    href="#waitlist"
                    className={`mt-6 block rounded-full px-5 py-3.5 text-center text-sm font-black transition hover:brightness-110 ${
                      featured ? 'text-white' : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                    }`}
                    style={featured ? { backgroundColor: TEAL } : undefined}
                  >
                    Join the waitlist
                  </a>
                  <ul className="mt-6 space-y-2.5">
                    {TIER_DETAILS[def.id].map((d) => (
                      <li key={d} className="flex gap-3 text-sm leading-6 text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: TEAL }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p data-reveal className="mx-auto mt-12 max-w-xl text-center text-sm leading-6 text-slate-500">
              Coaching a roster of clients?{' '}
              <Link href="/" className="font-bold underline decoration-teal-500/50 underline-offset-4 transition hover:text-white">
                Propel Coaches
              </Link>{' '}
              is the coach platform — plans from A$44.99/mo.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <div data-reveal>
              <SectionKicker>Straight answers</SectionKicker>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
                What people ask first.
              </h2>
            </div>
            <div className="mt-8 space-y-3">
              {FAQS.map((faq, i) => (
                <div key={faq.q} data-reveal className="overflow-hidden rounded-3xl border border-white/10 bg-[#10151A]">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    aria-expanded={activeFaq === i}
                    className="flex w-full items-center justify-between gap-5 px-7 py-5 text-left"
                  >
                    <span className="text-lg font-bold text-white">{faq.q}</span>
                    <span
                      className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-white/10 text-lg font-black text-white transition-transform duration-300 ${
                        activeFaq === i ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${activeFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="border-t border-white/5 px-7 py-5 leading-7 text-slate-400">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Waitlist CTA */}
        <section id="waitlist" className="relative overflow-hidden border-t border-white/5 px-5 py-16 md:py-24">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(15,168,156,0.14),transparent_60%)]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 data-reveal className="text-4xl font-black tracking-[-0.035em] text-white sm:text-6xl">
              First access. 3 August.
            </h2>
            <p data-reveal className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-400 tabular-nums">
              Join the waitlist and get the app on launch day, with launch pricing locked in. No spam — a handful of
              emails between now and 3 August 2026.
            </p>
            <div data-reveal className="mx-auto mt-10 max-w-md text-left">
              <div className="ml-embedded" data-form="D99tXQ" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#0D1216] px-5 py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-sm text-slate-500 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg text-xs font-black text-white" style={{ backgroundColor: TEAL }}>
                P
              </span>
              <span className="font-bold text-slate-300">Propel</span>
              <span className="tabular-nums">© 2026</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/" className="transition hover:text-white">For coaches</Link>
              <Link href="/privacy-policy" className="transition hover:text-white">Privacy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms</Link>
              <a href="mailto:hello@propelcoaches.com" className="transition hover:text-white">hello@propelcoaches.com</a>
            </div>
          </div>
        </footer>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .marquee { animation: propel-marquee 40s linear infinite; }
        @keyframes propel-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .marquee { animation: none; } }
        #waitlist .ml-embedded .ml-form-embedContainer,
        #waitlist .ml-embedded .ml-form-embedWrapper { background: transparent !important; }
        #waitlist .ml-embedded h1, #waitlist .ml-embedded h2, #waitlist .ml-embedded h3,
        #waitlist .ml-embedded h4, #waitlist .ml-embedded p, #waitlist .ml-embedded label {
          color: #E2E8F0 !important;
        }
        #waitlist .ml-embedded button[type='submit'] {
          background: ${TEAL} !important;
          color: #fff !important;
        }
      `,
        }}
      />
    </div>
  );
}
