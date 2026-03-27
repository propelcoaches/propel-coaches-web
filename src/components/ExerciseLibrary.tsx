'use client'

import { useEffect, useState } from 'react'
import {
  Search, X, Plus, Star, Loader2, Dumbbell,
  Film, Info, ExternalLink, Activity,
} from 'lucide-react'
import clsx from 'clsx'
import { ExerciseV2 } from '@/lib/types'
import { EXERCISES, Exercise } from '@/lib/exercises'

// ── Helpers ────────────────────────────────────────────────────

function localToV2(ex: Exercise): ExerciseV2 {
  const categoryMap: Record<string, ExerciseV2['category']> = {
    Chest: 'push', Shoulders: 'push', Triceps: 'push',
    Back: 'pull', Biceps: 'pull',
    Legs: 'legs', Glutes: 'legs',
    Core: 'core', Cardio: 'cardio', 'Full Body': 'full_body',
  }
  const compoundPatterns = [
    'Hip Hinge', 'Knee Dominant', 'Horizontal Push', 'Vertical Push',
    'Horizontal Pull', 'Vertical Pull', 'Olympic Lift', 'Locomotion',
  ]
  const isCardio = ex.muscle_group === 'Cardio'
  const isCompound = compoundPatterns.some((p) => ex.movement_pattern.includes(p))
  return {
    id: ex.id,
    name: ex.name,
    muscle_groups: [ex.muscle_group],
    category: categoryMap[ex.muscle_group] ?? 'full_body',
    equipment: [ex.equipment],
    movement_type: isCardio ? 'cardio' : isCompound ? 'compound' : 'isolation',
    demo_video_url: null,
    demo_image_url: null,
    instructions: null,
    created_by: null,
    is_system: true,
    created_at: '',
  }
}

const CATEGORY_CONFIG: Record<string, {
  label: string; color: string; bg: string; emoji: string
}> = {
  push:      { label: 'Push',      color: '#3B82F6', bg: 'rgba(59,130,246,0.09)',  emoji: '💪' },
  pull:      { label: 'Pull',      color: '#10B981', bg: 'rgba(16,185,129,0.09)',  emoji: '🏋️' },
  legs:      { label: 'Legs',      color: '#F97316', bg: 'rgba(249,115,22,0.09)',  emoji: '🦵' },
  core:      { label: 'Core',      color: '#EAB308', bg: 'rgba(234,179,8,0.09)',   emoji: '🎯' },
  cardio:    { label: 'Cardio',    color: '#EF4444', bg: 'rgba(239,68,68,0.09)',   emoji: '❤️' },
  full_body: { label: 'Full Body', color: '#A855F7', bg: 'rgba(168,85,247,0.09)', emoji: '⚡' },
}

const EQUIPMENT_ALL = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine',
  'Bodyweight', 'Kettlebell', 'Resistance Band', 'Cardio',
]

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null
}

// ── Exercise Detail Modal ──────────────────────────────────────

function ExerciseDetailModal({
  exercise, isFavourite, onToggleFavourite, onClose,
}: {
  exercise: ExerciseV2
  isFavourite: boolean
  onToggleFavourite: () => void
  onClose: () => void
}) {
  const cfg = CATEGORY_CONFIG[exercise.category] ?? CATEGORY_CONFIG.full_body
  const embedUrl = exercise.demo_video_url ? youtubeEmbed(exercise.demo_video_url) : null

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 rounded-t-2xl relative" style={{ background: `linear-gradient(135deg, ${cfg.bg}, transparent)` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{cfg.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                {exercise.is_system
                  ? <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-light text-cb-muted border border-cb-border">System</span>
                  : <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-bg text-brand border border-brand/30">Custom</span>
                }
              </div>
              <h2 className="text-xl font-bold text-cb-text">{exercise.name}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onToggleFavourite}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  isFavourite
                    ? 'text-yellow-500 bg-yellow-500/10'
                    : 'text-cb-muted hover:text-yellow-500 hover:bg-yellow-500/10'
                )}
                title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Star size={18} fill={isFavourite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            {exercise.muscle_groups.map((mg) => (
              <span key={mg} className="px-2.5 py-1 bg-surface-light text-cb-secondary text-xs rounded-full font-medium border border-cb-border">
                {mg}
              </span>
            ))}
            {exercise.equipment.map((eq) => (
              <span key={eq} className="px-2.5 py-1 bg-brand-bg text-brand text-xs rounded-full font-medium border border-brand/20">
                {eq}
              </span>
            ))}
            <span className={clsx(
              'px-2.5 py-1 text-xs rounded-full font-medium border',
              exercise.movement_type === 'compound'
                ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                : exercise.movement_type === 'isolation'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  : 'bg-red-500/10 text-red-600 border-red-500/20'
            )}>
              {exercise.movement_type.charAt(0).toUpperCase() + exercise.movement_type.slice(1)}
            </span>
          </div>

          {/* Video */}
          <div>
            <h3 className="text-sm font-semibold text-cb-text mb-2.5 flex items-center gap-1.5">
              <Film size={14} className="text-cb-muted" /> Demo Video
            </h3>
            {embedUrl ? (
              <div className="rounded-xl overflow-hidden aspect-video bg-surface-light">
                <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={`${exercise.name} demo`} />
              </div>
            ) : exercise.demo_video_url ? (
              <a
                href={exercise.demo_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
              >
                <ExternalLink size={14} /> Watch Demo
              </a>
            ) : (
              <div className="bg-surface-light border border-cb-border rounded-xl aspect-video flex flex-col items-center justify-center gap-2 text-cb-muted">
                <Film size={32} className="opacity-20" />
                <p className="text-xs">No demo video attached</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-cb-text mb-2.5 flex items-center gap-1.5">
              <Info size={14} className="text-cb-muted" /> Instructions & Coaching Cues
            </h3>
            {exercise.instructions ? (
              <p className="text-sm text-cb-secondary leading-relaxed whitespace-pre-line">{exercise.instructions}</p>
            ) : (
              <div className="bg-surface-light border border-cb-border rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-cb-secondary uppercase tracking-wider">General Cues</p>
                <ul className="space-y-1.5 text-sm text-cb-secondary">
                  {[
                    'Maintain a neutral spine throughout the movement',
                    'Control the eccentric (lowering) phase — don\'t rush it',
                    'Initiate the movement from the target muscle group',
                    'Breathe out on the concentric (exertion) phase',
                    'Keep consistent form before increasing load',
                  ].map((cue) => (
                    <li key={cue} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-cb-muted mt-2 flex-shrink-0" />
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Muscles worked */}
          <div>
            <h3 className="text-sm font-semibold text-cb-text mb-2.5 flex items-center gap-1.5">
              <Activity size={14} className="text-cb-muted" /> Muscles Worked
            </h3>
            <div className="flex flex-wrap gap-2">
              {exercise.muscle_groups.map((mg, i) => (
                <div
                  key={mg}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border',
                    i === 0
                      ? 'border-brand/30 bg-brand-bg text-brand'
                      : 'border-cb-border bg-surface-light text-cb-secondary'
                  )}
                >
                  <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', i === 0 ? 'bg-brand' : 'bg-cb-muted')} />
                  {mg}
                  <span className={clsx('text-xs', i === 0 ? 'text-brand/60' : 'text-cb-muted')}>
                    {i === 0 ? 'Primary' : 'Secondary'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add Custom Exercise Modal ─────────────────────────────────

function AddCustomExerciseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (ex: ExerciseV2) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('push')
  const [muscleGroups, setMuscleGroups] = useState<string[]>([])
  const [equipment, setEquipment] = useState<string[]>([])
  const [movementType, setMovementType] = useState('compound')
  const [instructions, setInstructions] = useState('')
  const [demoVideoUrl, setDemoVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MUSCLE_OPTS = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Legs', 'Glutes', 'Core', 'Full Body',
  ]

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Exercise name is required'); return }
    if (muscleGroups.length === 0) { setError('Select at least one muscle group'); return }
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          muscle_groups: muscleGroups,
          equipment,
          movement_type: movementType,
          instructions: instructions.trim() || null,
          demo_video_url: demoVideoUrl.trim() || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save')
        setSaving(false)
        return
      }
      const d = await res.json()
      onAdd(d.exercise)
      onClose()
    } catch {
      // Demo / network fallback — add locally
      onAdd({
        id: crypto.randomUUID(),
        name: name.trim(),
        category: category as ExerciseV2['category'],
        muscle_groups: muscleGroups,
        equipment,
        movement_type: movementType as ExerciseV2['movement_type'],
        instructions: instructions.trim() || null,
        demo_video_url: demoVideoUrl.trim() || null,
        demo_image_url: null,
        created_by: 'local',
        is_system: false,
        created_at: new Date().toISOString(),
      })
      onClose()
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30'
  const pillBase = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer'

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <div>
            <h2 className="text-base font-semibold text-cb-text">Add Custom Exercise</h2>
            <p className="text-xs text-cb-muted mt-0.5">Saved to your exercise library</p>
          </div>
          <button onClick={onClose} className="p-1 text-cb-muted hover:text-cb-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-cb-secondary mb-1">Exercise Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paused Bulgarian Split Squat"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.emoji} {cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-secondary mb-1">Movement Type *</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className={inputCls}
              >
                <option value="compound">Compound</option>
                <option value="isolation">Isolation</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-cb-secondary mb-2">Muscle Groups *</label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_OPTS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMuscleGroups(toggle(muscleGroups, m))}
                  className={clsx(
                    pillBase,
                    muscleGroups.includes(m)
                      ? 'bg-brand-bg border-brand/40 text-brand'
                      : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand/30'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-cb-secondary mb-2">Equipment</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_ALL.map((eq) => (
                <button
                  type="button"
                  key={eq}
                  onClick={() => setEquipment(toggle(equipment, eq))}
                  className={clsx(
                    pillBase,
                    equipment.includes(eq)
                      ? 'bg-brand-bg border-brand/40 text-brand'
                      : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand/30'
                  )}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-cb-secondary mb-1">Demo Video URL</label>
            <input
              type="url"
              value={demoVideoUrl}
              onChange={(e) => setDemoVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className={inputCls}
            />
            <p className="text-[10px] text-cb-muted mt-1">YouTube links will be embedded automatically</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-cb-secondary mb-1">Instructions & Coaching Cues</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step execution, key cues, common mistakes to avoid…"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-cb-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-cb-secondary border border-cb-border hover:bg-surface-light rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-brand hover:bg-brand/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Saving…' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main ExerciseLibrary component ────────────────────────────

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<ExerciseV2[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [equipFilter, setEquipFilter] = useState('all')
  const [movementFilter, setMovementFilter] = useState('all')
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [selected, setSelected] = useState<ExerciseV2 | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [favourites, setFavourites] = useState<Set<string>>(new Set())

  // Load favourites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cb_exercise_favourites')
      if (stored) setFavourites(new Set(JSON.parse(stored) as string[]))
    } catch { /* ignore */ }
  }, [])

  // Load exercises
  useEffect(() => {
    fetch('/api/exercises')
      .then((r) => r.json())
      .then((d) => { setExercises(d.exercises ?? []); setLoading(false) })
      .catch(() => { setExercises(EXERCISES.map(localToV2)); setLoading(false) })
  }, [])

  function toggleFavourite(id: string) {
    setFavourites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('cb_exercise_favourites', JSON.stringify(Array.from(next)))
      return next
    })
  }

  function handleAdd(ex: ExerciseV2) {
    setExercises((prev) => [ex, ...prev])
  }

  const filtered = exercises.filter((ex) => {
    if (showFavsOnly && !favourites.has(ex.id)) return false
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && ex.category !== categoryFilter) return false
    if (equipFilter !== 'all' && !ex.equipment.some((e) => e.toLowerCase() === equipFilter.toLowerCase())) return false
    if (movementFilter !== 'all' && ex.movement_type !== movementFilter) return false
    return true
  })

  const customCount = exercises.filter((e) => !e.is_system).length
  const favCount    = exercises.filter((e) => favourites.has(e.id)).length

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* ── Sticky header + filters ─────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-cb-border bg-surface sticky top-0 z-10 space-y-3">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-cb-text">Exercise Library</h2>
              <p className="text-xs text-cb-muted">
                {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
                {exercises.length !== filtered.length ? ` of ${exercises.length}` : ''}
                {customCount > 0 && ` · ${customCount} custom`}
                {favCount > 0 && ` · ${favCount} starred`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Add Custom Exercise
          </button>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-cb-muted hover:text-cb-text">
                <X size={12} />
              </button>
            )}
          </div>

          <select
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
            className="px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">All movement types</option>
            <option value="compound">Compound</option>
            <option value="isolation">Isolation</option>
            <option value="cardio">Cardio</option>
          </select>

          <button
            onClick={() => setShowFavsOnly((v) => !v)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors whitespace-nowrap',
              showFavsOnly
                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-600'
                : 'bg-surface-light border-cb-border text-cb-secondary hover:border-cb-text/30'
            )}
          >
            <Star size={14} fill={showFavsOnly ? 'currentColor' : 'none'} />
            Favourites {favCount > 0 && `(${favCount})`}
          </button>

          {(search || categoryFilter !== 'all' || equipFilter !== 'all' || movementFilter !== 'all' || showFavsOnly) && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setEquipFilter('all'); setMovementFilter('all'); setShowFavsOnly(false) }}
              className="text-xs text-cb-muted hover:text-danger transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              categoryFilter === 'all'
                ? 'bg-cb-text text-surface border-cb-text'
                : 'bg-surface-light border-cb-border text-cb-secondary hover:border-cb-text/30'
            )}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([val, cfg]) => {
            const active = categoryFilter === val
            return (
              <button
                key={val}
                onClick={() => setCategoryFilter(active ? 'all' : val)}
                style={active ? { backgroundColor: `${cfg.color}18`, borderColor: `${cfg.color}60`, color: cfg.color } : {}}
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  !active && 'bg-surface-light border-cb-border text-cb-secondary hover:border-cb-text/30'
                )}
              >
                {cfg.emoji} {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Equipment pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-cb-muted">Equipment:</span>
          <button
            onClick={() => setEquipFilter('all')}
            className={clsx(
              'px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors',
              equipFilter === 'all' ? 'bg-brand text-white' : 'bg-surface-light text-cb-secondary hover:bg-cb-border'
            )}
          >
            All
          </button>
          {EQUIPMENT_ALL.map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipFilter(equipFilter === eq ? 'all' : eq)}
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors',
                equipFilter === eq ? 'bg-brand text-white' : 'bg-surface-light text-cb-secondary hover:bg-cb-border'
              )}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-brand animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Dumbbell size={40} className="mx-auto text-cb-muted mb-3 opacity-30" />
            <p className="text-sm text-cb-muted mb-1">No exercises found{search ? ` matching "${search}"` : ''}</p>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setEquipFilter('all'); setMovementFilter('all'); setShowFavsOnly(false) }}
              className="text-xs text-brand hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filtered.map((ex) => {
              const cfg    = CATEGORY_CONFIG[ex.category] ?? CATEGORY_CONFIG.full_body
              const isFav  = favourites.has(ex.id)
              const isCustom = !ex.is_system

              return (
                <div
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className="bg-surface border border-cb-border rounded-xl overflow-hidden hover:border-brand/40 hover:shadow-md transition-all cursor-pointer group relative"
                >
                  {/* Favourite star — shows on hover or when active */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavourite(ex.id) }}
                    className={clsx(
                      'absolute top-2 right-2 p-1 rounded-md z-10 transition-all',
                      isFav
                        ? 'text-yellow-500 opacity-100'
                        : 'text-cb-muted opacity-0 group-hover:opacity-100 hover:!text-yellow-500'
                    )}
                    title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  >
                    <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
                  </button>

                  {/* Colour-coded category header */}
                  <div
                    className="h-16 flex flex-col items-center justify-center gap-0.5"
                    style={{ background: `linear-gradient(135deg, ${cfg.bg}, transparent)` }}
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-cb-text leading-snug mb-1.5 pr-4 group-hover:text-brand transition-colors">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-cb-muted mb-2 truncate">
                      {ex.muscle_groups.slice(0, 2).join(' · ')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-bg text-brand border border-brand/20">
                          Custom
                        </span>
                      )}
                      {ex.equipment.slice(0, 1).map((eq) => (
                        <span key={eq} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface-light text-cb-secondary border border-cb-border truncate max-w-[80px]">
                          {eq}
                        </span>
                      ))}
                      <span className={clsx(
                        'px-1.5 py-0.5 rounded text-[9px] font-medium',
                        ex.movement_type === 'compound'
                          ? 'bg-orange-500/10 text-orange-600'
                          : ex.movement_type === 'isolation'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-red-500/10 text-red-600'
                      )}>
                        {ex.movement_type === 'compound' ? 'Cmpd' : ex.movement_type === 'isolation' ? 'Isol' : 'Cardio'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <ExerciseDetailModal
          exercise={selected}
          isFavourite={favourites.has(selected.id)}
          onToggleFavourite={() => toggleFavourite(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Add custom modal */}
      {showAddModal && (
        <AddCustomExerciseModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
