'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, Dumbbell, UtensilsCrossed, ArrowRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS, DEMO_PROGRAMS } from '@/lib/demo/mockData'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

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

// ── Mock recent activity ──────────────────────────────────────────────────────

function buildDemoActivity(clients: ClientRow[], programs: ProgramRow[]) {
  const now = new Date()
  return [
    {
      id: '1',
      type: 'workout_logged' as const,
      clientName: clients[0]?.name ?? 'Client',
      detail: programs[0]?.name ?? 'Program',
      minutesAgo: 47,
      icon: Dumbbell,
    },
    {
      id: '2',
      type: 'checkin_submitted' as const,
      clientName: clients[1]?.name ?? 'Client',
      detail: 'Weekly check-in submitted',
      minutesAgo: 180,
      icon: CheckCircle2,
    },
    {
      id: '3',
      type: 'program_started' as const,
      clientName: clients[2]?.name ?? clients[0]?.name ?? 'Client',
      detail: programs[1]?.name ?? programs[0]?.name ?? 'Program',
      minutesAgo: 720,
      icon: TrendingUp,
    },
  ].map((a) => ({
    ...a,
    timeLabel: a.minutesAgo < 60
      ? `${a.minutesAgo}m ago`
      : a.minutesAgo < 1440
      ? `${Math.round(a.minutesAgo / 60)}h ago`
      : `${Math.round(a.minutesAgo / 1440)}d ago`,
  }))
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
  const isDemo = useIsDemo()
  const router = useRouter()
  const [activePrograms, setActivePrograms] = useState<ActiveEntry[]>([])
  type ActivityItem = { id: string; type: string; clientName: string; detail: string; timeLabel: string; icon: React.ComponentType<any> }
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      const clients = DEMO_CLIENTS as unknown as ClientRow[]
      const programs = (DEMO_PROGRAMS as unknown as ProgramRow[]).filter((p) => p.is_active)
      const entries: ActiveEntry[] = programs.map((p) => ({
        program: p,
        client: clients.find((c) => c.id === p.client_id) ?? { id: p.client_id },
      }))
      setActivePrograms(entries)
      setActivity(buildDemoActivity(clients, programs) as ActivityItem[])
      setLoading(false)
      return
    }

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: clientData }, { data: programData }] = await Promise.all([
        supabase.from('profiles').select('id,name,email,goal').eq('coach_id', user.id).eq('role', 'client'),
        supabase.from('workout_programs').select('id,name,client_id,is_active,current_week,weeks,days_per_week,updated_at')
          .eq('coach_id', user.id).eq('is_active', true).order('updated_at', { ascending: false }),
      ])

      const clients = (clientData ?? []) as ClientRow[]
      const programs = (programData ?? []) as ProgramRow[]
      const entries: ActiveEntry[] = programs.map((p) => ({
        program: p,
        client: clients.find((c) => c.id === p.client_id) ?? { id: p.client_id },
      }))
      setActivePrograms(entries.slice(0, 6))

      // Fetch recent check-ins for activity feed
      if (clients.length > 0) {
        const clientIds = clients.map((c) => c.id)
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
      }

      setLoading(false)
    }
    load()
  }, [isDemo])

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
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page greeting */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-cb-text">Welcome back</h1>
        <p className="text-sm text-cb-muted mt-1">Here's what's happening with your clients today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Widget 1: Active Programs ── */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Active Programs This Week"
            href="/clients"
            count={activePrograms.length}
          />
          {activePrograms.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-cb-border flex items-center justify-center mx-auto mb-3">
                <Dumbbell size={20} className="text-cb-muted" />
              </div>
              <p className="text-sm font-medium text-cb-secondary">No active programs yet</p>
              <p className="text-xs text-cb-muted mt-1 mb-4">Create a program and assign it to a client to see it here.</p>
              <Link
                href="/training"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
              >
                <Dumbbell size={14} /> Create Program
              </Link>
            </div>
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
