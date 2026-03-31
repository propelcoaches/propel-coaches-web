'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, Dumbbell, ArrowRight,
  Clock, CheckCircle2, Bell,
  Layers, DollarSign, BarChart2, UserPlus, MessageSquare,
  BrainCircuit, AlertTriangle, UtensilsCrossed, X, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'
import EmptyState from '@/components/EmptyState'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string
  name?: string | null
  email?: string | null
  goal?: string | null
  current_weight_kg?: number | null
  created_at?: string
}

interface ProgramRow {
  id: string
  name: string
  client_id: string
  is_active: boolean
  current_week: number
  weeks: number
  days_per_week: number
  updated_at?: string
}

interface ActiveEntry {
  client: ClientRow
  program: ProgramRow
}


function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

function initials(name?: string | null, email?: string | null): string {
  if (name) return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  return (email ?? '??').slice(0, 2).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-semibold text-cb-text tracking-tight">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-[11px] font-semibold text-brand bg-brand/8 rounded-full px-2 py-0.5 tabular-nums">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-brand hover:text-brand-light transition-colors font-medium">
          View all <ArrowRight size={11} />
        </Link>
      )}
    </div>
  )
}

function ActiveProgramCard({ entry, onClick }: { entry: ActiveEntry; onClick: () => void }) {
  const pct = Math.min(100, Math.round((entry.program.current_week / entry.program.weeks) * 100))
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-cb-border rounded-xl p-4 hover:border-brand/30 hover:bg-surface-light transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brand">{initials(entry.client.name, entry.client.email)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-cb-text truncate group-hover:text-brand transition-colors">
            {entry.client.name ?? entry.client.email}
          </p>
          <p className="text-xs text-cb-muted truncate mt-0.5">{entry.program.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div className="h-1.5 bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-cb-muted whitespace-nowrap">
              Wk {entry.program.current_week}/{entry.program.weeks}
            </span>
          </div>
        </div>
        <ArrowRight size={14} className="text-cb-muted group-hover:text-brand transition-colors mt-1 flex-shrink-0" />
      </div>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [activePrograms, setActivePrograms] = useState<ActiveEntry[]>([])
  type ActivityItem = { id: string; type: string; clientName: string; detail: string; timeLabel: string; sortDate: string; icon: React.ComponentType<any> }
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [nudgeClients, setNudgeClients] = useState<ClientRow[]>([])
  const [sendingNudge, setSendingNudge] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalClients: 0, activePrograms: 0, checkinRate: 0, revenue: 0 })
  const [intelligenceSummary, setIntelligenceSummary] = useState<{ red: number; amber: number } | null>(null)

  useEffect(() => {
    if (searchParams.get('setup') === 'complete') {
      setShowWelcome(true)
    }
  }, [searchParams])

  function dismissWelcome() {
    setShowWelcome(false)
    router.replace('/dashboard')
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: profileData }, { data: clientData }, { data: programData }, { data: inviteData }, { data: paidInvoices }] = await Promise.all([
        supabase.from('profiles').select('full_name, name').eq('id', user.id).single(),
        supabase.from('profiles').select('id,name,email,goal').eq('coach_id', user.id).eq('role', 'client'),
        supabase.from('workout_programs').select('id,name,client_id,is_active,current_week,weeks,days_per_week,updated_at')
          .eq('coach_id', user.id).eq('is_active', true).order('updated_at', { ascending: false }),
        supabase.from('client_invitations').select('id').eq('coach_id', user.id),
        supabase.from('invoices').select('amount_cents').eq('coach_id', user.id).eq('status', 'paid')
          .gte('paid_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ])

      const name = (profileData as any)?.full_name || (profileData as any)?.name || ''
      setFirstName(name.split(' ')[0] || null)

      const clients = (clientData ?? []) as ClientRow[]
      const programs = (programData ?? []) as ProgramRow[]
      const entries: ActiveEntry[] = programs.map((p) => ({
        program: p,
        client: clients.find((c) => c.id === p.client_id) ?? { id: p.client_id },
      }))
      setActivePrograms(entries.slice(0, 6))

      const totalClients = clients.length + (inviteData?.length ?? 0)
      const monthRevenue = (paidInvoices ?? []).reduce((s: number, inv: any) => s + (inv.amount_cents ?? 0), 0) / 100

      // Fetch recent activity from multiple sources + nudge detection
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [{ data: checkInData }, { data: recentInvitations }, { data: recentPrograms }] = await Promise.all([
        clients.length > 0
          ? supabase.from('check_ins').select('id, client_id, created_at, date')
              .in('client_id', clients.map((c) => c.id))
              .order('created_at', { ascending: false }).limit(8)
          : Promise.resolve({ data: [] }),
        supabase.from('client_invitations').select('id, client_name, client_email, created_at')
          .eq('coach_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('workout_programs').select('id, name, client_id, created_at')
          .eq('coach_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

      const checkinActivity = (checkInData ?? []).map((ci) => {
        const client = clients.find((c) => c.id === ci.client_id)
        return {
          id: `ci-${ci.id}`,
          type: 'checkin_submitted',
          clientName: client?.name ?? client?.email ?? 'Client',
          detail: 'Weekly check-in submitted',
          timeLabel: formatTimeAgo(ci.created_at ?? ci.date),
          sortDate: ci.created_at ?? ci.date,
          icon: CheckCircle2,
        }
      })

      const inviteActivity = (recentInvitations ?? []).map((inv) => ({
        id: `inv-${inv.id}`,
        type: 'invitation_sent',
        clientName: inv.client_name ?? inv.client_email ?? 'Client',
        detail: 'Client invitation sent',
        timeLabel: formatTimeAgo(inv.created_at),
        sortDate: inv.created_at,
        icon: UserPlus,
      }))

      const programActivity = (recentPrograms ?? []).map((prog) => {
        const client = clients.find((c) => c.id === prog.client_id)
        return {
          id: `prog-${prog.id}`,
          type: 'program_created',
          clientName: client?.name ?? client?.email ?? 'Client',
          detail: `Program "${prog.name}" created`,
          timeLabel: formatTimeAgo(prog.created_at),
          sortDate: prog.created_at,
          icon: Layers,
        }
      })

      const allActivity = [...checkinActivity, ...inviteActivity, ...programActivity]
        .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
        .slice(0, 5)
      setActivity(allActivity)

      if (clients.length > 0) {
        // Find clients with no check-in in last 7 days
        const { data: recentCheckIns } = await supabase
          .from('check_ins')
          .select('client_id')
          .in('client_id', clients.map((c) => c.id))
          .gte('created_at', sevenDaysAgo)

        const recentClientIds = new Set((recentCheckIns ?? []).map((ci) => ci.client_id))
        const needNudge = clients.filter((c) => !recentClientIds.has(c.id))
        setNudgeClients(needNudge)

        const checkinRate = Math.round((recentClientIds.size / clients.length) * 100)
        setStats({ totalClients, activePrograms: programs.length, checkinRate, revenue: monthRevenue })
      } else {
        setStats({ totalClients, activePrograms: programs.length, checkinRate: 0, revenue: monthRevenue })
      }

      setLoading(false)

      // Load intelligence summary in the background (non-blocking)
      fetch('/api/intelligence')
        .then(r => r.json())
        .then(d => {
          if (d.summary) setIntelligenceSummary({ red: d.summary.red, amber: d.summary.amber })
        })
        .catch(() => {})
    }
    load()
  }, [])

  const activityIconColors: Record<string, string> = {
    checkin_submitted: 'text-emerald-600',
    invitation_sent:   'text-blue-600',
    program_created:   'text-brand',
    workout_logged:    'text-brand',
    program_started:   'text-brand',
  }
  const activityIconBgs: Record<string, string> = {
    checkin_submitted: 'bg-emerald-500/10',
    invitation_sent:   'bg-blue-500/10',
    program_created:   'bg-brand/10',
    workout_logged:    'bg-brand/10',
    program_started:   'bg-brand/10',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const QUICK_STARTS = [
    { label: 'Add first client',       href: '/clients',           icon: UserPlus },
    { label: 'Set up branding',        href: '/branding',          icon: Sparkles },
    { label: 'Create workout template', href: '/templates',        icon: Dumbbell },
    { label: 'Explore AI tools',       href: '/workout-programs',  icon: BrainCircuit },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in-up">

      {/* ── Welcome modal ── */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 text-center border-b border-cb-border">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-brand" />
              </div>
              <h2 className="text-lg font-bold text-cb-text">Welcome to Propel{firstName ? `, ${firstName}` : ''}!</h2>
              <p className="text-sm text-cb-muted mt-1">Your account is set up. Here are a few things to get you started.</p>
              <button
                onClick={dismissWelcome}
                className="absolute top-4 right-4 p-1.5 text-cb-muted hover:text-cb-text transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick-start cards */}
            <div className="p-5 grid grid-cols-2 gap-3">
              {QUICK_STARTS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowWelcome(false)}
                  className="flex flex-col items-center justify-center gap-2.5 p-4 bg-surface-light border border-cb-border rounded-xl hover:border-brand/40 hover:bg-brand/5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                    <Icon size={18} className="text-brand" />
                  </div>
                  <span className="text-xs font-medium text-cb-secondary text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>

            {/* Dismiss */}
            <div className="px-5 pb-5">
              <button
                onClick={dismissWelcome}
                className="w-full py-2.5 border border-cb-border rounded-xl text-sm text-cb-secondary hover:bg-surface-light transition-colors"
              >
                I&apos;ll explore on my own
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page greeting */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-cb-text">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-cb-muted mt-1.5">Here&apos;s what&apos;s happening with your clients today.</p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Add Client',      href: '/clients',  icon: UserPlus,     color: 'text-brand',        bg: 'bg-brand/10' },
          { label: 'Create Program',  href: '/programs', icon: Dumbbell,     color: 'text-blue-600',     bg: 'bg-blue-500/10' },
          { label: 'View Messages',   href: '/messages', icon: MessageSquare,color: 'text-emerald-600',  bg: 'bg-emerald-500/10' },
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-4 py-3 bg-surface border border-cb-border rounded-xl hover:border-brand/30 hover:shadow-sm transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={15} className={color} />
            </div>
            <span className="text-sm font-medium text-cb-text group-hover:text-brand transition-colors">{label}</span>
            <ArrowRight size={13} className="text-cb-muted group-hover:text-brand transition-colors ml-auto flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Clients',
            value: stats.totalClients.toString(),
            icon: Users,
            iconColor: 'text-brand',
            iconBg: 'bg-brand/10',
            accentBar: 'bg-brand',
            trend: null,
          },
          {
            label: 'Active Programs',
            value: stats.activePrograms.toString(),
            icon: Layers,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-500/10',
            accentBar: 'bg-blue-500',
            trend: null,
          },
          {
            label: 'Check-in Rate',
            value: `${stats.checkinRate}%`,
            icon: BarChart2,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-500/10',
            accentBar: 'bg-emerald-500',
            trend: stats.checkinRate >= 80 ? 'good' : stats.checkinRate >= 50 ? 'ok' : 'low',
          },
          {
            label: "This Month's Revenue",
            value: stats.revenue > 0 ? `$${stats.revenue.toFixed(0)}` : '—',
            icon: DollarSign,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-500/10',
            accentBar: 'bg-amber-500',
            trend: null,
          },
        ].map(({ label, value, icon: Icon, iconColor, iconBg, accentBar }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-xl p-5 shadow-sm overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-0.5 ${accentBar}`} />
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3.5`}>
              <Icon size={17} className={iconColor} />
            </div>
            <p className="text-2xl font-bold text-cb-text tracking-tight">{value}</p>
            <p className="text-xs text-cb-muted font-medium mt-1 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Nudges ── */}
      {nudgeClients.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {nudgeClients.length} client{nudgeClients.length !== 1 ? 's' : ''} haven&apos;t checked in this week
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {nudgeClients.slice(0, 3).map((c) => c.name ?? c.email ?? 'Client').join(', ')}
              {nudgeClients.length > 3 && ` +${nudgeClients.length - 3} more`}
            </p>
          </div>
          <button
            onClick={async () => {
              setSendingNudge(true)
              try {
                await fetch('/api/notifications/broadcast', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clientIds: nudgeClients.map((c) => c.id), message: 'Reminder: please submit your weekly check-in!' }),
                })
              } finally {
                setSendingNudge(false)
              }
            }}
            disabled={sendingNudge}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            <Bell size={12} />
            {sendingNudge ? 'Sending…' : 'Send Reminder'}
          </button>
        </div>
      )}

      {/* ── Intelligence banner ── */}
      {intelligenceSummary && (intelligenceSummary.red > 0 || intelligenceSummary.amber > 0) && (
        <Link href="/intelligence" className="block mb-6 group">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border border-cb-border rounded-xl hover:border-brand/40 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                <BrainCircuit size={15} className="text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cb-text">Client Intelligence</p>
                <p className="text-xs text-cb-muted">
                  {intelligenceSummary.red > 0 && (
                    <span className="text-red-500 font-medium">{intelligenceSummary.red} at risk</span>
                  )}
                  {intelligenceSummary.red > 0 && intelligenceSummary.amber > 0 && ' · '}
                  {intelligenceSummary.amber > 0 && (
                    <span className="text-amber-500 font-medium">{intelligenceSummary.amber} need attention</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {intelligenceSummary.red > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                  <AlertTriangle size={10} />
                  {intelligenceSummary.red}
                </span>
              )}
              <ArrowRight size={15} className="text-cb-muted group-hover:text-brand transition-colors" />
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Widget 1: Active Programs ── */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Active Programs This Week"
            href="/clients"
            count={activePrograms.length}
          />
          {activePrograms.length === 0 ? (
            <EmptyState
              icon={<Layers size={48} />}
              title="No active programs yet"
              description="Create a program and assign it to a client to see it here."
              actionLabel="Create Program"
              actionHref="/training"
            />
          ) : (
            <div className="space-y-3">
              {activePrograms.map((entry) => (
                <ActiveProgramCard
                  key={entry.program.id}
                  entry={entry}
                  onClick={() => router.push(`/clients/${entry.client.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Widget 2: Recent Activity */}
          <div>
            <SectionHeader title="Recent Activity" />
            {activity.length === 0 ? (
              <div className="bg-surface border border-cb-border rounded-xl p-6 text-center">
                <Clock size={20} className="text-cb-muted mx-auto mb-2" />
                <p className="text-xs text-cb-muted">No recent activity</p>
              </div>
            ) : (
              <div className="bg-surface border border-cb-border rounded-xl overflow-hidden divide-y divide-cb-border">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-lg ${activityIconBgs[item.type] ?? 'bg-brand/10'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <item.icon size={13} className={activityIconColors[item.type] ?? 'text-brand'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-cb-text truncate">{item.clientName}</p>
                      <p className="text-[11px] text-cb-muted truncate">{item.detail}</p>
                    </div>
                    <span className="text-[10px] text-cb-muted flex-shrink-0">{item.timeLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 3: Quick Create */}
          <div>
            <SectionHeader title="Quick Create" />
            <div className="space-y-2">
              {[
                { label: 'New Program',    href: '/training',  icon: Dumbbell,        desc: 'Build a workout plan' },
                { label: 'New Meal Plan',  href: '/nutrition', icon: UtensilsCrossed, desc: 'Design a nutrition plan' },
                { label: 'New Client',     href: '/clients',   icon: Users,           desc: 'Add a coaching client' },
              ].map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-3 px-4 py-3 bg-surface border border-cb-border rounded-xl hover:border-brand/30 hover:bg-surface-light hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand/10 group-hover:bg-brand/15 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon size={18} className="text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cb-text">{a.label}</p>
                      <p className="text-[11px] text-cb-muted">{a.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-cb-muted group-hover:text-brand transition-colors flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
