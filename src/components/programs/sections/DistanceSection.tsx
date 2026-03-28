'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function DistanceSection({ section, sport, onChange }: Props) {
  function addSegment() {
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

  const totalDistance = section.exercises.reduce((sum, ex) => sum + (ex.distanceMeters ?? 0), 0)

  return (
    <div className="space-y-3">
      {totalDistance > 0 && (
        <div className="p-3 bg-surface-light rounded-xl border border-cb-border text-sm text-cb-secondary">
          Total distance: <strong className="text-cb-text">{totalDistance >= 1000
            ? `${(totalDistance / 1000).toFixed(1)}km`
            : `${totalDistance}m`}</strong>
        </div>
      )}

      {section.exercises.map((ex, i) => (
        <DynamicExerciseInput
          key={ex.id}
          exercise={ex}
          sport={sport}
          onChange={updated => updateExercise(i, updated)}
          onDelete={() => deleteExercise(i)}
          draggable
          label={`Seg ${i + 1}`}
        />
      ))}

      <button
        type="button"
        onClick={addSegment}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add segment
      </button>
    </div>
  )
}
