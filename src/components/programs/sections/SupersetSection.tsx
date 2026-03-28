'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


const PAIR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function SupersetSection({ section, sport, onChange }: Props) {
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
      {/* Rounds control */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-cb-secondary">Rounds</span>
        <input
          type="number"
          min={1}
          value={section.rounds ?? 3}
          onChange={e => onChange({ ...section, rounds: Number(e.target.value) })}
          className="w-16 px-2 py-1 text-sm bg-surface-light border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {pairs.map((pair, pi) => (
        <div key={pi} className="space-y-1.5">
          <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded inline-block">
            Superset {PAIR_LABELS[pi] ?? pi + 1}
          </span>
          {pair.map((ex, ei) => {
            const globalIdx = pi * 2 + ei
            return (
              <DynamicExerciseInput
                key={ex.id}
                exercise={ex}
                sport={sport}
                onChange={updated => updateExercise(globalIdx, updated)}
                onDelete={() => deleteExercise(globalIdx)}
                label={`${PAIR_LABELS[pi] ?? pi + 1}${ei + 1}`}
              />
            )
          })}
        </div>
      ))}

      <button
        type="button"
        onClick={addPair}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add superset pair
      </button>
    </div>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}
