'use client'

import { useEffect, useState } from 'react'
import { Autoflow, AutoflowEvent, Profile } from '@/lib/types'
import {
  Zap, Plus, X, Trash2, ToggleLeft, ToggleRight, Dumbbell, FileText,
  MessageCircle, Send, Bell, StickyNote, ChevronDown, ChevronUp
} from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type AutoflowWithClient = Autoflow & { client?: Profile }

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const EVENT_TYPES = [
  {
    type: 'workout_program' as const,
    label: 'Add Workout Program',
    desc: 'Import a workout phase',
    icon: Dumbbell,
    color: 'text-cb-warning',
    bg: 'bg-cb-warning/10',
    border: 'border-cb-warning/30',
    premium: false,
  },
  {
    type: 'resources' as const,
    label: 'Add Resources',
    desc: 'Import resources from your vault',
    icon: FileText,
    color: 'text-cb-teal',
    bg: 'bg-cb-teal/10',
    border: 'border-cb-teal/30',
    premium: false,
  },
  {
    type: 'message' as const,
    label: 'Automated Message',
    desc: 'Send a scheduled automated message',
    icon: MessageCircle,
    color: 'text-cb-success',
    bg: 'bg-cb-success/10',
    border: 'border-cb-success/30',
    premium: true,
  },
  {
    type: 'email' as const,
    label: 'Automated Email',
    desc: 'Send a scheduled automated email',
    icon: Send,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    premium: true,
  },
  {
    type: 'notification' as const,
    label: 'In-App Notification',
    desc: 'Send an in-app notification',
    icon: Bell,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    premium: true,
  },
  {
    type: 'note' as const,
    label: 'Automated Note',
    desc: 'Schedule a public note',
    icon: StickyNote,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    premium: true,
  },
]

// ── Add Event Modal (Autoflow Event Modal) ──
function EventModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (event: AutoflowEvent) => void
}) {
  const [selectedType, setSelectedType] = useState<AutoflowEvent['event_type'] | null>(null)
  const [dayOffset, setDayOffset] = useState(1)
  const [message, setMessage] = useState('')

  function handleAdd() {
    if (!selectedType) return
    const ev: AutoflowEvent = {
      id: genId(),
      autoflow_id: '',
      event_type: selectedType,
      day_offset: dayOffset,
      payload: selectedType === 'message' ? { message } : {},
      created_at: new Date().toISOString(),
    }
    onAdd(ev)
  }

  const selected = EVENT_TYPES.find((e) => e.type === selectedType)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">Autoflow Event</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>

        <div className="p-5">
          {/* Event type grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {EVENT_TYPES.map((et) => {
              const Icon = et.icon
              const isSelected = selectedType === et.type
              return (
                <button
                  key={et.type}
                  onClick={() => setSelectedType(et.type)}
                  className={clsx(
                    'relative text-left p-4 rounded-lg border transition-colors',
                    isSelected ? `border-cb-teal bg-cb-teal/10` : `${et.border} ${et.bg} hover:opacity-80`,
                    et.premium && 'opacity-90'
                  )}
                >
                  {et.premium && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-cb-warning/20 text-cb-warning text-[9px] font-semibold rounded uppercase tracking-wide">
                      Premium
                    </span>
                  )}
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mb-2', et.bg)}>
                    <Icon size={18} className={et.color} />
                  </div>
                  <p className="text-sm font-medium text-cb-text leading-tight mb-0.5">{et.label}</p>
                  <p className="text-[11px] text-cb-muted leading-relaxed">{et.desc}</p>
                </button>
              )
            })}
          </div>

          {/* Config for selected type */}
          {selected && (
            <div className="space-y-3 border-t border-cb-border pt-4">
              <div>
                <label className="block text-xs font-medium text-cb-muted mb-1">Day Offset</label>
                <input
                  type="number"
                  min={0}
                  value={dayOffset}
                  onChange={(e) => setDayOffset(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal"
                />
                <p className="text-[10px] text-cb-muted mt-1">Trigger this event {dayOffset} day(s) after the autoflow starts.</p>
              </div>

              {selected.premium && (
                <div className="bg-cb-warning/10 border border-cb-warning/30 rounded-lg p-3">
                  <p className="text-xs text-cb-warning font-medium">Premium Feature</p>
                  <p className="text-[11px] text-cb-muted mt-0.5">Upgrade to Premium to unlock {selected.label}.</p>
                </div>
              )}

              {selected.type === 'message' && (
                <div className="opacity-50 pointer-events-none">
                  <label className="block text-xs font-medium text-cb-muted mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your automated message…"
                    className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
                    disabled
                  />
                </div>
              )}

              {!selected.premium && (
                <button
                  onClick={handleAdd}
                  className="w-full py-2.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium"
                >
                  Add Event
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border hover:bg-surface-light rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Autoflow Modal ──
function AddAutoflowModal({
  clients,
  onClose,
  onAdd,
}: {
  clients: Profile[]
  onClose: () => void
  onAdd: (af: AutoflowWithClient) => void
}) {
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [triggerType, setTriggerType] = useState<'day' | 'event' | 'manual'>('day')
  const [events, setEvents] = useState<AutoflowEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)

  function handleAdd() {
    if (!name.trim()) return
    const client = clients.find((c) => c.id === clientId)
    const af: AutoflowWithClient = {
      id: genId(),
      coach_id: '',
      client_id: clientId || null,
      name: name.trim(),
      trigger_type: triggerType,
      trigger_day: null,
      events: events.map((e) => ({ ...e, autoflow_id: genId() })),
      is_active: true,
      created_at: new Date().toISOString(),
      client,
    }
    onAdd(af)
  }

  function handleAddEvent(ev: AutoflowEvent) {
    setEvents((prev) => [...prev, ev])
    setShowEventModal(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-cb-border">
            <h2 className="text-lg font-semibold text-cb-text">Add Autoflow</h2>
            <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Onboarding Flow"
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal" />
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-cb-teal">
                <option value="">All Clients (global)</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-2">Start Trigger</label>
              <div className="flex gap-2">
                {([
                  { value: 'day', label: 'Day 1' },
                  { value: 'event', label: 'When client joins' },
                  { value: 'manual', label: 'Manual' },
                ] as const).map((t) => (
                  <button key={t.value} onClick={() => setTriggerType(t.value)}
                    className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                      triggerType === t.value ? 'border-cb-teal bg-cb-teal/10 text-cb-teal' : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Events timeline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-cb-muted">Events ({events.length})</label>
                <button onClick={() => setShowEventModal(true)}
                  className="flex items-center gap-1 text-xs text-cb-teal hover:text-cb-teal/80">
                  <Plus size={12} /> Add Event
                </button>
              </div>
              {events.length === 0 ? (
                <div className="bg-surface-light border border-dashed border-cb-border rounded-lg p-4 text-center text-xs text-cb-muted">
                  No events yet. Click &quot;Add Event&quot; to build your flow.
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((ev, i) => {
                    const et = EVENT_TYPES.find((e) => e.type === ev.event_type)
                    const Icon = et?.icon ?? Zap
                    return (
                      <div key={ev.id} className="flex items-center gap-3 bg-surface-light border border-cb-border rounded-lg px-3 py-2.5">
                        <div className={clsx('w-6 h-6 rounded flex items-center justify-center flex-shrink-0', et?.bg)}>
                          <Icon size={13} className={et?.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-cb-text">{et?.label ?? ev.event_type}</p>
                          <p className="text-[10px] text-cb-muted">Day +{ev.day_offset}</p>
                        </div>
                        <button onClick={() => setEvents((prev) => prev.filter((_, j) => j !== i))}
                          className="text-cb-muted hover:text-cb-danger">
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
            <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text border border-cb-border rounded-lg hover:bg-surface-light transition-colors">Close</button>
            <button onClick={handleAdd} disabled={!name.trim()}
              className="px-4 py-2 text-sm bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg font-medium">
              Create Autoflow
            </button>
          </div>
        </div>
      </div>
      {showEventModal && <EventModal onClose={() => setShowEventModal(false)} onAdd={handleAddEvent} />}
    </>
  )
}

// ── Main Page ──
export default function AutoflowPage() {
  const [autoflows, setAutoflows] = useState<AutoflowWithClient[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data: clientData } = await supabase.from('profiles').select('id, full_name, email').eq('coach_id', user.id).eq('role', 'client').order('full_name')
      setClients((clientData ?? []).map((c: any) => ({ ...c, name: c.full_name })) as unknown as Profile[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: afData } = await supabase.from('autoflows').select('*, profiles(id, full_name, email)').eq('coach_id', user.id).order('created_at', { ascending: false }) as any
      if (afData) {
        setAutoflows(afData.map((af: any) => ({
          ...af,
          events: af.events ?? [],
          client: af.profiles ? { ...af.profiles, name: af.profiles.full_name } as unknown as Profile : undefined,
        })))
      }
      setLoading(false)
    })
  }, [])

  async function toggleActive(id: string) {
    const af = autoflows.find((a) => a.id === id)
    if (!af) return
    const newActive = !af.is_active
    setAutoflows((prev) => prev.map((a) => a.id === id ? { ...a, is_active: newActive } : a))
    const supabase = createClient()
    await supabase.from('autoflows').update({ is_active: newActive, updated_at: new Date().toISOString() }).eq('id', id)
  }

  async function deleteAutoflow(id: string) {
    setAutoflows((prev) => prev.filter((af) => af.id !== id))
    const supabase = createClient()
    await supabase.from('autoflows').delete().eq('id', id)
  }

  async function handleAdd(af: AutoflowWithClient) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      coach_id: user.id,
      client_id: af.client_id || null,
      name: af.name,
      trigger_type: af.trigger_type,
      trigger_day: af.trigger_day,
      events: af.events,
      is_active: true,
    }
    const { data } = await supabase.from('autoflows').insert(payload).select('*, profiles(id, full_name, email)').single() as any
    if (data) {
      setAutoflows((prev) => [{
        ...data,
        events: data.events ?? [],
        client: data.profiles ? { ...data.profiles, name: data.profiles.full_name } as unknown as Profile : af.client,
      }, ...prev])
    }
    setShowAddModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Autoflow</h1>
          <p className="text-sm text-cb-muted mt-0.5">Automate your coaching workflows and client communications</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Add Autoflow
        </button>
      </div>

      {autoflows.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <Zap size={48} className="mx-auto text-cb-muted mb-4" />
          <h2 className="text-lg font-semibold text-cb-secondary mb-2">No Autoflows Yet</h2>
          <p className="text-sm text-cb-muted max-w-sm mx-auto">
            Build automated workflows — trigger messages, assign programs, and update client statuses based on events.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium"
          >
            Create Your First Autoflow
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {autoflows.map((af) => {
            const isExpanded = expandedId === af.id
            return (
              <div key={af.id} className="bg-surface border border-cb-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    af.is_active ? 'bg-cb-teal/10' : 'bg-surface-light'
                  )}>
                    <Zap size={16} className={af.is_active ? 'text-cb-teal' : 'text-cb-muted'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-cb-text">{af.name}</p>
                      <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                        af.is_active ? 'bg-cb-success/15 text-cb-success' : 'bg-surface-light text-cb-muted'
                      )}>
                        {af.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-cb-muted">
                      <span>{af.client ? af.client.name : 'All clients'}</span>
                      <span>·</span>
                      <span>{af.events.length} event{af.events.length !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span className="capitalize">{af.trigger_type} trigger</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(af.id)}
                      className={clsx('p-1.5 rounded-lg transition-colors', af.is_active ? 'text-cb-success hover:bg-cb-success/10' : 'text-cb-muted hover:bg-surface-light')}
                      title={af.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {af.is_active ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : af.id)} className="text-cb-muted hover:text-cb-secondary p-1.5">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => deleteAutoflow(af.id)} className="text-cb-muted hover:text-cb-danger p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {isExpanded && af.events.length > 0 && (
                  <div className="border-t border-cb-border px-5 py-4">
                    <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-3">Events Timeline</p>
                    <div className="space-y-2">
                      {af.events.map((ev, i) => {
                        const et = EVENT_TYPES.find((e) => e.type === ev.event_type)
                        const Icon = et?.icon ?? Zap
                        return (
                          <div key={ev.id} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', et?.bg)}>
                                <Icon size={14} className={et?.color} />
                              </div>
                              {i < af.events.length - 1 && <div className="w-px h-4 bg-cb-border mt-1" />}
                            </div>
                            <div>
                              <p className="text-sm text-cb-text">{et?.label ?? ev.event_type}</p>
                              <p className="text-xs text-cb-muted">Day +{ev.day_offset}</p>
                            </div>
                            {et?.premium && (
                              <span className="px-1.5 py-0.5 bg-cb-warning/20 text-cb-warning text-[9px] font-semibold rounded uppercase tracking-wide ml-auto">
                                Premium
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && af.events.length === 0 && (
                  <div className="border-t border-cb-border px-5 py-4 text-sm text-cb-muted">
                    No events configured.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AddAutoflowModal clients={clients} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
