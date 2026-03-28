'use client'

import { Plus } from 'lucide-react'
import { WorkoutSection, ExerciseBlock, SportCategory } from '@/types/workout'
import DynamicExerciseInput from '../DynamicExerciseInput'


interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function CircuitSection({ section, sport, onChange }: Props) {
  function addStation() {
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
      {/* Circuit controls */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-surface-light rounded-xl border border-cb-border">
        <CtrlField label="Rounds">
          <input
            type="number"
            min={1}
            value={section.rounds ?? 3}
            onChange={e => onChange({ ...section, rounds: Number(e.target.value) })}
            className={ctrlInput}
          />
        </CtrlField>
        <CtrlField label="Rest between stations (s)">
          <input
            type="number"
            min={0}
            value={section.restSeconds ?? 15}
            onChange={e => onChange({ ...section, restSeconds: Number(e.target.value) })}
            className={ctrlInput}
          />
        </CtrlField>
        <CtrlField label="Rest between rounds (s)">
          <input
            type="number"
            min={0}
            value={section.workSeconds ?? 90}
            onChange={e => onChange({ ...section, workSeconds: Number(e.target.value) })}
            className={ctrlInput}
          />
        </CtrlField>
      </div>

      {section.exercises.map((ex, i) => (
        <DynamicExerciseInput
          key={ex.id}
          exercise={ex}
          sport={sport}
          onChange={updated => updateExercise(i, updated)}
          onDelete={() => deleteExercise(i)}
          draggable
          label={`Station ${i + 1}`}
        />
      ))}

      <button
        type="button"
        onClick={addStation}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-cb-border text-sm text-cb-muted hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus size={14} /> Add station
      </button>
    </div>
  )
}

function CtrlField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-cb-muted uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

const ctrlInput =
  'w-20 px-2 py-1 text-sm bg-white dark:bg-surface border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-1 focus:ring-brand'
