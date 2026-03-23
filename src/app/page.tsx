import Link from 'next/link'
import {
  Dumbbell, UtensilsCrossed, MessageSquare, TrendingUp,
  ClipboardCheck, HeartPulse, CreditCard, Bot, Check,
  ArrowRight, Star, Users, Zap, Shield, Smartphone,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────── */
const FEATURES = [
  { icon: Dumbbell,        title: 'Training Programs',    desc: 'Build and assign workout programs with sets, reps, tempo, and coach notes. Clients log sessions live in the app.' },
  { icon: UtensilsCrossed, title: 'Nutrition Planning',   desc: 'Create personalised meal plans and macro targets. Clients log food and track progress against their goals.' },
  { icon: MessageSquare,   title: 'Client Messaging',     desc: 'Chat directly with clients in real time. Your AI coach handles messages when you\'re offline.' },
  { icon: ClipboardCheck,  title: 'Check-ins',            desc: 'Weekly progress check-ins with custom questions. Stay on top of how every client is really doing.' },
  { icon: HeartPulse,      title: 'Habit Tracking',       desc: 'Set daily habits and let clients track them in the app. Build consistency one day at a time.' },
  { icon: TrendingUp,      title: 'Progress & Metrics',   desc: 'Weight, measurements, progress photos, and personal bests — every metric in one place.' },
  { icon: Bot,             title: 'AI Coach Assistant',   desc: 'Your AI coach responds to clients 24/7 in your tone and style — motivational, supportive, or professional.' },
  { icon: CreditCard,      title: 'Payments & Invoicing', desc: 'Send invoices, manage subscriptions, and track revenue — all powered by Stripe.' },
]

const PROFESSIONS = [
  { emoji: '🏋️', title: 'Personal Trainers' },
  { emoji: '🥗', title: 'Nutritionists' },
  { emoji: '🍎', title: 'Dietitians' },
  { emoji: '🫀', title: 'Exercise Physiologists' },
  { emoji: '💪', title: 'Strength Coaches' },
  { emoji: '📱', title: 'Online Fitness Coaches' },
  { emoji: '🩺', title: 'Physiotherapists' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign up in 60 seconds',  desc: 'Create your account, tell us your profession, and choose which features your clients can access.' },
  { step: '02', title: 'Invite your clients',    desc: 'Send clients an invite link. They download the app, create a profile, and connect to you instantly.' },
  { step: '03', title: 'Start coaching',         desc: 'Build programs, send check-ins, chat in real time, and let your AI assistant handle the in-between.' },
]

const PRICING = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    desc: 'Perfect for coaches just getting started',
    cta: 'Start free trial',
    highlight: false,
    features: ['Up to 10 clients', 'All core features', 'AI coach assistant', 'Stripe payments', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$59',
    period: '/month',
    desc: 'For established coaches scaling their business',
    cta: 'Start free trial',
    highlight: true,
    features: ['Unlimited clients', 'All core features', 'AI coach assistant', 'Custom brand colours & logo', 'Priority support', 'Early access to new features'],
  },
  {
    name: 'Clinic',
    price: '$119',
    period: '/month',
    desc: 'For multi-practitioner clinics and teams',
    cta: 'Contact us',
    highlight: false,
    features: ['Unlimited clients', 'Up to 5 practitioners', 'All Pro features', 'Team dashboard', 'Dedicated onboarding', 'Custom contract'],
  },
]

const TESTIMONIALS = [
  { name: 'Sarah Mitchell',  role: 'Online PT, Sydney',            stars: 5, quote: 'Propel replaced three separate tools I was using. My clients love the app and I finally feel on top of everything.' },
  { name: 'James Khoury',    role: 'Accredited Dietitian',         stars: 5, quote: 'As a dietitian I only needed the nutrition and check-in features — being able to turn everything else off was a game changer.' },
  { name: 'Mia Torres',      role: 'Exercise Physiologist',        stars: 5, quote: 'The AI coach handles all the after-hours messages. I used to spend an hour every night replying — now I don\'t.' },
]

/* ─── Page ──────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>

      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Propel</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features"    className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing"     className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get started free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#0F7B8C]/10 text-[#0F7B8C] text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Zap size={12} /> Built for health &amp; fitness professionals
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
            The platform that<br />
            <span className="text-[#0F7B8C]">propels your practice</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for personal trainers, dietitians, exercise physiologists and more. Manage clients, programs, nutrition, check-ins, payments and an AI coaching assistant — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
              Start for free <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
              See how it works
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2"><Users size={16} className="text-[#0F7B8C]" /><span><strong className="text-gray-600">500+</strong> coaches</span></div>
            <div className="flex items-center gap-2"><Shield size={16} className="text-[#0F7B8C]" /><span><strong className="text-gray-600">No lock-in</strong> — cancel anytime</span></div>
            <div className="flex items-center gap-2"><Smartphone size={16} className="text-[#0F7B8C]" /><span><strong className="text-gray-600">iOS &amp; Android</strong> client app</span></div>
          </div>
        </div>
      </section>

      {/* ── Professions ─────────────────────── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Built for every health profession</p>
          <div className="flex flex-wrap justify-center gap-4">
            {PROFESSIONS.map(p => (
              <div key={p.title} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-xl">{p.emoji}</span>
                <span className="text-sm font-semibold text-gray-700">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Everything you need.<br />Nothing you don't.</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Choose which features your clients can access. A dietitian doesn't need the workout section, and a PT might not need nutrition logging. Propel adapts to your practice.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#0F7B8C]/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#0F7B8C]" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Section ──────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#0F7B8C] to-[#0a5a68] text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Bot size={12} /> AI-powered
              </div>
              <h2 className="text-4xl font-black mb-6 leading-tight">Your AI coach works while you sleep</h2>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                Clients don't stop needing support at 5pm. Your AI coaching assistant responds to messages around the clock — in your tone, with your knowledge.
              </p>
              <ul className="space-y-3">
                {[
                  'Responds instantly to client questions and check-ins',
                  'Matches your communication style perfectly',
                  'Hands off to you seamlessly when needed',
                  'Toggle on or off for any client at any time',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                    <Check size={16} className="text-white mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Example conversation</p>
              {[
                { from: 'client', text: 'Hey, I missed my session today. Feeling really guilty 😔' },
                { from: 'ai',     text: 'Don\'t be too hard on yourself — one missed session doesn\'t undo your progress. How are you feeling? Any reason you couldn\'t get there today?' },
                { from: 'client', text: 'Just been flat out at work. I\'ll make it up tomorrow' },
                { from: 'ai',     text: 'That\'s the spirit. Tomorrow is upper body — get a good sleep and stay hydrated tonight. You\'ve got this 💪' },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.from === 'client' ? 'bg-white/20 text-white' : 'bg-white text-gray-800'}`}>
                    {msg.from === 'ai' && <p className="text-[10px] font-bold text-[#0F7B8C] mb-1">AI Coach</p>}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-lg text-gray-500">No setup call required. No lengthy onboarding. Just you and your clients, coaching.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#0F7B8C]/10 flex items-center justify-center mx-auto mb-5">
                  <span className="text-[#0F7B8C] font-black text-lg">{step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Coaches love Propel</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, quote, stars }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{quote}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500">14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PRICING.map(({ name, price, period, desc, cta, highlight, features }) => (
              <div key={name} className={`rounded-2xl p-8 border ${highlight ? 'bg-[#0F7B8C] text-white border-[#0F7B8C] shadow-2xl shadow-[#0F7B8C]/25 md:scale-105' : 'bg-white border-gray-100 shadow-sm'}`}>
                {highlight && (
                  <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    <Star size={10} className="fill-white" /> Most popular
                  </div>
                )}
                <h3 className={`font-black text-xl mb-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
                <p className={`text-sm mb-5 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>{desc}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-gray-900'}`}>{price}</span>
                  <span className={`text-sm mb-1 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>{period}</span>
                </div>
                <Link href="/register" className={`block text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-6 ${highlight ? 'bg-white text-[#0F7B8C] hover:bg-gray-50' : 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'}`}>
                  {cta}
                </Link>
                <ul className="space-y-3">
                  {features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${highlight ? 'text-white/90' : 'text-gray-600'}`}>
                      <Check size={15} className={`flex-shrink-0 mt-0.5 ${highlight ? 'text-white' : 'text-[#0F7B8C]'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to propel your practice?</h2>
          <p className="text-lg text-gray-500 mb-10">Join hundreds of health professionals who've replaced their patchwork of tools with one platform that just works.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#0F7B8C] hover:bg-[#0d6b7a] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-[#0F7B8C]/20">
            Get started free <ArrowRight size={18} />
          </Link>
          <p className="text-sm text-gray-400 mt-4">14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F7B8C] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
