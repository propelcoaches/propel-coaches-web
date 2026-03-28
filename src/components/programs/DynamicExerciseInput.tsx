'use client'

import { Trash2, GripVertical } from 'lucide-react'
import clsx from 'clsx'
import { ExerciseBlock, SportCategory } from '@/types/workout'
import { getSportConfig } from '@/constants/workoutConfigs'

const REST_QUICK = [30, 60, 90, 120]
const HR_ZONES = [1, 2, 3, 4, 5]
const RPE_OPTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface Props {
  exercise: ExerciseBlock
  sport: SportCategory
  onChange: (updated: ExerciseBlock) => void
  onDelete: () => void
  draggable?: boolean
  /** Optional prefix label, e.g. "A1", "Station 2", "Min 3" */
  label?: string
}

export default function DynamicExerciseInput({
  exercise, sport, onChange, onDelete, draggable, label,
}: Props) {
  const fields = getSportConfig(sport).exerciseFields

  function set<K extends keyof ExerciseBlock>(key: K, val: ExerciseBlock[K]) {
    onChange({ ...exercise, [key]: val })
  }

  return (
    <div className="group relative rounded-xl border border-cb-border bg-surface hover:border-brand/20 transition-colors">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {draggable && (
          <GripVertical size={14} className="text-cb-muted cursor-grab active:cursor-grabbing flex-shrink-0" />
        )}
        {label && (
          <span className="text-[11px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded flex-shrink-0">
            {label}
          </span>
        )}
        <input
          value={exercise.exerciseName}
          onChange={e => set('exerciseName', e.target.value)}
          placeholder="Exercise name…"
          className="flex-1 bg-transparent text-sm font-medium text-cb-text placeholder-cb-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-cb-muted hover:text-red-500 transition-all flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Field grid */}
      <div className="px-3 pb-3 flex flex-wrap gap-2">

        {fields.sets && (
          <FieldBox label="Sets">
            <input
              type="number"
              min={1}
              value={exercise.sets ?? ''}
              onChange={e => set('sets', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="3"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.reps && (
          <FieldBox label="Reps">
            <input
              type="text"
              value={exercise.reps ?? ''}
              onChange={e => set('reps', e.target.value || undefined)}
              placeholder="8-12"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.weight && (
          <FieldBox label="Weight">
            <input
              type="text"
              value={exercise.weight ?? ''}
              onChange={e => set('weight', e.target.value || undefined)}
              placeholder="80kg"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.distance && (
          <FieldBox label="Distance (m)">
            <input
              type="number"
              min={0}
              value={exercise.distanceMeters ?? ''}
              onChange={e => set('distanceMeters', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="400"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.duration && (
          <FieldBox label="Duration (s)">
            <input
              type="number"
              min={0}
              value={exercise.durationSeconds ?? ''}
              onChange={e => set('durationSeconds', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="60"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.pace && (
          <FieldBox label="Pace">
            <input
              type="text"
              value={exercise.pace ?? ''}
              onChange={e => set('pace', e.target.value || undefined)}
              placeholder="5:30/km"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.tempo && (
          <FieldBox label="Tempo">
            <input
              type="text"
              value={exercise.tempo ?? ''}
              onChange={e => set('tempo', e.target.value || undefined)}
              placeholder="3-1-2-0"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.rest && (
          <FieldBox label="Rest">
            <div className="flex items-center gap-1 flex-wrap">
              <input
                type="number"
                min={0}
                value={exercise.restSeconds ?? ''}
                onChange={e => set('restSeconds', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="90"
                className={clsx(inputCls, 'w-14')}
              />
              <span className="text-[10px] text-cb-muted">s</span>
              {REST_QUICK.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('restSeconds', v)}
                  className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
                    exercise.restSeconds === v
                      ? 'bg-brand text-white border-brand'
                      : 'border-cb-border text-cb-muted hover:border-brand/40 hover:text-brand'
                  )}
                >
                  {v}s
                </button>
              ))}
            </div>
          </FieldBox>
        )}

        {fields.calories && (
          <FieldBox label="Cal">
            <input
              type="number"
              min={0}
              value={exercise.calories ?? ''}
              onChange={e => set('calories', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="50"
              className={inputCls}
            />
          </FieldBox>
        )}

        {fields.rpe && (
          <FieldBox label="RPE">
            <div className="flex flex-wrap gap-0.5">
              {RPE_OPTS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('rpe', exercise.rpe === v ? undefined : v)}
                  className={clsx(
                    'w-6 h-6 text-[10px] font-semibold rounded transition-colors',
                    exercise.rpe === v
                      ? 'bg-brand text-white'
                      : 'bg-surface-light text-cb-muted hover:bg-brand/10 hover:text-brand'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </FieldBox>
        )}

        {fields.heartRateZone && (
          <FieldBox label="HR Zone">
            <div className="flex gap-0.5">
              {HR_ZONES.map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => set('heartRateZone', exercise.heartRateZone === z ? undefined : z)}
                  className={clsx(
                    'w-7 h-7 text-[11px] font-bold rounded transition-colors',
                    exercise.heartRateZone === z
                      ? 'bg-brand text-white'
                      : 'bg-surface-light text-cb-muted hover:bg-brand/10 hover:text-brand'
                  )}
                >
                  Z{z}
                </button>
              ))}
            </div>
          </FieldBox>
        )}

        {fields.cues && (
          <FieldBox label="Coach notes" wide>
            <input
              type="text"
              value={exercise.coachNotes ?? ''}
              onChange={e => set('coachNotes', e.target.value || undefined)}
              placeholder="Cues, form reminders…"
              className={clsx(inputCls, 'w-full')}
            />
          </FieldBox>
        )}
      </div>
    </div>
  )
}

function FieldBox({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={clsx('flex flex-col gap-1', wide ? 'w-full' : '')}>
      <span className="text-[10px] font-medium text-cb-muted uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

const inputCls =
  'w-20 px-2 py-1 text-sm bg-surface-light border border-cb-border rounded-lg text-cb-text placeholder-cb-muted focus:outline-none focus:ring-1 focus:ring-brand'
