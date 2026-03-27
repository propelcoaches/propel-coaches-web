'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

export default function MetricsPage() {
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [realClients, setRealClients] = useState<{ id: string; name: string; full_name: string }[]>([])
  const [realWeightLogs, setRealWeightLogs] = useState<any[]>([])
  const [realCheckIns, setRealCheckIns] = useState<any[]>([])
  const [realPRs, setRealPRs] = useState<any[]>([])
  const [realMeasurements, setRealMeasurements] = useState<any[]>([])
  const [macroInputs, setMacroInputs] = useState({ calories: '2000', protein: '150', carbs: '200', fat: '70' })
  const [savingMacros, setSavingMacros] = useState(false)
  const [macroSaved, setMacroSaved] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  // Fetch clients list for the dropdown
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('coach_id', user.id)
        .eq('role', 'client')
        .order('full_name')
      setRealClients((data || []).map(c => ({ id: c.id, name: c.full_name, full_name: c.full_name })))
      setLoadingClients(false)
    })
  }, [])

  // Fetch metrics when selectedClient changes
  useEffect(() => {
    if (!selectedClient) return
    const supabase = createClient()
    setLoadingMetrics(true)
    Promise.all([
      supabase.from('weight_logs').select('*').eq('client_id', selectedClient).order('date', { ascending: true }).limit(24),
      supabase.from('check_ins').select('energy, sleep_quality, stress, date').eq('client_id', selectedClient).order('date', { ascending: false }).limit(20),
      supabase.from('personal_records').select('*').eq('client_id', selectedClient).order('date', { ascending: false }),
      supabase.from('macro_targets').select('*').eq('client_id', selectedClient).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('body_measurements').select('*').eq('client_id', selectedClient).order('date', { ascending: false }).limit(20),
    ]).then(([wl, ci, pr, mt, bm]) => {
      setRealWeightLogs(wl.data || [])
      setRealCheckIns(ci.data || [])
      setRealPRs(pr.data || [])
      setRealMeasurements(bm.data || [])
      if (mt.data) {
        setMacroInputs({
          calories: String(mt.data.calories || 2000),
          protein: String(mt.data.protein_g || 150),
          carbs: String(mt.data.carbs_g || 200),
          fat: String(mt.data.fats_g || 70),
        })
      }
    }).finally(() => setLoadingMetrics(false))
  }, [selectedClient])

  const handleSaveMacros = async () => {
    if (!selectedClient) return
    setSavingMacros(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('macro_targets').upsert({
      client_id: selectedClient,
      coach_id: user?.id,
      calories: parseInt(macroInputs.calories) || 0,
      protein_g: parseInt(macroInputs.protein) || 0,
      carbs_g: parseInt(macroInputs.carbs) || 0,
      fats_g: parseInt(macroInputs.fat) || 0,
      set_by_coach: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })
    setSavingMacros(false)
    setMacroSaved(true)
    setTimeout(() => setMacroSaved(false), 2500)
  }

  const clients = realClients
  const clientWeightLogsRaw = realWeightLogs
  const clientWeightLogs = clientWeightLogsRaw
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12)

  const clientCheckIns = realCheckIns
  const clientProfile = clients.find((c: any) => c.id === selectedClient)
  const measurements = realMeasurements
  const prs = realPRs

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
          {loadingClients
            ? <option disabled>Loading clients...</option>
            : (clients as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.full_name || c.name}</option>)
          }
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
                <input type="number" value={macroInputs.calories} onChange={e => setMacroInputs(p => ({ ...p, calories: e.target.value }))} placeholder="2000" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Protein (g)</label>
                <input type="number" value={macroInputs.protein} onChange={e => setMacroInputs(p => ({ ...p, protein: e.target.value }))} placeholder="150" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Carbs (g)</label>
                <input type="number" value={macroInputs.carbs} onChange={e => setMacroInputs(p => ({ ...p, carbs: e.target.value }))} placeholder="200" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-cb-muted">Fat (g)</label>
                <input type="number" value={macroInputs.fat} onChange={e => setMacroInputs(p => ({ ...p, fat: e.target.value }))} placeholder="70" className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>
            <button
              onClick={handleSaveMacros}
              disabled={savingMacros || !selectedClient}
              className="mt-4 w-full px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingMacros && <Loader2 size={14} className="animate-spin" />}
              {macroSaved ? '✓ Saved!' : 'Save Targets'}
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
                      <td className="px-4 py-2 text-sm font-medium text-cb-text">{pr.exercise_name}</td>
                      <td className="px-4 py-2 text-sm text-cb-secondary">{pr.weight_kg} kg</td>
                      <td className="px-4 py-2 text-sm text-cb-secondary">{pr.reps}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-brand">{pr.estimated_1rm} kg</td>
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
