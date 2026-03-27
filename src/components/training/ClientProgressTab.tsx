'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from '@/lib/toast'
import {
  format, addDays, differenceInDays, parseISO, startOfWeek,
} from 'date-fns'
import {
  TrendingUp, Award, Calendar, BarChart3, AlertTriangle, FileDown,
  ChevronDown, ChevronUp, Dumbbell, CheckCircle2, XCircle, Clock, Activity,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryPoint { date: string; weight_kg: number; reps: number; e1rm: number }
interface ExerciseHistory { exercise_id: string; exercise_name: string; data: HistoryPoint[] }
interface WeeklyVolume { week: string; week_label: string; total_sets: number; tonnage_kg: number }
interface AdherenceDay { date: string; status: 'completed' | 'missed' | 'upcoming' | 'rest' }
interface SessionSet { set_number: number; reps: number | null; weight_kg: number | null; is_warmup: boolean }
interface SessionExercise { name: string; sets: SessionSet[] }
interface SessionFeedItem {
  id: string; logged_at: string; duration_minutes: number | null
  workout_name: string | null; exercises: SessionExercise[]
}
interface PrescribedEx {
  exercise_name: string
  prescribed: { sets: number; reps_min: number; reps_max: number; weight_kg: number | null }
  actual: { sets_completed: number; avg_reps: number | null; avg_weight_kg: number | null }
}
interface PrescribedVsActual { workout_name: string; logged_at: string; exercises: PrescribedEx[] }
interface PersonalBest {
  exercise_name: string; reps: number; weight_kg: number
  estimated_1rm_kg: number; achieved_at: string
}
interface AnalyticsData {
  exercise_history: ExerciseHistory[]
  weekly_volume: WeeklyVolume[]
  adherence: AdherenceDay[]
  session_feed: SessionFeedItem[]
  prescribed_vs_actual: PrescribedVsActual[]
  personal_bests: PersonalBest[]
  inactivity_days: number
  last_session_date: string | null
}

// ─── SVG Line Chart ────────────────────────────────────────────────────────────

function LineChart({
  series,
  colors = ['#14b8a6', '#f59e0b', '#6366f1', '#ec4899'],
  width = 560,
  height = 180,
  yLabel = '',
}: {
  series: { name: string; data: { x: number; y: number; label: string }[] }[]
  colors?: string[]
  width?: number
  height?: number
  yLabel?: string
}) {
  const px = 48, py = 12, pb = 28
  const plotW = width - px - 12
  const plotH = height - py - pb

  const allX = series.flatMap((s) => s.data.map((d) => d.x))
  const allY = series.flatMap((s) => s.data.map((d) => d.y))
  if (allX.length === 0) return <div className="flex items-center justify-center h-24 text-cb-muted text-sm">No data yet</div>

  const minX = Math.min(...allX), maxX = Math.max(...allX)
  const minY = Math.min(...allY) * 0.94
  const maxY = Math.max(...allY) * 1.04

  const sx = (x: number) => px + ((x - minX) / (maxX - minX || 1)) * plotW
  const sy = (y: number) => py + plotH - ((y - minY) / (maxY - minY || 1)) * plotH

  const yTicks = [0, 0.33, 0.67, 1].map((t) => ({
    y: py + plotH * (1 - t),
    val: Math.round(minY + t * (maxY - minY)),
  }))

  // X axis: show up to 6 evenly spaced labels from the union of data points
  const allDates = Array.from(new Set(allX)).sort((a, b) => a - b)
  const xTickStep = Math.ceil(allDates.length / 6)
  const xTicks = allDates.filter((_, i) => i % xTickStep === 0)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* grid */}
      {yTicks.map((t) => (
        <g key={t.val}>
          <line x1={px} y1={t.y} x2={px + plotW} y2={t.y} stroke="currentColor" strokeOpacity={0.08} />
          <text x={px - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.45}>{t.val}</text>
        </g>
      ))}
      {yLabel && <text x={10} y={py + plotH / 2} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.45} transform={`rotate(-90, 10, ${py + plotH / 2})`}>{yLabel}</text>}
      {/* x axis labels */}
      {xTicks.map((x, i) => {
        const pt = series[0]?.data.find((d) => d.x === x)
        return pt ? (
          <text key={i} x={sx(x)} y={height - 4} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.45}>{pt.label}</text>
        ) : null
      })}
      {/* series */}
      {series.map((s, si) => {
        if (s.data.length === 0) return null
        const color = colors[si % colors.length]
        const sorted = [...s.data].sort((a, b) => a.x - b.x)
        const d = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ')
        const area = `${d} L ${sx(sorted[sorted.length - 1].x)} ${py + plotH} L ${sx(sorted[0].x)} ${py + plotH} Z`
        return (
          <g key={si}>
            <path d={area} fill={color} fillOpacity={0.07} />
            <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {sorted.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={color} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = '#14b8a6',
  color2,
  width = 560,
  height = 160,
  yLabel = '',
}: {
  data: { label: string; value: number; value2?: number }[]
  color?: string
  color2?: string
  width?: number
  height?: number
  yLabel?: string
}) {
  const px = 52, py = 10, pb = 22
  const plotW = width - px - 8
  const plotH = height - py - pb

  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.value2 ?? 0)), 1)
  const barGroupW = plotW / data.length
  const barW = barGroupW * (color2 ? 0.38 : 0.6)

  const yTicks = [0, 0.5, 1].map((t) => ({
    y: py + plotH * (1 - t),
    val: Math.round(maxVal * t),
  }))

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {yTicks.map((t) => (
        <g key={t.val}>
          <line x1={px} y1={t.y} x2={px + plotW} y2={t.y} stroke="currentColor" strokeOpacity={0.08} />
          <text x={px - 4} y={t.y + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.45}>{t.val.toLocaleString()}</text>
        </g>
      ))}
      {yLabel && <text x={10} y={py + plotH / 2} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.45} transform={`rotate(-90, 10, ${py + plotH / 2})`}>{yLabel}</text>}
      {data.map((d, i) => {
        const xBase = px + i * barGroupW + barGroupW * 0.1
        const h1 = (d.value / maxVal) * plotH
        return (
          <g key={i}>
            <rect x={xBase} y={py + plotH - h1} width={barW} height={Math.max(h1, 1)} fill={color} rx={2} fillOpacity={0.8} />
            {d.value2 !== undefined && color2 && (
              <rect x={xBase + barW + 2} y={py + plotH - (d.value2 / maxVal) * plotH} width={barW} height={Math.max((d.value2 / maxVal) * plotH, 1)} fill={color2} rx={2} fillOpacity={0.8} />
            )}
            <text x={xBase + barW / 2} y={height - 4} textAnchor="middle" fontSize={8} fill="currentColor" fillOpacity={0.4}>{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Exercise History Section ─────────────────────────────────────────────────

function ExerciseHistorySection({ history }: { history: ExerciseHistory[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [metric, setMetric] = useState<'e1rm' | 'weight'>('e1rm')

  useEffect(() => {
    if (history.length > 0 && selected.length === 0) {
      setSelected(history.slice(0, 2).map((h) => h.exercise_id))
    }
  }, [history]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const series = useMemo(() =>
    history
      .filter((h) => selected.includes(h.exercise_id))
      .map((h) => ({
        name: h.exercise_name,
        data: h.data.map((pt, i) => ({
          x: i,
          y: metric === 'e1rm' ? pt.e1rm : pt.weight_kg,
          label: format(parseISO(pt.date), 'MMM d'),
        })),
      })),
    [history, selected, metric]
  )

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-cb-muted">
        <Dumbbell size={28} className="mb-2 opacity-40" />
        <p className="text-sm">No workout data yet</p>
      </div>
    )
  }

  const COLORS = ['#14b8a6', '#f59e0b', '#6366f1', '#ec4899']

  return (
    <div className="space-y-3">
      {/* Exercise pills */}
      <div className="flex flex-wrap gap-1.5">
        {history.slice(0, 8).map((h, i) => {
          const on = selected.includes(h.exercise_id)
          return (
            <button
              key={h.exercise_id}
              onClick={() => toggle(h.exercise_id)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                on
                  ? 'text-white border-transparent'
                  : 'border-cb-border text-cb-muted bg-transparent hover:bg-surface-light'
              )}
              style={on ? { backgroundColor: COLORS[history.indexOf(h) % COLORS.length] } : {}}
            >
              {h.exercise_name}
            </button>
          )
        })}
        <div className="ml-auto flex rounded-lg border border-cb-border overflow-hidden">
          {(['e1rm', 'weight'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={clsx(
                'px-2.5 py-1 text-xs font-medium transition-colors',
                metric === m ? 'bg-cb-teal text-white' : 'text-cb-muted hover:bg-surface-light'
              )}
            >
              {m === 'e1rm' ? 'e1RM (kg)' : 'Weight (kg)'}
            </button>
          ))}
        </div>
      </div>
      {/* Chart */}
      <div className="pt-1">
        <LineChart series={series} colors={COLORS} yLabel={metric === 'e1rm' ? 'e1RM kg' : 'kg'} />
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-cb-muted text-center">Select exercises above to plot</p>
      )}
    </div>
  )
}

// ─── Personal Bests Section ───────────────────────────────────────────────────

function PersonalBestsSection({ pbs }: { pbs: PersonalBest[] }) {
  if (pbs.length === 0) {
    return <p className="text-sm text-cb-muted py-4 text-center">No personal bests recorded yet</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-cb-border">
            <th className="text-left py-2 pr-3 text-cb-muted font-medium">Exercise</th>
            <th className="text-center py-2 px-2 text-cb-muted font-medium">Reps</th>
            <th className="text-right py-2 px-2 text-cb-muted font-medium">Weight</th>
            <th className="text-right py-2 px-2 text-cb-muted font-medium">e1RM</th>
            <th className="text-right py-2 pl-2 text-cb-muted font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {pbs.map((pb, i) => (
            <tr key={i} className="border-b border-cb-border/50 hover:bg-surface-light transition-colors">
              <td className="py-2 pr-3 font-medium text-cb-text">{pb.exercise_name}</td>
              <td className="py-2 px-2 text-center text-cb-secondary">{pb.reps}RM</td>
              <td className="py-2 px-2 text-right text-cb-secondary">{pb.weight_kg} kg</td>
              <td className="py-2 px-2 text-right font-semibold text-cb-teal">{pb.estimated_1rm_kg} kg</td>
              <td className="py-2 pl-2 text-right text-cb-muted whitespace-nowrap">
                {format(parseISO(pb.achieved_at), 'MMM d, yy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Adherence Calendar ───────────────────────────────────────────────────────

function AdherenceCalendar({ adherence }: { adherence: AdherenceDay[] }) {
  if (adherence.length === 0) return null

  // Group into weeks (Mon-first)
  const firstDate = parseISO(adherence[0].date)
  const mondayOfFirst = startOfWeek(firstDate, { weekStartsOn: 1 })
  const totalDays = differenceInDays(parseISO(adherence[adherence.length - 1].date), mondayOfFirst) + 1
  const numWeeks = Math.ceil(totalDays / 7)

  const dayMap = new Map(adherence.map((d) => [d.date, d]))

  const completedCount = adherence.filter((d) => d.status === 'completed').length
  const missedCount = adherence.filter((d) => d.status === 'missed').length
  const scheduledCount = completedCount + missedCount
  const adherencePct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-cb-text font-semibold text-sm">{adherencePct}% adherence</span>
        <span className="text-cb-muted">{completedCount} completed</span>
        <span className="text-red-500">{missedCount} missed</span>
        <div className="ml-auto flex items-center gap-2">
          {[['completed', '#22c55e', 'Done'], ['missed', '#ef4444', 'Missed'], ['upcoming', '#94a3b8', 'Sched'], ['rest', '#1e293b', 'Rest']] .map(([status, color, label]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-cb-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ display: 'grid', gridTemplateColumns: `20px repeat(${numWeeks}, 1fr)`, gap: '2px', minWidth: `${numWeeks * 16 + 24}px` }}>
          {/* Day labels column */}
          <div />
          {Array.from({ length: numWeeks }, (_, wi) => {
            const weekStart = addDays(mondayOfFirst, wi * 7)
            return (
              <div key={wi} className="text-[9px] text-cb-muted text-center truncate">
                {wi % 3 === 0 ? format(weekStart, 'MMM d') : ''}
              </div>
            )
          })}
          {/* Day rows */}
          {dayLabels.map((dl, di) => (
            <>
              <div key={`l-${di}`} className="text-[9px] text-cb-muted flex items-center justify-end pr-1">{dl}</div>
              {Array.from({ length: numWeeks }, (_, wi) => {
                const date = addDays(mondayOfFirst, wi * 7 + di)
                const ds = format(date, 'yyyy-MM-dd')
                const day = dayMap.get(ds)
                const status = day?.status ?? 'rest'
                const color = status === 'completed' ? '#22c55e'
                  : status === 'missed' ? '#ef4444'
                  : status === 'upcoming' ? '#94a3b8'
                  : 'transparent'
                const border = status === 'rest' ? '1px solid rgba(148,163,184,0.1)' : 'none'
                return (
                  <div
                    key={`${wi}-${di}`}
                    title={`${ds}: ${status}`}
                    className="rounded-sm aspect-square"
                    style={{ backgroundColor: color, border, opacity: status === 'rest' ? 0.3 : 1 }}
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Weekly Volume Section ────────────────────────────────────────────────────

function VolumeSection({ volume }: { volume: WeeklyVolume[] }) {
  const [metric, setMetric] = useState<'tonnage' | 'sets'>('tonnage')
  const data = volume.map((w) => ({
    label: w.week_label,
    value: metric === 'tonnage' ? w.tonnage_kg : w.total_sets,
  }))
  const total = volume.reduce((s, w) => s + (metric === 'tonnage' ? w.tonnage_kg : w.total_sets), 0)
  const avg = volume.length > 0 ? Math.round(total / volume.length) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-cb-border overflow-hidden">
          {(['tonnage', 'sets'] as const).map((m) => (
            <button key={m} onClick={() => setMetric(m)} className={clsx('px-2.5 py-1 text-xs font-medium transition-colors', metric === m ? 'bg-cb-teal text-white' : 'text-cb-muted hover:bg-surface-light')}>
              {m === 'tonnage' ? 'Tonnage' : 'Sets'}
            </button>
          ))}
        </div>
        <span className="text-xs text-cb-muted">
          Avg {avg.toLocaleString()} {metric === 'tonnage' ? 'kg' : 'sets'}/wk
        </span>
      </div>
      <BarChart data={data} color={metric === 'tonnage' ? '#6366f1' : '#14b8a6'} yLabel={metric === 'tonnage' ? 'kg' : 'sets'} />
    </div>
  )
}

// ─── Session Feed ─────────────────────────────────────────────────────────────

function SessionFeedSection({ sessions }: { sessions: SessionFeedItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(sessions[0]?.id ?? null)

  if (sessions.length === 0) {
    return <p className="text-sm text-cb-muted py-6 text-center">No sessions logged yet</p>
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const isOpen = expanded === s.id
        const totalSets = s.exercises.reduce((acc, ex) => acc + ex.sets.filter((st) => !st.is_warmup).length, 0)
        const totalVol = s.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, st) => a + (st.is_warmup ? 0 : (st.weight_kg ?? 0) * (st.reps ?? 0)), 0), 0)
        return (
          <div key={s.id} className="border border-cb-border rounded-xl overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-light transition-colors"
              onClick={() => setExpanded(isOpen ? null : s.id)}
            >
              <div className="w-8 h-8 rounded-lg bg-cb-teal/10 flex items-center justify-center shrink-0">
                <Dumbbell size={15} className="text-cb-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cb-text truncate">
                  {s.workout_name ?? 'Open Session'}
                </p>
                <p className="text-xs text-cb-muted">
                  {format(parseISO(s.logged_at), 'EEE MMM d, yyyy')}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                  {` · ${s.exercises.length} exercises · ${totalSets} sets`}
                  {totalVol > 0 ? ` · ${Math.round(totalVol).toLocaleString()} kg` : ''}
                </p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-cb-muted shrink-0" /> : <ChevronDown size={16} className="text-cb-muted shrink-0" />}
            </button>
            {isOpen && (
              <div className="border-t border-cb-border px-4 py-3 space-y-4 bg-surface-light/30">
                {s.exercises.map((ex, ei) => (
                  <div key={ei}>
                    <p className="text-xs font-semibold text-cb-text mb-1.5">{ex.name}</p>
                    <div className="grid gap-1">
                      <div className="grid grid-cols-4 gap-2 text-[10px] text-cb-muted font-medium px-1">
                        <span>Set</span><span className="text-right">Reps</span>
                        <span className="text-right">Weight</span><span className="text-right">Vol</span>
                      </div>
                      {ex.sets.map((st, si) => (
                        <div key={si} className={clsx('grid grid-cols-4 gap-2 text-xs px-1 py-0.5 rounded', st.is_warmup ? 'text-cb-muted' : 'text-cb-text')}>
                          <span>{st.set_number}{st.is_warmup ? ' W' : ''}</span>
                          <span className="text-right">{st.reps ?? '—'}</span>
                          <span className="text-right">{st.weight_kg != null ? `${st.weight_kg} kg` : '—'}</span>
                          <span className="text-right text-cb-muted">
                            {st.reps && st.weight_kg ? `${Math.round(st.reps * st.weight_kg)} kg` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Prescribed vs Actual ─────────────────────────────────────────────────────

function PrescribedVsActualSection({ data }: { data: PrescribedVsActual[] }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (data.length === 0) {
    return <p className="text-sm text-cb-muted py-6 text-center">No linked sessions — client must complete a scheduled workout to compare</p>
  }

  const session = data[activeIdx]

  return (
    <div className="space-y-3">
      {/* Session picker */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={clsx(
              'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap',
              i === activeIdx ? 'bg-cb-teal text-white border-cb-teal' : 'border-cb-border text-cb-muted hover:bg-surface-light'
            )}
          >
            {s.workout_name} · {format(parseISO(s.logged_at), 'MMM d')}
          </button>
        ))}
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-cb-border">
              <th className="text-left py-2 pr-3 text-cb-muted font-medium">Exercise</th>
              <th className="text-center py-2 px-2 text-cb-muted font-medium" colSpan={3}>Prescribed</th>
              <th className="text-center py-2 px-2 text-cb-muted font-medium" colSpan={3}>Actual</th>
              <th className="text-right py-2 pl-2 text-cb-muted font-medium">Sets %</th>
            </tr>
            <tr className="border-b border-cb-border/50">
              <th />
              <th className="text-center py-1 text-[10px] text-cb-muted font-normal">Sets</th>
              <th className="text-center py-1 text-[10px] text-cb-muted font-normal">Reps</th>
              <th className="text-center py-1 text-[10px] text-cb-muted font-normal">Weight</th>
              <th className="text-center py-1 text-[10px] text-cb-muted font-normal">Sets</th>
              <th className="text-center py-1 text-[10px] text-cb-muted font-normal">Avg Reps</th>
              <th className="text-center py-1 text-[10px] text-cb-muted font-normal">Avg Wt</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {session.exercises.map((ex, i) => {
              const setsPct = ex.prescribed.sets > 0
                ? Math.round((ex.actual.sets_completed / ex.prescribed.sets) * 100)
                : 100
              const repsRange = ex.prescribed.reps_min === ex.prescribed.reps_max
                ? `${ex.prescribed.reps_min}`
                : `${ex.prescribed.reps_min}–${ex.prescribed.reps_max}`
              const actRepsOk = ex.actual.avg_reps != null
                && ex.actual.avg_reps >= ex.prescribed.reps_min - 1
                && ex.actual.avg_reps <= ex.prescribed.reps_max + 1
              const actWtOk = ex.prescribed.weight_kg == null
                || (ex.actual.avg_weight_kg != null && ex.actual.avg_weight_kg >= ex.prescribed.weight_kg * 0.95)
              return (
                <tr key={i} className="border-b border-cb-border/50 hover:bg-surface-light/50 transition-colors">
                  <td className="py-2 pr-3 font-medium text-cb-text">{ex.exercise_name}</td>
                  <td className="py-2 px-2 text-center text-cb-secondary">{ex.prescribed.sets}</td>
                  <td className="py-2 px-2 text-center text-cb-secondary">{repsRange}</td>
                  <td className="py-2 px-2 text-center text-cb-secondary">
                    {ex.prescribed.weight_kg != null ? `${ex.prescribed.weight_kg} kg` : '—'}
                  </td>
                  <td className={clsx('py-2 px-2 text-center font-medium', setsPct >= 100 ? 'text-green-500' : setsPct >= 75 ? 'text-amber-500' : 'text-red-500')}>
                    {ex.actual.sets_completed}
                  </td>
                  <td className={clsx('py-2 px-2 text-center', actRepsOk ? 'text-green-500' : 'text-amber-500')}>
                    {ex.actual.avg_reps ?? '—'}
                  </td>
                  <td className={clsx('py-2 px-2 text-center', actWtOk ? 'text-green-500' : 'text-amber-500')}>
                    {ex.actual.avg_weight_kg != null ? `${ex.actual.avg_weight_kg} kg` : '—'}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-semibold', setsPct >= 100 ? 'bg-green-500/10 text-green-500' : setsPct >= 75 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500')}>
                      {setsPct}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-cb-muted">Colour coding: green = on target, amber = within 1 rep/5% weight, red = below target</p>
    </div>
  )
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

function exportProgressPDF(clientName: string, data: AnalyticsData): void {
  const completedCount = data.adherence.filter((d) => d.status === 'completed').length
  const missedCount = data.adherence.filter((d) => d.status === 'missed').length
  const scheduledCount = completedCount + missedCount
  const adherencePct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0
  const totalTonnage = data.weekly_volume.reduce((s, w) => s + w.tonnage_kg, 0)
  const avgTonnage = data.weekly_volume.length > 0 ? Math.round(totalTonnage / data.weekly_volume.length) : 0
  const generated = format(new Date(), 'MMMM d, yyyy')

  const pbRows = data.personal_bests.map((pb) => `
    <tr>
      <td>${pb.exercise_name}</td>
      <td style="text-align:center">${pb.reps}RM</td>
      <td style="text-align:right">${pb.weight_kg} kg</td>
      <td style="text-align:right;font-weight:600;color:#14b8a6">${pb.estimated_1rm_kg} kg</td>
      <td style="text-align:right;color:#888">${format(parseISO(pb.achieved_at), 'MMM d, yyyy')}</td>
    </tr>`).join('')

  const sessionRows = data.session_feed.slice(0, 10).map((s) => {
    const totalSets = s.exercises.reduce((acc, ex) => acc + ex.sets.filter((st) => !st.is_warmup).length, 0)
    const vol = s.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, st) => a + (st.is_warmup ? 0 : (st.weight_kg ?? 0) * (st.reps ?? 0)), 0), 0)
    return `<tr>
      <td>${format(parseISO(s.logged_at), 'EEE MMM d, yyyy')}</td>
      <td>${s.workout_name ?? 'Open Session'}</td>
      <td style="text-align:center">${s.exercises.length}</td>
      <td style="text-align:center">${totalSets}</td>
      <td style="text-align:right">${s.duration_minutes ?? '—'} min</td>
      <td style="text-align:right">${Math.round(vol).toLocaleString()} kg</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${clientName} – Progress Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 32px 40px; font-size: 12px; }
  h1 { font-size: 22px; font-weight: 700; color: #14b8a6; }
  h2 { font-size: 14px; font-weight: 600; margin: 24px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  .meta { color: #666; font-size: 11px; margin-top: 4px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
  .stat { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .stat-val { font-size: 24px; font-weight: 700; color: #14b8a6; }
  .stat-label { font-size: 10px; color: #888; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #e5e7eb; color: #666; font-weight: 600; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #f8fafc; }
  @media print { body { padding: 16px 20px; } .stats { page-break-inside: avoid; } }
  .print-btn { display: block; margin: 0 auto 20px; padding: 8px 24px; background: #14b8a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; }
  @media print { .print-btn { display: none; } }
</style></head><body>
<button class="print-btn" onclick="window.print()">⬇ Save as PDF / Print</button>
<h1>${clientName} – Progress Report</h1>
<p class="meta">Generated ${generated} · Last 12 weeks</p>

<div class="stats">
  <div class="stat"><div class="stat-val">${adherencePct}%</div><div class="stat-label">Program Adherence</div></div>
  <div class="stat"><div class="stat-val">${completedCount}</div><div class="stat-label">Sessions Completed</div></div>
  <div class="stat"><div class="stat-val">${missedCount}</div><div class="stat-label">Sessions Missed</div></div>
  <div class="stat"><div class="stat-val">${avgTonnage.toLocaleString()} kg</div><div class="stat-label">Avg Weekly Tonnage</div></div>
</div>

<h2>Personal Bests</h2>
<table>
  <thead><tr><th>Exercise</th><th style="text-align:center">Rep Range</th><th style="text-align:right">Weight</th><th style="text-align:right">e1RM</th><th style="text-align:right">Date</th></tr></thead>
  <tbody>${pbRows}</tbody>
</table>

<h2>Recent Sessions</h2>
<table>
  <thead><tr><th>Date</th><th>Workout</th><th style="text-align:center">Exercises</th><th style="text-align:center">Sets</th><th style="text-align:right">Duration</th><th style="text-align:right">Volume</th></tr></thead>
  <tbody>${sessionRows}</tbody>
</table>

${data.inactivity_days > 7 ? `<p style="margin-top:20px;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#dc2626;font-size:11px">⚠ Client has not logged a session in ${data.inactivity_days} days (last session: ${data.last_session_date ?? 'unknown'})</p>` : ''}
</body></html>`

  const win = window.open('', '_blank', 'width=960,height=800')
  if (!win) { toast.error('Pop-ups are blocked. Please allow pop-ups to export.'); return }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.addEventListener('load', () => setTimeout(() => { if (win && !win.closed) win.print() }, 400))
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientProgressTab({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inactivityThreshold, setInactivityThreshold] = useState(7)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/workout-analytics?weeks=12`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (error || !data) {
    return <div className="py-10 text-center text-cb-muted text-sm">{error ?? 'No data'}</div>
  }

  const completedCount = data.adherence.filter((d) => d.status === 'completed').length
  const scheduledCount = completedCount + data.adherence.filter((d) => d.status === 'missed').length
  const adherencePct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0
  const totalVol = data.weekly_volume.reduce((s, w) => s + w.tonnage_kg, 0)
  const avgVol = data.weekly_volume.length > 0 ? Math.round(totalVol / data.weekly_volume.length) : 0
  const isInactive = data.inactivity_days >= inactivityThreshold

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-cb-muted">
          <Clock size={14} />
          {data.last_session_date
            ? <>Last session: <span className="font-medium text-cb-text">{format(parseISO(data.last_session_date), 'MMM d, yyyy')}</span> ({data.inactivity_days}d ago)</>
            : 'No sessions logged'
          }
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-cb-muted flex items-center gap-1.5">
            Alert after
            <select
              value={inactivityThreshold}
              onChange={(e) => setInactivityThreshold(Number(e.target.value))}
              className="rounded border border-cb-border bg-surface text-cb-text px-1.5 py-0.5 text-xs"
            >
              {[3, 5, 7, 10, 14].map((v) => <option key={v} value={v}>{v} days</option>)}
            </select>
            inactivity
          </label>
          <button
            onClick={() => exportProgressPDF(clientName, data)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-cb-border rounded-lg text-xs font-medium text-cb-secondary hover:text-cb-text hover:bg-surface-light transition-colors"
          >
            <FileDown size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Inactivity alert */}
      {isInactive && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <span className="font-semibold">{clientName}</span> hasn't logged a session in{' '}
            <span className="font-semibold">{data.inactivity_days} days</span>. Consider reaching out.
          </span>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Adherence', value: `${adherencePct}%`, sub: `${completedCount} of ${scheduledCount} sessions`, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Avg Weekly Tonnage', value: `${avgVol.toLocaleString()} kg`, sub: 'last 12 weeks', icon: TrendingUp, color: 'text-cb-teal' },
          { label: 'Personal Bests', value: `${data.personal_bests.length}`, sub: 'all time', icon: Award, color: 'text-amber-500' },
          { label: 'Sessions Logged', value: `${data.session_feed.length}`, sub: 'last 12 weeks', icon: Activity, color: 'text-purple-500' },
        ].map((k) => (
          <div key={k.label} className="bg-surface border border-cb-border rounded-xl p-4 flex items-start gap-3">
            <k.icon size={18} className={clsx('mt-0.5 shrink-0', k.color)} />
            <div>
              <p className="text-xl font-bold text-cb-text leading-none">{k.value}</p>
              <p className="text-xs text-cb-muted mt-1">{k.label}</p>
              <p className="text-[10px] text-cb-muted/70 mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Exercise history + Personal Bests */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-surface border border-cb-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-cb-teal" />
            <h3 className="text-sm font-semibold text-cb-text">Exercise History</h3>
          </div>
          <ExerciseHistorySection history={data.exercise_history} />
        </div>
        <div className="lg:col-span-2 bg-surface border border-cb-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-cb-text">Personal Bests</h3>
          </div>
          <PersonalBestsSection pbs={data.personal_bests} />
        </div>
      </div>

      {/* Row 2: Adherence + Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-surface border border-cb-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-green-500" />
            <h3 className="text-sm font-semibold text-cb-text">Program Adherence</h3>
          </div>
          <AdherenceCalendar adherence={data.adherence} />
        </div>
        <div className="lg:col-span-2 bg-surface border border-cb-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-purple-500" />
            <h3 className="text-sm font-semibold text-cb-text">Weekly Volume</h3>
          </div>
          <VolumeSection volume={data.weekly_volume} />
        </div>
      </div>

      {/* Row 3: Prescribed vs Actual (full width) */}
      <div className="bg-surface border border-cb-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={15} className="text-cb-secondary" />
          <h3 className="text-sm font-semibold text-cb-text">Prescribed vs Actual</h3>
        </div>
        <PrescribedVsActualSection data={data.prescribed_vs_actual} />
      </div>

      {/* Row 4: Session feed (full width) */}
      <div className="bg-surface border border-cb-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell size={15} className="text-cb-teal" />
          <h3 className="text-sm font-semibold text-cb-text">Session Feed</h3>
          <span className="text-xs text-cb-muted ml-1">— {data.session_feed.length} recent sessions</span>
        </div>
        <SessionFeedSection sessions={data.session_feed} />
      </div>
    </div>
  )
}
