'use client'

import { useState, useEffect } from 'react'
import {
  X, Sparkles, ChevronRight, ChevronLeft, Loader2,
  CheckCircle2, Dumbbell, Zap, BookOpen, RotateCcw,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

function genId() { return crypto.randomUUID() }

interface Client { id: string; name?: string | null; email?: string | null }

interface GeneratedExercise {
  name: string; muscle_group: string; sets: number
  reps_min: number; reps_max: number; rpe: number | null
  tempo: string | null; rest_seconds: number
  notes: string; superset_with_next: boolean
}

interface GeneratedDay {
  day_number: number; name: string
  session_notes: string; exercises: GeneratedExercise[]
}

interface GeneratedProgram {
  name: string; description: string; coaching_notes: string
  progression_notes: string; deload_notes: string
  goal: string; difficulty: string; days: GeneratedDay[]
}

interface BuilderSet { id: string; set_number: number; target_reps: number; target_weight_kg: number | null }
interface BuilderExercise { id: string; name: string; muscle_group: string; notes: string; rest_seconds: number; sets: BuilderSet[] }
interface BuilderDay { id: string; day_number: number; name: string; exercises: BuilderExercise[] }
interface ProgramShell {
  id: string; client_id: string; coach_id: string; name: string
  description: string | null; goal: string | null; weeks: number
  current_week: number; days_per_week: number; is_active: boolean
  ai_generated: boolean; coach_approved: boolean
  created_at: string; updated_at: string
}

interface WizardState {
  clientId: string
  goal: string; experience: string; injuries: string
  weeks: number; daysPerWeek: number; sessionLength: string; split: string
  equipment: string; repRanges: string; trainingStyle: string; cardio: string
  priorityExercises: string; avoidExercises: string
  progressionModel: string; deload: string
  includeTempo: boolean; includeRpe: boolean
  additionalNotes: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Analysing client profile…',
  'Determining optimal training split…',
  'Programming each session…',
  'Applying progressive overload…',
  'Adding coaching cues and notes…',
  'Finalising your program…',
]

function Pills<T extends string>({
  options, value, onChange, multi = false, selected,
}: {
  options: { value: T; label: string }[]
  value?: T; onChange?: (v: T) => void
  multi?: boolean; selected?: T[]
}) {
  if (multi) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              selected?.includes(o.value)
                ? 'bg-cb-teal text-white border-cb-teal'
                : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange?.(o.value)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            value === o.value
              ? 'bg-cb-teal text-white border-cb-teal'
              : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ state, setState, clients }: { state: WizardState; setState: (s: Partial<WizardState>) => void; clients: Client[] }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Client</label>
        <select
          value={state.clientId}
          onChange={(e) => setState({ clientId: e.target.value })}
          className="w-full px-3 py-2.5 bg-surface border border-cb-border rounded-xl text-sm text-cb-text focus:outline-none focus:border-cb-teal"
        >
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Primary Goal</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'hypertrophy', label: '💪 Muscle Hypertrophy', desc: 'Maximise muscle size and definition' },
            { value: 'strength', label: '🏋️ Maximal Strength', desc: 'Increase 1RM on big lifts' },
            { value: 'fat_loss', label: '🔥 Fat Loss + Muscle', desc: 'Preserve muscle in a deficit' },
            { value: 'athletic_performance', label: '⚡ Athletic Performance', desc: 'Power, speed, and sport capacity' },
            { value: 'general_fitness', label: '🌿 General Fitness', desc: 'Health, mobility, and conditioning' },
            { value: 'powerlifting', label: '🥇 Powerlifting', desc: 'Squat, Bench, Deadlift competition prep' },
          ].map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setState({ goal: g.value })}
              className={clsx(
                'text-left px-3 py-3 rounded-xl border transition-all',
                state.goal === g.value
                  ? 'border-cb-teal bg-cb-teal/5 shadow-sm'
                  : 'border-cb-border hover:border-cb-teal/40'
              )}
            >
              <p className={clsx('text-sm font-semibold', state.goal === g.value ? 'text-cb-teal' : 'text-cb-text')}>{g.label}</p>
              <p className="text-[11px] text-cb-muted mt-0.5">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Training Experience</label>
        <Pills
          options={[
            { value: 'beginner', label: 'Beginner (< 1 year)' },
            { value: 'intermediate', label: 'Intermediate (1–4 years)' },
            { value: 'advanced', label: 'Advanced (4+ years)' },
          ]}
          value={state.experience as never}
          onChange={(v) => setState({ experience: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Injuries / Physical Limitations</label>
        <textarea
          value={state.injuries}
          onChange={(e) => setState({ injuries: e.target.value })}
          placeholder="e.g. Left knee – avoid deep knee flexion. Lower back – no good mornings."
          rows={3}
          className="w-full px-3 py-2.5 bg-surface border border-cb-border rounded-xl text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-cb-teal resize-none"
        />
      </div>
    </div>
  )
}

function Step2({ state, setState }: { state: WizardState; setState: (s: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Program Duration</label>
        <Pills
          options={[4, 6, 8, 10, 12, 16].map((w) => ({ value: String(w) as never, label: `${w} weeks` }))}
          value={String(state.weeks) as never}
          onChange={(v) => setState({ weeks: Number(v) })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Training Days Per Week</label>
        <Pills
          options={[2, 3, 4, 5, 6].map((d) => ({ value: String(d) as never, label: `${d} days` }))}
          value={String(state.daysPerWeek) as never}
          onChange={(v) => setState({ daysPerWeek: Number(v) })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Target Session Length</label>
        <Pills
          options={[
            { value: '45', label: '45 min' },
            { value: '60', label: '60 min' },
            { value: '75', label: '75 min' },
            { value: '90+', label: '90+ min' },
          ]}
          value={state.sessionLength as never}
          onChange={(v) => setState({ sessionLength: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Training Split</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { value: 'full_body', label: 'Full Body', desc: 'All muscles every session' },
            { value: 'upper_lower', label: 'Upper / Lower', desc: 'Upper and lower day alternating' },
            { value: 'ppl', label: 'Push / Pull / Legs', desc: 'Classic PPL rotation' },
            { value: 'bro_split', label: 'Body Part Split', desc: 'One muscle group per day' },
            { value: 'ai_decides', label: '✨ Let AI Decide', desc: 'Optimal for the selected goal' },
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setState({ split: s.value })}
              className={clsx(
                'text-left px-3 py-2.5 rounded-xl border transition-all',
                state.split === s.value ? 'border-cb-teal bg-cb-teal/5' : 'border-cb-border hover:border-cb-teal/40'
              )}
            >
              <p className={clsx('text-sm font-semibold', state.split === s.value ? 'text-cb-teal' : 'text-cb-text')}>{s.label}</p>
              <p className="text-[11px] text-cb-muted">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step3({ state, setState }: { state: WizardState; setState: (s: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Equipment Available</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { value: 'full_gym', label: '🏋️ Full Commercial Gym', desc: 'Barbells, cables, machines, dumbbells' },
            { value: 'home_barbell', label: '🏠 Home Gym w/ Barbell', desc: 'Barbell, plates, and dumbbells' },
            { value: 'dumbbells_only', label: '🎯 Dumbbells Only', desc: 'No barbell or cable machines' },
            { value: 'bodyweight', label: '🧘 Bodyweight Only', desc: 'No equipment whatsoever' },
          ].map((eq) => (
            <button
              key={eq.value}
              type="button"
              onClick={() => setState({ equipment: eq.value })}
              className={clsx(
                'text-left px-3 py-2.5 rounded-xl border transition-all',
                state.equipment === eq.value ? 'border-cb-teal bg-cb-teal/5' : 'border-cb-border hover:border-cb-teal/40'
              )}
            >
              <p className={clsx('text-sm font-semibold', state.equipment === eq.value ? 'text-cb-teal' : 'text-cb-text')}>{eq.label}</p>
              <p className="text-[11px] text-cb-muted">{eq.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Preferred Rep Ranges</label>
        <Pills
          options={[
            { value: 'strength', label: 'Strength (1–5)' },
            { value: 'power', label: 'Power (3–6)' },
            { value: 'hypertrophy', label: 'Hypertrophy (6–12)' },
            { value: 'endurance', label: 'Endurance (12+)' },
            { value: 'mixed', label: 'Mixed' },
          ]}
          value={state.repRanges as never}
          onChange={(v) => setState({ repRanges: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Training Style</label>
        <Pills
          options={[
            { value: 'standard', label: 'Standard Sets' },
            { value: 'supersets', label: 'Supersets' },
            { value: 'circuits', label: 'Circuits' },
            { value: 'rpe_based', label: 'RPE-Based' },
          ]}
          value={state.trainingStyle as never}
          onChange={(v) => setState({ trainingStyle: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Cardio Integration</label>
        <Pills
          options={[
            { value: 'none', label: 'No Cardio' },
            { value: 'separate_days', label: 'Separate Days' },
            { value: 'finishers', label: 'Session Finishers' },
            { value: 'liss', label: 'LISS Only' },
          ]}
          value={state.cardio as never}
          onChange={(v) => setState({ cardio: v })}
        />
      </div>
    </div>
  )
}

function Step4({ state, setState }: { state: WizardState; setState: (s: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Progressive Overload Model</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { value: 'linear', label: 'Linear Progression', desc: 'Add weight every session or week' },
            { value: 'dup', label: 'DUP (Daily Undulating)', desc: 'Vary reps and intensity each session' },
            { value: 'wave', label: 'Wave Loading', desc: 'Accumulation → intensification blocks' },
            { value: 'ai_decides', label: '✨ Let AI Decide', desc: 'Optimal for the goal and experience' },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setState({ progressionModel: p.value })}
              className={clsx(
                'text-left px-3 py-2.5 rounded-xl border transition-all',
                state.progressionModel === p.value ? 'border-cb-teal bg-cb-teal/5' : 'border-cb-border hover:border-cb-teal/40'
              )}
            >
              <p className={clsx('text-sm font-semibold', state.progressionModel === p.value ? 'text-cb-teal' : 'text-cb-text')}>{p.label}</p>
              <p className="text-[11px] text-cb-muted">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Deload Protocol</label>
        <Pills
          options={[
            { value: 'every_4', label: 'Every 4 weeks' },
            { value: 'every_8', label: 'Every 8 weeks' },
            { value: 'auto', label: 'Auto-regulate' },
            { value: 'none', label: 'No deload' },
          ]}
          value={state.deload as never}
          onChange={(v) => setState({ deload: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-cb-secondary mb-2">Exercises to Prioritise</label>
          <textarea
            value={state.priorityExercises}
            onChange={(e) => setState({ priorityExercises: e.target.value })}
            placeholder="e.g. Bench press, Squat, Pull-ups…"
            rows={3}
            className="w-full px-3 py-2.5 bg-surface border border-cb-border rounded-xl text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-cb-teal resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-cb-secondary mb-2">Exercises to Avoid</label>
          <textarea
            value={state.avoidExercises}
            onChange={(e) => setState({ avoidExercises: e.target.value })}
            placeholder="e.g. Good mornings, behind-the-neck press…"
            rows={3}
            className="w-full px-3 py-2.5 bg-surface border border-cb-border rounded-xl text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-cb-teal resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={state.includeRpe} onChange={(e) => setState({ includeRpe: e.target.checked })}
            className="w-4 h-4 accent-cb-teal" />
          <span className="text-sm text-cb-text">Include RPE targets</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={state.includeTempo} onChange={(e) => setState({ includeTempo: e.target.checked })}
            className="w-4 h-4 accent-cb-teal" />
          <span className="text-sm text-cb-text">Include tempo prescriptions</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-cb-secondary mb-2">Additional Context for the AI</label>
        <textarea
          value={state.additionalNotes}
          onChange={(e) => setState({ additionalNotes: e.target.value })}
          placeholder="Anything else the AI should know — training history, lifestyle, schedule, client preferences…"
          rows={4}
          className="w-full px-3 py-2.5 bg-surface border border-cb-border rounded-xl text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-cb-teal resize-none"
        />
      </div>
    </div>
  )
}

// ─── Result View ──────────────────────────────────────────────────────────────

function ResultView({
  program,
  clientName,
  onUseInBuilder,
  onSaveAsTemplate,
  onRegenerate,
}: {
  program: GeneratedProgram
  clientName: string
  onUseInBuilder: () => void
  onSaveAsTemplate: () => void
  onRegenerate: () => void
}) {
  const goalColor: Record<string, string> = {
    hypertrophy: 'bg-blue-500/10 text-blue-500',
    strength: 'bg-red-500/10 text-red-500',
    fat_loss: 'bg-orange-500/10 text-orange-500',
    athletic_performance: 'bg-purple-500/10 text-purple-500',
    general_fitness: 'bg-green-500/10 text-green-500',
    powerlifting: 'bg-red-600/10 text-red-600',
  }
  const diffColor: Record<string, string> = {
    beginner: 'text-green-500', intermediate: 'text-amber-500', advanced: 'text-red-500',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-5 py-4 bg-cb-teal/5 border border-cb-teal/20 rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CheckCircle2 size={16} className="text-cb-teal shrink-0" />
              <h3 className="text-base font-bold text-cb-text">{program.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className={clsx('px-2 py-0.5 rounded-full font-medium capitalize', goalColor[program.goal] ?? 'bg-surface-light text-cb-muted')}>{program.goal.replace('_', ' ')}</span>
              <span className={clsx('font-medium capitalize', diffColor[program.difficulty] ?? 'text-cb-muted')}>{program.difficulty}</span>
              <span className="text-cb-muted">for {clientName}</span>
            </div>
          </div>
        </div>
        {program.description && (
          <p className="mt-2 text-sm text-cb-secondary leading-relaxed">{program.description}</p>
        )}
      </div>

      {/* Coaching notes */}
      {program.coaching_notes && (
        <div className="px-4 py-3 bg-surface-light border border-cb-border rounded-xl">
          <p className="text-xs font-semibold text-cb-text mb-1.5">Coaching Notes</p>
          {program.coaching_notes.split('\n').map((line, i) => (
            <p key={i} className="text-xs text-cb-secondary leading-relaxed">{line}</p>
          ))}
        </div>
      )}

      {/* Progression */}
      {program.progression_notes && (
        <div className="px-4 py-3 bg-surface-light border border-cb-border rounded-xl">
          <p className="text-xs font-semibold text-cb-text mb-1">Progression Scheme</p>
          <p className="text-xs text-cb-secondary">{program.progression_notes}</p>
        </div>
      )}

      {/* Days grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {program.days.map((day) => (
          <div key={day.day_number} className="bg-surface border border-cb-border rounded-xl p-4">
            <p className="text-sm font-semibold text-cb-text mb-0.5">Day {day.day_number}: {day.name}</p>
            {day.session_notes && <p className="text-xs text-cb-muted mb-2 italic">{day.session_notes}</p>}
            <div className="space-y-1">
              {day.exercises.map((ex, i) => {
                const reps = ex.reps_min === ex.reps_max ? `${ex.reps_min}` : `${ex.reps_min}–${ex.reps_max}`
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-cb-secondary truncate mr-2">{ex.name}</span>
                    <span className="text-cb-muted shrink-0">
                      {ex.sets}×{reps}
                      {ex.rpe ? ` @RPE${ex.rpe}` : ''}
                      {ex.tempo ? ` ${ex.tempo}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const STEPS = ['Client & Goal', 'Program Structure', 'Equipment & Style', 'Advanced Settings']

export default function AIWorkoutWizard({
  clients,
  onClose,
  onSave,
}: {
  clients: Client[]
  onClose: () => void
  onSave: (prog: ProgramShell, days: BuilderDay[]) => void
}) {
  const allClients = clients

  const [step, setStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [result, setResult] = useState<GeneratedProgram | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)

  const [state, setWizardState] = useState<WizardState>({
    clientId: allClients[0]?.id ?? '',
    goal: 'hypertrophy', experience: 'intermediate', injuries: '',
    weeks: 8, daysPerWeek: 4, sessionLength: '60', split: 'upper_lower',
    equipment: 'full_gym', repRanges: 'hypertrophy', trainingStyle: 'standard', cardio: 'none',
    priorityExercises: '', avoidExercises: '',
    progressionModel: 'linear', deload: 'every_4',
    includeTempo: false, includeRpe: true,
    additionalNotes: '',
  })

  const setState = (patch: Partial<WizardState>) => setWizardState((prev) => ({ ...prev, ...patch }))

  // Animate loading steps
  useEffect(() => {
    if (!generating) return
    const interval = setInterval(() => {
      setLoadingStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1))
    }, 600)
    return () => clearInterval(interval)
  }, [generating])

  const selectedClient = allClients.find((c) => c.id === state.clientId)

  async function generate() {
    setGenerating(true)
    setLoadingStepIdx(0)
    setResult(null)
    try {
      const res = await fetch('/api/ai/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: selectedClient?.name ?? 'Client', ...state }),
      })
      const data = await res.json()
      if (data.program) setResult(data.program)
    } catch {
      // mock fallback handled by API
    }
    setGenerating(false)
  }

  function handleUseInBuilder() {
    if (!result) return
    const prog: ProgramShell = {
      id: genId(), client_id: state.clientId, coach_id: 'current-coach',
      name: result.name, description: result.description ?? null,
      goal: result.goal ?? null, weeks: state.weeks, current_week: 1,
      days_per_week: state.daysPerWeek, is_active: true,
      ai_generated: true, coach_approved: true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    const builderDays: BuilderDay[] = result.days.map((day) => ({
      id: genId(),
      day_number: day.day_number,
      name: day.name,
      exercises: day.exercises.map((ex) => ({
        id: genId(),
        name: ex.name,
        muscle_group: ex.muscle_group,
        notes: ex.notes ?? '',
        rest_seconds: ex.rest_seconds ?? 90,
        sets: Array.from({ length: ex.sets }, (_, si) => ({
          id: genId(),
          set_number: si + 1,
          target_reps: ex.reps_min,
          target_weight_kg: null,
        })),
      })),
    }))
    onSave(prog as never, builderDays)
  }

  async function handleSaveAsTemplate() {
    if (!result) return
    setSavingTemplate(true)
    {
      await fetch('/api/program-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name, description: result.description,
          goal: result.goal, difficulty: result.difficulty,
          duration_weeks: state.weeks, days_per_week: state.daysPerWeek,
          structure: { notes: result.coaching_notes, workouts: result.days.map((d) => ({
            week_number: 1, day_number: d.day_number, name: d.name,
            exercises: d.exercises.map((ex, i) => ({
              order_index: i, sets: ex.sets, reps_min: ex.reps_min, reps_max: ex.reps_max,
              rest_seconds: ex.rest_seconds, rpe: ex.rpe, tempo: ex.tempo, notes: ex.notes,
              exercise: { id: '', name: ex.name, category: ex.muscle_group },
            })),
          })) },
        }),
      })
    }
    setSavingTemplate(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-2xl shadow-2xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cb-teal/10 flex items-center justify-center">
              <Sparkles size={16} className="text-cb-teal" />
            </div>
            <div>
              <h2 className="text-base font-bold text-cb-text">AI Workout Generator</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-cb-muted hover:bg-surface-light"><X size={18} /></button>
        </div>

        {/* Step indicator */}
        {!result && !generating && (
          <div className="px-6 py-3 border-b border-cb-border">
            <div className="flex items-center gap-0">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      i < step ? 'bg-cb-teal text-white' : i === step ? 'bg-cb-teal text-white ring-2 ring-cb-teal/30' : 'bg-surface-light text-cb-muted border border-cb-border'
                    )}>
                      {i < step ? <CheckCircle2 size={12} /> : i + 1}
                    </div>
                    <span className={clsx('text-[10px] mt-1 font-medium hidden sm:block', i === step ? 'text-cb-teal' : 'text-cb-muted')}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={clsx('flex-1 h-px mx-2 mt-[-14px]', i < step ? 'bg-cb-teal' : 'bg-cb-border')} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">
          {generating ? (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cb-teal/10 flex items-center justify-center">
                <Sparkles size={24} className="text-cb-teal animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-cb-text mb-1">Building your program…</p>
                <p className="text-sm text-cb-muted">Claude is analysing {selectedClient?.name ?? 'your client'}'s profile</p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                {LOADING_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    {i < loadingStepIdx ? (
                      <CheckCircle2 size={14} className="text-cb-teal shrink-0" />
                    ) : i === loadingStepIdx ? (
                      <Loader2 size={14} className="text-cb-teal animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-cb-border shrink-0" />
                    )}
                    <span className={clsx('transition-colors', i <= loadingStepIdx ? 'text-cb-text' : 'text-cb-muted')}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : result ? (
            <ResultView
              program={result}
              clientName={selectedClient?.name ?? 'Client'}
              onUseInBuilder={handleUseInBuilder}
              onSaveAsTemplate={handleSaveAsTemplate}
              onRegenerate={() => { setResult(null); generate() }}
            />
          ) : (
            <>
              {step === 0 && <Step1 state={state} setState={setState} clients={allClients} />}
              {step === 1 && <Step2 state={state} setState={setState} />}
              {step === 2 && <Step3 state={state} setState={setState} />}
              {step === 3 && <Step4 state={state} setState={setState} />}
            </>
          )}
        </div>

        {/* Footer */}
        {!generating && (
          <div className="px-6 py-4 border-t border-cb-border flex items-center justify-between">
            {result ? (
              <>
                <button onClick={() => { setResult(null); generate() }} className="flex items-center gap-1.5 px-3 py-2 border border-cb-border rounded-xl text-sm text-cb-secondary hover:bg-surface-light transition-colors">
                  <RotateCcw size={14} /> Regenerate
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveAsTemplate} disabled={savingTemplate} className="flex items-center gap-1.5 px-3 py-2 border border-cb-border rounded-xl text-sm text-cb-secondary hover:bg-surface-light transition-colors">
                    {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />} Save as Template
                  </button>
                  <button onClick={handleUseInBuilder} className="flex items-center gap-1.5 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-sm font-semibold transition-colors">
                    <Dumbbell size={14} /> Open in Builder
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} className="flex items-center gap-1.5 px-3 py-2 border border-cb-border rounded-xl text-sm text-cb-secondary hover:bg-surface-light transition-colors">
                  <ChevronLeft size={15} /> {step === 0 ? 'Cancel' : 'Back'}
                </button>
                {step < STEPS.length - 1 ? (
                  <button onClick={() => setStep(step + 1)} className="flex items-center gap-1.5 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-sm font-semibold transition-colors">
                    Next <ChevronRight size={15} />
                  </button>
                ) : (
                  <button onClick={generate} className="flex items-center gap-1.5 px-5 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-sm font-bold transition-colors">
                    <Zap size={15} /> Generate Program
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
