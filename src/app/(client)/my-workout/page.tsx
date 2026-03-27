'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Play, Check, X, Clock,
  Dumbbell, Trophy, Flame, Plus, Minus, SkipForward,
  Moon, MessageSquare, Star, ExternalLink, Film,
  AlertCircle, Loader2, ChevronDown, ChevronUp, BarChart2,
  Zap, RefreshCw,
} from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ExerciseDetail = {
  id: string
  name: string
  category: string
  muscle_groups: string[]
  instructions: string | null
  demo_video_url: string | null
  demo_image_url: string | null
}

type SessionExercise = {
  id: string
  exercise_id: string
  order_index: number
  sets: number
  reps_min: number
  reps_max: number
  rep_range: string
  weight: number | null
  weight_unit: 'kg' | 'lb'
  rest_seconds: number
  rpe: number | null
  tempo: string | null
  notes: string | null
  superset_id: string | null
  exercise: ExerciseDetail
}

type WorkoutSession = {
  id: string
  week_number: number
  day_number: number
  name: string
  notes: string | null
  supersets: { id: string; label: string | null }[]
  exercises: SessionExercise[]
}

type ActiveProgram = {
  id: string
  name: string
  description: string | null
  goal: string
  difficulty: string
  duration_weeks: number
  days_per_week: number
  status: string
  started_at: string | null
  notes: string | null
  workouts: WorkoutSession[]
}

type SetLog = {
  repsCompleted: string
  weightUsed:    string
  completed:     boolean
}

// Previous session reference per exercise → sets
type PrevLog = Record<string, { reps: number; weightKg: number }[]>

type LogResult = {
  durationMs:     number
  totalVolume:    number
  totalSets:      number
  newPersonalBests: { name: string; reps: number; weightKg: number; prev: number | null }[]
  sessionNote:    string
}

type View = 'loading' | 'no_program' | 'overview' | 'preview' | 'logging' | 'summary'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const GOAL_CFG: Record<string, { label: string; color: string; emoji: string }> = {
  strength:        { label: 'Strength',        color: '#EF4444', emoji: '💪' },
  hypertrophy:     { label: 'Hypertrophy',     color: '#F97316', emoji: '📈' },
  fat_loss:        { label: 'Fat Loss',        color: '#3B82F6', emoji: '🔥' },
  endurance:       { label: 'Endurance',       color: '#10B981', emoji: '⚡' },
  general_fitness: { label: 'General Fitness', color: '#A855F7', emoji: '🎯' },
}

const CATEGORY_EMOJI: Record<string, string> = {
  push: '💪', pull: '🏋️', legs: '🦵', core: '🎯', cardio: '❤️', full_body: '⚡',
  Chest: '💪', Back: '🏋️', Shoulders: '💪', Biceps: '💪', Triceps: '💪',
  Legs: '🦵', Glutes: '🦵', Core: '🎯', Cardio: '❤️', 'Full Body': '⚡',
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function currentWeekDay(): number {
  // 1=Mon … 7=Sun (matches program_workouts.day_number)
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

function programCurrentWeek(program: ActiveProgram): number {
  if (!program.started_at) return 1
  const started  = new Date(program.started_at)
  const elapsed  = Math.floor((Date.now() - started.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(elapsed + 1, program.duration_weeks)
}

function todayWorkout(program: ActiveProgram): WorkoutSession | null {
  const week = programCurrentWeek(program)
  const day  = currentWeekDay()
  return program.workouts.find((w) => w.week_number === week && w.day_number === day) ?? null
}

function groupBySuperset(exercises: SessionExercise[]): { ssId: string | null; label: string | null; items: SessionExercise[] }[] {
  const groups: { ssId: string | null; label: string | null; items: SessionExercise[] }[] = []
  const seen = new Map<string, typeof groups[number]>()
  for (const ex of exercises) {
    if (!ex.superset_id) {
      groups.push({ ssId: null, label: null, items: [ex] })
    } else if (seen.has(ex.superset_id)) {
      seen.get(ex.superset_id)!.items.push(ex)
    } else {
      const g = { ssId: ex.superset_id, label: null as string | null, items: [ex] }
      seen.set(ex.superset_id, g)
      groups.push(g)
    }
  }
  return groups
}

function fmtTime(ms: number): string {
  const s   = Math.floor(ms / 1000)
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function fmtRest(s: number): string {
  return s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` : `${s}s`
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0&autoplay=1` : null
}

function epley1RM(weight: number, reps: number): number {
  return reps === 1 ? weight : parseFloat((weight * (1 + reps / 30)).toFixed(2))
}

// ─────────────────────────────────────────────────────────────
// RestTimerBar
// ─────────────────────────────────────────────────────────────

function RestTimerBar({
  seconds,
  total,
  exerciseName,
  onSkip,
  onAdd30,
}: {
  seconds:      number
  total:        number
  exerciseName: string
  onSkip:       () => void
  onAdd30:      () => void
}) {
  const pct = Math.max(0, (seconds / total) * 100)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-cb-border shadow-2xl">
      {/* Progress bar */}
      <div className="h-1 bg-surface-light">
        <div
          className="h-full bg-brand transition-all ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-4 px-5 py-3">
        <Clock size={18} className="text-brand flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cb-muted truncate">Rest — {exerciseName}</p>
          <p className="text-xl font-bold text-cb-text font-mono leading-tight">{fmtRest(seconds)}</p>
        </div>
        <button
          onClick={onAdd30}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cb-border text-sm text-cb-secondary hover:bg-surface-light transition-colors"
        >
          <Plus size={13} /> 30s
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          <SkipForward size={14} /> Skip
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DemoVideoModal
// ─────────────────────────────────────────────────────────────

function DemoVideoModal({ exercise, onClose }: { exercise: ExerciseDetail; onClose: () => void }) {
  const embed = exercise.demo_video_url ? youtubeEmbed(exercise.demo_video_url) : null
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-cb-border">
          <div>
            <h3 className="font-semibold text-cb-text">{exercise.name}</h3>
            <p className="text-xs text-cb-muted capitalize mt-0.5">{exercise.muscle_groups.join(', ')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
            <X size={18} />
          </button>
        </div>
        {embed ? (
          <div className="aspect-video">
            <iframe src={embed} className="w-full h-full" allowFullScreen title={exercise.name} />
          </div>
        ) : (
          <div className="aspect-video bg-surface-light flex flex-col items-center justify-center gap-3 text-cb-muted">
            <Film size={40} className="opacity-20" />
            <p className="text-sm">No demo video available</p>
          </div>
        )}
        {exercise.instructions && (
          <div className="p-4 border-t border-cb-border">
            <p className="text-xs font-semibold text-cb-secondary uppercase tracking-wider mb-2">Instructions</p>
            <p className="text-sm text-cb-secondary leading-relaxed">{exercise.instructions}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ExercisePreviewCard
// ─────────────────────────────────────────────────────────────

function ExercisePreviewCard({
  exercise,
  ssLabel,
  onVideoClick,
}: {
  exercise:     SessionExercise
  ssLabel:      string | null
  onVideoClick: (ex: ExerciseDetail) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const emoji = CATEGORY_EMOJI[exercise.exercise.category] ?? '🏋️'
  const hasVideo = !!exercise.exercise.demo_video_url

  return (
    <div className={clsx('bg-surface rounded-xl border overflow-hidden', exercise.superset_id ? 'border-brand/30 border-l-4 border-l-brand/50' : 'border-cb-border')}>
      <div className="flex items-start gap-3 p-3.5">
        {/* Superset label */}
        {ssLabel ? (
          <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[9px] font-bold text-white">{ssLabel}</span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs">{emoji}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-cb-text">{exercise.exercise.name}</p>
          <p className="text-xs text-cb-muted capitalize mb-2">{exercise.exercise.muscle_groups.join(', ')}</p>

          {/* Prescription row */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 bg-brand-bg text-brand text-xs rounded-full font-semibold">
              {exercise.sets} × {exercise.rep_range}
            </span>
            {exercise.weight != null && (
              <span className="px-2 py-0.5 bg-surface-light text-cb-secondary text-xs rounded-full border border-cb-border">
                {exercise.weight} {exercise.weight_unit}
              </span>
            )}
            <span className="px-2 py-0.5 bg-surface-light text-cb-secondary text-xs rounded-full border border-cb-border">
              {fmtRest(exercise.rest_seconds)} rest
            </span>
            {exercise.rpe && (
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 text-xs rounded-full border border-orange-500/20">
                RPE {exercise.rpe}
              </span>
            )}
            {exercise.tempo && (
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 text-xs rounded-full border border-purple-500/20">
                {exercise.tempo}
              </span>
            )}
          </div>

          {/* Coach notes (expandable) */}
          {exercise.notes && (
            <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 mt-2 text-[11px] text-brand hover:text-brand/80 transition-colors">
              <MessageSquare size={11} />
              Coach note
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
          {expanded && exercise.notes && (
            <div className="mt-2 px-3 py-2 bg-brand-bg border border-brand/20 rounded-lg text-xs text-brand/90 leading-relaxed">
              {exercise.notes}
            </div>
          )}
        </div>

        {/* Demo video thumbnail */}
        <button
          onClick={() => onVideoClick(exercise.exercise)}
          className={clsx(
            'flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all',
            hasVideo
              ? 'bg-cb-text/5 border-cb-border hover:border-brand/40 hover:bg-brand-bg'
              : 'bg-surface-light border-cb-border opacity-40 cursor-default'
          )}
          disabled={!hasVideo}
          title={hasVideo ? 'Watch demo video' : 'No demo available'}
        >
          <Play size={16} className={hasVideo ? 'text-brand' : 'text-cb-muted'} />
          <span className="text-[9px] font-medium text-cb-muted leading-none">Demo</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WorkoutPreviewView
// ─────────────────────────────────────────────────────────────

function WorkoutPreviewView({
  workout,
  program,
  onBack,
  onStart,
}: {
  workout:  WorkoutSession
  program:  ActiveProgram
  onBack:   () => void
  onStart:  () => void
}) {
  const [videoExercise, setVideoExercise] = useState<ExerciseDetail | null>(null)
  const groups = groupBySuperset(workout.exercises)

  // Attach superset labels
  const ssLabelMap = new Map<string, string>()
  const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let li = 0
  for (const g of groups) {
    if (g.ssId && !ssLabelMap.has(g.ssId)) ssLabelMap.set(g.ssId, LABELS[li++ % 26])
  }

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0)
  const gc = GOAL_CFG[program.goal] ?? GOAL_CFG.general_fitness

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface border-b border-cb-border px-4 pt-4 pb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-cb-secondary hover:text-cb-text mb-3 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-cb-muted mb-0.5">Week {workout.week_number} · {DAYS[workout.day_number - 1]}</p>
            <h1 className="text-lg font-bold text-cb-text">{workout.name}</h1>
            <p className="text-sm text-cb-muted mt-0.5">
              {workout.exercises.length} exercises · {totalSets} sets
            </p>
          </div>
          <span className="text-xl">{gc.emoji}</span>
        </div>

        {/* Session notes from coach */}
        {workout.notes && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-brand-bg border border-brand/20 rounded-xl">
            <MessageSquare size={13} className="text-brand flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand/90 leading-relaxed">{workout.notes}</p>
          </div>
        )}

        {/* Program notes */}
        {program.notes && (
          <details className="mt-2">
            <summary className="text-xs text-cb-muted cursor-pointer hover:text-cb-text transition-colors">
              Program warm-up notes ▸
            </summary>
            <p className="text-xs text-cb-secondary leading-relaxed mt-1 px-1">{program.notes}</p>
          </details>
        )}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-3">
        {workout.exercises.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={36} className="mx-auto text-cb-muted mb-3 opacity-30" />
            <p className="text-sm text-cb-muted">This session has no exercises yet.</p>
            <p className="text-xs text-cb-muted mt-1">Your coach will add them soon.</p>
          </div>
        ) : (
          groups.map((g, gi) => {
            const label = g.ssId ? ssLabelMap.get(g.ssId) ?? null : null
            if (g.ssId) {
              return (
                <div key={g.ssId}>
                  {/* Superset label */}
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-brand">Superset</span>
                    <span className="text-xs text-cb-muted">({g.items.length} exercises)</span>
                    <div className="h-px flex-1 bg-brand/20" />
                  </div>
                  <div className="space-y-0.5">
                    {g.items.map((ex) => (
                      <ExercisePreviewCard key={ex.id} exercise={ex} ssLabel={label} onVideoClick={setVideoExercise} />
                    ))}
                  </div>
                </div>
              )
            }
            return (
              <ExercisePreviewCard key={g.items[0].id} exercise={g.items[0]} ssLabel={null} onVideoClick={setVideoExercise} />
            )
          })
        )}
      </div>

      {/* Start button */}
      <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-cb-border">
        <button
          onClick={onStart}
          disabled={workout.exercises.length === 0}
          className="w-full py-3.5 bg-brand hover:bg-brand/90 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
        >
          <Zap size={18} /> Start Workout
        </button>
      </div>

      {videoExercise && (
        <DemoVideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// LoggingView
// ─────────────────────────────────────────────────────────────

function LoggingView({
  workout,
  programId,
  prevLog,
  onFinish,
  onAbort,
}: {
  workout:   WorkoutSession
  programId: string | null
  prevLog:   PrevLog
  onFinish:  (result: LogResult) => void
  onAbort:   () => void
}) {
  // logs[exerciseId][setIndex] = SetLog
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() => {
    const init: Record<string, SetLog[]> = {}
    for (const ex of workout.exercises) {
      init[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
        repsCompleted: (prevLog[ex.exercise_id]?.[i]?.reps ?? '').toString(),
        weightUsed:    (prevLog[ex.exercise_id]?.[i]?.weightKg ?? ex.weight ?? '').toString(),
        completed:     false,
      }))
    }
    return init
  })

  // Rest timer
  const [restSeconds, setRestSeconds]       = useState<number | null>(null)
  const [restTotal,   setRestTotal]         = useState(90)
  const [restLabel,   setRestLabelStr]      = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAtRef.current), 1000)
    return () => clearInterval(id)
  }, [])

  // Session note
  const [sessionNote, setSessionNote] = useState('')
  const [showNote,    setShowNote]    = useState(false)

  function startRest(seconds: number, label: string) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTotal(seconds)
    setRestSeconds(seconds)
    setRestLabelStr(label)
    timerRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopRest() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestSeconds(null)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function updateSet(exId: string, setIdx: number, patch: Partial<SetLog>) {
    setLogs((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => i === setIdx ? { ...s, ...patch } : s),
    }))
  }

  function completeSet(ex: SessionExercise, setIdx: number) {
    updateSet(ex.id, setIdx, { completed: true })
    // Start rest timer
    if (ex.rest_seconds > 0) startRest(ex.rest_seconds, ex.exercise.name)
  }

  function uncompleteSet(exId: string, setIdx: number) {
    updateSet(exId, setIdx, { completed: false })
    stopRest()
  }

  // Progress summary
  const totalSets     = workout.exercises.reduce((a, e) => a + e.sets, 0)
  const completedSets = Object.values(logs).flat().filter((s) => s.completed).length
  const pct           = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  async function handleFinish() {
    if (timerRef.current) clearInterval(timerRef.current)

    const durationMs = Date.now() - startedAtRef.current

    // Calculate volume
    let totalVolume = 0
    const allSets: { exerciseId: string; name: string; reps: number; weightKg: number }[] = []
    for (const ex of workout.exercises) {
      const exLogs = logs[ex.id] ?? []
      for (const set of exLogs) {
        if (!set.completed) continue
        const reps   = parseInt(set.repsCompleted) || 0
        const weight = parseFloat(set.weightUsed) || 0
        totalVolume += reps * weight
        if (reps > 0) allSets.push({ exerciseId: ex.exercise_id, name: ex.exercise.name, reps, weightKg: weight })
      }
    }

    // Detect PBs (vs prevLog estimated 1RM)
    const pbMap = new Map<string, { name: string; reps: number; weightKg: number; prev: number | null }>()
    for (const s of allSets) {
      const new1RM = epley1RM(s.weightKg, s.reps)
      const prevSets = prevLog[s.exerciseId] ?? []
      const prevBest = prevSets.reduce((best, ps) => Math.max(best, epley1RM(ps.weightKg, ps.reps)), 0)
      if (new1RM > prevBest) {
        const existing = pbMap.get(s.exerciseId)
        if (!existing || new1RM > epley1RM(existing.weightKg, existing.reps)) {
          pbMap.set(s.exerciseId, { name: s.name, reps: s.reps, weightKg: s.weightKg, prev: prevBest > 0 ? prevBest : null })
        }
      }
    }

    // Persist to DB
    const apiSets: { exercise_id: string; set_number: number; reps_completed: number | null; weight_input: number | null; weight_unit: 'kg'; is_warmup: boolean }[] = []
    for (const ex of workout.exercises) {
      const exLogs = logs[ex.id] ?? []
      exLogs.forEach((setLog, i) => {
        if (!setLog.completed) return
        apiSets.push({
          exercise_id:    ex.exercise_id,
          set_number:     i + 1,
          reps_completed: parseInt(setLog.repsCompleted) || null,
          weight_input:   parseFloat(setLog.weightUsed) || null,
          weight_unit:    'kg',
          is_warmup:      false,
        })
      })
    }
    if (apiSets.length > 0) {
      try {
        await fetch('/api/workout-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workout_id:       workout.id,
            program_id:       programId,
            duration_minutes: Math.round(durationMs / 60000),
            notes:            sessionNote || null,
            sets:             apiSets,
          }),
        })
      } catch { toast.error('Workout saved locally but failed to sync — check your connection.') }
    }

    onFinish({
      durationMs,
      totalVolume,
      totalSets:        completedSets,
      newPersonalBests: Array.from(pbMap.values()),
      sessionNote,
    })
  }

  const groups = groupBySuperset(workout.exercises)
  const ssLabelMap = new Map<string, string>()
  const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let li = 0
  for (const g of groups) {
    if (g.ssId && !ssLabelMap.has(g.ssId)) ssLabelMap.set(g.ssId, LABELS[li++ % 26])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface border-b border-cb-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onAbort}
            className="p-1.5 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors"
            title="Stop workout"
          >
            <X size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-cb-text truncate">{workout.name}</p>
            <p className="text-xs text-cb-muted font-mono">{fmtTime(elapsed)}</p>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-surface-light rounded-full overflow-hidden border border-cb-border">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-cb-muted whitespace-nowrap">{completedSets}/{totalSets}</span>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40 space-y-4">
        {groups.map((g) => {
          const label = g.ssId ? ssLabelMap.get(g.ssId) ?? null : null
          if (g.ssId) {
            return (
              <div key={g.ssId}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand">Superset</span>
                  <div className="h-px flex-1 bg-brand/20" />
                </div>
                <div className="space-y-1">
                  {g.items.map((ex) => (
                    <ExerciseLogBlock
                      key={ex.id} ex={ex} ssLabel={label}
                      sets={logs[ex.id] ?? []}
                      prevLog={prevLog[ex.exercise_id] ?? []}
                      onUpdateSet={(i, patch) => updateSet(ex.id, i, patch)}
                      onCompleteSet={(i) => completeSet(ex, i)}
                      onUncompleteSet={(i) => uncompleteSet(ex.id, i)}
                    />
                  ))}
                </div>
              </div>
            )
          }
          const ex = g.items[0]
          return (
            <ExerciseLogBlock
              key={ex.id} ex={ex} ssLabel={null}
              sets={logs[ex.id] ?? []}
              prevLog={prevLog[ex.exercise_id] ?? []}
              onUpdateSet={(i, patch) => updateSet(ex.id, i, patch)}
              onCompleteSet={(i) => completeSet(ex, i)}
              onUncompleteSet={(i) => uncompleteSet(ex.id, i)}
            />
          )
        })}

        {/* Session note */}
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <button onClick={() => setShowNote((v) => !v)} className="flex items-center gap-2 text-sm text-cb-secondary hover:text-cb-text w-full text-left">
            <MessageSquare size={15} />
            <span>Add session note for coach</span>
            {showNote ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
          </button>
          {showNote && (
            <textarea
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="How did the workout feel? Any pain, fatigue, PRs, or thoughts for your coach…"
              rows={3}
              className="mt-3 w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          )}
        </div>
      </div>

      {/* Finish button */}
      <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-surface border-t border-cb-border px-4 py-3" style={{ paddingBottom: restSeconds !== null ? 88 : 12 }}>
        <button
          onClick={handleFinish}
          className="w-full py-3.5 bg-brand hover:bg-brand/90 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
        >
          <Check size={18} /> Finish Workout
        </button>
      </div>

      {/* Rest timer */}
      {restSeconds !== null && (
        <RestTimerBar
          seconds={restSeconds}
          total={restTotal}
          exerciseName={restLabel}
          onSkip={stopRest}
          onAdd30={() => setRestSeconds((v) => (v ?? 0) + 30)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ExerciseLogBlock
// ─────────────────────────────────────────────────────────────

function ExerciseLogBlock({
  ex, ssLabel, sets, prevLog, onUpdateSet, onCompleteSet, onUncompleteSet,
}: {
  ex:              SessionExercise
  ssLabel:         string | null
  sets:            SetLog[]
  prevLog:         { reps: number; weightKg: number }[]
  onUpdateSet:     (i: number, patch: Partial<SetLog>) => void
  onCompleteSet:   (i: number) => void
  onUncompleteSet: (i: number) => void
}) {
  const completedCount = sets.filter((s) => s.completed).length
  const allDone        = sets.length > 0 && completedCount === sets.length

  return (
    <div className={clsx('bg-surface border rounded-xl overflow-hidden', ssLabel ? 'border-brand/30 border-l-4 border-l-brand/50' : 'border-cb-border')}>
      {/* Exercise header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-cb-border/50">
        {ssLabel && (
          <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-white">{ssLabel}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-cb-text truncate">{ex.exercise.name}</p>
            {allDone && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-success">
                <Check size={11} /> Done
              </span>
            )}
          </div>
          <p className="text-[11px] text-cb-muted">
            {ex.sets} × {ex.rep_range}
            {ex.weight != null && ` · ${ex.weight}${ex.weight_unit}`}
            {' · '}{fmtRest(ex.rest_seconds)} rest
          </p>
        </div>
        <span className="text-xs font-semibold text-cb-muted">{completedCount}/{ex.sets}</span>
      </div>

      {/* Column headers */}
      <div className="grid gap-2 px-4 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-wider text-cb-muted" style={{ gridTemplateColumns: '32px 1fr 1fr 44px' }}>
        <span>Set</span><span className="text-center">Reps</span><span className="text-center">Weight</span><span />
      </div>

      {/* Set rows */}
      <div className="px-4 pb-3 space-y-1.5">
        {sets.map((set, i) => {
          const prev      = prevLog[i]
          const isCurrent = !set.completed && sets.slice(0, i).every((s) => s.completed)

          return (
            <div
              key={i}
              className={clsx(
                'grid items-center gap-2 rounded-lg p-2 transition-colors',
                set.completed
                  ? 'bg-success/10'
                  : isCurrent
                    ? 'bg-brand-bg border border-brand/20'
                    : 'bg-surface-light'
              )}
              style={{ gridTemplateColumns: '32px 1fr 1fr 44px' }}
            >
              {/* Set number */}
              <span className={clsx('text-xs font-bold text-center', set.completed ? 'text-success' : isCurrent ? 'text-brand' : 'text-cb-muted')}>
                {i + 1}
              </span>

              {/* Reps input */}
              <div className="relative">
                <input
                  type="number" min={0}
                  value={set.repsCompleted}
                  onChange={(e) => onUpdateSet(i, { repsCompleted: e.target.value })}
                  placeholder={String(ex.reps_min)}
                  readOnly={set.completed}
                  className={clsx(
                    'w-full px-2 py-1.5 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors',
                    set.completed
                      ? 'bg-success/15 text-success border border-success/20 cursor-default'
                      : 'bg-surface border border-cb-border text-cb-text'
                  )}
                />
                {prev && !set.completed && (
                  <span className="absolute -bottom-3.5 left-0 right-0 text-center text-[9px] text-cb-muted leading-none">
                    last {prev.reps}
                  </span>
                )}
              </div>

              {/* Weight input */}
              <div className="relative">
                <input
                  type="number" min={0} step={0.5}
                  value={set.weightUsed}
                  onChange={(e) => onUpdateSet(i, { weightUsed: e.target.value })}
                  placeholder={ex.weight != null ? String(ex.weight) : 'BW'}
                  readOnly={set.completed}
                  className={clsx(
                    'w-full px-2 py-1.5 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors',
                    set.completed
                      ? 'bg-success/15 text-success border border-success/20 cursor-default'
                      : 'bg-surface border border-cb-border text-cb-text'
                  )}
                />
                {prev && !set.completed && (
                  <span className="absolute -bottom-3.5 left-0 right-0 text-center text-[9px] text-cb-muted leading-none">
                    last {prev.weightKg}
                  </span>
                )}
              </div>

              {/* Complete button */}
              {set.completed ? (
                <button
                  onClick={() => onUncompleteSet(i)}
                  className="w-10 h-8 rounded-lg bg-success flex items-center justify-center hover:bg-success/80 transition-colors"
                  title="Undo"
                >
                  <Check size={15} className="text-white" />
                </button>
              ) : (
                <button
                  onClick={() => completeSet(i)}
                  className={clsx(
                    'w-10 h-8 rounded-lg border flex items-center justify-center transition-colors',
                    isCurrent
                      ? 'bg-brand border-brand text-white hover:bg-brand/90'
                      : 'border-cb-border text-cb-muted hover:border-brand/50 hover:text-brand'
                  )}
                  title="Log set"
                >
                  <Check size={15} />
                </button>
              )}
            </div>
          )
        })}

        {/* Previous session reference */}
        {prevLog.length > 0 && (
          <p className="text-[10px] text-cb-muted pt-1 flex items-center gap-1">
            <RefreshCw size={9} />
            Last session: {prevLog.map((p) => `${p.weightKg}kg×${p.reps}`).join(', ')}
          </p>
        )}
      </div>
    </div>
  )

  function completeSet(i: number) {
    onCompleteSet(i)
  }
}

// ─────────────────────────────────────────────────────────────
// SummaryView
// ─────────────────────────────────────────────────────────────

function SummaryView({
  result,
  workout,
  onDone,
}: {
  result:  LogResult
  workout: WorkoutSession
  onDone:  () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  function handleSubmit() {
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="max-w-lg mx-auto w-full px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-cb-text">Workout Complete!</h1>
          <p className="text-cb-muted mt-1 text-sm">{workout.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Duration',   value: fmtTime(result.durationMs), icon: <Clock size={16} /> },
            { label: 'Volume',     value: result.totalVolume > 0 ? `${(result.totalVolume / 1000).toFixed(1)}t` : '—', icon: <BarChart2 size={16} /> },
            { label: 'Sets done',  value: String(result.totalSets), icon: <Dumbbell size={16} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface border border-cb-border rounded-xl p-3.5 text-center">
              <div className="flex items-center justify-center mb-1.5 text-brand">{stat.icon}</div>
              <p className="text-lg font-bold text-cb-text">{stat.value}</p>
              <p className="text-[10px] font-medium text-cb-muted uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Personal bests */}
        {result.newPersonalBests.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-yellow-500" />
              <p className="font-semibold text-cb-text text-sm">New Personal Best{result.newPersonalBests.length > 1 ? 's' : ''}!</p>
            </div>
            <div className="space-y-2.5">
              {result.newPersonalBests.map((pb) => (
                <div key={pb.name} className="bg-surface/70 rounded-lg px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-cb-text">{pb.name}</p>
                      <p className="text-xs text-cb-muted">
                        {pb.reps} rep{pb.reps !== 1 ? 's' : ''} @ {pb.weightKg}kg
                        {' '}→ e1RM {epley1RM(pb.weightKg, pb.reps).toFixed(1)}kg
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {pb.prev != null ? (
                        <p className="text-xs font-bold text-success">+{(epley1RM(pb.weightKg, pb.reps) - pb.prev).toFixed(1)}kg</p>
                      ) : (
                        <p className="text-xs font-bold text-brand">First log!</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session feedback */}
        {!submitted ? (
          <div className="bg-surface border border-cb-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-cb-muted" />
              <p className="text-sm font-medium text-cb-text">Note for your coach</p>
            </div>
            <textarea
              value={result.sessionNote}
              readOnly
              placeholder="No session note left."
              rows={2}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-3 w-full py-2.5 bg-brand hover:bg-brand/90 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {submitting ? 'Saving…' : 'Save & Return'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Check size={20} className="mx-auto text-success mb-1" />
            <p className="text-sm text-cb-secondary">Saved! Your coach can see your log.</p>
          </div>
        )}

        <button
          onClick={onDone}
          className="w-full py-3 border border-cb-border rounded-xl text-sm text-cb-secondary hover:bg-surface-light transition-colors"
        >
          Back to My Training
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProgramOverview (weekly calendar)
// ─────────────────────────────────────────────────────────────

function ProgramOverview({
  program,
  onSelectWorkout,
}: {
  program:          ActiveProgram
  onSelectWorkout:  (workout: WorkoutSession) => void
}) {
  const currentWeek = programCurrentWeek(program)
  const todayDay    = currentWeekDay()
  const [viewWeek, setViewWeek] = useState(currentWeek)

  const gc = GOAL_CFG[program.goal] ?? GOAL_CFG.general_fitness

  // Get workouts for selected week
  const weekWorkouts = program.workouts.filter((w) => w.week_number === viewWeek)
  const workoutByDay = new Map(weekWorkouts.map((w) => [w.day_number, w]))

  // Completed days (local storage)
  const completedKey = `cb_completed_workouts_${program.id}`
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(completedKey) ?? '[]') as string[])
    } catch { return new Set() }
  })

  function isToday(weekNum: number, dayNum: number) {
    return weekNum === currentWeek && dayNum === todayDay
  }

  // Weeks with workouts
  const totalFilledDays = program.workouts.filter((w) => w.exercises.length > 0).length

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Program header */}
      <div className="flex-shrink-0 bg-surface border-b border-cb-border px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: gc.color }}>
              {gc.emoji} {gc.label}
            </p>
            <h1 className="text-lg font-bold text-cb-text leading-tight">{program.name}</h1>
            <p className="text-xs text-cb-muted mt-0.5">
              {program.duration_weeks} weeks · Week {currentWeek} of {program.duration_weeks}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
            style={{ backgroundColor: `${gc.color}15` }}
          >
            {gc.emoji}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden border border-cb-border">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${Math.round((currentWeek / program.duration_weeks) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-cb-muted whitespace-nowrap">
            {Math.round((currentWeek / program.duration_weeks) * 100)}% complete
          </span>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex-shrink-0 px-4 py-3 bg-surface border-b border-cb-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setViewWeek((v) => Math.max(1, v - 1))}
            disabled={viewWeek <= 1}
            className="p-1 text-cb-muted hover:text-cb-text disabled:opacity-30 flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: program.duration_weeks }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              onClick={() => setViewWeek(w)}
              className={clsx(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                viewWeek === w
                  ? 'bg-brand border-brand text-white'
                  : w === currentWeek
                    ? 'border-brand/40 text-brand bg-brand-bg'
                    : 'border-cb-border text-cb-secondary hover:bg-surface-light'
              )}
            >
              Week {w} {w === currentWeek && '●'}
            </button>
          ))}
          <button
            onClick={() => setViewWeek((v) => Math.min(program.duration_weeks, v + 1))}
            disabled={viewWeek >= program.duration_weeks}
            className="p-1 text-cb-muted hover:text-cb-text disabled:opacity-30 flex-shrink-0"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* 7-day strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const workout   = workoutByDay.get(day)
            const isNow     = isToday(viewWeek, day)
            const isDone    = workout && completed.has(workout.id)
            const hasWork   = workout && workout.exercises.length > 0
            const isRest    = !workout || workout.exercises.length === 0

            return (
              <button
                key={day}
                onClick={() => workout && workout.exercises.length > 0 && onSelectWorkout(workout)}
                disabled={isRest}
                className={clsx(
                  'flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all',
                  isNow && hasWork
                    ? 'bg-brand border-brand text-white shadow-md scale-105'
                    : isDone
                      ? 'bg-success/10 border-success/40 text-success'
                      : hasWork
                        ? 'bg-surface border-cb-border text-cb-secondary hover:border-brand/40'
                        : 'bg-surface-light border-cb-border/50 text-cb-muted opacity-60 cursor-default'
                )}
              >
                <span className={clsx('text-[10px] font-semibold', isNow && hasWork ? 'text-white/80' : '')}>
                  {DAYS[day - 1].slice(0, 1)}
                </span>
                {isDone ? (
                  <Check size={14} className="text-success" />
                ) : isRest ? (
                  <Moon size={13} />
                ) : (
                  <div className={clsx('w-1.5 h-1.5 rounded-full', isNow ? 'bg-white' : 'bg-brand')} />
                )}
                <span className={clsx('text-[9px]', isNow && hasWork ? 'text-white/60' : 'text-cb-muted')}>
                  {isRest ? 'REST' : `${workout?.exercises.length ?? 0}ex`}
                </span>
              </button>
            )
          })}
        </div>

        {/* Today's workout highlight */}
        {viewWeek === currentWeek && (() => {
          const tw = workoutByDay.get(todayDay)
          if (!tw || tw.exercises.length === 0) return (
            <div className="bg-surface border border-cb-border rounded-xl p-5 text-center">
              <Moon size={28} className="mx-auto text-cb-muted mb-2 opacity-40" />
              <p className="text-sm font-medium text-cb-text">Rest Day</p>
              <p className="text-xs text-cb-muted mt-0.5">Recovery is part of the program.</p>
            </div>
          )
          const isDone = completed.has(tw.id)
          return (
            <div className={clsx('rounded-xl border overflow-hidden', isDone ? 'border-success/40' : 'border-brand/40 shadow-sm')}>
              <div className={clsx('px-4 py-2.5 flex items-center gap-2', isDone ? 'bg-success/10' : 'bg-brand')} >
                <Flame size={14} className={isDone ? 'text-success' : 'text-white'} />
                <p className={clsx('text-xs font-bold uppercase tracking-wider', isDone ? 'text-success' : 'text-white')}>
                  {isDone ? 'Completed Today' : "Today's Workout"}
                </p>
                <span className={clsx('text-xs ml-auto', isDone ? 'text-success' : 'text-white/70')}>
                  {DAYS[todayDay - 1]}
                </span>
              </div>
              <div className="bg-surface p-4">
                <p className="text-base font-bold text-cb-text mb-0.5">{tw.name}</p>
                <p className="text-sm text-cb-muted mb-3">
                  {tw.exercises.length} exercises · {tw.exercises.reduce((a, e) => a + e.sets, 0)} sets
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tw.exercises.slice(0, 4).map((ex) => (
                    <span key={ex.id} className="px-2 py-0.5 bg-surface-light border border-cb-border rounded-full text-[11px] text-cb-secondary">
                      {ex.exercise.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  ))}
                  {tw.exercises.length > 4 && (
                    <span className="px-2 py-0.5 bg-surface-light border border-cb-border rounded-full text-[11px] text-cb-muted">
                      +{tw.exercises.length - 4} more
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onSelectWorkout(tw)}
                  className={clsx(
                    'w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors',
                    isDone
                      ? 'bg-surface-light border border-cb-border text-cb-secondary hover:bg-cb-border'
                      : 'bg-brand text-white hover:bg-brand/90'
                  )}
                >
                  {isDone ? <><RefreshCw size={15} /> Redo Workout</> : <><Zap size={15} /> Open Workout</>}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Other workouts this week */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cb-muted px-1">
            Other sessions this week
          </p>
          {[1, 2, 3, 4, 5, 6, 7].filter((d) => d !== todayDay || viewWeek !== currentWeek).map((day) => {
            const w = workoutByDay.get(day)
            if (!w || w.exercises.length === 0) return null
            const isDone = completed.has(w.id)
            const isNow  = isToday(viewWeek, day)
            return (
              <button
                key={day}
                onClick={() => onSelectWorkout(w)}
                className={clsx(
                  'w-full flex items-center gap-3 bg-surface border rounded-xl px-4 py-3 text-left hover:border-brand/40 transition-colors',
                  isDone ? 'border-success/30' : 'border-cb-border',
                  isNow && viewWeek !== currentWeek && 'ring-2 ring-brand/30'
                )}
              >
                <div className={clsx('w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold', isDone ? 'bg-success/10 border-success/40 text-success' : 'bg-brand-bg border-brand/30 text-brand')}>
                  {isDone ? <Check size={14} /> : DAYS[day - 1].slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-cb-text truncate">{w.name}</p>
                  <p className="text-xs text-cb-muted">{DAYS[day - 1]} · {w.exercises.length} exercises</p>
                </div>
                <ChevronRight size={16} className="text-cb-muted flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function MyWorkoutPage() {
  const [view,     setView]     = useState<View>('loading')
  const [program,  setProgram]  = useState<ActiveProgram | null>(null)
  const [workout,  setWorkout]  = useState<WorkoutSession | null>(null)
  const [prevLog,  setPrevLog]  = useState<PrevLog>({})
  const [result,   setResult]   = useState<LogResult | null>(null)

  const loadProgram = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setView('no_program'); return }

      const res = await fetch(`/api/clients/${user.id}/programs/active`)
      const d   = await res.json()
      if (!d.program) { setView('no_program'); return }
      setProgram(d.program)
      setView('overview')
    } catch {
      setView('no_program')
    }
  }, [])

  useEffect(() => { loadProgram() }, [loadProgram])

  async function handleSelectWorkout(w: WorkoutSession) {
    setWorkout(w)

    // Fetch previous log
    try {
      const res  = await fetch(`/api/workout-logs?workoutId=${w.id}&limit=1`)
      const d    = await res.json()
      const prev: PrevLog = {}
      for (const set of d.logs?.[0]?.sets ?? []) {
        if (!prev[set.exercise_id]) prev[set.exercise_id] = []
        prev[set.exercise_id].push({ reps: set.reps_completed, weightKg: set.weight_kg })
      }
      setPrevLog(prev)
    } catch { setPrevLog({}) }

    setView('preview')
  }

  function handleFinish(r: LogResult) {
    setResult(r)
    setView('summary')
  }

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-brand animate-spin" />
      </div>
    )
  }

  if (view === 'no_program') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <Dumbbell size={48} className="text-cb-muted opacity-30" />
        <div>
          <h2 className="text-lg font-bold text-cb-text">No Active Program</h2>
          <p className="text-sm text-cb-muted mt-1">Your coach hasn't assigned a training program yet. Check back soon!</p>
        </div>
      </div>
    )
  }

  if (view === 'overview' && program) {
    return <ProgramOverview program={program} onSelectWorkout={handleSelectWorkout} />
  }

  if (view === 'preview' && workout && program) {
    return (
      <WorkoutPreviewView
        workout={workout}
        program={program}
        onBack={() => setView('overview')}
        onStart={() => setView('logging')}
      />
    )
  }

  if (view === 'logging' && workout) {
    return (
      <LoggingView
        workout={workout}
        programId={program?.id ?? null}
        prevLog={prevLog}
        onFinish={handleFinish}
        onAbort={() => setView('preview')}
      />
    )
  }

  if (view === 'summary' && result && workout) {
    return (
      <SummaryView
        result={result}
        workout={workout}
        onDone={() => { setView('overview'); setWorkout(null); setResult(null) }}
      />
    )
  }

  return null
}
