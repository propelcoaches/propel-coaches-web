'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS, DEMO_WEIGHT_LOGS, DEMO_CHECK_INS } from '@/lib/demo/mockData'
import clsx from 'clsx'

const DEMO_MEASUREMENTS: Record<string, { date: string; chest: number; waist: number; hips: number; arms: number; thighs: number }[]> = {
  'demo-client-1': [
    { date: '2025-09-16', chest: 108, waist: 96, hips: 102, arms: 38, thighs: 62 },
    { date: '2026-01-10', chest: 105, waist: 92, hips: 99, arms: 39, thighs: 60 },
    { date: '2026-03-03', chest: 103, waist: 89, hips: 97, arms: 40, thighs: 59 },
  ],
  'demo-client-2': [
    { date: '2025-10-04', chest: 88, waist: 70, hips: 94, arms: 29, thighs: 55 },
    { date: '2026-03-04', chest: 86, waist: 67, hips: 92, arms: 30, thighs: 53 },
  ],
  'demo-client-3': [
    { date: '2025-11-19', chest: 100, waist: 82, hips: 96, arms: 37, thighs: 58 },
    { date: '2026-03-02', chest: 103, waist: 84, hips: 97, arms: 40, thighs: 61 },
  ],
  'demo-client-4': [
    { date: '2025-12-02', chest: 93, waist: 76, hips: 98, arms: 30, thighs: 57 },
    { date: '2026-03-05', chest: 91, waist: 73, hips: 96, arms: 31, thighs: 55 },
  ],
}

const DEMO_PRS: Record<string, { exercise: string; weight: number; reps: number; e1rm: number; date: string }[]> = {
  'demo-client-1': [
    { exercise: 'Squat', weight: 120, reps: 5, e1rm: 139, date: '2026-03-03' },
    { exercise: 'Bench Press', weight: 100, reps: 5, e1rm: 116, date: '2026-02-10' },
    { exercise: 'Romanian Deadlift', weight: 110, reps: 6, e1rm: 131, date: '2026-01-28' },
  ],
  'demo-client-2': [
    { exercise: 'Bulgarian Split Squat', weight: 40, reps: 8, e1rm: 51, date: '2026-02-18' },
    { exercise: 'Hip Thrust', weight: 90, reps: 10, e1rm: 120, date: '2026-03-04' },
  ],
  'demo-client-3': [
    { exercise: 'Bench Press', weight: 110, reps: 3, e1rm: 123, date: '2026-03-02' },
    { exercise: 'Deadlift', weight: 175, reps: 3, e1rm: 195, date: '2026-02-16' },
    { exercise: 'Squat', weight: 140, reps: 5, e1rm: 163, date: '2026-01-20' },
  ],
  'demo-client-4': [
    { exercise: 'Goblet Squat', weight: 24, reps: 10, e1rm: 32, date: '2026-03-05' },
  ],
}

export default function MetricsPage() {
  const isDemo = useIsDemo()
  const [selectedClient, setSelectedClient] = useState<string>(isDemo ? 'demo-client-1' : '')

  const clients = isDemo ? DEMO_CLIENTS : []

  const clientWeightLogs = DEMO_WEIGHT_LOGS.filter(w => w.client_id === selectedClient)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12)

  const clientCheckIns = DEMO_CHECK_INS.filter(c => c.client_id === selectedClient)
  const clientProfile = clients.find(c => c.id === selectedClient)
  const measurements = DEMO_MEASUREMENTS[selectedClient] ?? []
  const prs = DEMO_PRS[selectedClient] ?? []

  const latestWeight = clientWeightLogs[clientWeightLogs.length - 1]?.weight_kg
  const prevWeight = clientWeightLogs[clientWeightLogs.length - 2]?.weight_kg
  const weightDiff = latestWeight && prevWeight ? +(latestWeight - prevWeight).toFixed(1) : null

  // Body fat %
  const bfLogs = clientWeightLogs.filter(w => w.body_fat_pct != null)
  const latestBf = bfLogs[bfLogs.length - 1]?.body_fat_pct ?? null
  const prevBf = bfLogs[bfLogs.length - 2]?.body_fat_pct ?? null
  const bfDiff = latestBf != null && prevBf != null ? +(latestBf - prevBf).toFixed(1) : null

  const avgCheckinScore = clientCheckIns.length > 0
    ? Math.round(clientCheckIns.reduce((s, c) => s + c.energy, 0) / clientCheckIns.length)
    : null

  const minWeight = clientWeightLogs.length > 0 ? Math.min(...clientWeightLogs.map(w => w.weight_kg)) : 0
  const maxWeight = clientWeightLogs.length > 0 ? Math.max(...clientWeightLogs.map(w => w.weight_kg)) : 0
  const weightRange = maxWeight - minWeight || 1

  const adherenceWeeks = Array.from({ length: 8 }, (_, i) => i < clientCheckIns.length)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Metrics</h1>
          <p className="text-sm text-cb-muted mt-0.5">Progress data and personal records</p>
        </div>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          className="px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand">
          {!selectedClient && <option value="">Select client...</option>}
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedClient ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <p className="text-cb-muted text-sm">Select a client to view their metrics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Macro Targets Panel */}
          <div className="bg-surface border border-cb-border rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-cb-text">Macro Targets</h2>
              <p className="text-xs text-cb-muted mt-0.5">Daily nutrition goals for {clientProfile?.name}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Calories</label>
                <input type="number" placeholder="2000" defaultValue="2000" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Protein (g)</label>
                <input type="number" placeholder="150" defaultValue="150" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Carbs (g)</label>
                <input type="number" placeholder="200" defaultValue="200" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Fat (g)</label>
                <input type="number" placeholder="70" defaultValue="70" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Save Targets
            </button>
            <p className="text-xs text-cb-muted mt-3">These targets will be visible to the client in their nutrition tracking.</p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-cb-border rounded-xl p-4">
              <p className="text-xs text-cb-muted mb-1">Current Weight</p>
              <p className="text-2xl font-bold text-cb-text">{latestWeight ?? '—'}<span className="text-sm font-normal text-cb-muted ml-1">kg</span></p>
              {weightDiff !== null && (
                <p className={clsx('text-xs mt-1 flex items-center gap-1', weightDiff < 0 ? 'text-cb-success' : weightDiff > 0 ? 'text-cb-danger' : 'text-cb-muted')}>
                  {weightDiff < 0 ? <TrendingDown size={12} /> : weightDiff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                  {weightDiff > 0 ? '+' : ''}{weightDiff} kg vs last
                </p>
              )}
            </div>
            <div className="bg-surface border border-cb-border rounded-xl p-4">
              <p className="text-xs text-cb-muted mb-1">Body Fat %</p>
              <p className="text-2xl font-bold text-cb-text">
                {latestBf != null ? latestBf : '—'}
                {latestBf != null && <span className="text-sm font-normal text-cb-muted ml-1">%</span>}
              </p>
              {bfDiff !== null && (
                <p className={clsx('text-xs mt-1 flex items-center gap-1', bfDiff < 0 ? 'text-cb-success' : bfDiff > 0 ? 'text-cb-danger' : 'text-cb-muted')}>
                  {bfDiff < 0 ? <TrendingDown size={12} /> : bfDiff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                  {bfDiff > 0 ? '+' : ''}{bfDiff}% vs last
                </p>
              )}
              {latestBf == null && <p className="text-xs text-cb-muted mt-1">no data yet</p>}
            </div>
            <div className="bg-surface border border-cb-border rounded-xl p-4">
              <p className="text-xs text-cb-muted mb-1">Check-ins</p>
              <p className="text-2xl font-bold text-cb-text">{clientCheckIns.length}</p>
              <p className="text-xs text-cb-muted mt-1">total submitted</p>
            </div>
            <div className="bg-surface border border-cb-border rounded-xl p-4">
              <p className="text-xs text-cb-muted mb-1">Avg Energy</p>
              <p className="text-2xl font-bold text-cb-text">{avgCheckinScore ?? '—'}<span className="text-sm font-normal text-cb-muted ml-1">/10</span></p>
              <p className="text-xs text-cb-muted mt-1">all check-ins</p>
            </div>
          </div>

          {/* Weight + BF% chart */}
          {clientWeightLogs.length > 1 && (
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-cb-text">Weight History</h2>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-cb-muted"><span className="inline-block w-3 h-2 rounded-sm bg-brand opacity-80" /> Weight</span>
                  {bfLogs.length > 0 && <span className="flex items-center gap-1.5 text-xs text-cb-muted"><span className="inline-block w-3 h-2 rounded-sm bg-amber-400 opacity-80" /> Body Fat %</span>}
                </div>
              </div>
              <div className="flex items-end gap-2 h-36">
                {clientWeightLogs.map((log, i) => {
                  const heightPct = ((log.weight_kg - minWeight) / weightRange) * 80 + 10
                  const hasBf = log.body_fat_pct != null
                  return (
                    <div key={log.id} className="flex flex-col items-end gap-0.5 flex-1 min-w-0 group">
                      <div className="relative w-full flex justify-center items-end gap-[2px]">
                        <div
                          className="flex-1 max-w-[14px] bg-brand rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ height: heightPct + '%', minHeight: 4 }}
                          title={log.weight_kg + ' kg — ' + log.date}
                        />
                        {hasBf && (
                          <div
                            className="flex-1 max-w-[14px] bg-amber-400 rounded-t-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                            style={{ height: (log.body_fat_pct! / 40) * 100 + '%', minHeight: 4 }}
                            title={log.body_fat_pct + '% body fat — ' + log.date}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-cb-muted">{clientWeightLogs[0]?.date.slice(0, 7)}</span>
                <span className="text-[10px] text-cb-muted">{clientWeightLogs[clientWeightLogs.length - 1]?.date.slice(0, 7)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-cb-secondary font-medium">{clientWeightLogs[0]?.weight_kg} kg</span>
                <span className="text-xs text-cb-secondary font-medium">{latestWeight} kg</span>
              </div>
            </div>
          )}

          {/* Weight log table */}
          {clientWeightLogs.length > 0 && (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-cb-border">
                <h2 className="text-sm font-semibold text-cb-text">Weight Log</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cb-border bg-surface-light">
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Date</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Weight</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Body Fat %</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {[...clientWeightLogs].reverse().map((log, i, arr) => {
                    const prev = arr[i + 1]
                    const diff = prev ? +(log.weight_kg - prev.weight_kg).toFixed(1) : null
                    return (
                      <tr key={log.id} className="hover:bg-surface-light">
                        <td className="px-4 py-2 text-sm text-cb-secondary">
                          {new Date(log.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-cb-text">{log.weight_kg} kg</td>
                        <td className="px-4 py-2 text-sm text-cb-secondary">
                          {log.body_fat_pct != null
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-600">{log.body_fat_pct}%</span>
                            : <span className="text-cb-muted">—</span>}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {diff !== null ? (
                            <span className={clsx('flex items-center gap-1', diff < 0 ? 'text-cb-success' : diff > 0 ? 'text-cb-danger' : 'text-cb-muted')}>
                              {diff < 0 ? <TrendingDown size={11} /> : diff > 0 ? <TrendingUp size={11} /> : <Minus size={11} />}
                              {diff > 0 ? '+' : ''}{diff} kg
                            </span>
                          ) : <span className="text-cb-muted">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Adherence */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-cb-text mb-4">Check-in Adherence (last 8 weeks)</h2>
            <div className="flex gap-2">
              {adherenceWeeks.map((submitted, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className={clsx(
                    'w-full h-8 rounded',
                    submitted ? 'bg-brand' : 'bg-surface-light border border-cb-border'
                  )} title={'Week ' + (i + 1) + ': ' + (submitted ? 'submitted' : 'missed')} />
                  <span className="text-[10px] text-cb-muted">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements */}
          {measurements.length > 0 && (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-cb-border">
                <h2 className="text-sm font-semibold text-cb-text">Body Measurements (cm)</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cb-border bg-surface-light">
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Date</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Chest</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Waist</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Hips</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Arms</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Thighs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {measurements.map((m, i) => (
                    <tr key={i} className="hover:bg-surface-light">
                      <td className="px-4 py-2 text-sm text-cb-secondary">
                        {new Date(m.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2 text-sm text-cb-text">{m.chest}</td>
                      <td className="px-4 py-2 text-sm text-cb-text">{m.waist}</td>
                      <td className="px-4 py-2 text-sm text-cb-text">{m.hips}</td>
                      <td className="px-4 py-2 text-sm text-cb-text">{m.arms}</td>
                      <td className="px-4 py-2 text-sm text-cb-text">{m.thighs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Personal Records */}
          {prs.length > 0 && (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-cb-border">
                <h2 className="text-sm font-semibold text-cb-text">Personal Records</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cb-border bg-surface-light">
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Exercise</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Weight</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Reps</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">e1RM</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {prs.map((pr, i) => (
                    <tr key={i} className="hover:bg-surface-light">
                      <td className="px-4 py-2 text-sm font-medium text-cb-text">{pr.exercise}</td>
                      <td className="px-4 py-2 text-sm text-cb-secondary">{pr.weight} kg</td>
                      <td className="px-4 py-2 text-sm text-cb-secondary">{pr.reps}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-brand">{pr.e1rm} kg</td>
                      <td className="px-4 py-2 text-sm text-cb-muted">
                        {new Date(pr.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
