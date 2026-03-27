'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Search, X, ChevronLeft, Save, Users, GripVertical,
  Trash2, Copy, Link2, Dumbbell, Moon, FileText, Loader2,
  ChevronDown, MoreHorizontal, Check, BookOpen, Zap,
  AlertCircle, Target, Calendar, LayoutGrid, Clock, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { Profile, ProgramGoal, ProgramDifficulty } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { EXERCISES } from '@/lib/exercises'
import AIWorkoutWizard from '@/components/ai/AIWorkoutWizard'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DraftExercise = {
  uid: string
  exerciseId: string
  name: string
  category: string
  sets: number
  repsMin: number
  repsMax: number
  weight: number | null
  weightUnit: 'kg' | 'lb'
  restSeconds: number
  rpe: number | null
  tempo: string
  notes: string
  supersetId: string | null
}

type WorkoutCell = {
  uid: string
  name: string
  sessionNotes: string
  isRest: boolean
  exercises: DraftExercise[]
}

type ProgramDraft = {
  id: string | null
  name: string
  goal: ProgramGoal
  difficulty: ProgramDifficulty
  durationWeeks: number
  daysPerWeek: number
  clientId: string | null
  programNotes: string
  grid: Record<string, WorkoutCell>
}

type ClientOpt = { id: string; name: string | null; email: string | null }
type ExGroup   = { supersetId: string | null; label: string | null; exercises: DraftExercise[] }

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DAYS       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SS_LABELS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const REST_OPTS  = [30, 45, 60, 90, 120, 180, 240, 300]

const GOALS: { value: ProgramGoal; label: string; emoji: string; color: string }[] = [
  { value: 'strength',        label: 'Strength',        emoji: '💪', color: '#EF4444' },
  { value: 'hypertrophy',     label: 'Hypertrophy',     emoji: '📈', color: '#F97316' },
  { value: 'fat_loss',        label: 'Fat Loss',        emoji: '🔥', color: '#3B82F6' },
  { value: 'endurance',       label: 'Endurance',       emoji: '⚡', color: '#10B981' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '🎯', color: '#A855F7' },
]

const DIFFICULTIES: { value: ProgramDifficulty; label: string; color: string }[] = [
  { value: 'beginner',     label: 'Beginner',     color: '#22C55E' },
  { value: 'intermediate', label: 'Intermediate', color: '#F59E0B' },
  { value: 'advanced',     label: 'Advanced',     color: '#EF4444' },
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function genUid()                         { return crypto.randomUUID() }
function cellKey(w: number, d: number)    { return `${w}-${d}` }
function restLabel(s: number)             { return s >= 60 ? `${s / 60}min` : `${s}s` }

function makeCell(week: number, day: number): WorkoutCell {
  return {
    uid:          genUid(),
    name:         `${DAYS[day - 1]} - Session`,
    sessionNotes: '',
    isRest:       false,
    exercises:    [],
  }
}

function makeExercise(ex: { id: string; name: string; muscle_group?: string; category?: string }): DraftExercise {
  return {
    uid:          genUid(),
    exerciseId:   ex.id,
    name:         ex.name,
    category:     ex.category ?? ex.muscle_group ?? 'full_body',
    sets:         3,
    repsMin:      8,
    repsMax:      12,
    weight:       null,
    weightUnit:   'kg',
    restSeconds:  90,
    rpe:          null,
    tempo:        '',
    notes:        '',
    supersetId:   null,
  }
}

function calcProgress(draft: ProgramDraft) {
  const total  = draft.durationWeeks * 7
  let filled   = 0
  for (let w = 1; w <= draft.durationWeeks; w++) {
    for (let d = 1; d <= 7; d++) {
      const c = draft.grid[cellKey(w, d)]
      if (c && !c.isRest && c.exercises.length > 0) filled++
    }
  }
  return { filled, total, pct: total > 0 ? Math.round((filled / total) * 100) : 0 }
}

function groupExercises(exercises: DraftExercise[]): ExGroup[] {
  const groups: ExGroup[]           = []
  const seen   = new Map<string, ExGroup>()
  let labelIdx = 0
  for (const ex of exercises) {
    if (!ex.supersetId) {
      groups.push({ supersetId: null, label: null, exercises: [ex] })
    } else if (seen.has(ex.supersetId)) {
      seen.get(ex.supersetId)!.exercises.push(ex)
    } else {
      const g: ExGroup = { supersetId: ex.supersetId, label: SS_LABELS[labelIdx++ % 26], exercises: [ex] }
      seen.set(ex.supersetId, g)
      groups.push(g)
    }
  }
  return groups
}

function flatExercises(groups: ExGroup[]): DraftExercise[] {
  return groups.flatMap((g) => g.exercises)
}

const goalCfg   = (g: ProgramGoal)         => GOALS.find((x) => x.value === g) ?? GOALS[4]
const diffCfg   = (d: ProgramDifficulty)   => DIFFICULTIES.find((x) => x.value === d) ?? DIFFICULTIES[1]

// ─────────────────────────────────────────────────────────────
// CreateProgramModal
// ─────────────────────────────────────────────────────────────

function CreateProgramModal({
  clients,
  onClose,
  onCreate,
}: {
  clients: ClientOpt[]
  onClose: () => void
  onCreate: (draft: ProgramDraft) => void
}) {
  const [name,          setName]          = useState('New Program')
  const [goal,          setGoal]          = useState<ProgramGoal>('hypertrophy')
  const [difficulty,    setDifficulty]    = useState<ProgramDifficulty>('intermediate')
  const [durationWeeks, setDurationWeeks] = useState(4)
  const [daysPerWeek,   setDaysPerWeek]   = useState(4)
  const [clientId,      setClientId]      = useState<string | null>(null)
  const [isTemplate,    setIsTemplate]    = useState(false)
  const [nameError,     setNameError]     = useState(false)

  function handleCreate() {
    if (!name.trim()) { setNameError(true); return }
    // Auto-mark Sat/Sun as rest for programs ≤ 5 days/week
    const grid: Record<string, WorkoutCell> = {}
    for (let w = 1; w <= durationWeeks; w++) {
      for (let d = 1; d <= 7; d++) {
        const cell  = makeCell(w, d)
        if (d > daysPerWeek) cell.isRest = true
        grid[cellKey(w, d)] = cell
      }
    }
    onCreate({
      id: null, name: name.trim(), goal, difficulty,
      durationWeeks, daysPerWeek, clientId, programNotes: '', grid,
    })
    onClose()
  }

  const sel = 'px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/30 w-full'
  const opt = (val: string, label: string) => <option key={val} value={val}>{label}</option>

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-base font-semibold text-cb-text">Create Program</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-cb-secondary mb-1">Program Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(false) }}
              className={clsx(
                'w-full px-3 py-2 bg-surface-light border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2',
                nameError ? 'border-red-400 focus:ring-red-400/30' : 'border-cb-border focus:ring-brand/30'
              )}
              placeholder="e.g. 4-Week Hypertrophy Block"
              autoFocus
            />
            {nameError && <p className="text-xs text-red-500 mt-1">Program name is required</p>}
          </div>

          {/* Goal + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value as ProgramGoal)} className={sel}>
                {GOALS.map((g) => opt(g.value, `${g.emoji} ${g.label}`))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as ProgramDifficulty)} className={sel}>
                {DIFFICULTIES.map((d) => opt(d.value, d.label))}
              </select>
            </div>
          </div>

          {/* Duration + Days/week */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Duration</label>
              <select value={durationWeeks} onChange={(e) => setDurationWeeks(+e.target.value)} className={sel}>
                {[2, 4, 6, 8, 10, 12, 16, 20, 24].map((n) => opt(String(n), `${n} weeks`))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Days per week</label>
              <select value={daysPerWeek} onChange={(e) => setDaysPerWeek(+e.target.value)} className={sel}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => opt(String(n), `${n} day${n > 1 ? 's' : ''}`))}
              </select>
            </div>
          </div>

          {/* Assign to client */}
          {clients.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Assign to Client (optional)</label>
              <select value={clientId ?? ''} onChange={(e) => setClientId(e.target.value || null)} className={sel}>
                <option value="">— No client (save as draft)</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
              </select>
            </div>
          )}

          {/* Template toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsTemplate((v) => !v)}
              className={clsx(
                'w-9 h-5 rounded-full transition-colors relative',
                isTemplate ? 'bg-brand' : 'bg-surface-light border border-cb-border'
              )}
            >
              <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', isTemplate ? 'left-4' : 'left-0.5')} />
            </button>
            <span className="text-sm text-cb-secondary">Save as reusable template</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-brand hover:bg-brand/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Plus size={14} /> Create Program
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// AssignClientModal
// ─────────────────────────────────────────────────────────────

function AssignClientModal({
  clients,
  currentClientId,
  onAssign,
  onClose,
}: {
  clients: ClientOpt[]
  currentClientId: string | null
  onAssign: (clientId: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(currentClientId ?? '')
  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-base font-semibold text-cb-text">Assign to Client</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {clients.length === 0 && (
            <p className="text-sm text-cb-muted text-center py-4">No clients yet. Invite clients first.</p>
          )}
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left',
                selected === c.id ? 'border-brand bg-brand-bg' : 'border-cb-border hover:bg-surface-light'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-surface-light border border-cb-border flex items-center justify-center text-xs font-medium text-cb-secondary">
                {(c.name ?? c.email ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cb-text truncate">{c.name ?? 'Unnamed'}</p>
                <p className="text-xs text-cb-muted truncate">{c.email}</p>
              </div>
              {selected === c.id && <Check size={16} className="text-brand flex-shrink-0" />}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light">Cancel</button>
          <button
            onClick={() => { if (selected) { onAssign(selected); onClose() } }}
            disabled={!selected}
            className="px-4 py-2 text-sm bg-brand text-white rounded-lg font-medium hover:bg-brand/90 disabled:opacity-50"
          >
            Assign & Activate
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CopyWorkoutModal
// ─────────────────────────────────────────────────────────────

function CopyWorkoutModal({
  draft,
  fromWeek,
  fromDay,
  onCopy,
  onClose,
}: {
  draft: ProgramDraft
  fromWeek: number
  fromDay: number
  onCopy: (targets: { week: number; day: number }[]) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(w: number, d: number) {
    const k = cellKey(w, d)
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(k) ? n.delete(k) : n.add(k)
      return n
    })
  }

  function handleCopy() {
    const targets = Array.from(selected).map((k) => {
      const [w, d] = k.split('-').map(Number)
      return { week: w, day: d }
    })
    onCopy(targets)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <div>
            <h2 className="text-base font-semibold text-cb-text">Copy Workout</h2>
            <p className="text-xs text-cb-muted mt-0.5">Select days to copy this session to</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="pb-2 text-cb-muted font-medium pr-2 text-left">Week</th>
                  {DAYS.map((d) => (
                    <th key={d} className="pb-2 text-cb-muted font-medium px-1">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: draft.durationWeeks }, (_, wi) => wi + 1).map((w) => (
                  <tr key={w}>
                    <td className="pr-2 py-1 text-left text-cb-muted font-medium">W{w}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                      const isSource  = w === fromWeek && d === fromDay
                      const cell      = draft.grid[cellKey(w, d)]
                      const isRest    = cell?.isRest
                      const isChecked = selected.has(cellKey(w, d))
                      return (
                        <td key={d} className="px-1 py-1">
                          {isSource ? (
                            <div className="w-7 h-7 mx-auto rounded-md bg-brand flex items-center justify-center" title="Source">
                              <Check size={12} className="text-white" />
                            </div>
                          ) : (
                            <button
                              onClick={() => !isRest && toggle(w, d)}
                              disabled={isRest ?? false}
                              className={clsx(
                                'w-7 h-7 mx-auto rounded-md border transition-colors flex items-center justify-center',
                                isRest
                                  ? 'bg-surface-light border-cb-border cursor-not-allowed opacity-40'
                                  : isChecked
                                    ? 'bg-brand border-brand'
                                    : 'border-cb-border hover:border-brand/50 hover:bg-brand-bg'
                              )}
                            >
                              {isChecked && <Check size={12} className="text-white" />}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 pb-5">
          <p className="text-xs text-cb-muted">{selected.size} day{selected.size !== 1 ? 's' : ''} selected</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light">Cancel</button>
            <button
              onClick={handleCopy}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm bg-brand text-white rounded-lg font-medium hover:bg-brand/90 disabled:opacity-50"
            >
              Copy to {selected.size} day{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ExerciseSearchBar
// ─────────────────────────────────────────────────────────────

function ExerciseSearchBar({ onAdd }: { onAdd: (ex: DraftExercise) => void }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<{ id: string; name: string; category: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) { setResults([]); setOpen(false); return }

    setLoading(true)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          const list = (d.exercises ?? []).slice(0, 8).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e: any) => ({ id: e.id, name: e.name, category: e.muscle_groups?.[0] ?? e.category ?? 'Other' })
          )
          setResults(list)
          setOpen(list.length > 0)
        })
        .catch(() => {
          const filtered = EXERCISES
            .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8)
            .map((e) => ({ id: e.id, name: e.name, category: e.muscle_group }))
          setResults(filtered)
          setOpen(filtered.length > 0)
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function select(ex: { id: string; name: string; category: string }) {
    onAdd(makeExercise(ex))
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-cb-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search and add exercise…"
          className="w-full pl-9 pr-3 py-2.5 bg-surface-light border border-cb-border rounded-xl text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {loading && <Loader2 size={14} className="absolute right-3 text-cb-muted animate-spin" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }} className="absolute right-3 text-cb-muted hover:text-cb-text">
            <X size={14} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-cb-border rounded-xl shadow-xl z-30 overflow-hidden">
          {results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => select(ex)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light transition-colors border-b border-cb-border/50 last:border-0"
            >
              <Dumbbell size={13} className="text-cb-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cb-text truncate">{ex.name}</p>
                <p className="text-[10px] text-cb-muted">{ex.category}</p>
              </div>
              <Plus size={13} className="text-brand flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ExerciseBlock
// ─────────────────────────────────────────────────────────────

function ExerciseBlock({
  ex,
  supersetLabel,
  isDragOver,
  canLink,
  onUpdate,
  onDelete,
  onDuplicate,
  onLink,
  onUnlink,
  dragHandleProps,
}: {
  ex:              DraftExercise
  supersetLabel:   string | null
  isDragOver:      boolean
  canLink:         boolean
  onUpdate:        (ex: DraftExercise) => void
  onDelete:        () => void
  onDuplicate:     () => void
  onLink:          () => void
  onUnlink:        () => void
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>
}) {
  const [showNotes,    setShowNotes]    = useState(!!ex.notes)
  const [showAdvanced, setShowAdvanced] = useState(!!(ex.rpe || ex.tempo))
  const [showMenu,     setShowMenu]     = useState(false)

  const inSuperset = !!ex.supersetId

  const fieldCls = 'bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text text-center focus:outline-none focus:ring-2 focus:ring-brand/30 w-full py-1.5'

  return (
    <div className={clsx('relative', isDragOver && 'before:absolute before:-top-0.5 before:inset-x-0 before:h-0.5 before:bg-brand before:rounded-full')}>
      <div className={clsx(
        'bg-surface border rounded-xl overflow-hidden transition-all',
        inSuperset ? 'border-brand/30 border-l-4 border-l-brand/60' : 'border-cb-border hover:border-cb-text/20',
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-cb-muted hover:text-cb-secondary flex-shrink-0">
            <GripVertical size={14} />
          </div>
          {supersetLabel && (
            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-white">{supersetLabel}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-cb-text truncate">{ex.name}</p>
            <p className="text-[10px] text-cb-muted capitalize">{ex.category.replace(/_/g, ' ')}</p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => setShowNotes((v) => !v)}
              className={clsx('p-1.5 rounded-md transition-colors', showNotes ? 'text-brand bg-brand-bg' : 'text-cb-muted hover:text-cb-secondary')}
              title="Coaching notes"
            >
              <FileText size={12} />
            </button>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={clsx('p-1.5 rounded-md transition-colors', showAdvanced ? 'text-brand bg-brand-bg' : 'text-cb-muted hover:text-cb-secondary')}
              title="Advanced options (RPE & Tempo)"
            >
              <Zap size={12} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-1.5 rounded-md text-cb-muted hover:text-cb-secondary transition-colors"
              >
                <MoreHorizontal size={12} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-surface border border-cb-border rounded-lg shadow-xl z-20 w-44 py-1 text-sm">
                  <button onClick={() => { setShowNotes((v) => !v); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-light text-cb-secondary">
                    <FileText size={13} /> {showNotes ? 'Hide' : 'Show'} Notes
                  </button>
                  <button onClick={() => { onDuplicate(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-light text-cb-secondary">
                    <Copy size={13} /> Duplicate exercise
                  </button>
                  {inSuperset && (
                    <button onClick={() => { onUnlink(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-light text-cb-secondary">
                      <Link2 size={13} /> Remove from superset
                    </button>
                  )}
                  <div className="border-t border-cb-border my-1" />
                  <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-light text-danger">
                    <Trash2 size={13} /> Remove exercise
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sets / Reps / Weight / Rest */}
        <div className="px-3 pb-2.5 grid grid-cols-4 gap-2">
          {/* Sets */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-cb-muted mb-1 text-center">Sets</p>
            <input
              type="number" min={1}
              value={ex.sets}
              onChange={(e) => onUpdate({ ...ex, sets: Math.max(1, parseInt(e.target.value) || 1) })}
              className={fieldCls}
            />
          </div>

          {/* Reps */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-cb-muted mb-1 text-center">Reps</p>
            <div className="flex items-center gap-0.5">
              <input
                type="number" min={1}
                value={ex.repsMin}
                onChange={(e) => onUpdate({ ...ex, repsMin: Math.max(1, parseInt(e.target.value) || 1) })}
                className="bg-surface-light border border-cb-border rounded-l-lg text-xs text-cb-text text-center focus:outline-none focus:ring-2 focus:ring-brand/30 w-full py-1.5"
                title="Min reps"
              />
              <span className="text-cb-muted text-xs flex-shrink-0">–</span>
              <input
                type="number" min={ex.repsMin}
                value={ex.repsMax}
                onChange={(e) => onUpdate({ ...ex, repsMax: Math.max(ex.repsMin, parseInt(e.target.value) || ex.repsMin) })}
                className="bg-surface-light border border-cb-border rounded-r-lg text-xs text-cb-text text-center focus:outline-none focus:ring-2 focus:ring-brand/30 w-full py-1.5"
                title="Max reps"
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-cb-muted mb-1 text-center">Weight</p>
            <div className="flex items-center">
              <input
                type="number" min={0} step={0.5}
                value={ex.weight ?? ''}
                onChange={(e) => onUpdate({ ...ex, weight: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="BW"
                className="bg-surface-light border border-cb-border rounded-l-lg text-xs text-cb-text text-center focus:outline-none focus:ring-2 focus:ring-brand/30 w-full py-1.5"
              />
              <button
                onClick={() => onUpdate({ ...ex, weightUnit: ex.weightUnit === 'kg' ? 'lb' : 'kg' })}
                className="px-1.5 py-1.5 bg-surface-light border border-l-0 border-cb-border rounded-r-lg text-[9px] font-semibold text-cb-secondary hover:bg-cb-border transition-colors flex-shrink-0"
              >
                {ex.weightUnit}
              </button>
            </div>
          </div>

          {/* Rest */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-cb-muted mb-1 text-center">Rest</p>
            <select
              value={ex.restSeconds}
              onChange={(e) => onUpdate({ ...ex, restSeconds: parseInt(e.target.value) })}
              className="bg-surface-light border border-cb-border rounded-lg text-xs text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/30 w-full py-1.5 text-center"
            >
              {REST_OPTS.map((s) => <option key={s} value={s}>{restLabel(s)}</option>)}
            </select>
          </div>
        </div>

        {/* Advanced: RPE + Tempo */}
        {showAdvanced && (
          <div className="px-3 pb-2.5 grid grid-cols-2 gap-2 border-t border-cb-border/50 pt-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-cb-muted mb-1">RPE (1–10)</p>
              <input
                type="number" min={1} max={10} step={0.5}
                value={ex.rpe ?? ''}
                onChange={(e) => onUpdate({ ...ex, rpe: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="—"
                className={fieldCls}
              />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-cb-muted mb-1">Tempo (e–p–c–p)</p>
              <input
                type="text"
                value={ex.tempo}
                onChange={(e) => onUpdate({ ...ex, tempo: e.target.value })}
                placeholder="e.g. 3-1-2-0"
                className={fieldCls}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        {showNotes && (
          <div className="px-3 pb-2.5 border-t border-cb-border/50 pt-2">
            <textarea
              value={ex.notes}
              onChange={(e) => onUpdate({ ...ex, notes: e.target.value })}
              placeholder="Coaching note for this exercise…"
              rows={2}
              className="w-full px-2.5 py-2 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>
        )}
      </div>

      {/* Superset link button between exercises */}
      {canLink && !inSuperset && (
        <div className="flex items-center justify-center py-1.5 gap-2">
          <div className="h-px flex-1 bg-cb-border" />
          <button
            onClick={onLink}
            className="flex items-center gap-1 text-[10px] text-cb-muted hover:text-brand transition-colors px-2 py-0.5 rounded-full border border-cb-border hover:border-brand/40 hover:bg-brand-bg"
          >
            <Link2 size={10} /> Superset
          </button>
          <div className="h-px flex-1 bg-cb-border" />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WorkoutEditor
// ─────────────────────────────────────────────────────────────

function WorkoutEditor({
  cell,
  week,
  day,
  draft,
  onUpdateCell,
  onClose,
  onCopyWorkout,
}: {
  cell:          WorkoutCell
  week:          number
  day:           number
  draft:         ProgramDraft
  onUpdateCell:  (cell: WorkoutCell) => void
  onClose:       () => void
  onCopyWorkout: () => void
}) {
  const [dragIdx,     setDragIdx]     = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [showCopy,    setShowCopy]    = useState(false)

  const exercises = cell.exercises
  const groups    = groupExercises(exercises)

  function update(patch: Partial<WorkoutCell>) {
    onUpdateCell({ ...cell, ...patch })
  }

  function updateExercise(idx: number, ex: DraftExercise) {
    const next = [...exercises]
    next[idx]  = ex
    update({ exercises: next })
  }

  function deleteExercise(idx: number) {
    const next = exercises.filter((_, i) => i !== idx)
    update({ exercises: next })
  }

  function duplicateExercise(idx: number) {
    const next = [...exercises]
    next.splice(idx + 1, 0, { ...exercises[idx], uid: genUid(), supersetId: null })
    update({ exercises: next })
  }

  function addExercise(ex: DraftExercise) {
    update({ exercises: [...exercises, ex] })
  }

  // Link exercise at flatIdx with exercise at flatIdx+1
  function linkExercises(flatIdx: number) {
    const next   = [...exercises]
    const ex1    = next[flatIdx]
    const ex2    = next[flatIdx + 1]
    if (!ex1 || !ex2) return
    const ssId   = ex1.supersetId ?? ex2.supersetId ?? genUid()
    next[flatIdx]     = { ...ex1, supersetId: ssId }
    next[flatIdx + 1] = { ...ex2, supersetId: ssId }
    update({ exercises: next })
  }

  function unlinkExercise(flatIdx: number) {
    const next = [...exercises]
    next[flatIdx] = { ...next[flatIdx], supersetId: null }
    update({ exercises: next })
  }

  // Drag-and-drop reorder (flat exercises array)
  function handleDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const next        = [...exercises]
    const [item]      = next.splice(dragIdx, 1)
    next.splice(toIdx, 0, item)
    update({ exercises: next })
    setDragIdx(null)
    setDragOverIdx(null)
  }

  // Map from exercise uid to its flat index (for DnD)
  const flatIndexMap = new Map(exercises.map((ex, i) => [ex.uid, i]))

  const totalSets = exercises.reduce((a, e) => a + e.sets, 0)

  return (
    <div className="flex flex-col h-full bg-surface border-l border-cb-border overflow-hidden">
      {/* Editor header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-cb-border">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onClose} className="p-1 text-cb-muted hover:text-cb-text rounded-md transition-colors">
            <X size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <input
              value={cell.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full text-sm font-semibold text-cb-text bg-transparent focus:outline-none focus:ring-0 placeholder-cb-muted"
              placeholder="Session name…"
            />
            <p className="text-[10px] text-cb-muted">Week {week} · {DAYS[day - 1]} · {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {totalSets} sets</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => update({ isRest: !cell.isRest })}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors',
                cell.isRest
                  ? 'bg-surface-light border-cb-border text-cb-secondary'
                  : 'border-cb-border text-cb-muted hover:bg-surface-light'
              )}
              title="Toggle rest day"
            >
              <Moon size={11} /> {cell.isRest ? 'REST' : 'Rest'}
            </button>
            <button
              onClick={() => setShowCopy(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-cb-border text-cb-muted hover:bg-surface-light transition-colors"
              title="Copy to other days"
            >
              <Copy size={11} /> Copy
            </button>
          </div>
        </div>

        {/* Session notes */}
        <textarea
          value={cell.sessionNotes}
          onChange={(e) => update({ sessionNotes: e.target.value })}
          placeholder="Session notes (warm-up, focus, weekly cues…)"
          rows={1}
          className="w-full px-2.5 py-1.5 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
          style={{ minHeight: 30, maxHeight: 80, overflow: 'auto' }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = `${Math.min(t.scrollHeight, 80)}px`
          }}
        />
      </div>

      {/* Exercise search */}
      {!cell.isRest && (
        <div className="flex-shrink-0 p-3 border-b border-cb-border bg-surface">
          <ExerciseSearchBar onAdd={addExercise} />
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto p-3">
        {cell.isRest ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Moon size={36} className="text-cb-muted opacity-30" />
            <p className="text-sm text-cb-muted">Rest Day</p>
            <button
              onClick={() => update({ isRest: false })}
              className="text-xs text-brand hover:underline"
            >
              Convert to workout
            </button>
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
            <div className="w-14 h-14 rounded-2xl bg-surface-light border-2 border-dashed border-cb-border flex items-center justify-center">
              <Dumbbell size={24} className="text-cb-muted opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium text-cb-secondary">No exercises yet</p>
              <p className="text-xs text-cb-muted mt-1">Search for an exercise above, or type a name and press Enter to add it quickly.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-cb-muted bg-surface-light border border-cb-border rounded-lg px-3 py-1.5">
              <span>↑</span> Use the search bar above to get started
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {groups.map((group) => {
              if (group.supersetId) {
                // Superset group
                return (
                  <div key={group.supersetId} className="mb-3">
                    {/* Superset header bar */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{group.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-brand">Superset</span>
                        <span className="text-xs text-cb-muted">({group.exercises.length} exercises)</span>
                      </div>
                      <div className="h-px flex-1 bg-brand/20" />
                    </div>
                    {/* Exercises in superset */}
                    <div className="space-y-0.5">
                      {group.exercises.map((ex) => {
                        const flatIdx = flatIndexMap.get(ex.uid) ?? 0
                        return (
                          <ExerciseBlock
                            key={ex.uid}
                            ex={ex}
                            supersetLabel={group.label}
                            isDragOver={dragOverIdx === flatIdx}
                            canLink={false}
                            onUpdate={(updated) => updateExercise(flatIdx, updated)}
                            onDelete={() => deleteExercise(flatIdx)}
                            onDuplicate={() => duplicateExercise(flatIdx)}
                            onLink={() => {}}
                            onUnlink={() => unlinkExercise(flatIdx)}
                            dragHandleProps={{
                              draggable: true,
                              onDragStart: () => setDragIdx(flatIdx),
                              onDragOver:  (e: React.DragEvent) => { e.preventDefault(); setDragOverIdx(flatIdx) },
                              onDrop:      () => handleDrop(flatIdx),
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              }

              // Single exercise
              const ex       = group.exercises[0]
              const flatIdx  = flatIndexMap.get(ex.uid) ?? 0
              const nextExId = exercises[flatIdx + 1]?.uid
              const canLink  = nextExId != null && !exercises[flatIdx + 1]?.supersetId

              return (
                <div key={ex.uid} className="mb-1.5">
                  <ExerciseBlock
                    ex={ex}
                    supersetLabel={null}
                    isDragOver={dragOverIdx === flatIdx}
                    canLink={canLink}
                    onUpdate={(updated) => updateExercise(flatIdx, updated)}
                    onDelete={() => deleteExercise(flatIdx)}
                    onDuplicate={() => duplicateExercise(flatIdx)}
                    onLink={() => linkExercises(flatIdx)}
                    onUnlink={() => unlinkExercise(flatIdx)}
                    dragHandleProps={{
                      draggable: true,
                      onDragStart: () => setDragIdx(flatIdx),
                      onDragOver:  (e: React.DragEvent) => { e.preventDefault(); setDragOverIdx(flatIdx) },
                      onDrop:      () => handleDrop(flatIdx),
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Copy modal */}
      {showCopy && (
        <CopyWorkoutModal
          draft={draft}
          fromWeek={week}
          fromDay={day}
          onCopy={(targets) => {
            targets.forEach(({ week: tw, day: td }) => {
              const key   = cellKey(tw, td)
              const clone = draft.grid[key] ?? makeCell(tw, td)
              onUpdateCell({ ...clone, exercises: cell.exercises.map((e) => ({ ...e, uid: genUid() })) })
            })
          }}
          onClose={() => setShowCopy(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProgramGrid (weekly grid)
// ─────────────────────────────────────────────────────────────

function ProgramGrid({
  draft,
  selectedCell,
  compact,
  onSelectCell,
  onUpdateCell,
}: {
  draft:         ProgramDraft
  selectedCell:  { week: number; day: number } | null
  compact:       boolean
  onSelectCell:  (week: number, day: number) => void
  onUpdateCell:  (week: number, day: number, cell: WorkoutCell) => void
}) {
  const { filled, total, pct } = calcProgress(draft)
  const activeGoal  = goalCfg(draft.goal)
  const activeDiff  = diffCfg(draft.difficulty)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Progress bar */}
      {!compact && (
        <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 border-b border-cb-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-cb-secondary">Progress</span>
            <div className="w-32 h-2 bg-surface-light rounded-full overflow-hidden border border-cb-border">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-cb-muted">{filled}/{total} days  ({pct}%)</span>
          </div>
          {/* Program notes */}
        </div>
      )}

      {/* Grid scroll area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: compact ? 280 : 700 }}>
          <thead>
            <tr className="bg-surface border-b border-cb-border">
              <th className="py-2.5 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-cb-muted w-14">
                Week
              </th>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <th key={d} className={clsx('py-2.5 text-[10px] font-semibold uppercase tracking-wider text-cb-muted', compact ? 'px-1 text-center' : 'px-2 text-center')}>
                  {compact ? DAYS[d - 1].slice(0, 1) : DAYS[d - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: draft.durationWeeks }, (_, wi) => wi + 1).map((week) => (
              <tr key={week} className="border-b border-cb-border/50">
                <td className="py-1.5 px-3 text-xs font-semibold text-cb-muted bg-surface">
                  W{week}
                </td>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const key      = cellKey(week, day)
                  const cell     = draft.grid[key]
                  const isRest   = cell?.isRest ?? false
                  const exCount  = cell?.exercises.length ?? 0
                  const hasEx    = exCount > 0
                  const isSelected = selectedCell?.week === week && selectedCell?.day === day

                  return (
                    <td key={day} className={clsx('p-1', compact ? 'w-8' : 'min-w-[90px]')}>
                      {compact ? (
                        // Compact dot view
                        <button
                          onClick={() => onSelectCell(week, day)}
                          className={clsx(
                            'w-full h-7 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all',
                            isSelected  && 'ring-2 ring-brand',
                            isRest      ? 'bg-surface-light text-cb-muted'
                              : hasEx   ? 'bg-brand/15 text-brand border border-brand/30'
                                        : 'bg-surface border border-cb-border text-cb-muted hover:border-brand/40'
                          )}
                          title={cell?.name}
                        >
                          {isRest ? '–' : hasEx ? exCount : '+'}
                        </button>
                      ) : (
                        // Full card view
                        <button
                          onClick={() => onSelectCell(week, day)}
                          className={clsx(
                            'w-full rounded-lg border transition-all text-left overflow-hidden group',
                            isSelected  ? 'border-brand ring-2 ring-brand/30 bg-brand-bg'
                              : isRest  ? 'border-cb-border/50 bg-surface-light cursor-default opacity-70'
                              : hasEx   ? 'border-cb-border hover:border-brand/50 bg-surface hover:shadow-sm'
                                        : 'border-dashed border-cb-border hover:border-brand/50 bg-surface'
                          )}
                          style={{ minHeight: 72 }}
                        >
                          {isRest ? (
                            <div className="flex flex-col items-center justify-center h-full py-4 gap-1">
                              <Moon size={14} className="text-cb-muted" />
                              <span className="text-[10px] font-medium text-cb-muted uppercase tracking-wider">REST</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); const c = draft.grid[key] ?? makeCell(week, day); onUpdateCell(week, day, { ...c, isRest: false }) }}
                                className="text-[9px] text-cb-muted hover:text-brand mt-0.5 hidden group-hover:block"
                              >
                                + Add workout
                              </button>
                            </div>
                          ) : hasEx ? (
                            <div className="p-2">
                              <p className="text-[10px] font-semibold text-cb-text truncate mb-1 leading-tight">
                                {cell?.name ?? `${DAYS[day - 1]} - Session`}
                              </p>
                              <p className="text-[9px] text-cb-muted">
                                {exCount} exercise{exCount !== 1 ? 's' : ''}
                              </p>
                              <p className="text-[9px] text-cb-muted">
                                {cell?.exercises.reduce((a, e) => a + e.sets, 0)} sets
                              </p>
                              {isSelected && (
                                <div className="mt-1.5 flex flex-wrap gap-0.5">
                                  {cell?.exercises.slice(0, 3).map((e) => (
                                    <span key={e.uid} className="text-[8px] px-1 py-0.5 bg-brand/10 text-brand rounded truncate max-w-[60px]">{e.name.split(' ')[0]}</span>
                                  ))}
                                  {(exCount > 3) && <span className="text-[8px] text-cb-muted">+{exCount - 3}</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-4 gap-1 opacity-40 group-hover:opacity-80 transition-opacity">
                              <Plus size={14} className="text-cb-muted" />
                              <span className="text-[9px] text-cb-muted">Add workout</span>
                            </div>
                          )}
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ProgramBuilderTab (main export)
// ─────────────────────────────────────────────────────────────

export default function ProgramBuilderTab() {
  // View state
  const [view,         setView]         = useState<'list' | 'builder'>('list')
  const [draft,        setDraft]        = useState<ProgramDraft | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ week: number; day: number } | null>(null)

  // List state
  const [programs,   setPrograms]   = useState<{ id: string; name: string; goal: ProgramGoal; difficulty: ProgramDifficulty; status: string; duration_weeks: number; days_per_week: number; client?: { name: string | null } }[]>([])
  const [clients,    setClients]    = useState<ClientOpt[]>([])
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState(false)

  // Modal state
  const [showCreate,    setShowCreate]    = useState(false)
  const [showAIWizard,  setShowAIWizard]  = useState(false)
  const [showAssign,    setShowAssign]    = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saveMsg,       setSaveMsg]       = useState<string | null>(null)

  // Notes panel
  const [showNotes, setShowNotes] = useState(false)

  // ── Load data ─────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [clientRes, programRes] = await Promise.all([
        supabase.from('profiles').select('id, name, email').eq('coach_id', user.id).eq('role', 'client'),
        supabase.from('programs').select('id, name, goal, difficulty, status, duration_weeks, days_per_week, client:profiles!programs_client_id_fkey(name)').eq('coach_id', user.id).order('updated_at', { ascending: false }),
      ])
      setClients(clientRes.data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPrograms((programRes.data ?? []).map((p: any) => ({ ...p, client: Array.isArray(p.client) ? p.client[0] : p.client })) as typeof programs)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Draft helpers ─────────────────────────────────────────

  function updateCell(week: number, day: number, cell: WorkoutCell) {
    if (!draft) return
    setDraft((d) => d ? ({ ...d, grid: { ...d.grid, [cellKey(week, day)]: cell } }) : d)
  }

  function updateSelectedCell(cell: WorkoutCell) {
    if (!selectedCell) return
    updateCell(selectedCell.week, selectedCell.day, cell)
  }

  function openProgram(p: typeof programs[0]) {
    const durationWeeks = p.duration_weeks || 4
    const daysPerWeek = p.days_per_week || 4
    const grid: Record<string, WorkoutCell> = {}
    for (let w = 1; w <= durationWeeks; w++) {
      for (let d = 1; d <= 7; d++) {
        grid[cellKey(w, d)] = makeCell(w, d)
        if (d > daysPerWeek) grid[cellKey(w, d)].isRest = true
      }
    }
    setDraft({
      id: p.id, name: p.name, goal: p.goal, difficulty: p.difficulty,
      durationWeeks, daysPerWeek, clientId: null, programNotes: '', grid,
    })
    setView('builder')
  }

  // ── Save ──────────────────────────────────────────────────

  async function handleSave(status: 'draft' | 'active' = 'draft') {
    if (!draft) return
    setSaving(true)
    try {
      const supabase = createClient()
      const body = {
        name:           draft.name,
        goal:           draft.goal,
        difficulty:     draft.difficulty,
        duration_weeks: draft.durationWeeks,
        days_per_week:  draft.daysPerWeek,
        client_id:      draft.clientId,
        notes:          draft.programNotes,
        status,
      }
      if (draft.id) {
        await supabase.from('programs').update(body).eq('id', draft.id)
      } else {
        const { data } = await supabase.from('programs').insert({ ...body, coach_id: (await supabase.auth.getUser()).data.user?.id }).select().single()
        if (data) setDraft((d) => d ? { ...d, id: data.id } : d)
      }
      setSaveMsg(status === 'active' ? 'Published!' : 'Saved')
      setTimeout(() => setSaveMsg(null), 2000)
      loadData()
    } catch { setSaveMsg('Error saving') }
    finally { setSaving(false) }
  }

  async function handleAssign(clientId: string) {
    if (!draft?.id) { setDraft((d) => d ? { ...d, clientId } : d); return }
    try {
      await fetch(`/api/programs/${draft.id}/assign/${clientId}`, { method: 'POST' })
      setDraft((d) => d ? { ...d, clientId } : d)
      setSaveMsg('Assigned & activated!')
      setTimeout(() => setSaveMsg(null), 2000)
    } catch {
      setSaveMsg('Error assigning client')
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  // ── AI wizard save handler ────────────────────────────────

  async function handleAISave(prog: { name: string; goal: string | null; weeks: number; days_per_week: number; client_id: string }, aiDays: { day_number: number; name: string; exercises: { id: string; name: string; muscle_group: string }[] }[]) {
    setShowAIWizard(false)
    // Build a draft from the AI-generated content
    const goal = (prog.goal ?? 'hypertrophy') as ProgramGoal
    const grid: Record<string, WorkoutCell> = {}
    for (let w = 1; w <= prog.weeks; w++) {
      for (let d = 1; d <= 7; d++) {
        const aiDay = aiDays[d - 1]
        if (aiDay) {
          grid[cellKey(w, d)] = {
            uid: genUid(),
            name: aiDay.name,
            sessionNotes: '',
            isRest: false,
            exercises: aiDay.exercises.map((ex) => makeExercise(ex)),
          }
        } else {
          const cell = makeCell(w, d)
          cell.isRest = true
          grid[cellKey(w, d)] = cell
        }
      }
    }
    setDraft({
      id: null,
      name: prog.name,
      goal,
      difficulty: 'intermediate',
      durationWeeks: prog.weeks,
      daysPerWeek: prog.days_per_week,
      clientId: prog.client_id || null,
      programNotes: '',
      grid,
    })
    setView('builder')
  }

  // ── Render ────────────────────────────────────────────────

  const activeGoal  = draft ? goalCfg(draft.goal)       : null
  const activeDiff  = draft ? diffCfg(draft.difficulty) : null
  const progress    = draft ? calcProgress(draft)        : null

  const selectedCellData = selectedCell && draft
    ? (draft.grid[cellKey(selectedCell.week, selectedCell.day)] ?? makeCell(selectedCell.week, selectedCell.day))
    : null

  // Program list
  if (view === 'list') {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-cb-text">Training Programs</h1>
            <p className="text-sm text-cb-muted mt-0.5">Build and assign programs to your clients</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIWizard(true)}
              className="flex items-center gap-2 px-4 py-2 border border-brand/40 text-brand hover:bg-brand/10 rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles size={15} /> AI Generate
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} /> New Program
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-brand animate-spin" />
          </div>
        ) : loadError ? (
          <div className="bg-surface border border-cb-border rounded-2xl p-10 text-center">
            <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
            <p className="text-sm font-medium text-cb-text mb-1">Failed to load programs</p>
            <p className="text-xs text-cb-muted mb-4">Check your connection and try again</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-surface border border-dashed border-cb-border rounded-2xl p-16 text-center">
            <LayoutGrid size={40} className="mx-auto text-cb-muted mb-3 opacity-30" />
            <p className="text-sm font-medium text-cb-text mb-1">No programs yet</p>
            <p className="text-xs text-cb-muted mb-4">Create your first training program and assign it to a client</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium"
            >
              <Plus size={14} /> Create Program
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {programs.map((p) => {
              const gc = goalCfg(p.goal)
              const dc = diffCfg(p.difficulty)
              return (
                <button
                  key={p.id}
                  onClick={() => openProgram(p)}
                  className="bg-surface border border-cb-border rounded-xl overflow-hidden hover:border-brand/40 hover:shadow-md transition-all text-left group"
                >
                  <div className="h-2" style={{ backgroundColor: gc.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-cb-text group-hover:text-brand transition-colors leading-snug">{p.name}</p>
                      <span className="text-lg flex-shrink-0">{gc.emoji}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${gc.color}15`, color: gc.color }}>
                        {gc.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${dc.color}15`, color: dc.color }}>
                        {dc.label}
                      </span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                        p.status === 'active' ? 'bg-success/10 text-success' : 'bg-surface-light text-cb-muted'
                      )}>
                        {p.status}
                      </span>
                    </div>
                    {p.client?.name && (
                      <div className="flex items-center gap-1.5 text-xs text-cb-muted">
                        <Users size={11} />
                        <span className="truncate">{p.client.name}</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {showCreate && (
          <CreateProgramModal
            clients={clients}
            onClose={() => setShowCreate(false)}
            onCreate={(d) => { setDraft(d); setView('builder') }}
          />
        )}

        {showAIWizard && (
          <AIWorkoutWizard
            clients={clients}
            onClose={() => setShowAIWizard(false)}
            onSave={(prog, days) => handleAISave(
              { name: prog.name, goal: prog.goal, weeks: prog.weeks, days_per_week: prog.days_per_week, client_id: prog.client_id },
              days.map((d) => ({ day_number: d.day_number, name: d.name, exercises: d.exercises.map((e) => ({ id: e.id, name: e.name, muscle_group: e.muscle_group })) }))
            )}
          />
        )}
      </div>
    )
  }

  // Program builder
  if (!draft) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Builder header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-cb-border bg-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('list'); setSelectedCell(null) }}
            className="flex items-center gap-1.5 text-sm text-cb-secondary hover:text-cb-text transition-colors"
          >
            <ChevronLeft size={16} /> Programs
          </button>

          <div className="w-px h-4 bg-cb-border" />

          {/* Program name */}
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => d ? { ...d, name: e.target.value } : d)}
            className="text-sm font-semibold text-cb-text bg-transparent focus:outline-none focus:ring-0 min-w-0 flex-1"
            placeholder="Program name…"
          />

          {/* Meta pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${activeGoal!.color}15`, color: activeGoal!.color }}>
              {activeGoal!.emoji} {activeGoal!.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${activeDiff!.color}15`, color: activeDiff!.color }}>
              {activeDiff!.label}
            </span>
            <span className="text-xs text-cb-muted">{draft.durationWeeks}w · {draft.daysPerWeek}d/w</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-20 h-1.5 bg-surface-light rounded-full border border-cb-border overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progress!.pct}%` }} />
            </div>
            <span className="text-xs text-cb-muted whitespace-nowrap">{progress!.pct}% built</span>
          </div>

          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={clsx('p-1.5 rounded-lg border transition-colors text-xs', showNotes ? 'bg-brand-bg border-brand/30 text-brand' : 'border-cb-border text-cb-muted hover:bg-surface-light')}
            title="Program notes"
          >
            <BookOpen size={14} />
          </button>

          {/* Save msg */}
          {saveMsg && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check size={13} /> {saveMsg}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-cb-border rounded-lg text-cb-secondary hover:bg-surface-light transition-colors"
            >
              <Users size={13} /> Assign
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-cb-border rounded-lg text-cb-secondary hover:bg-surface-light transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={13} />} Save Draft
            </button>
            <button
              onClick={() => handleSave('active')}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand hover:bg-brand/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Zap size={13} />} Publish
            </button>
          </div>
        </div>

        {/* Program notes */}
        {showNotes && (
          <div className="mt-2">
            <textarea
              value={draft.programNotes}
              onChange={(e) => setDraft((d) => d ? { ...d, programNotes: e.target.value } : d)}
              placeholder="Program notes — warm-up protocol, weekly focus, coaching context…"
              rows={2}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>
        )}
      </div>

      {/* Progress stepper */}
      <div className="flex-shrink-0 flex items-center justify-center gap-0 px-5 py-2.5 bg-surface-light border-b border-cb-border">
        {[
          { step: 1, label: 'Program Details', done: true },
          { step: 2, label: 'Build Workouts',  done: false, active: true },
          { step: 3, label: 'Assign & Publish', done: false },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-center gap-0">
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors',
              s.active ? 'bg-brand/10 text-brand' : s.done ? 'text-brand' : 'text-cb-muted'
            )}>
              <div className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                s.done ? 'bg-brand text-white' : s.active ? 'border-2 border-brand text-brand' : 'border-2 border-cb-border text-cb-muted'
              )}>
                {s.done ? <Check size={10} /> : s.step}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={clsx('w-8 h-px mx-1', s.done ? 'bg-brand' : 'bg-cb-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Main content: grid + optional workout editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid panel */}
        <div className={clsx('flex flex-col overflow-hidden transition-all', selectedCell ? 'w-80 flex-shrink-0 border-r border-cb-border' : 'flex-1')}>
          <ProgramGrid
            draft={draft}
            selectedCell={selectedCell}
            compact={!!selectedCell}
            onSelectCell={(w, d) => {
              if (!draft.grid[cellKey(w, d)]) {
                setDraft((prev) => prev ? ({ ...prev, grid: { ...prev.grid, [cellKey(w, d)]: makeCell(w, d) } }) : prev)
              }
              setSelectedCell((s) => s?.week === w && s.day === d ? null : { week: w, day: d })
            }}
            onUpdateCell={updateCell}
          />
        </div>

        {/* Workout editor panel */}
        {selectedCell && selectedCellData && (
          <div className="flex-1 overflow-hidden">
            <WorkoutEditor
              cell={selectedCellData}
              week={selectedCell.week}
              day={selectedCell.day}
              draft={draft}
              onUpdateCell={updateSelectedCell}
              onClose={() => setSelectedCell(null)}
              onCopyWorkout={() => {}}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssign && (
        <AssignClientModal
          clients={clients}
          currentClientId={draft.clientId}
          onAssign={handleAssign}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  )
}
