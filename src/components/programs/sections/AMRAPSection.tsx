'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function AMRAPSection({ section, sport, onChange }: Props) {
  function addExercise() {
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

  const timeMins = section.timeLimitSeconds ? Math.floor(section.timeLimitSeconds / 60) : 10

  return (
    <div className="space-y-3">
      {/* Time cap */}
      <div className="flex items-center gap-3 p-3 bg-surface-light rounded-xl border border-cb-border">
        <span className="text-xs font-medium text-cb-secondary">Time cap (min)</span>
        <input
          type="number"
          min={1}
          value={timeMins}
          onChange={e => onChange({ ...section, timeLimitSeconds: Number(e.target.value) * 60 })}
          className="w-20 px-2 py-1 text-sm bg-white dark:bg-surface border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <span className="text-xs text-cb-muted">AMRAP — as many rounds as possible</span>
      </div>

      {section.exercises.map((ex, i) => (
        <DynamicExerciseInput
          key={ex.id}
          exercise={ex}
          sport={sport}
          onChange={updated => updateExercise(i, updated)}
          onDelete={() => deleteExercise(i)}
          draggable
        />
      ))}

      <button
        type="button"
        onClick={addExercise}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add movement
      </button>
    </div>
  )
}
