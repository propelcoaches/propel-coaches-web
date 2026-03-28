'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function TimedSection({ section, sport, onChange }: Props) {
  function addBlock() {
    onChange({
      ...section,
      exercises: [
        ...section.exercises,
        { id: crypto.randomUUID(), exerciseName: '', order: section.exercises.length },
      ],
    })
  }

  function updateExercise(idx: number, ex: ExerciseBlock) {
    const exercises = [...section.exercises]
    exercises[idx] = ex
    onChange({ ...section, exercises })
  }

  function deleteExercise(idx: number) {
    onChange({ ...section, exercises: section.exercises.filter((_, i) => i !== idx) })
  }

  const totalSecs = section.exercises.reduce((sum, ex) => sum + (ex.durationSeconds ?? 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-3 bg-surface-light rounded-xl border border-cb-border">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-cb-muted uppercase tracking-wide">Session time cap (min)</span>
          <input
            type="number"
            min={1}
            value={section.timeLimitSeconds ? Math.floor(section.timeLimitSeconds / 60) : ''}
            onChange={e => onChange({ ...section, timeLimitSeconds: e.target.value ? Number(e.target.value) * 60 : undefined })}
            placeholder="—"
            className="w-20 px-2 py-1 text-sm bg-white dark:bg-surface border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        {totalSecs > 0 && (
          <div className="text-xs text-cb-muted">
            Blocks total: <strong className="text-cb-text">{Math.round(totalSecs / 60)} min</strong>
          </div>
        )}
      </div>

      {section.exercises.map((ex, i) => (
        <DynamicExerciseInput
          key={ex.id}
          exercise={ex}
          sport={sport}
          onChange={updated => updateExercise(i, updated)}
          onDelete={() => deleteExercise(i)}
          draggable
          label={`Block ${i + 1}`}
        />
      ))}

      <button
        type="button"
        onClick={addBlock}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add block
      </button>
    </div>
  )
}
