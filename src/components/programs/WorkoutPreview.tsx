'use client'

import clsx from 'clsx'
import { Clock, Zap, Repeat, MapPin, Route } from 'lucide-react'
import { Workout, WorkoutSection, ExerciseBlock, WorkoutFormat } from '@/types/workout'
import { getSportConfig, getFormatConfig, SPORT_ACCENT_COLORS } from '@/constants/workoutConfigs'

interface Props {
  workout: Workout
  compact?: boolean
}

export default function WorkoutPreview({ workout, compact }: Props) {
  const sportCfg = getSportConfig(workout.sportCategory)
  const accentBorder = SPORT_ACCENT_COLORS[workout.sportCategory]

  return (
    <div className={clsx('rounded-xl border border-cb-border bg-surface overflow-hidden', !compact && 'shadow-sm')}>
      {/* Header */}
      <div className={clsx('border-t-4 px-5 py-4', accentBorder)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-cb-text text-base">{workout.title || 'Untitled Workout'}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium text-cb-muted">{sportCfg.label}</span>
              {workout.estimatedDuration && (
                <span className="flex items-center gap-1 text-xs text-cb-muted">
                  <Clock size={11} />
                  {workout.estimatedDuration} min
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-brand/10 text-brand flex-shrink-0">
            Preview
          </span>
        </div>
        {workout.coachNotes && (
          <p className="mt-2 text-xs text-cb-muted italic border-l-2 border-cb-border pl-2">{workout.coachNotes}</p>
        )}
      </div>

      {/* Sections */}
      <div className="divide-y divide-cb-border">
        {workout.sections.map((section, idx) => (
          <SectionPreview
            key={section.id}
            section={section}
            index={idx}
            sport={workout.sportCategory}
          />
        ))}
        {workout.sections.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-cb-muted">No sections yet.</div>
        )}
      </div>
    </div>
  )
}

function SectionPreview({ section, index, sport }: {
  section: WorkoutSection
  index: number
  sport: string
}) {
  const fmtCfg = getFormatConfig(section.format)

  return (
    <div className="px-5 py-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-cb-muted uppercase tracking-wide">
          {section.title || `Section ${index + 1}`}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand/8 text-brand">
          {fmtCfg.label}
        </span>
        {section.rounds && (
          <span className="text-[10px] text-cb-muted flex items-center gap-0.5">
            <Repeat size={10} /> {section.rounds} rounds
          </span>
        )}
        {section.timeLimitSeconds && (
          <span className="text-[10px] text-cb-muted flex items-center gap-0.5">
            <Clock size={10} /> {Math.floor(section.timeLimitSeconds / 60)} min
          </span>
        )}
        {section.workSeconds && section.restSeconds && (
          <span className="text-[10px] text-cb-muted">
            {section.workSeconds}s on / {section.restSeconds}s off
          </span>
        )}
      </div>

      {/* Format-specific exercise display */}
      <FormatExercises section={section} />
    </div>
  )
}

function FormatExercises({ section }: { section: WorkoutSection }) {
  const { format, exercises } = section

  if (exercises.length === 0) {
    return <p className="text-xs text-cb-muted italic">No exercises.</p>
  }

  switch (format) {
    case 'straight_sets':
    case 'superset':
    case 'custom':
      return <SetsRepsTable exercises={exercises} />

    case 'circuit':
    case 'for_time':
    case 'amrap':
      return <StationList exercises={exercises} />

    case 'emom':
      return <EMOMList exercises={exercises} />

    case 'interval':
      return <IntervalList exercises={exercises} section={section} />

    case 'ygig':
      return <YGIGTable exercises={exercises} />

    case 'distance':
      return <DistanceTable exercises={exercises} />

    case 'tempo':
      return <TempoTable exercises={exercises} />

    case 'timed':
      return <TimedList exercises={exercises} />

    default:
      return <SetsRepsTable exercises={exercises} />
  }
}

// ── Strength / sets × reps table ─────────────────────────────────────────────
function SetsRepsTable({ exercises }: { exercises: ExerciseBlock[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-cb-muted text-left border-b border-cb-border">
          <th className="pb-1.5 font-medium">Exercise</th>
          <th className="pb-1.5 font-medium text-center w-16">Sets</th>
          <th className="pb-1.5 font-medium text-center w-16">Reps</th>
          <th className="pb-1.5 font-medium text-center w-20">Weight</th>
          <th className="pb-1.5 font-medium text-center w-16">Rest</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((ex, i) => (
          <tr key={ex.id} className={clsx('border-b border-cb-border/50', i % 2 === 0 ? '' : 'bg-surface-light/40')}>
            <td className="py-1.5 font-medium text-cb-text">{ex.exerciseName || '—'}</td>
            <td className="py-1.5 text-center text-cb-secondary">{ex.sets ?? '—'}</td>
            <td className="py-1.5 text-center text-cb-secondary">{ex.reps ?? '—'}</td>
            <td className="py-1.5 text-center text-cb-secondary">{ex.weight ?? '—'}</td>
            <td className="py-1.5 text-center text-cb-muted">{ex.restSeconds ? `${ex.restSeconds}s` : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Circuit / AMRAP / For Time — numbered stations ────────────────────────────
function StationList({ exercises }: { exercises: ExerciseBlock[] }) {
  return (
    <div className="space-y-1.5">
      {exercises.map((ex, i) => (
        <div key={ex.id} className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {i + 1}
          </span>
          <span className="text-sm font-medium text-cb-text flex-1">{ex.exerciseName || '—'}</span>
          <span className="text-xs text-cb-muted">{ex.reps ?? ex.durationSeconds ? `${ex.durationSeconds}s` : ''}</span>
        </div>
      ))}
    </div>
  )
}

// ── EMOM — clock-style ────────────────────────────────────────────────────────
function EMOMList({ exercises }: { exercises: ExerciseBlock[] }) {
  return (
    <div className="space-y-1">
      {exercises.map((ex, i) => (
        <div key={ex.id} className="flex items-baseline gap-3 py-1 border-b border-cb-border/40 last:border-0">
          <span className="text-[10px] font-bold text-brand w-14 flex-shrink-0">Min {i + 1}:</span>
          <span className="text-sm text-cb-text">{ex.exerciseName || '—'}</span>
          {(ex.reps || ex.sets) && (
            <span className="text-xs text-cb-muted ml-auto">
              {ex.sets && `${ex.sets} × `}{ex.reps}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Intervals — work/rest bars ────────────────────────────────────────────────
function IntervalList({ exercises, section }: { exercises: ExerciseBlock[]; section: WorkoutSection }) {
  const workS = section.workSeconds ?? 40
  const restS = section.restSeconds ?? 20
  const total = workS + restS
  const workPct = (workS / total) * 100

  return (
    <div className="space-y-2">
      {/* Visual bar */}
      <div className="flex rounded-lg overflow-hidden h-5 text-[10px] font-semibold">
        <div
          className="bg-emerald-500 text-white flex items-center justify-center"
          style={{ width: `${workPct}%` }}
        >
          {workS}s
        </div>
        <div
          className="bg-cb-border text-cb-muted flex items-center justify-center"
          style={{ width: `${100 - workPct}%` }}
        >
          {restS}s
        </div>
      </div>
      {exercises.map((ex, i) => (
        <div key={ex.id} className="flex items-center gap-2 py-0.5">
          <Zap size={12} className="text-brand flex-shrink-0" />
          <span className="text-sm text-cb-text">{ex.exerciseName || '—'}</span>
          {ex.rpe && <span className="ml-auto text-xs text-cb-muted">RPE {ex.rpe}</span>}
        </div>
      ))}
    </div>
  )
}

// ── YGIG — two-column ────────────────────────────────────────────────────────
function YGIGTable({ exercises }: { exercises: ExerciseBlock[] }) {
  const pairs = chunk(exercises, 2)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-cb-muted uppercase tracking-wide pb-1 border-b border-cb-border">
        <span>Partner A</span>
        <span>Partner B</span>
      </div>
      {pairs.map((pair, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-brand/5 rounded-lg px-3 py-2 text-cb-text font-medium">
            {pair[0]?.exerciseName || '—'}
            {pair[0]?.reps && <span className="text-xs text-cb-muted ml-1">{pair[0].reps}</span>}
          </div>
          <div className="bg-surface-light rounded-lg px-3 py-2 text-cb-text font-medium">
            {pair[1]?.exerciseName || '—'}
            {pair[1]?.reps && <span className="text-xs text-cb-muted ml-1">{pair[1].reps}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Distance / Running — splits table ─────────────────────────────────────────
function DistanceTable({ exercises }: { exercises: ExerciseBlock[] }) {
  const totalM = exercises.reduce((sum, ex) => sum + (ex.distanceMeters ?? 0), 0)
  return (
    <div className="space-y-2">
      {totalM > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-cb-muted mb-2">
          <Route size={12} />
          Total: <strong className="text-cb-text">
            {totalM >= 1000 ? `${(totalM / 1000).toFixed(1)}km` : `${totalM}m`}
          </strong>
        </div>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-cb-muted text-left border-b border-cb-border">
            <th className="pb-1.5 font-medium">Segment</th>
            <th className="pb-1.5 font-medium text-right w-20">Distance</th>
            <th className="pb-1.5 font-medium text-right w-24">Target Pace</th>
            <th className="pb-1.5 font-medium text-right w-16">HR Zone</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex, i) => (
            <tr key={ex.id} className="border-b border-cb-border/50">
              <td className="py-1.5 font-medium text-cb-text">{ex.exerciseName || `Seg ${i + 1}`}</td>
              <td className="py-1.5 text-right text-cb-secondary">
                {ex.distanceMeters
                  ? ex.distanceMeters >= 1000
                    ? `${(ex.distanceMeters / 1000).toFixed(1)}km`
                    : `${ex.distanceMeters}m`
                  : '—'}
              </td>
              <td className="py-1.5 text-right text-cb-secondary">{ex.pace ?? '—'}</td>
              <td className="py-1.5 text-right text-cb-muted">{ex.heartRateZone ? `Z${ex.heartRateZone}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tempo / Rehab ─────────────────────────────────────────────────────────────
function TempoTable({ exercises }: { exercises: ExerciseBlock[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-cb-muted text-left border-b border-cb-border">
          <th className="pb-1.5 font-medium">Exercise</th>
          <th className="pb-1.5 font-medium text-center w-16">Sets</th>
          <th className="pb-1.5 font-medium text-center w-16">Reps</th>
          <th className="pb-1.5 font-medium text-center w-24">Tempo</th>
          <th className="pb-1.5 font-medium text-center w-16">RPE</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((ex, i) => (
          <tr key={ex.id} className={clsx('border-b border-cb-border/50', i % 2 === 0 ? '' : 'bg-surface-light/40')}>
            <td className="py-1.5 font-medium text-cb-text">{ex.exerciseName || '—'}</td>
            <td className="py-1.5 text-center text-cb-secondary">{ex.sets ?? '—'}</td>
            <td className="py-1.5 text-center text-cb-secondary">{ex.reps ?? '—'}</td>
            <td className="py-1.5 text-center">
              {ex.tempo
                ? <code className="text-[10px] bg-surface-light px-1.5 py-0.5 rounded font-mono text-cb-text">{ex.tempo}</code>
                : <span className="text-cb-muted">—</span>}
            </td>
            <td className="py-1.5 text-center text-cb-muted">{ex.rpe ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Timed blocks ──────────────────────────────────────────────────────────────
function TimedList({ exercises }: { exercises: ExerciseBlock[] }) {
  return (
    <div className="space-y-1.5">
      {exercises.map((ex, i) => (
        <div key={ex.id} className="flex items-center gap-3 py-1.5 border-b border-cb-border/40 last:border-0">
          <span className="text-[10px] font-bold text-cb-muted w-14 flex-shrink-0">Block {i + 1}</span>
          <span className="text-sm font-medium text-cb-text flex-1">{ex.exerciseName || '—'}</span>
          {ex.durationSeconds && (
            <span className="text-xs text-cb-muted flex items-center gap-1">
              <Clock size={11} />{Math.floor(ex.durationSeconds / 60)}:{String(ex.durationSeconds % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}
