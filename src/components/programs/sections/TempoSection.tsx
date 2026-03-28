'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function TempoSection({ section, sport, onChange }: Props) {
  function addExercise() {
    onChange({
      ...section,
      exercises: [
        ...section.exercises,
        {
          id: crypto.randomUUID(),
          exerciseName: '',
          order: section.exercises.length,
          tempo: '3-1-2-0',  // Default rehab tempo
        },
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
      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400">
        Tempo notation: <strong>Eccentric – Pause – Concentric – Pause</strong> (e.g. 3-1-2-0 = 3s lower, 1s pause, 2s lift, 0s pause)
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
        <Plus size={14} /> Add exercise
      </button>
    </div>
  )
}
