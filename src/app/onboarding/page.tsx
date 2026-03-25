'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dumbbell, UtensilsCrossed, ClipboardCheck, HeartPulse,
  ListTodo, BookOpen, MessageSquare, TrendingUp, ChevronRight,
  ChevronLeft, Check, Sparkles, Bot, Zap, Clock, Shield,
  Flame, Heart, GraduationCap, Briefcase,
} from 'lucide-react'

/* ─── Types ────────────────────────────────── */
type Profession =
  | 'personal_trainer' | 'nutritionist' | 'dietitian'
  | 'exercise_physiologist' | 'strength_coach'
  | 'online_fitness_coach' | 'physiotherapist' | 'other'

type AiStyle = 'motivational' | 'supportive' | 'professional' | 'educational'

interface ClientFeatures {
  training: boolean; nutrition: boolean; check_ins: boolean
  habits: boolean; tasks: boolean; resources: boolean
  messaging: boolean; progress: boolean
}

/* ─── Data ─────────────────────────────────── */
const PROFESSIONS = [
  { id: 'personal_trainer',      label: 'Personal Trainer',              emoji: '🏋️' },
  { id: 'nutritionist',          label: 'Nutritionist',                  emoji: '🥗' },
  { id: 'dietitian',             label: 'Dietitian',                     emoji: '🍎' },
  { id: 'exercise_physiologist', label: 'Exercise Physiologist',         emoji: '🫀' },
  { id: 'strength_coach',        label: 'Strength & Conditioning Coach', emoji: '💪' },
  { id: 'online_fitness_coach',  label: 'Online Fitness Coach',          emoji: '📱' },
  { id: 'physiotherapist',       label: 'Physiotherapist',               emoji: '🩺' },
  { id: 'other',                 label: 'Other',                         emoji: '✨' },
] as const

const DEFAULTS: Record<Profession, ClientFeatures> = {
  personal_trainer:      { training: true,  nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  nutritionist:          { training: false, nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  dietitian:             { training: false, nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  exercise_physiologist: { training: true,  nutrition: false, check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  strength_coach:        { training: true,  nutrition: false, check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  online_fitness_coach:  { training: true,  nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  physiotherapist:       { training: true,  nutrition: false, check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  other:                 { training: true,  nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
}

const FEATURES = [
  { key: 'training'  as const, label: 'Training & Workouts',  desc: 'Programs, exercises, workout sessions', icon: Dumbbell },
  { key: 'nutrition' as const, label: 'Nutrition Plans',       desc: 'Meal plans, macros, food logging',      icon: UtensilsCrossed },
  { key: 'check_ins' as const, label: 'Check-ins',             desc: 'Weekly progress check-ins',             icon: ClipboardCheck },
  { key: 'habits'    as const, label: 'Habits',                desc: 'Daily habit tracking',                  icon: HeartPulse },
  { key: 'tasks'     as const, label: 'Tasks',                 desc: 'Client to-do lists and assignments',    icon: ListTodo },
  { key: 'resources' as const, label: 'Resources',             desc: 'Share files, videos and guides',        icon: BookOpen },
  { key: 'messaging' as const, label: 'Messaging',             desc: 'Direct chat with clients',              icon: MessageSquare },
  { key: 'progress'  as const, label: 'Progress Tracking',     desc: 'Metrics, photos, measurements',         icon: TrendingUp },
]

const AI_STYLES: { id: AiStyle; label: string; desc: string; example: string; icon: React.ElementType }[] = [
  {
    id: 'motivational',
    label: 'Motivational',
    desc: 'High energy, encouraging, celebrates every win',
    example: '"Amazing work today! You crushed that session — keep that momentum going! 🔥"',
    icon: Flame,
  },
  {
    id: 'supportive',
    label: 'Supportive',
    desc: 'Warm, empathetic, focused on the client\'s wellbeing',
    example: '"That\'s completely okay — rest days are just as important as training days. How are you feeling?"',
    icon: Heart,
  },
  {
    id: 'professional',
    label: 'Professional',
    desc: 'Clear, concise, evidence-based responses',
    example: '"Based on your program, your next session is upper body push. Aim for the target weights listed."',
    icon: Briefcase,
  },
  {
    id: 'educational',
    label: 'Educational',
    desc: 'Explains the why behind recommendations',
    example: '"Progressive overload works because it signals your muscles to adapt — that\'s why we increase weight gradually."',
    icon: GraduationCap,
  },
]

/* ─── Main Component ───────────────────────── */
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profession, setProfession] = useState<Profession | null>(null)
  const [features, setFeatures] = useState<ClientFeatures>(DEFAULTS.personal_trainer)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiStyle, setAiStyle] = useState<AiStyle>('supportive')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TOTAL = 4

  function selectProfession(p: Profession) {
    setProfession(p)
    setFeatures(DEFAULTS[p])
  }

  function toggleFeature(key: keyof ClientFeatures) {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function finish() {
    if (!profession) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('profiles').update({
      profession,
      client_features: features,
      ai_coach_enabled: aiEnabled,
      ai_coach_style: aiStyle,
      onboarding_completed: true,
    }).eq('id', user.id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const isWide = step >= 2

  return (
    <div className="min-h-screen bg-cb-bg flex items-center justify-center p-4">
      <div className={`w-full transition-all duration-300 ${isWide ? 'max-w-2xl' : 'max-w-sm'}`}>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#2B2B2B] rounded-xl px-8 py-5">
            <img src="/logo/full-dark.png" alt="Propel" style={{ width: 160, height: 'auto' }} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 px-1">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-[var(--brand)]' : 'bg-cb-border'}`} />
          ))}
        </div>

        <div className="bg-cb-surface border border-cb-border rounded-2xl shadow-lg overflow-hidden">

          {/* ── Step 1: Welcome ───────────────────── */}
          {step === 1 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-[var(--brand)]" />
              </div>
              <h1 className="text-2xl font-bold text-cb-text mb-2">Welcome to your platform!</h1>
              <p className="text-cb-text-secondary text-sm mb-8 max-w-xs mx-auto">
                Let's take 60 seconds to set up your coaching workspace so it's perfect for your practice.
              </p>
              <div className="space-y-3 text-left mb-8">
                {[
                  { icon: '🎯', title: 'Tell us your profession', desc: 'So we can set smart defaults' },
                  { icon: '⚙️', title: 'Choose client features', desc: 'Control what your clients see in the app' },
                  { icon: '🤖', title: 'Set up your AI coach', desc: 'An assistant that supports clients between sessions' },
                  { icon: '🚀', title: 'Start coaching', desc: 'Your dashboard will be ready to go' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-cb-bg rounded-xl p-4">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-cb-text">{item.title}</p>
                      <p className="text-xs text-cb-text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)}
                className="w-full bg-[var(--brand)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2">
                Let's get started <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: Profession ──────────────── */}
          {step === 2 && (
            <div className="p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wide mb-1">Step 1 of 3</p>
                <h2 className="text-xl font-bold text-cb-text">What's your profession?</h2>
                <p className="text-cb-text-secondary text-sm mt-1">We'll pre-select the best features for your clients.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {PROFESSIONS.map((p) => (
                  <button key={p.id} onClick={() => selectProfession(p.id as Profession)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${profession === p.id ? 'border-[var(--brand)] bg-[var(--brand)]/10' : 'border-cb-border bg-cb-bg hover:border-[var(--brand)]/40'}`}>
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <p className={`text-xs font-semibold leading-tight ${profession === p.id ? 'text-cb-text' : 'text-cb-text-secondary'}`}>{p.label}</p>
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cb-border text-sm font-medium text-cb-text hover:bg-cb-bg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={() => { if (!profession) { setError('Please select a profession'); return } setError(null); setStep(3) }}
                  className="flex-1 bg-[var(--brand)] hover:opacity-90 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Features ────────────────── */}
          {step === 3 && (
            <div className="p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wide mb-1">Step 2 of 3</p>
                <h2 className="text-xl font-bold text-cb-text">What can your clients access?</h2>
                <p className="text-cb-text-secondary text-sm mt-1">Pre-selected based on your profession — customise freely. You can always change this in Settings.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {FEATURES.map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} onClick={() => toggleFeature(key)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${features[key] ? 'border-[var(--brand)] bg-[var(--brand)]/8' : 'border-cb-border bg-cb-bg hover:border-cb-border/70'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${features[key] ? 'bg-[var(--brand)]/15' : 'bg-cb-surface'}`}>
                      <Icon size={18} className={features[key] ? 'text-[var(--brand)]' : 'text-cb-text-secondary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cb-text">{label}</p>
                      <p className="text-xs text-cb-text-secondary mt-0.5">{desc}</p>
                    </div>
                    <div className="relative flex-shrink-0 rounded-full transition-colors"
                      style={{ width: 40, height: 22, backgroundColor: features[key] ? 'var(--brand)' : '#d1d5db' }}>
                      <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                        style={{ width: 18, height: 18, transform: features[key] ? 'translateX(20px)' : 'translateX(2px)' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cb-border text-sm font-medium text-cb-text hover:bg-cb-bg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(4)}
                  className="flex-1 bg-[var(--brand)] hover:opacity-90 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: AI Coach ─────────────────── */}
          {step === 4 && (
            <div className="p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold text-[var(--brand)] uppercase tracking-wide mb-1">Step 3 of 3</p>
                <h2 className="text-xl font-bold text-cb-text">Your AI Coaching Assistant</h2>
              </div>

              {/* Explainer */}
              <div className="bg-gradient-to-br from-[var(--brand)]/10 to-[var(--brand)]/5 border border-[var(--brand)]/20 rounded-2xl p-5 mb-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/15 flex items-center justify-center flex-shrink-0">
                    <Bot size={20} className="text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-cb-text mb-1">What is the AI Coach?</p>
                    <p className="text-xs text-cb-text-secondary leading-relaxed">
                      Your AI Coach is a smart assistant that engages with your clients in the messaging section — in your name, in your style. It answers common questions, provides encouragement, and keeps clients accountable between your real sessions.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Clock, title: '24/7 Support', desc: 'Responds instantly, even when you\'re offline or with another client' },
                    { icon: Zap,   title: 'Reduces Your Load', desc: 'Handles repetitive questions so you can focus on high-value coaching' },
                    { icon: Shield, title: 'You Stay in Control', desc: 'Turn it on or off anytime. You can always jump in and reply yourself' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="bg-cb-surface/60 rounded-xl p-3 text-center">
                      <Icon size={16} className="text-[var(--brand)] mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-cb-text mb-1">{title}</p>
                      <p className="text-[10px] text-cb-text-secondary leading-tight">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between p-4 bg-cb-bg rounded-xl border border-cb-border mb-5">
                <div>
                  <p className="text-sm font-semibold text-cb-text">Enable AI Coach</p>
                  <p className="text-xs text-cb-text-secondary mt-0.5">Your AI assistant will respond to client messages on your behalf</p>
                </div>
                <button onClick={() => setAiEnabled(e => !e)}
                  className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                  style={{ width: 44, height: 24, backgroundColor: aiEnabled ? 'var(--brand)' : '#d1d5db' }}>
                  <span className="absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ width: 20, height: 20, transform: aiEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                </button>
              </div>

              {/* Communication style — only show if enabled */}
              {aiEnabled && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-cb-text mb-1">Communication style</p>
                  <p className="text-xs text-cb-text-secondary mb-3">Choose how your AI coach talks to clients. You can refine this further in Settings.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AI_STYLES.map(({ id, label, desc, example, icon: Icon }) => (
                      <button key={id} onClick={() => setAiStyle(id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${aiStyle === id ? 'border-[var(--brand)] bg-[var(--brand)]/8' : 'border-cb-border bg-cb-bg hover:border-[var(--brand)]/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={15} className={aiStyle === id ? 'text-[var(--brand)]' : 'text-cb-text-secondary'} />
                          <p className={`text-sm font-bold ${aiStyle === id ? 'text-cb-text' : 'text-cb-text-secondary'}`}>{label}</p>
                          {aiStyle === id && <Check size={13} className="text-[var(--brand)] ml-auto" />}
                        </div>
                        <p className="text-xs text-cb-text-secondary mb-2">{desc}</p>
                        <p className="text-[11px] text-cb-text-secondary italic bg-cb-surface rounded-lg px-2.5 py-1.5 leading-relaxed">{example}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cb-border text-sm font-medium text-cb-text hover:bg-cb-bg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={finish} disabled={loading}
                  className="flex-1 bg-[var(--brand)] hover:opacity-90 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    : <><Check size={16} /> Go to my dashboard</>}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-cb-text-secondary mt-6">You can change any of these settings later from your Settings page.</p>
      </div>
    </div>
  )
}
