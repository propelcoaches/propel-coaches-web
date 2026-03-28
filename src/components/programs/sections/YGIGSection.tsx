'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function YGIGSection({ section, sport, onChange }: Props) {
  const pairs = chunk(section.exercises, 2)

  function addPair() {
    const n = section.exercises.length
    onChange({
      ...section,
      exercises: [
        ...section.exercises,
        { id: crypto.randomUUID(), exerciseName: '', order: n },
        { id: crypto.randomUUID(), exerciseName: '', order: n + 1 },
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
    <div className="space-y-4">
      {/* Rounds */}
      <div className="flex items-center gap-3 p-3 bg-surface-light rounded-xl border border-cb-border">
        <span className="text-xs font-medium text-cb-secondary">Rounds each</span>
        <input
          type="number"
          min={1}
          value={section.rounds ?? 4}
          onChange={e => onChange({ ...section, rounds: Number(e.target.value) })}
          className="w-16 px-2 py-1 text-sm bg-white dark:bg-surface border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <span className="text-xs text-cb-muted">You Go I Go — partners alternate turns</span>
      </div>

      {pairs.map((pair, pi) => (
        <div key={pi} className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            {pi === 0 && (
              <span className="text-[10px] font-semibold text-cb-muted uppercase tracking-wide block">Partner A</span>
            )}
            {pair[0] && (
              <DynamicExerciseInput
                exercise={pair[0]}
                sport={sport}
                onChange={updated => updateExercise(pi * 2, updated)}
                onDelete={() => deleteExercise(pi * 2)}
                label={`Round ${pi + 1}`}
              />
            )}
          </div>
          <div className="space-y-1.5">
            {pi === 0 && (
              <span className="text-[10px] font-semibold text-cb-muted uppercase tracking-wide block">Partner B</span>
            )}
            {pair[1] && (
              <DynamicExerciseInput
                exercise={pair[1]}
                sport={sport}
                onChange={updated => updateExercise(pi * 2 + 1, updated)}
                onDelete={() => deleteExercise(pi * 2 + 1)}
                label={`Round ${pi + 1}`}
              />
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPair}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add round pair
      </button>
    </div>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}
