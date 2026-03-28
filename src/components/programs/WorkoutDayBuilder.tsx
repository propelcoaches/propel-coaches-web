'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { Workout, WorkoutSection, SportCategory, WorkoutFormat } from '@/types/workout'
import { getSportConfig, getFormatConfig, SPORT_ACCENT_COLORS, SPORT_ACCENT_BG } from '@/constants/workoutConfigs'
import SportCategoryPicker from './SportCategoryPicker'
import WorkoutFormatPicker from './WorkoutFormatPicker'
import SectionBuilder from './sections/SectionBuilder'
import WorkoutPreview from './WorkoutPreview'

interface Props {
  initial?: Partial<Workout>
  onSave?: (workout: Workout) => void
  onCancel?: () => void
  saving?: boolean
}

export default function WorkoutDayBuilder({ initial, onSave, onCancel, saving }: Props) {
  const [step, setStep] = useState<'sport' | 'build'>(initial?.sportCategory ? 'build' : 'sport')
  const [workout, setWorkout] = useState<Workout>(() => ({
    id: initial?.id ?? crypto.randomUUID(),
    title: initial?.title ?? '',
    sportCategory: initial?.sportCategory ?? 'strength',
    description: initial?.description,
    estimatedDuration: initial?.estimatedDuration,
    sections: initial?.sections ?? [],
    coachNotes: initial?.coachNotes,
  }))
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showFormatPicker, setShowFormatPicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [newSectionFormat, setNewSectionFormat] = useState<WorkoutFormat>(() =>
    getSportConfig(workout.sportCategory).defaultFormat
  )

  function updateWorkout(patch: Partial<Workout>) {
    setWorkout(w => ({ ...w, ...patch }))
  }

  function selectSport(cat: SportCategory) {
    const sportCfg = getSportConfig(cat)
    updateWorkout({ sportCategory: cat })
    setNewSectionFormat(sportCfg.defaultFormat)
  }

  function handleConfirmSport() {
    setStep('build')
    // Add one default section automatically
    if (workout.sections.length === 0) addSection()
  }

  function addSection() {
    const section: WorkoutSection = {
      id: crypto.randomUUID(),
      format: getSportConfig(workout.sportCategory).defaultFormat,
      exercises: [],
      order: workout.sections.length,
    }
    setWorkout(w => ({ ...w, sections: [...w.sections, section] }))
    setShowFormatPicker(false)
  }

  function addSectionWithFormat(format: WorkoutFormat) {
    const section: WorkoutSection = {
      id: crypto.randomUUID(),
      format,
      exercises: [],
      order: workout.sections.length,
    }
    setWorkout(w => ({ ...w, sections: [...w.sections, section] }))
    setNewSectionFormat(format)
    setShowFormatPicker(false)
  }

  function updateSection(idx: number, section: WorkoutSection) {
    const sections = [...workout.sections]
    sections[idx] = section
    updateWorkout({ sections })
  }

  function deleteSection(idx: number) {
    updateWorkout({ sections: workout.sections.filter((_, i) => i !== idx) })
  }

  function moveSectionUp(idx: number) {
    if (idx === 0) return
    const sections = [...workout.sections]
    ;[sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]]
    updateWorkout({ sections: sections.map((s, i) => ({ ...s, order: i })) })
  }

  function moveSectionDown(idx: number) {
    if (idx === workout.sections.length - 1) return
    const sections = [...workout.sections]
    ;[sections[idx], sections[idx + 1]] = [sections[idx + 1], sections[idx]]
    updateWorkout({ sections: sections.map((s, i) => ({ ...s, order: i })) })
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Estimated duration: sum of section timeLimits + exercise durations
  const estimatedMins = Math.ceil(
    workout.sections.reduce((sum, s) => {
      if (s.timeLimitSeconds) return sum + s.timeLimitSeconds / 60
      return sum + s.exercises.reduce((es, ex) => es + (ex.durationSeconds ?? 0) / 60, 0)
    }, 0)
  )

  const accentBorder = SPORT_ACCENT_COLORS[workout.sportCategory]
  const accentBg = SPORT_ACCENT_BG[workout.sportCategory]

  // ── Step 1: Sport selection ────────────────────────────────────────────────
  if (step === 'sport') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-cb-text mb-1">What type of training is this?</h2>
          <p className="text-sm text-cb-muted">Pick a sport category to see the right fields and formats.</p>
        </div>
        <SportCategoryPicker value={workout.sportCategory} onChange={selectSport} />
        <div className="flex items-center justify-between pt-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-sm text-cb-muted hover:text-cb-secondary transition-colors">
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirmSport}
            className="ml-auto px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Workout builder ────────────────────────────────────────────────
  const sportCfg = getSportConfig(workout.sportCategory)

  return (
    <div className={clsx('flex gap-6', showPreview ? 'items-start' : '')}>
    {/* ── Builder column ─────────────────────────────────────────────────── */}
    <div className={clsx('space-y-5', showPreview ? 'flex-1 min-w-0' : 'max-w-3xl mx-auto w-full')}>
      {/* Workout metadata header */}
      <div className={clsx('rounded-xl border-t-4 border bg-surface p-4 space-y-3', accentBorder, 'border-cb-border')}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', accentBg, 'text-cb-text')}>
            {sportCfg.label}
          </span>
          {estimatedMins > 0 && (
            <span className="text-xs text-cb-muted">~{estimatedMins} min</span>
          )}
          <button
            type="button"
            onClick={() => setStep('sport')}
            className="text-xs text-cb-muted hover:text-cb-secondary transition-colors underline underline-offset-2 ml-auto"
          >
            Change sport
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(p => !p)}
            className={clsx(
              'flex items-center gap-1.5 text-xs transition-colors',
              showPreview ? 'text-brand' : 'text-cb-muted hover:text-cb-secondary'
            )}
          >
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
        </div>
        <input
          value={workout.title}
          onChange={e => updateWorkout({ title: e.target.value })}
          placeholder="Workout title…"
          className="w-full text-base font-semibold bg-transparent text-cb-text placeholder-cb-muted focus:outline-none border-b border-transparent focus:border-cb-border transition-colors"
        />
        <textarea
          value={workout.coachNotes ?? ''}
          onChange={e => updateWorkout({ coachNotes: e.target.value || undefined })}
          placeholder="Coach notes (optional)…"
          rows={2}
          className="w-full text-sm bg-transparent text-cb-secondary placeholder-cb-muted focus:outline-none resize-none border-b border-transparent focus:border-cb-border transition-colors"
        />
      </div>

      {/* Sections */}
      {workout.sections.map((section, idx) => {
        const fmtCfg = getFormatConfig(section.format)
        const isCollapsed = collapsed.has(section.id)
        return (
          <div key={section.id} className="rounded-xl border border-cb-border bg-surface overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-light border-b border-cb-border">
              <GripVertical size={14} className="text-cb-muted flex-shrink-0" />
              <input
                value={section.title ?? ''}
                onChange={e => updateSection(idx, { ...section, title: e.target.value || undefined })}
                placeholder={`Section ${idx + 1}`}
                className="flex-1 text-sm font-medium bg-transparent text-cb-text placeholder-cb-muted focus:outline-none"
              />
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand flex-shrink-0">
                {fmtCfg.label}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => moveSectionUp(idx)} disabled={idx === 0}
                  className="p-1 text-cb-muted hover:text-cb-text disabled:opacity-30 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => moveSectionDown(idx)} disabled={idx === workout.sections.length - 1}
                  className="p-1 text-cb-muted hover:text-cb-text disabled:opacity-30 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onClick={() => deleteSection(idx)}
                  className="p-1 text-cb-muted hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
                <button type="button" onClick={() => toggleCollapse(section.id)}
                  className="p-1 text-cb-muted hover:text-cb-text transition-colors">
                  {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>

            {/* Section body */}
            {!isCollapsed && (
              <div className="p-4">
                <SectionBuilder
                  section={section}
                  sport={workout.sportCategory}
                  onChange={updated => updateSection(idx, updated)}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Add section */}
      {showFormatPicker ? (
        <div className="rounded-xl border border-cb-border bg-surface p-4 space-y-3">
          <p className="text-sm font-medium text-cb-secondary">Choose format for new section:</p>
          <WorkoutFormatPicker
            sport={workout.sportCategory}
            value={newSectionFormat}
            onChange={setNewSectionFormat}
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => addSectionWithFormat(newSectionFormat)}
              className="px-4 py-1.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
            >
              Add section
            </button>
            <button
              type="button"
              onClick={() => setShowFormatPicker(false)}
              className="px-4 py-1.5 text-sm text-cb-muted hover:text-cb-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowFormatPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
        >
          <Plus size={15} /> Add section
        </button>
      )}

      {/* Save / Cancel */}
      <div className="flex items-center justify-between pt-2 border-t border-cb-border">
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-cb-muted hover:text-cb-secondary transition-colors">
            Cancel
          </button>
        )}
        {onSave && (
          <button
            type="button"
            onClick={() => onSave(workout)}
            disabled={saving || !workout.title.trim()}
            className="ml-auto px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save Workout
          </button>
        )}
      </div>
    </div>

    {/* ── Preview column (visible when toggled on wide screens) ─────────── */}
    {showPreview && (
      <div className="w-80 flex-shrink-0 sticky top-4">
        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-3">Client Preview</p>
        <WorkoutPreview workout={workout} compact />
      </div>
    )}
    </div>
  )
}
