'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronDown } from 'lucide-react'

type Coach = {
  id: string
  full_name: string
  email: string
  plan?: string
  subscription_status?: string
  stripe_customer_id?: string
  clients_count: number
  created_at: string
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  useEffect(() => {
    const secret = sessionStorage.getItem('adminSecret')
    if (!secret) { setError('Not authenticated'); setLoading(false); return }

    fetch('/api/admin/coaches', { headers: { 'x-admin-secret': secret } })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch'))
      .then(data => setCoaches(data.coaches ?? []))
      .catch(() => setError('Failed to load coaches'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return coaches.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.plan ?? '').toLowerCase().includes(q)
    )
  }, [coaches, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.full_name.localeCompare(b.full_name)
        case 'clients': return b.clients_count - a.clients_count
        case 'created_at':
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [filtered, sortBy])

  const statusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success'
      case 'trialing': return 'bg-teal/20 text-teal'
      case 'past_due': return 'bg-amber-500/20 text-amber-400'
      case 'canceled': return 'bg-danger/20 text-danger'
      default: return 'bg-gray-800 text-gray-400'
    }
  }

  const planColor = (plan?: string) => {
    switch ((plan ?? '').toLowerCase()) {
      case 'pro': return 'bg-teal/20 text-teal'
      case 'clinic': return 'bg-success/20 text-success'
      default: return 'bg-gray-800 text-gray-300'
    }
  }

  if (loading) return (
    <div className="p-8 text-gray-400">Loading coaches…</div>
  )

  if (error) return (
    <div className="p-8 text-red-400">{error}</div>
  )

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Coaches</h1>
        <p className="text-gray-400">All coaches on the platform ({sorted.length})</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or plan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal/40 pr-10"
          >
            <option value="created_at">Newest First</option>
            <option value="name">Name</option>
            <option value="clients">Clients</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>
                {['Name', 'Email', 'Plan', 'Status', 'Clients', 'Joined'].map(h => (
                  <th key={h} className="text-left py-4 px-6 font-semibold text-gray-500 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    {coaches.length === 0 ? 'No coaches yet' : 'No matches found'}
                  </td>
                </tr>
              ) : sorted.map(coach => (
                <tr key={coach.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{coach.full_name}</td>
                  <td className="py-4 px-6 text-gray-400">{coach.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${planColor(coach.plan)}`}>
                      {coach.plan ?? 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(coach.subscription_status)}`}>
                      {coach.subscription_status ?? 'inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-white font-medium">{coach.clients_count}</td>
                  <td className="py-4 px-6 text-gray-400">
                    {new Date(coach.created_at).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
