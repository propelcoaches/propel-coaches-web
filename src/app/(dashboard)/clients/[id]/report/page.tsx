'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Printer, TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'


function ScoreBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-cb-muted">—</span>
  const color =
    value >= 8 ? 'bg-cb-success/15 text-cb-success' :
    value >= 5 ? 'bg-cb-warning/15 text-cb-warning' :
    'bg-cb-danger/15 text-cb-danger'
  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-sm font-semibold', color)}>
      {value}/10
    </span>
  )
}

export default function ReportPage() {
  const params = useParams()
  const clientId = params.id as string
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [realWeightLogs, setRealWeightLogs] = useState<any[]>([])
  const [realCheckIns, setRealCheckIns] = useState<any[]>([])
  const [realPRs, setRealPRs] = useState<any[]>([])

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    setLoading(true)
    Promise.all([
      supabase.from('profiles').select('id, full_name, email, starting_weight_kg, created_at').eq('id', clientId).single(),
      supabase.from('weight_logs').select('*').eq('client_id', clientId).order('date', { ascending: true }),
      supabase.from('check_ins').select('energy, sleep_quality, stress, date, bodyweight_kg').eq('client_id', clientId).order('date', { ascending: false }),
      supabase.from('personal_records').select('*').eq('client_id', clientId).order('date', { ascending: false }),
    ]).then(([profileRes, wlRes, ciRes, prRes]) => {
      if (profileRes.data) setClient({ ...profileRes.data, name: profileRes.data.full_name })
      setRealWeightLogs(wlRes.data || [])
      setRealCheckIns(ciRes.data || [])
      setRealPRs(prRes.data || [])
    }).finally(() => setLoading(false))
  }, [clientId])

  const clientWeightLogs = useMemo(() => {
    return [...realWeightLogs].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [realWeightLogs])

  const clientCheckIns = useMemo(() => realCheckIns, [realCheckIns])

  const measurements: { date: string; chest: number; waist: number; hips: number; arms: number; thighs: number }[] = []
  const prs = useMemo(() => realPRs, [realPRs])

  const startWeight = client?.starting_weight_kg ?? 0
  const currentWeight = clientWeightLogs[clientWeightLogs.length - 1]?.weight_kg ?? startWeight
  const totalChange = currentWeight - startWeight

  const avgEnergy = clientCheckIns.length > 0
    ? Math.round(clientCheckIns.reduce((s, c) => s + c.energy, 0) / clientCheckIns.length)
    : null

  const avgSleep = clientCheckIns.length > 0
    ? Math.round(clientCheckIns.reduce((s, c) => s + c.sleep_quality, 0) / clientCheckIns.length)
    : null

  const avgStress = clientCheckIns.length > 0
    ? Math.round(clientCheckIns.reduce((s, c) => s + c.stress, 0) / clientCheckIns.length)
    : null

  const latestMeasurements = measurements[measurements.length - 1]
  const prevMeasurements = measurements[measurements.length - 2]

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-64">
        <Loader2 size={24} className="animate-spin text-cb-muted" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-cb-muted">Client not found</p>
      </div>
    )
  }

  const dateRange = 'Sep 2025 – Mar 2026'

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* No-print toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-cb-border">
        <div className="p-4 max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-cb-text" />
            <h1 className="text-lg font-semibold text-cb-text">Progress Report</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-8 max-w-5xl mx-auto print:p-0">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-cb-text mb-2">Progress Report</h1>
          <p className="text-2xl font-semibold text-brand mb-1">{client.name}</p>
          <p className="text-sm text-cb-muted">{dateRange}</p>
          <p className="text-sm text-cb-muted mt-2">Propel</p>
        </div>

        {/* Weight Journey Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-cb-text mb-4">Weight Journey</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-cb-muted mb-2">Start Weight</p>
              <p className="text-2xl font-bold text-cb-text">{startWeight.toFixed(1)}</p>
              <p className="text-sm text-cb-muted mt-1">kg</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-cb-muted mb-2">Current Weight</p>
              <p className="text-2xl font-bold text-cb-text">{currentWeight.toFixed(1)}</p>
              <p className="text-sm text-cb-muted mt-1">kg</p>
            </div>
            <div className={clsx(
              'bg-gray-50 border border-gray-200 rounded-lg p-6',
              totalChange > 0 ? 'border-red-200' : 'border-green-200'
            )}>
              <p className="text-sm text-cb-muted mb-2">Total Change</p>
              <p className={clsx(
                'text-2xl font-bold',
                totalChange > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}
              </p>
              <p className="text-sm text-cb-muted mt-1">kg</p>
            </div>
          </div>
        </section>

        {/* Check-in Summary */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-cb-text mb-4">Check-in Summary</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-cb-muted mb-2">Total Check-ins</p>
              <p className="text-2xl font-bold text-cb-text">{clientCheckIns.length}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-cb-muted mb-2">Avg Energy</p>
                <ScoreBadge value={avgEnergy} />
              </div>
              <div>
                <p className="text-sm text-cb-muted mb-2">Avg Sleep</p>
                <ScoreBadge value={avgSleep} />
              </div>
              <div>
                <p className="text-sm text-cb-muted mb-2">Avg Stress</p>
                <ScoreBadge value={avgStress} />
              </div>
            </div>
          </div>
        </section>

        {/* Personal Records */}
        {prs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-cb-text mb-4">Personal Records</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-cb-muted">Exercise</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-cb-muted">Weight</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-cb-muted">Reps</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-cb-muted">Estimated 1RM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {prs.map((pr: { exercise_name: string; weight_kg: number; reps: number; estimated_1rm: number; date: string }, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-cb-text font-medium">{pr.exercise_name}</td>
                      <td className="px-4 py-3 text-sm text-cb-secondary">{pr.weight_kg} kg</td>
                      <td className="px-4 py-3 text-sm text-cb-secondary">{pr.reps}</td>
                      <td className="px-4 py-3 text-sm font-medium text-brand">{pr.estimated_1rm} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Body Measurements */}
        {measurements.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-cb-text mb-4">Body Measurements</h2>
            <div className="grid grid-cols-2 gap-4">
              {latestMeasurements && [
                { label: 'Chest', key: 'chest' as const },
                { label: 'Waist', key: 'waist' as const },
                { label: 'Hips', key: 'hips' as const },
                { label: 'Arms', key: 'arms' as const },
                { label: 'Thighs', key: 'thighs' as const },
              ].map((measurement) => {
                const current = latestMeasurements[measurement.key]
                const prev = prevMeasurements?.[measurement.key]
                const delta = prev ? current - prev : null

                return (
                  <div key={measurement.label} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-cb-muted mb-2">{measurement.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-cb-text">{current}</span>
                      <span className="text-sm text-cb-muted">cm</span>
                    </div>
                    {delta !== null && (
                      <p className={clsx(
                        'text-xs mt-2 flex items-center gap-1',
                        delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-600' : 'text-cb-muted'
                      )}>
                        {delta < 0 ? <TrendingDown size={12} /> : delta > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                        {delta > 0 ? '+' : ''}{delta} cm
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-cb-muted">
          <p>Propel Progress Report — {new Date().toLocaleDateString('en-AU')}</p>
        </div>
      </div>
    </div>
  )
}
