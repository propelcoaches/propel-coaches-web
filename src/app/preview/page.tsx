'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AI_TIERS, COACH_TIERS, AI_TIER_FEATURE_COPY, COACH_TIER_FEATURE_COPY, formatPrice } from '@/lib/pricing';

const BRAND = {
  teal: '#245CFF',
  tealLight: '#6EA0FF',
  tealMist: '#EEF3FF',
  ink: '#0D1B2A',
  softBg: '#F5F7FA',
};

function useMouseTilt(strength = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      setTilt({ x: -dy * strength, y: dx * strength });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [strength]);
  return { ref, tilt };
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

function MeshBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-[640px] w-[640px] rounded-full blur-3xl opacity-60 animate-mesh-drift-1"
        style={{ background: 'radial-gradient(circle, rgba(85,223,175,0.55), transparent 60%)' }} />
      <div className="absolute top-40 -right-40 h-[720px] w-[720px] rounded-full blur-3xl opacity-50 animate-mesh-drift-2"
        style={{ background: 'radial-gradient(circle, rgba(36,92,255,0.45), transparent 60%)' }} />
      <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full blur-3xl opacity-40 animate-mesh-drift-3"
        style={{ background: 'radial-gradient(circle, rgba(228,248,243,0.9), transparent 60%)' }} />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0D1B2A 1px, transparent 0)', backgroundSize: '32px 32px' }} />
    </div>
  );
}

function HeroPhone() {
  const { ref, tilt } = useMouseTilt(6);
  return (
    <div ref={ref} className="relative mx-auto" style={{ perspective: '1400px' }}>
      <div
        className="relative transition-transform duration-200 ease-out animate-phone-float"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(-3deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow halo */}
        <div className="absolute -inset-16 -z-10 rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(36,92,255,0.4), transparent 65%)' }} />
        {/* Phone bezel */}
        <div className="relative h-[640px] w-[310px] rounded-[3.5rem] p-[3px]"
          style={{
            background: 'linear-gradient(145deg, #2A2F3D 0%, #0D1B2A 50%, #1A1D27 100%)',
            boxShadow: '0 60px 120px -20px rgba(13,27,42,0.55), 0 30px 60px -15px rgba(36,92,255,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>
          <div className="relative h-full w-full overflow-hidden rounded-[3.3rem] bg-black">
            <Image
              src="/screenshots/app/01-goals.png"
              alt="Propel app onboarding"
              fill
              priority
              className="object-cover"
              sizes="310px"
            />
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2 z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
            {/* Reflection sweep */}
            <div className="pointer-events-none absolute inset-0 z-20 opacity-30 mix-blend-overlay"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.15) 100%)' }} />
          </div>
        </div>
        {/* Floating chip 1 */}
        <div className="absolute -left-24 top-24 hidden rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl md:block animate-chip-float-a"
          style={{ transform: 'translateZ(60px)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Today</div>
          <div className="mt-1 text-sm font-black text-slate-900">Bench day +2.5kg</div>
          <div className="text-[11px] text-slate-500">Readiness 4/5</div>
        </div>
        {/* Floating chip 2 */}
        <div className="absolute -right-20 top-72 hidden rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl md:block animate-chip-float-b"
          style={{ transform: 'translateZ(80px)' }}>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white"
              style={{ background: BRAND.teal }}>92</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Adherence</div>
              <div className="text-xs font-bold text-slate-700">7-day rolling</div>
            </div>
          </div>
        </div>
        {/* Floating chip 3 */}
        <div className="absolute -left-16 bottom-24 hidden rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl md:block animate-chip-float-c"
          style={{ transform: 'translateZ(70px)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-700">AI coach</div>
          <div className="mt-1 max-w-[160px] text-xs leading-snug text-slate-700">
            &ldquo;Sleep dropped. Pull volume 10%.&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
}

function PathCard({
  badge, title, body, bullets, cta, href, accent,
}: {
  badge: string; title: string; body: string; bullets: string[]; cta: string; href: string; accent: 'teal' | 'ink';
}) {
  const isTeal = accent === 'teal';
  return (
    <div className="group relative overflow-hidden rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        background: isTeal ? 'linear-gradient(155deg, #FFFFFF 0%, #EEF3FF 100%)' : 'linear-gradient(155deg, #0D1B2A 0%, #1A2438 100%)',
        borderColor: isTeal ? 'rgba(36,92,255,0.2)' : 'rgba(85,223,175,0.25)',
        color: isTeal ? BRAND.ink : '#fff',
      }}>
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: isTeal ? BRAND.teal : BRAND.tealLight }} />
      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]"
        style={{
          background: isTeal ? 'rgba(36,92,255,0.12)' : 'rgba(85,223,175,0.15)',
          color: isTeal ? BRAND.teal : BRAND.tealLight,
        }}>
        {badge}
      </span>
      <h3 className="mt-5 text-3xl font-black tracking-tight">{title}</h3>
      <p className={`mt-3 text-sm leading-6 ${isTeal ? 'text-slate-600' : 'text-slate-300'}`}>{body}</p>
      <ul className="mt-6 space-y-2">
        {bullets.map((b) => (
          <li key={b} className={`flex items-start gap-3 text-sm ${isTeal ? 'text-slate-700' : 'text-slate-200'}`}>
            <span className="mt-1 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full text-[9px] font-black"
              style={{ background: isTeal ? BRAND.teal : BRAND.tealLight, color: isTeal ? '#fff' : BRAND.ink }}>✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Link href={href}
        className="mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-all hover:gap-3"
        style={{
          background: isTeal ? BRAND.teal : BRAND.tealLight,
          color: isTeal ? '#fff' : BRAND.ink,
        }}>
        {cta} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

function AppShowcaseTile({ eyebrow, title, body, accent }: { eyebrow: string; title: string; body: string; accent?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl"
      style={{ background: accent ? `linear-gradient(155deg, #FFFFFF 0%, ${accent} 100%)` : '#fff' }}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: BRAND.teal }}>{eyebrow}</div>
      <h4 className="mt-2 text-xl font-black tracking-tight text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function CoachDashboardRender() {
  return (
    <div className="relative w-full" style={{ perspective: '1600px' }}>
      <div className="rounded-3xl p-1 shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(36,92,255,0.4), rgba(13,27,42,0.6))',
          transform: 'rotateY(-6deg) rotateX(4deg)',
          transformStyle: 'preserve-3d',
        }}>
        <div className="overflow-hidden rounded-[1.4rem] bg-[#0D1B2A]">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 rounded-md bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">app.propelcoaches.com</span>
          </div>
          {/* Dashboard body */}
          <div className="grid grid-cols-[200px_1fr] gap-0 bg-[#0F1117]">
            {/* Sidebar */}
            <div className="border-r border-white/5 p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-black text-white" style={{ background: BRAND.teal }}>P</div>
                <span className="text-xs font-black text-white">Coaches</span>
              </div>
              {['Today', 'Clients', 'Programs', 'Nutrition', 'Messages', 'Payments'].map((item, i) => (
                <div key={item}
                  className={`mb-1 rounded-lg px-3 py-2 text-xs font-bold ${i === 0 ? 'text-white' : 'text-slate-400'}`}
                  style={i === 0 ? { background: 'rgba(85,223,175,0.15)' } : undefined}>
                  {item}
                </div>
              ))}
            </div>
            {/* Main */}
            <div className="p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.tealLight }}>Today&apos;s decisions</div>
                  <div className="mt-0.5 text-lg font-black text-white">14 clients need a call</div>
                </div>
                <div className="text-[10px] text-slate-500">Live · 3:06pm</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: '92%', l: 'Adherence' },
                  { v: '14', l: 'Check-ins ready' },
                  { v: '6', l: 'At risk' },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xl font-black text-white">{s.v}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.tealLight }}>AI brief · Tom R.</div>
                <div className="text-sm font-bold text-white">Reduce squat volume by 1 back-off set</div>
                <div className="mt-1 text-[11px] leading-5 text-slate-400">Sleep 2/5, RPE creeping above plan. Keep top set, add 8 min mobility.</div>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ background: BRAND.teal }}>Approve</span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black text-slate-300">Edit</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Program builder</div>
                  <div className="mt-2 space-y-1.5">
                    {['Bench press · 4×6 @ RPE 8', 'Incline DB press · 3×10', 'Cable row · 3×12'].map((l) => (
                      <div key={l} className="rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] font-bold text-slate-300">{l}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live messages</div>
                  <div className="mt-2 space-y-1.5">
                    <div className="rounded-md bg-white/[0.06] px-2 py-1.5 text-[10px] text-white">Client uploaded form video</div>
                    <div className="ml-3 rounded-md bg-white/[0.04] px-2 py-1.5 text-[10px] text-slate-300">AI drafted a reply</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientCompanionPhone() {
  return (
    <div className="relative mx-auto" style={{ perspective: '1400px' }}>
      <div className="relative h-[500px] w-[245px] rounded-[2.6rem] p-[2px] shadow-2xl animate-phone-float-slow"
        style={{
          background: 'linear-gradient(145deg, #2A2F3D 0%, #0D1B2A 50%, #1A1D27 100%)',
          transform: 'rotateY(8deg) rotateX(-2deg)',
          transformStyle: 'preserve-3d',
        }}>
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem]"
          style={{ background: BRAND.softBg }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-bold text-slate-900">
            <span>3:06</span>
            <div className="h-5 w-20 rounded-full bg-black" />
            <span>●●●</span>
          </div>
          {/* Header */}
          <div className="px-5 pt-5">
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>From your coach</div>
            <div className="mt-1 text-lg font-black leading-tight text-slate-900">Push day. Add 2.5kg to bench.</div>
            <div className="mt-1 text-[10px] leading-4 text-slate-500">Mike said: bar speed was sharp last week — go for it.</div>
          </div>
          {/* Cards */}
          <div className="space-y-2 p-4">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Today</div>
                  <div className="text-sm font-black text-slate-900">Bench press</div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[9px] font-black text-white" style={{ background: BRAND.teal }}>Start</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {['4×6', '82.5kg', '2:30'].map((v) => (
                  <div key={v} className="rounded-lg bg-slate-50 py-1.5 text-center text-[10px] font-black text-slate-800">{v}</div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-3 text-white" style={{ background: BRAND.ink }}>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: BRAND.tealLight }}>Check-in due</div>
              <p className="mt-1 text-[11px] leading-4 text-slate-200">2 questions from Mike: sleep last night + back pain.</p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-full border-[5px] text-[9px] font-black"
                  style={{ borderColor: BRAND.teal, color: BRAND.teal }}>78%</div>
                <div>
                  <div className="text-[11px] font-black text-slate-900">Protein on track</div>
                  <div className="text-[9px] text-slate-500">42g left before dinner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black text-white shadow-lg"
        style={{ background: BRAND.ink }}>
        Client app
      </div>
    </div>
  );
}

function PricingCard({
  badge, name, tagline, price, period, features, highlighted, ctaHref, ctaLabel, theme,
}: {
  badge?: string; name: string; tagline: string; price: string; period: string; features: string[];
  highlighted?: boolean; ctaHref: string; ctaLabel: string; theme: 'ai' | 'coach';
}) {
  const accent = theme === 'ai' ? BRAND.teal : BRAND.ink;
  return (
    <div className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 ${highlighted ? '-translate-y-2 shadow-2xl' : 'shadow-sm hover:-translate-y-1 hover:shadow-lg'}`}
      style={{
        background: '#fff',
        borderColor: highlighted ? accent : '#E5E7EB',
        borderWidth: highlighted ? 2 : 1,
      }}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
          style={{ background: accent }}>{badge}</span>
      )}
      <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>{theme === 'ai' ? 'AI Coach' : 'For Coaches'}</div>
      <h4 className="mt-2 text-2xl font-black text-slate-900">{name}</h4>
      <p className="mt-1 text-xs text-slate-500">{tagline}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-900">{price}</span>
        <span className="text-xs font-bold text-slate-500">{period}</span>
      </div>
      <ul className="mt-5 flex-1 space-y-2">
        {features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <span className="mt-1 grid h-3.5 w-3.5 flex-shrink-0 place-items-center rounded-full text-[8px] font-black text-white"
              style={{ background: accent }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaHref}
        className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black transition-transform hover:-translate-y-0.5"
        style={{ background: highlighted ? accent : 'transparent', color: highlighted ? '#fff' : accent, border: highlighted ? 'none' : `2px solid ${accent}` }}>
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function PreviewPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'If I sign up to Propel Coaches, do I get assigned a human coach?',
      a: 'No. Propel Coaches is software, not a coaching service. It is built for coaches who already run their own business — or want to start one. You bring your own clients (or get them through your usual channels) and use Propel Coaches to manage them. If you want a coach yourself, you would either work with a coach who happens to use Propel, or download the Propel app and have the AI coach you.',
    },
    {
      q: 'So what is the actual difference between Propel and Propel Coaches?',
      a: 'Propel (the app) is a B2C product — you, the athlete, pay a subscription and the AI coaches you. There is no human involved. Propel Coaches is a B2B SaaS product — a coach pays the subscription, brings their own existing clients, and uses our software (web dashboard + companion client app) to deliver coaching. Different buyers, different jobs, same engine.',
    },
    {
      q: 'Do a coach’s clients pay anything?',
      a: 'No. If your coach uses Propel Coaches, you download the client app for free and access everything through their subscription. The coach pays one monthly plan that covers their whole roster.',
    },
    {
      q: 'I’m a coach but I don’t have clients yet. Is this for me?',
      a: 'Yes — Propel Coaches starts at A$44.99/month for up to 20 clients, so you can start small. We don’t supply leads or run a marketplace, but the software handles client onboarding, branded packages, payments, and forms so you can take on clients as you get them.',
    },
    {
      q: 'What makes the AI different from a chatbot?',
      a: 'The AI sits on top of your real training data, nutrition logs, check-ins, sleep, and adherence. It does not answer questions — it makes one decision per day: what you should do right now, and why. In the coach platform it also drafts replies and program adjustments for the coach to review.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes. Propel (the AI app) has a 7-day trial through the App Store. Propel Coaches plans include a 14-day trial — card required, charged after the trial ends.',
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <style jsx global>{`
        @keyframes phone-float {
          0%, 100% { transform: translateY(0) rotateZ(-3deg); }
          50% { transform: translateY(-14px) rotateZ(-3deg); }
        }
        @keyframes phone-float-slow {
          0%, 100% { transform: translateY(0) rotateY(8deg) rotateX(-2deg); }
          50% { transform: translateY(-10px) rotateY(8deg) rotateX(-2deg); }
        }
        @keyframes chip-float-a { 0%,100% { transform: translateY(0) translateZ(60px); } 50% { transform: translateY(-8px) translateZ(60px); } }
        @keyframes chip-float-b { 0%,100% { transform: translateY(0) translateZ(80px); } 50% { transform: translateY(-12px) translateZ(80px); } }
        @keyframes chip-float-c { 0%,100% { transform: translateY(0) translateZ(70px); } 50% { transform: translateY(-6px) translateZ(70px); } }
        @keyframes mesh-drift-1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.1); } }
        @keyframes mesh-drift-2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(1.05); } }
        @keyframes mesh-drift-3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.08); } }
        .animate-phone-float { animation: phone-float 6s ease-in-out infinite; }
        .animate-phone-float-slow { animation: phone-float-slow 7s ease-in-out infinite; }
        .animate-chip-float-a { animation: chip-float-a 5s ease-in-out infinite; }
        .animate-chip-float-b { animation: chip-float-b 6s ease-in-out infinite 0.5s; }
        .animate-chip-float-c { animation: chip-float-c 5.5s ease-in-out infinite 1s; }
        .animate-mesh-drift-1 { animation: mesh-drift-1 18s ease-in-out infinite; }
        .animate-mesh-drift-2 { animation: mesh-drift-2 22s ease-in-out infinite; }
        .animate-mesh-drift-3 { animation: mesh-drift-3 20s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <Link href="/preview" className="flex items-center gap-2.5">
            <Image src="/logo/icon-dark.png" alt="Propel" width={36} height={36} className="rounded-xl" />
            <span className="text-lg font-black tracking-tight text-slate-900">Propel</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link href="#ai-coach" className="text-sm font-bold text-slate-600 transition hover:text-teal-700">AI app</Link>
            <Link href="#coaches" className="text-sm font-bold text-slate-600 transition hover:text-teal-700">For coaches</Link>
            <Link href="#pricing" className="text-sm font-bold text-slate-600 transition hover:text-teal-700">Pricing</Link>
            <Link href="#faq" className="text-sm font-bold text-slate-600 transition hover:text-teal-700">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-bold text-slate-600 transition hover:text-teal-700 sm:block">Log in</Link>
            <Link href="#pricing"
              className="rounded-full px-4 py-2 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5"
              style={{ background: BRAND.teal }}>
              Get the app
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-5 pb-32 pt-32 lg:px-8 lg:pt-40">
        <MeshBackdrop />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-widest backdrop-blur"
              style={{ borderColor: 'rgba(36,92,255,0.25)', background: 'rgba(255,255,255,0.7)', color: BRAND.teal }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: BRAND.teal }} />
              Launching in Australia · Aug 3
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
              An AI coach that tells you{' '}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: BRAND.teal }}>what to do today</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-3 opacity-50" style={{ background: BRAND.tealMist }} />
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-7 text-slate-600">
              Propel reads your training, nutrition, sleep and adherence — then makes one decision a day. No dashboards to interpret. No 47 menus. Just the next move, with the reason.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#pricing"
                className="rounded-full px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: BRAND.teal, boxShadow: '0 14px 30px -10px rgba(36,92,255,0.55)' }}>
                Download for iOS
              </Link>
              <Link href="#coaches"
                className="rounded-full border-2 px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5"
                style={{ borderColor: BRAND.ink, color: BRAND.ink }}>
                I&apos;m a coach →
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex -space-x-2">
                {[BRAND.teal, BRAND.tealLight, BRAND.ink, '#FFC857'].map((c, i) => (
                  <div key={i} className="h-7 w-7 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </div>
              <div>
                <div className="font-black text-slate-900">★★★★★</div>
                <div>Built with 200+ coach + athlete sessions</div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150} className="flex justify-center lg:justify-end">
            <HeroPhone />
          </Reveal>
        </div>
      </section>

      {/* TWO SYSTEMS — THE FORK */}
      <section className="relative px-5 py-20 lg:px-8" style={{ background: BRAND.softBg }}>
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>Two separate products · Same engine</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Which one are you?
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Propel is an app for people who train themselves. Propel Coaches is software for coaches who already have their own clients. They&apos;re different products — pick the one that matches you.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal delay={100}>
              <PathCard
                accent="teal"
                badge="I train myself"
                title="Propel"
                body="An AI coach in your pocket. You pay a subscription, the AI programs your training and nutrition every day. No human coach involved — the AI is the coach."
                bullets={[
                  'Solo athlete, no coach needed',
                  'AI builds the program, adapts daily',
                  'Strength, running, cycling, tri, HYROX, nutrition',
                  'iOS app · A$24.99–A$59.99 / month',
                ]}
                cta="Get the AI app"
                href="#pricing"
              />
            </Reveal>
            <Reveal delay={200}>
              <PathCard
                accent="ink"
                badge="I'm a coach with clients"
                title="Propel Coaches"
                body="Software for coaches who run their own business. You bring your clients — we give you the dashboard to manage them, AI tools to scale your workload, and a free app your clients log into."
                bullets={[
                  'You already coach clients (or want to start)',
                  'Web dashboard for programs, messaging, payments',
                  'Your clients use a companion app, free',
                  'A$44.99–A$179.99 / month, billed to you',
                ]}
                cta="See coach platform"
                href="#coaches"
              />
            </Reveal>
          </div>
          <Reveal delay={300}>
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border-2 border-dashed p-5 text-center text-sm"
              style={{ borderColor: 'rgba(36,92,255,0.35)', background: BRAND.tealMist, color: BRAND.ink }}>
              <span className="font-black">Heads up:</span> Propel Coaches is not a marketplace. We don&apos;t supply clients or assign you a coach. It&apos;s the software coaches use to run their own coaching business — you bring the clients, we give you the tools.
            </div>
          </Reveal>
        </div>
      </section>

      {/* AI COACH DEEP DIVE */}
      <section id="ai-coach" className="relative px-5 py-24 lg:px-8">
        <MeshBackdrop />
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>Propel · The AI app</div>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Stop scrolling dashboards. Get told.
                </h2>
              </div>
              <p className="max-w-md text-base text-slate-600">
                Every other fitness app shows you 14 charts and a green smiley. Propel makes the call for you and explains the why.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal delay={100}>
              <div className="grid gap-4 sm:grid-cols-2">
                <AppShowcaseTile
                  eyebrow="Today directive"
                  title="One move, with the reason"
                  body="Bench day. Add 2.5kg. Readiness 4/5, last top set moved fast — push the load and keep rest strict."
                  accent="#EEF3FF"
                />
                <AppShowcaseTile
                  eyebrow="Adaptive programs"
                  title="Strength, running, cycling, tri"
                  body="Programs that swap exercises, scale volume, and reroute weeks when your week falls apart. Like a real coach watching."
                />
                <AppShowcaseTile
                  eyebrow="Nutrition AI"
                  title="Food vision + meal plans"
                  body="Snap a meal, get macros. Or follow a meal plan tailored to your training load, with swaps when you don't fancy salmon."
                />
                <AppShowcaseTile
                  eyebrow="Coach chat"
                  title="An AI you can argue with"
                  body="Ask why it pulled volume. Push back if it's wrong. It re-decides with your context, not generic advice."
                  accent="#EEF3FF"
                />
              </div>
            </Reveal>
            <Reveal delay={200} className="flex justify-center">
              <HeroPhone />
            </Reveal>
          </div>
        </div>
      </section>

      {/* COACH PLATFORM DEEP DIVE */}
      <section id="coaches" className="relative overflow-hidden px-5 py-24 lg:px-8"
        style={{ background: BRAND.ink, color: '#fff' }}>
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: BRAND.teal }} />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[600px] w-[600px] rounded-full blur-3xl opacity-25"
          style={{ background: BRAND.tealLight }} />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRAND.tealLight }}>Propel Coaches · Software for coaches</div>
            <h2 className="mt-2 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Run your coaching business from one dashboard. Your clients use a free app.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              You bring your own clients — Propel Coaches is the software you run them on. Two surfaces, one platform: a web dashboard for you, a companion mobile app for your athletes. You set the brand, you make the calls — the AI does the busywork.
            </p>
            <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold"
              style={{ borderColor: 'rgba(85,223,175,0.3)', color: BRAND.tealLight, background: 'rgba(85,223,175,0.08)' }}>
              <span>For:</span>
              <span style={{ color: '#fff' }}>Personal trainers · Strength coaches · Online coaches · Nutrition coaches · Coaching teams</span>
            </div>
          </Reveal>

          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.4fr_0.9fr]">
            <Reveal delay={100}>
              <div className="relative">
                <div className="absolute -top-3 left-6 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>
                  Coach web dashboard
                </div>
                <CoachDashboardRender />
              </div>
            </Reveal>
            <Reveal delay={200}>
              <ClientCompanionPhone />
            </Reveal>
          </div>

          <Reveal delay={150}>
            <div className="mt-16 grid gap-4 md:grid-cols-3">
              {[
                { e: 'Programs', t: 'AI-drafted, coach-approved', b: 'AI generates the block. You review, tweak, hit publish. Done in 3 minutes per client instead of 30.' },
                { e: 'Check-ins & messages', t: 'Never miss a struggling client', b: 'Live signals flag at-risk clients. AI drafts personalised replies. You ship the human touch.' },
                { e: 'Business', t: 'Payments, packages, referrals', b: 'Stripe-powered billing, branded packages, a marketplace presence, and team seats for multi-coach shops.' },
              ].map((c) => (
                <div key={c.e} className="rounded-2xl border p-6 backdrop-blur"
                  style={{ borderColor: 'rgba(85,223,175,0.2)', background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.tealLight }}>{c.e}</div>
                  <div className="mt-2 text-lg font-black">{c.t}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{c.b}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SHARED ENGINE BAND */}
      <section className="relative px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>Shared engine</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              One coaching brain. Two ways to use it.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Whether the AI is driving solo or working under a human coach, the engine is the same — five-pillar decision logic across stimulus, fatigue, adherence, time horizon, and risk. Six years of programming distilled into one daily call.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {['Stimulus', 'Fatigue', 'Adherence', 'Time horizon', 'Risk'].map((p) => (
                <span key={p} className="rounded-full border px-4 py-2 text-xs font-black"
                  style={{ borderColor: 'rgba(36,92,255,0.3)', color: BRAND.teal, background: BRAND.tealMist }}>
                  {p}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative px-5 py-24 lg:px-8" style={{ background: BRAND.softBg }}>
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>Pricing</div>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Pick your side.</h2>
              <p className="mt-4 text-base text-slate-600">AU pricing in AUD. 7-day trial on Propel, 14-day trial on Propel Coaches.</p>
            </div>
          </Reveal>

          {/* AI tiers */}
          <Reveal delay={100}>
            <div className="mt-14 flex items-center gap-3">
              <Image src="/logo/icon-dark.png" alt="" width={28} height={28} className="rounded-md" />
              <div>
                <div className="text-lg font-black text-slate-900">Propel — for athletes</div>
                <div className="text-xs text-slate-500">Solo AI coaching, paid by you</div>
              </div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {(['ai_starter', 'ai_pro', 'ai_elite'] as const).map((id) => {
                const t = AI_TIERS[id];
                return (
                  <PricingCard
                    key={id}
                    theme="ai"
                    badge={t.popular ? 'Most popular' : undefined}
                    highlighted={t.popular}
                    name={t.name}
                    tagline={t.tagline}
                    price={formatPrice(t.monthlyCents)}
                    period="/month"
                    features={AI_TIER_FEATURE_COPY[id]}
                    ctaHref="#"
                    ctaLabel="Download iOS app"
                  />
                );
              })}
            </div>
          </Reveal>

          {/* Coach tiers */}
          <Reveal delay={200}>
            <div className="mt-20 flex items-center gap-3">
              <div className="grid h-7 w-7 place-items-center rounded-md text-[11px] font-black text-white" style={{ background: BRAND.ink }}>P</div>
              <div>
                <div className="text-lg font-black text-slate-900">Propel Coaches — for coaches</div>
                <div className="text-xs text-slate-500">One plan covers your whole client roster</div>
              </div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {(['coach_starter', 'coach_pro', 'coach_scale'] as const).map((id) => {
                const t = COACH_TIERS[id];
                return (
                  <PricingCard
                    key={id}
                    theme="coach"
                    badge={t.popular ? 'Most popular' : undefined}
                    highlighted={t.popular}
                    name={t.name}
                    tagline={t.tagline}
                    price={formatPrice(t.monthlyCents)}
                    period="/month"
                    features={COACH_TIER_FEATURE_COPY[id]}
                    ctaHref="/register"
                    ctaLabel="Start 14-day trial"
                  />
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="text-center">
              <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRAND.teal }}>FAQ</div>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Common questions.</h2>
            </div>
          </Reveal>
          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-teal-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-black text-slate-900">{f.q}</span>
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-sm font-black transition-transform"
                      style={{
                        background: activeFaq === i ? BRAND.teal : BRAND.tealMist,
                        color: activeFaq === i ? '#fff' : BRAND.teal,
                        transform: activeFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}>+</span>
                  </div>
                  <div className={`grid transition-all duration-300 ${activeFaq === i ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-sm leading-7 text-slate-600">{f.a}</p>
                    </div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + FOOTER */}
      <section className="relative px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl p-12 lg:p-16"
          style={{ background: `linear-gradient(135deg, ${BRAND.teal} 0%, ${BRAND.ink} 100%)`, color: '#fff' }}>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                The launch is Aug 3. Be one of the first to train with it.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-200">
                Drop your email and we&apos;ll send you the App Store link the moment it&apos;s live, plus a 50% off code for the first month.
              </p>
              <form className="mt-6 flex max-w-md gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 rounded-full border-0 bg-white/10 px-5 py-3 text-sm font-bold text-white placeholder:text-white/50 backdrop-blur focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <button type="submit"
                  className="rounded-full bg-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
                  style={{ color: BRAND.ink }}>
                  Notify me
                </button>
              </form>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Image src="/logo/icon-light.png" alt="Propel" width={140} height={140}
                className="opacity-90 drop-shadow-2xl" />
            </div>
          </div>
        </div>
        <footer className="mx-auto mt-12 max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logo/icon-dark.png" alt="Propel" width={20} height={20} className="rounded" />
              <span className="font-bold">Propel</span> · Built in Australia
            </div>
            <div className="flex gap-5">
              <Link href="/privacy-policy" className="hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
              <Link href="/" className="hover:text-slate-900">Current site</Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
