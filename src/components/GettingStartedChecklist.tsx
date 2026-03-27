'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, ChevronDown, X, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'coach_getting_started_v1'

interface Step {
  id: string
  label: string
  description: string
  href: string
  cta: string
}

const STEPS: Step[] = [
  {
    id: 'add_client',
    label: 'Add your first client',
    description: 'Set up a client profile with their goals and details.',
    href: '/clients',
    cta: 'Add Client',
  },
  {
    id: 'customize_branding',
    label: 'Customize your branding',
    description: 'Add your logo and brand colors.',
    href: '/branding',
    cta: 'Set Up Branding',
  },
  {
    id: 'create_program',
    label: 'Create a workout program',
    description: 'Build a week-by-week training plan for a client.',
    href: '/workout-programs',
    cta: 'Build Program',
  },
  {
    id: 'setup_payments',
    label: 'Set up payments',
    description: 'Connect Stripe to accept payments from clients.',
    href: '/payments',
    cta: 'Set Up Payments',
  },
]

function loadState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveState(s: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

// ── Simple CSS confetti ──────────────────────────────────────────────────────

function ConfettiPiece({ style }: { style: React.CSSProperties }) {
  return <div className="absolute top-0 w-2 h-2 rounded-sm opacity-90" style={style} />
}

function Confetti() {
  const pieces = Array.from({ length: 30 }, (_, i) => {
    const colors = ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6']
    const color = colors[i % colors.length]
    const left = Math.random() * 100
    const delay = Math.random() * 1.5
    const duration = 1.5 + Math.random() * 1.5
    const size = 4 + Math.random() * 6
    return {
      style: {
        left: `${left}%`,
        backgroundColor: color,
        width: `${size}px`,
        height: `${size}px`,
        animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      } as React.CSSProperties,
    }
  })

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p, i) => <ConfettiPiece key={i} style={p.style} />)}
      </div>
    </>
  )
}

export default function GettingStartedChecklist() {
  const router = useRouter()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const prevAllDone = useRef(false)

  // Load state + auto-detect completed steps from Supabase
  useEffect(() => {
    const s = loadState()
    setChecked(s)
    setDismissed(s.__dismissed === true)
    setMounted(true)

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const updates: Record<string, boolean> = { ...s }

      const [clientsRes, brandingRes, programsRes, profileRes] = await Promise.all([
        supabase.from('profiles').select('id').eq('coach_id', user.id).eq('role', 'client').limit(1),
        supabase.from('coach_branding').select('id').eq('coach_id', user.id).limit(1),
        supabase.from('workout_programs').select('id').eq('coach_id', user.id).limit(1),
        supabase.from('profiles').select('stripe_account_id').eq('id', user.id).single(),
      ])

      if (clientsRes.data && clientsRes.data.length > 0) updates['add_client'] = true
      if (brandingRes.data && brandingRes.data.length > 0) updates['customize_branding'] = true
      if (programsRes.data && programsRes.data.length > 0) updates['create_program'] = true
      if (!profileRes.error && profileRes.data?.stripe_account_id) updates['setup_payments'] = true

      setChecked(updates)
      saveState(updates)
    })
  }, [])

  // Detect when all steps become complete → trigger confetti
  useEffect(() => {
    if (!mounted) return
    const allDone = STEPS.every((s) => checked[s.id])
    if (allDone && !prevAllDone.current) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3500)
    }
    prevAllDone.current = allDone
  }, [checked, mounted])

  // Auto-dismiss 4s after all done
  useEffect(() => {
    if (!mounted) return
    const allDone = STEPS.every((s) => checked[s.id])
    if (!allDone) return
    const t = setTimeout(() => setDismissed(true), 4000)
    return () => clearTimeout(t)
  }, [checked, mounted])

  if (!mounted || dismissed) return null

  const completedCount = STEPS.filter((s) => checked[s.id]).length
  const allDone = completedCount === STEPS.length
  const pct = Math.round((completedCount / STEPS.length) * 100)

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    saveState(next)
  }

  function handleDismiss() {
    const next = { ...checked, __dismissed: true }
    setChecked(next)
    saveState(next)
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-6 right-6 z-30 w-80 bg-surface border border-cb-border rounded-xl shadow-2xl overflow-hidden">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cb-border bg-surface-light">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <Sparkles size={14} className="text-brand flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-cb-text">
              {allDone ? 'All set! Great work 🎉' : 'Getting Started'}
            </p>
            <p className="text-[10px] text-cb-muted">{completedCount} of {STEPS.length} complete</p>
          </div>
          <ChevronDown
            size={14}
            className={clsx('text-cb-muted transition-transform', collapsed && 'rotate-180')}
          />
        </button>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 text-cb-muted hover:text-cb-secondary rounded transition-colors"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cb-border">
        <div
          className="h-1 bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="py-2">
          {STEPS.map((step) => {
            const done = checked[step.id] ?? false
            return (
              <div
                key={step.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-light transition-colors group"
              >
                <button
                  onClick={() => toggle(step.id)}
                  className="mt-0.5 flex-shrink-0 text-cb-muted hover:text-brand transition-colors"
                >
                  {done
                    ? <CheckCircle2 size={16} className="text-brand" />
                    : <Circle size={16} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-xs font-medium', done ? 'text-cb-muted line-through' : 'text-cb-text')}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-[11px] text-cb-muted mt-0.5 leading-relaxed">{step.description}</p>
                  )}
                </div>
                {!done && (
                  <button
                    onClick={() => router.push(step.href)}
                    className="flex-shrink-0 text-[10px] font-medium text-brand hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {step.cta} →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
