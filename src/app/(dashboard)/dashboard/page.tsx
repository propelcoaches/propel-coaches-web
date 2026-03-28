'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, Dumbbell, UtensilsCrossed, ArrowRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Bell,
  Layers, DollarSign, BarChart2,
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
        <h2 className="text-sm font-semibold text-cb-text">{title}</h2>
        {count !== undefined && (
          <span className="text-[11px] font-medium text-cb-muted bg-surface-light border border-cb-border rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-brand hover:underline font-medium">
          View all <ArrowRight size={12} />
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
  const [firstName, setFirstName] = useState<string | null>(null)
  const [activePrograms, setActivePrograms] = useState<ActiveEntry[]>([])
  type ActivityItem = { id: string; type: string; clientName: string; detail: string; timeLabel: string; icon: React.ComponentType<any> }
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [nudgeClients, setNudgeClients] = useState<ClientRow[]>([])
  const [sendingNudge, setSendingNudge] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalClients: 0, activePrograms: 0, checkinRate: 0, revenue: 0 })

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

      // Fetch recent check-ins for activity feed + nudge detection
      if (clients.length > 0) {
        const clientIds = clients.map((c) => c.id)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: checkInData } = await supabase
          .from('check_ins')
          .select('id, client_id, created_at, date')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
          .limit(8)

        const recentActivity = (checkInData ?? []).map((ci) => {
          const client = clients.find((c) => c.id === ci.client_id)
          return {
            id: ci.id,
            type: 'checkin_submitted' as const,
            clientName: client?.name ?? client?.email ?? 'Client',
            detail: 'Weekly check-in submitted',
            timeLabel: formatTimeAgo(ci.created_at ?? ci.date),
            icon: CheckCircle2,
          }
        })
        setActivity(recentActivity)

        // Find clients with no check-in in last 7 days
        const { data: recentCheckIns } = await supabase
          .from('check_ins')
          .select('client_id')
          .in('client_id', clientIds)
          .gte('created_at', sevenDaysAgo)

        const recentClientIds = new Set((recentCheckIns ?? []).map((ci) => ci.client_id))
        const needNudge = clients.filter((c) => !recentClientIds.has(c.id))
        setNudgeClients(needNudge)

        const checkinRate = clients.length > 0
          ? Math.round((recentClientIds.size / clients.length) * 100)
          : 0
        setStats({ totalClients, activePrograms: programs.length, checkinRate, revenue: monthRevenue })
      } else {
        setStats({ totalClients, activePrograms: programs.length, checkinRate: 0, revenue: monthRevenue })
      }

      setLoading(false)
    }
    load()
  }, [])

  const activityIcons: Record<string, React.ReactNode> = {
    workout_logged:      <Dumbbell size={13} className="text-brand" />,
    checkin_submitted:   <CheckCircle2 size={13} className="text-brand" />,
    program_started:     <TrendingUp size={13} className="text-brand" />,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in-up">
      {/* Page greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-cb-text">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-cb-muted mt-1">Here's what's happening with your clients today.</p>
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
          },
          {
            label: 'Active Programs',
            value: stats.activePrograms.toString(),
            icon: Layers,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50',
          },
          {
            label: 'Check-in Rate',
            value: `${stats.checkinRate}%`,
            icon: BarChart2,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-50',
          },
          {
            label: "This Month's Revenue",
            value: stats.revenue > 0 ? `$${stats.revenue.toFixed(0)}` : '$0',
            icon: DollarSign,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50',
          },
        ].map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={iconColor} />
            </div>
            <p className="text-2xl font-bold text-cb-text">{value}</p>
            <p className="text-sm text-cb-muted mt-0.5">{label}</p>
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
                    <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon size={12} className="text-brand" />
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
                    className="flex items-center gap-3 px-4 py-3 bg-surface border border-cb-border rounded-xl hover:border-brand/30 hover:bg-surface-light transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-brand" />
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
