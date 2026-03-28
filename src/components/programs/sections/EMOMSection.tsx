'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function EMOMSection({ section, sport, onChange }: Props) {
  const totalMinutes = section.exercises.length

  function addMinute() {
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

  return (
    <div className="space-y-3">
      {/* EMOM controls */}
      <div className="flex items-center gap-4 p-3 bg-surface-light rounded-xl border border-cb-border">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-cb-muted uppercase tracking-wide">Total time</span>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-cb-text">
            <span className="text-brand text-lg">{totalMinutes}</span>
            <span className="text-cb-muted font-normal">min</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-cb-muted uppercase tracking-wide">Work per minute (s)</span>
          <input
            type="number"
            min={10}
            max={60}
            value={section.workSeconds ?? 40}
            onChange={e => onChange({ ...section, workSeconds: Number(e.target.value) })}
            className="w-20 px-2 py-1 text-sm bg-white dark:bg-surface border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {section.exercises.map((ex, i) => (
        <DynamicExerciseInput
          key={ex.id}
          exercise={ex}
          sport={sport}
          onChange={updated => updateExercise(i, updated)}
          onDelete={() => deleteExercise(i)}
          label={`Min ${i + 1}`}
        />
      ))}

      <button
        type="button"
        onClick={addMinute}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add minute
      </button>
    </div>
  )
}
