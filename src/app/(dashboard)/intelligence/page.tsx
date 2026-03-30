'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, CheckCircle2, Loader2, Sparkles,
  RefreshCw, TrendingDown, MessageSquareOff,
  Zap, Moon, Activity, Dumbbell, ChevronRight,
  BrainCircuit, Users,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from '@/lib/toast'
import type { ClientSignal } from '@/app/api/intelligence/route'

// ─── Signal metadata ──────────────────────────────────────────────────────────

const SIGNAL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  no_checkin_7d:     { label: 'No check-in (7d)',  icon: <AlertTriangle size={11} />, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  no_checkin_14d:    { label: 'No check-in (14d)', icon: <AlertTriangle size={11} />, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
  declining_energy:  { label: 'Energy declining',  icon: <TrendingDown size={11} />,  color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' },
  high_stress:       { label: 'High stress',       icon: <Zap size={11} />,           color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
  poor_sleep:        { label: 'Poor sleep',        icon: <Moon size={11} />,          color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  gone_quiet:        { label: 'Gone quiet',        icon: <MessageSquareOff size={11}/>,color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  no_active_program: { label: 'No program',        icon: <Dumbbell size={11} />,      color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' },
}

const RISK_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
  red:   { bar: 'bg-red-500',   badge: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',   label: 'At Risk' },
  amber: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', label: 'Needs Attention' },
  green: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', label: 'On Track' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricPill({ label, value, unit = '' }: { label: string; value: number | null; unit?: string }) {
  if (value == null) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs text-cb-secondary">
      <span className="text-cb-muted">{label}</span>
      <span className="font-semibold text-cb-text">{value}{unit}</span>
    </span>
  )
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
  return (
    <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

// ─── Client card ──────────────────────────────────────────────────────────────

function ClientCard({ client, onLoadInsight }: {
  client: ClientSignal
  onLoadInsight: (id: string) => void
}) {
  const risk = RISK_STYLES[client.risk_level]
  const m = client.metrics

  return (
    <div className={clsx(
      'bg-surface border border-cb-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      client.risk_level === 'red'   && 'border-l-4 border-l-red-500',
      client.risk_level === 'amber' && 'border-l-4 border-l-amber-400',
      client.risk_level === 'green' && 'border-l-4 border-l-emerald-500',
    )}>
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={client.full_name} url={client.avatar_url} />
            <div className="min-w-0">
              <p className="font-semibold text-cb-text truncate">{client.full_name}</p>
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-0.5', risk.badge)}>
                {client.risk_level === 'red'   && <AlertTriangle size={10} />}
                {client.risk_level === 'amber' && <AlertTriangle size={10} />}
                {client.risk_level === 'green' && <CheckCircle2 size={10} />}
                {risk.label}
              </span>
            </div>
          </div>
          <Link
            href={`/clients/${client.client_id}`}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-light text-cb-muted hover:text-brand transition-colors"
          >
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Signals */}
        {client.signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {client.signals.map(s => {
              const meta = SIGNAL_META[s]
              if (!meta) return null
              return (
                <span key={s} className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', meta.color)}>
                  {meta.icon}
                  {meta.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Metrics row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {m.days_since_checkin < 999 && (
            <MetricPill label="Last check-in" value={m.days_since_checkin} unit="d ago" />
          )}
          {m.avg_energy_last_7d != null && (
            <MetricPill label="Energy" value={m.avg_energy_last_7d} unit="/10" />
          )}
          {m.avg_stress_last_7d != null && (
            <MetricPill label="Stress" value={m.avg_stress_last_7d} unit="/10" />
          )}
          {m.avg_sleep_last_7d != null && (
            <MetricPill label="Sleep" value={m.avg_sleep_last_7d} unit="/10" />
          )}
          {m.latest_bodyweight_kg != null && (
            <MetricPill label="Weight" value={m.latest_bodyweight_kg} unit=" kg" />
          )}
          {m.bodyweight_delta_kg != null && Math.abs(m.bodyweight_delta_kg) > 0.1 && (
            <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold', m.bodyweight_delta_kg > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
              {m.bodyweight_delta_kg > 0 ? '▲' : '▼'} {Math.abs(m.bodyweight_delta_kg).toFixed(1)} kg
            </span>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {client.ai_insight ? (
        <div className="px-5 py-3 bg-brand/5 border-t border-brand/10 flex gap-2.5">
          <BrainCircuit size={14} className="text-brand flex-shrink-0 mt-0.5" />
          <p className="text-xs text-cb-secondary leading-relaxed">{client.ai_insight}</p>
        </div>
      ) : client.risk_level !== 'green' ? (
        <div className="px-5 py-3 border-t border-cb-border">
          <button
            onClick={() => onLoadInsight(client.client_id)}
            className="flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 font-medium transition-colors"
          >
            <Sparkles size={12} />
            Generate AI insight
          </button>
        </div>
      ) : null}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const [clients, setClients]       = useState<ClientSignal[]>([])
  const [summary, setSummary]       = useState({ total: 0, red: 0, amber: 0, green: 0 })
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]         = useState<'all' | 'red' | 'amber' | 'green'>('all')
  const [loadingInsights, setLoadingInsights] = useState<Set<string>>(new Set())

  const fetchSignals = useCallback(async (withInsights = false) => {
    try {
      const url = `/api/intelligence${withInsights ? '?insights=true' : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load signals')
      const data = await res.json()
      setClients(data.clients ?? [])
      setSummary(data.summary ?? { total: 0, red: 0, amber: 0, green: 0 })
    } catch {
      toast.error('Failed to load client intelligence')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchSignals().finally(() => setLoading(false))
  }, [fetchSignals])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSignals()
    setRefreshing(false)
    toast.info('Signals refreshed')
  }

  const handleLoadInsight = async (clientId: string) => {
    setLoadingInsights(prev => new Set(prev).add(clientId))
    try {
      const res = await fetch(`/api/intelligence?insights=true`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const updated = (data.clients ?? []) as ClientSignal[]
      setClients(prev => prev.map(c => {
        const fresh = updated.find(u => u.client_id === c.client_id)
        return fresh ?? c
      }))
    } catch {
      toast.error('Failed to generate insight')
    } finally {
      setLoadingInsights(prev => { const n = new Set(prev); n.delete(clientId); return n })
    }
  }

  const handleLoadAllInsights = async () => {
    setRefreshing(true)
    try {
      await fetchSignals(true)
      toast.info('AI insights generated')
    } catch {
      toast.error('Failed to generate insights')
    } finally {
      setRefreshing(false)
    }
  }

  const filtered = filter === 'all' ? clients : clients.filter(c => c.risk_level === filter)
  const atRiskCount = summary.red + summary.amber

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit size={22} className="text-brand" />
            <h1 className="text-2xl font-bold text-cb-text">Client Intelligence</h1>
          </div>
          <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mb-2" />
          <p className="text-sm text-cb-muted">Engagement signals, wellbeing trends, and churn risk across your roster</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadAllInsights}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-brand text-brand rounded-lg hover:bg-brand/5 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Insights
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-cb-border text-cb-secondary rounded-lg hover:border-brand/40 hover:text-brand transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { key: 'all',   label: 'Total Clients', value: summary.total, color: 'text-brand',          bg: 'border-l-brand' },
          { key: 'red',   label: 'At Risk',        value: summary.red,   color: 'text-red-500',        bg: 'border-l-red-500' },
          { key: 'amber', label: 'Needs Attention',value: summary.amber, color: 'text-amber-500',      bg: 'border-l-amber-400' },
          { key: 'green', label: 'On Track',        value: summary.green, color: 'text-emerald-500',   bg: 'border-l-emerald-500' },
        ].map(({ key, label, value, color, bg }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={clsx(
              'bg-surface border border-cb-border border-l-4 rounded-xl p-4 text-left transition-all shadow-sm hover:shadow-md',
              bg,
              filter === key && 'ring-2 ring-brand/30',
            )}
          >
            <p className="text-xs font-medium text-cb-muted mb-1">{label}</p>
            <p className={clsx('text-3xl font-bold', color)}>{loading ? '—' : value}</p>
          </button>
        ))}
      </div>

      {/* At-risk alert banner */}
      {!loading && atRiskCount > 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">{atRiskCount} client{atRiskCount !== 1 ? 's' : ''}</span> need{atRiskCount === 1 ? 's' : ''} your attention.
            {summary.red > 0 && ` ${summary.red} ${summary.red === 1 ? 'is' : 'are'} at high churn risk.`}
          </p>
        </div>
      )}

      {/* Client grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-cb-muted">
          <Loader2 size={28} className="animate-spin mb-3" />
          <p className="text-sm">Analysing client signals…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users size={40} className="text-cb-border mb-3" />
          <p className="font-semibold text-cb-text mb-1">
            {filter === 'all' ? 'No clients yet' : `No ${filter === 'green' ? 'on-track' : filter === 'amber' ? 'amber' : 'at-risk'} clients`}
          </p>
          <p className="text-sm text-cb-muted">
            {filter === 'all'
              ? 'Add clients to start seeing intelligence signals.'
              : 'All clear in this category.'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="mt-3 text-sm text-brand hover:underline">Show all clients</button>
          )}
        </div>
      ) : (
        <>
          {/* Sort: red first, then amber, then green */}
          {(['red', 'amber', 'green'] as const)
            .filter(r => filter === 'all' || filter === r)
            .map(r => {
              const group = filtered.filter(c => c.risk_level === r)
              if (group.length === 0) return null
              const titles = { red: 'At Risk', amber: 'Needs Attention', green: 'On Track' }
              const icons = {
                red:   <AlertTriangle size={14} className="text-red-500" />,
                amber: <Activity size={14} className="text-amber-500" />,
                green: <CheckCircle2 size={14} className="text-emerald-500" />,
              }
              return (
                <div key={r} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    {icons[r]}
                    <h2 className="text-sm font-semibold text-cb-text">{titles[r]}</h2>
                    <span className="text-xs text-cb-muted">({group.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.map(client => (
                      <ClientCard
                        key={client.client_id}
                        client={
                          loadingInsights.has(client.client_id)
                            ? { ...client, ai_insight: 'Generating insight…' }
                            : client
                        }
                        onLoadInsight={handleLoadInsight}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
        </>
      )}
    </div>
  )
}
