'use client'

import { useState, useEffect, useMemo } from 'react'

type Coach = {
  id: string
  plan?: string
  subscription_status?: string
}

type Stats = {
  totalCoaches: number
  activeSubscriptions: number
  mrr: number
  trialCoaches: number
}

const PLAN_PRICING: Record<string, number> = {
  starter: 49,
  pro: 99,
  clinic: 199,
}

export default function AdminRevenuePage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const secret = sessionStorage.getItem('adminSecret')
    if (!secret) { setError('Not authenticated'); setLoading(false); return }

    fetch('/api/admin/coaches', { headers: { 'x-admin-secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch'))
      .then(data => { setStats(data.stats); setCoaches(data.coaches ?? []) })
      .catch(() => setError('Failed to load revenue data'))
      .finally(() => setLoading(false))
  }, [])

  const planBreakdown = useMemo(() => {
    const active = coaches.filter(c => c.subscription_status === 'active' || c.subscription_status === 'trialing')
    const counts: Record<string, { count: number; price: number }> = {}
    active.forEach(c => {
      const plan = (c.plan ?? 'starter').toLowerCase()
      const price = PLAN_PRICING[plan] ?? PLAN_PRICING['starter']
      if (!counts[plan]) counts[plan] = { count: 0, price }
      counts[plan].count++
    })
    return Object.entries(counts).map(([plan, { count, price }]) => ({
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      price,
      coaches: count,
      mrr: price * count,
    })).sort((a, b) => a.price - b.price)
  }, [coaches])

  const totalMrr = planBreakdown.reduce((s, p) => s + p.mrr, 0)

  if (loading) return <div className="p-8 text-gray-400">Loading revenue data…</div>
  if (error) return <div className="p-8 text-red-400">{error}</div>

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Revenue</h1>
        <p className="text-gray-400">MRR and subscription overview</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Current MRR</p>
            <p className="text-3xl font-bold text-white">${stats.mrr.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">ARR (projected)</p>
            <p className="text-3xl font-bold text-white">${(stats.mrr * 12).toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
            <p className="text-gray-500 text-sm mt-1">{stats.trialCoaches} on trial</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-500 text-sm mb-1">Total Coaches</p>
            <p className="text-3xl font-bold text-white">{stats.totalCoaches}</p>
          </div>
        </div>
      )}

      {planBreakdown.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Plan Breakdown</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 border-b border-gray-800">
                <tr>
                  {['Plan', 'Price / mo', 'Active Coaches', 'MRR', '% of MRR'].map(h => (
                    <th key={h} className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {planBreakdown.map(row => (
                  <tr key={row.plan} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{row.plan}</td>
                    <td className="py-4 px-6 text-gray-400">${row.price}</td>
                    <td className="py-4 px-6 text-white">{row.coaches}</td>
                    <td className="py-4 px-6 text-white font-medium">${row.mrr.toLocaleString()}</td>
                    <td className="py-4 px-6 text-gray-400">
                      {totalMrr > 0 ? ((row.mrr / totalMrr) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-800/30">
                  <td className="py-4 px-6 font-bold text-white" colSpan={3}>Total</td>
                  <td className="py-4 px-6 font-bold text-white">${totalMrr.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-400">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
