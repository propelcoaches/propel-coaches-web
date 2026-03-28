'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import Link from 'next/link'
import { format, formatDistanceToNowStrict } from 'date-fns'
import {
  UserPlus, Search, Trash2, MoreHorizontal, Tag, SlidersHorizontal, X, Check, ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  id: string
  name: string | null
  email: string | null
  tags: string[]
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  onboarding_completed: boolean
}

type CheckInRow = {
  client_id: string
  date: string
  created_at: string
}

type ProgramRow = {
  client_id: string
  current_week: number
  weeks: number
}

type Invitation = {
  id: string
  client_name: string
  client_email: string
  status: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (email ?? '??').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

type DurationBadge = { text: string; variant: 'blue' | 'green' | 'amber' }

function getDuration(client: Client, program?: ProgramRow): DurationBadge | null {
  const today = new Date()

  if (client.start_date) {
    const start = new Date(client.start_date)
    const currentWeek = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (7 * 86400000)))

    if (client.end_date) {
      const end = new Date(client.end_date)
      const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000))
      if (today > end) return { text: 'Finished', variant: 'green' }
      return { text: `Week ${currentWeek} of ${totalWeeks}`, variant: 'blue' }
    }

    return { text: `Week ${currentWeek}`, variant: 'blue' }
  }

  if (program) {
    if (program.current_week >= program.weeks) return { text: 'Finished', variant: 'green' }
    return { text: `Week ${program.current_week} of ${program.weeks}`, variant: 'blue' }
  }

  return null
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, suggestions }: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
    setOpen(false)
  }

  const removeTag = (tag: string) => onChange(value.filter(t => t !== tag))

  const filtered = suggestions.filter(s => s.includes(input.toLowerCase()) && !value.includes(s))

  return (
    <div ref={ref} className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] px-3 py-2 border border-cb-border rounded-lg bg-surface cursor-text focus-within:ring-2 focus-within:ring-brand"
        onClick={() => setOpen(true)}
      >
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand text-xs rounded-full font-medium">
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:text-brand/60">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); addTag(input) }
            if (e.key === 'Backspace' && !input && value.length) removeTag(value[value.length - 1])
          }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? 'Select or type a tag…' : ''}
          className="flex-1 min-w-[100px] text-sm text-cb-text bg-transparent outline-none placeholder-cb-muted"
        />
      </div>
      {open && (filtered.length > 0 || input.trim()) && (
        <div className="absolute z-20 mt-1 w-full bg-surface border border-cb-border rounded-lg shadow-lg overflow-hidden">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => { e.preventDefault(); addTag(s) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-light text-cb-text flex items-center gap-2"
            >
              <Tag size={12} className="text-cb-muted" /> {s}
            </button>
          ))}
          {input.trim() && !suggestions.includes(input.trim().toLowerCase()) && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); addTag(input) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-light text-brand"
            >
              Create tag &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Row Menu ─────────────────────────────────────────────────────────────────

function RowMenu({ clientId, onDelete }: { clientId: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="p-1.5 rounded-md text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 bg-surface border border-cb-border rounded-lg shadow-lg overflow-hidden">
          <Link
            href={`/clients/${clientId}`}
            className="block px-3 py-2 text-sm text-cb-text hover:bg-surface-light"
            onClick={() => setOpen(false)}
          >
            View profile
          </Link>
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full text-left px-3 py-2 text-sm text-cb-danger hover:bg-cb-danger/5"
          >
            Remove client
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

type Form = {
  name: string
  email: string
  tags: string[]
  setDates: boolean
  start_date: string
  end_date: string
  sendEmail: boolean
}

function AddClientModal({
  onClose,
  onAdded,
  allTags,
  questionnaireForms,
}: {
  onClose: () => void
  onAdded: () => void
  allTags: string[]
  questionnaireForms: { id: string; name: string }[]
}) {
  const [form, setForm] = useState<Form>({
    name: '', email: '', tags: [], setDates: false,
    start_date: '', end_date: '', sendEmail: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (form.sendEmail) {
        // Send invite via existing API
        const res = await fetch('/api/clients/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail: form.email.trim(),
            clientName: form.name.trim(),
            coachId: user.id,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to send invitation')

        // Store extra fields on the invitation record
        if (form.tags.length > 0 || form.start_date || form.end_date) {
          await supabase
            .from('client_invitations')
            .update({
              tags: form.tags,
              start_date: form.start_date || null,
              end_date: form.end_date || null,
            })
            .eq('coach_id', user.id)
            .eq('client_email', form.email.trim())
            .order('created_at', { ascending: false })
            .limit(1)
        }
      } else {
        // Add without sending email — just create an invitation record directly
        const { error: invErr } = await supabase.from('client_invitations').insert({
          coach_id: user.id,
          client_name: form.name.trim(),
          client_email: form.email.trim(),
          status: 'pending',
          tags: form.tags,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        })
        if (invErr) throw invErr
      }

      onAdded()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add client')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-cb-text" />
            <h2 className="text-base font-semibold text-cb-text">Add Client</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {error && <p className="text-xs text-cb-danger bg-cb-danger/10 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-cb-text mb-1.5">
              Client Name <span className="text-cb-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="Type your client's name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cb-text mb-1.5">
              Client Email <span className="text-cb-danger">*</span>
            </label>
            <input
              type="email"
              placeholder="Type your client's email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cb-text mb-1.5">Client Tag</label>
            <TagInput
              value={form.tags}
              onChange={tags => setForm(p => ({ ...p, tags }))}
              suggestions={allTags}
            />
          </div>

          {questionnaireForms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-cb-text mb-1.5">Questionnaire Form</label>
              <div className="relative">
                <select className="w-full appearance-none px-3 py-2.5 border border-cb-border rounded-lg text-sm text-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand pr-8">
                  <option value="">Select a questionnaire form(s)</option>
                  {questionnaireForms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cb-muted pointer-events-none" />
              </div>
            </div>
          )}

          {/* Set dates */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm(p => ({ ...p, setDates: !p.setDates }))}
              className={clsx(
                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                form.setDates ? 'bg-brand border-brand' : 'border-cb-border bg-surface'
              )}
            >
              {form.setDates && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-cb-text">Set client start and end date?</span>
          </label>

          {form.setDates && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label className="text-xs font-medium text-cb-muted block mb-1">Start date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-cb-muted block mb-1">End date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {/* Send email */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm(p => ({ ...p, sendEmail: !p.sendEmail }))}
              className={clsx(
                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                form.sendEmail ? 'bg-brand border-brand' : 'border-cb-border bg-surface'
              )}
            >
              {form.sendEmail && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-cb-text">Email client the login instructions <span className="text-cb-muted">(you can do this later)</span></span>
          </label>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={onClose} className="text-sm text-cb-secondary hover:text-cb-text font-medium">
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Adding…' : 'Add Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [latestCheckIns, setLatestCheckIns] = useState<Map<string, CheckInRow>>(new Map())
  const [activePrograms, setActivePrograms] = useState<Map<string, ProgramRow>>(new Map())
  const [questionnaireForms, setQuestionnaireForms] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: 'client' | 'invitation' } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const tagFilterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (tagFilterRef.current && !tagFilterRef.current.contains(e.target as Node)) setShowTagFilter(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [clientsRes, invRes, formsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, email, tags, start_date, end_date, created_at, updated_at, onboarding_completed')
        .eq('coach_id', user.id)
        .eq('role', 'client')
        .order('created_at', { ascending: false }),
      supabase
        .from('client_invitations')
        .select('id, client_name, client_email, status, created_at')
        .eq('coach_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('check_in_forms')
        .select('id, name')
        .eq('form_type', 'questionnaire'),
    ])

    const clientList = (clientsRes.data ?? []) as Client[]
    setClients(clientList)
    setInvitations((invRes.data ?? []) as Invitation[])
    setQuestionnaireForms(formsRes.data ?? [])

    if (clientList.length > 0) {
      const ids = clientList.map(c => c.id)
      const [ciRes, progRes] = await Promise.all([
        supabase
          .from('check_ins')
          .select('client_id, date, created_at')
          .in('client_id', ids)
          .order('date', { ascending: false }),
        supabase
          .from('workout_programs')
          .select('client_id, current_week, weeks')
          .in('client_id', ids)
          .eq('is_active', true),
      ])

      const ciMap = new Map<string, CheckInRow>()
      for (const ci of (ciRes.data ?? [])) {
        if (!ciMap.has(ci.client_id)) ciMap.set(ci.client_id, ci)
      }
      setLatestCheckIns(ciMap)

      const progMap = new Map<string, ProgramRow>()
      for (const p of (progRes.data ?? [])) {
        progMap.set(p.client_id, p)
      }
      setActivePrograms(progMap)
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, tagFilter])

  // ── Computed ────────────────────────────────────────────────────────────────

  const allTags = Array.from(new Set(clients.flatMap(c => c.tags ?? [])))

  const PAGE_SIZE = 25

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchesSearch = !q || (c.name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q)
    const matchesTag = !tagFilter || (c.tags ?? []).includes(tagFilter)
    return matchesSearch && matchesTag
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length)

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleDeleteClient = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${id}/delete`, { method: 'DELETE' })
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id))
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const handleDeleteInvitation = async (id: string) => {
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('client_invitations').delete().eq('id', id)
      setInvitations(prev => prev.filter(i => i.id !== id))
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="h-6 w-20 bg-surface-light rounded animate-pulse" />
          <div className="h-9 w-28 bg-surface-light rounded-lg animate-pulse" />
        </div>
        <div className="h-10 bg-surface-light rounded-lg animate-pulse mb-4" />
        <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-cb-border last:border-0">
              <div className="w-8 h-8 rounded-full bg-surface-light animate-pulse" />
              <div className="h-4 w-36 bg-surface-light rounded animate-pulse" />
              <div className="ml-auto h-4 w-20 bg-surface-light rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-cb-text">Clients</h1>
        <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mt-1.5" />
      </div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
          <input
            type="text"
            placeholder="Search clients"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Count filter */}
        <button className="flex items-center gap-1.5 px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light transition-colors">
          <SlidersHorizontal size={14} />
          {filtered.length + invitations.length} Client{(filtered.length + invitations.length) !== 1 ? 's' : ''}
          {invitations.length > 0 && <span className="ml-1 text-cb-warning">({invitations.length} invited)</span>}
        </button>

        {/* Tag filter */}
        <div ref={tagFilterRef} className="relative">
          <button
            onClick={() => setShowTagFilter(v => !v)}
            className={clsx(
              'flex items-center gap-1.5 p-2 border rounded-lg text-sm transition-colors',
              tagFilter
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-cb-border text-cb-secondary hover:bg-surface-light'
            )}
          >
            <Tag size={15} />
          </button>
          {showTagFilter && (
            <div className="absolute left-0 mt-1 w-48 bg-surface border border-cb-border rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => { setTagFilter(null); setShowTagFilter(false) }}
                className={clsx('w-full text-left px-3 py-2 text-sm flex items-center gap-2', !tagFilter ? 'text-brand font-medium' : 'text-cb-secondary hover:bg-surface-light')}
              >
                All clients
              </button>
              {allTags.length === 0 && (
                <p className="px-3 py-2 text-xs text-cb-muted">No tags yet</p>
              )}
              {allTags.map(t => (
                <button
                  key={t}
                  onClick={() => { setTagFilter(t); setShowTagFilter(false) }}
                  className={clsx('w-full text-left px-3 py-2 text-sm flex items-center gap-2', tagFilter === t ? 'text-brand font-medium' : 'text-cb-secondary hover:bg-surface-light')}
                >
                  <Tag size={11} className="text-cb-muted" /> {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
          >
            <UserPlus size={15} />
            Add Client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
        {filtered.length === 0 && invitations.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand/8 flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} className="text-brand/60" />
            </div>
            <p className="text-sm font-medium text-cb-secondary mb-1">
              {search || tagFilter ? 'No clients match your filter' : 'No clients yet'}
            </p>
            {!search && !tagFilter && (
              <p className="text-xs text-cb-muted mb-4">Add your first client to get started</p>
            )}
            {!search && !tagFilter && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
              >
                <UserPlus size={14} /> Add Client
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cb-border">
                <th className="w-10 px-4 py-3">
                  <div
                    onClick={toggleSelectAll}
                    className={clsx(
                      'w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors',
                      selected.size === filtered.length && filtered.length > 0
                        ? 'bg-brand border-brand'
                        : 'border-cb-border bg-surface hover:border-cb-secondary'
                    )}
                  >
                    {selected.size === filtered.length && filtered.length > 0 && <Check size={10} className="text-white" />}
                  </div>
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted px-3 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-cb-muted px-3 py-3">Tag</th>
                <th className="text-left text-xs font-semibold text-cb-muted px-3 py-3">Last Check-In</th>
                <th className="text-left text-xs font-semibold text-cb-muted px-3 py-3">Last Active</th>
                <th className="text-left text-xs font-semibold text-cb-muted px-3 py-3">Duration</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cb-border">
              {paginated.map(client => {
                const checkIn = latestCheckIns.get(client.id)
                const program = activePrograms.get(client.id)
                const duration = getDuration(client, program)
                const lastActive = checkIn ? checkIn.created_at : client.updated_at

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-brand/5 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-brand"
                    onClick={() => window.location.href = `/clients/${client.id}`}
                  >
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div
                        onClick={() => toggleSelect(client.id)}
                        className={clsx(
                          'w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors',
                          selected.has(client.id) ? 'bg-brand border-brand' : 'border-cb-border bg-surface hover:border-cb-secondary'
                        )}
                      >
                        {selected.has(client.id) && <Check size={10} className="text-white" />}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-brand/10 text-brand">
                          {getInitials(client.name, client.email)}
                        </div>
                        <span className="text-sm font-medium text-cb-text">{client.name ?? client.email ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(client.tags ?? []).length === 0
                          ? <span className="text-cb-muted text-sm">—</span>
                          : (client.tags ?? []).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-brand/8 text-brand text-xs rounded-full font-medium border border-brand/20">
                              {tag}
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-cb-secondary">
                      {checkIn ? relativeTime(checkIn.date) : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-cb-secondary">
                      {relativeTime(lastActive)}
                    </td>
                    <td className="px-3 py-3.5">
                      {duration ? (
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          duration.variant === 'green'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                        )}>
                          {duration.text}
                        </span>
                      ) : (
                        <span className="text-cb-muted text-sm">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                      <RowMenu
                        clientId={client.id}
                        onDelete={() => setConfirmDelete({ id: client.id, name: client.name ?? 'this client', type: 'client' })}
                      />
                    </td>
                  </tr>
                )
              })}

              {/* Pending invitations */}
              {invitations.map(inv => (
                <tr key={inv.id} className="hover:bg-surface-light transition-colors opacity-70 cursor-pointer" onClick={() => toast.info(`${inv.client_name} has been invited but hasn't activated their account yet.`)}>
                  <td className="px-4 py-3.5" />
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cb-muted/15 flex items-center justify-center flex-shrink-0 text-xs font-bold text-cb-muted">
                        {inv.client_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-cb-text">{inv.client_name}</span>
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-cb-warning/15 text-cb-warning font-medium">Invited</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-cb-muted">—</td>
                  <td className="px-3 py-3.5 text-sm text-cb-muted">—</td>
                  <td className="px-3 py-3.5 text-sm text-cb-muted">Sent {format(new Date(inv.created_at), 'd MMM')}</td>
                  <td className="px-3 py-3.5 text-sm text-cb-muted">—</td>
                  <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setConfirmDelete({ id: inv.id, name: inv.client_name, type: 'invitation' })}
                      className="p-1.5 rounded-md text-cb-muted hover:text-cb-danger hover:bg-cb-danger/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-cb-muted">
            Showing {showingFrom}–{showingTo} of {filtered.length} clients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-cb-border text-cb-secondary hover:bg-surface-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-cb-muted">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-cb-border text-cb-secondary hover:bg-surface-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); load() }}
          allTags={allTags}
          questionnaireForms={questionnaireForms}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-cb-border rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-base font-semibold text-cb-text mb-2">
              Remove {confirmDelete.type === 'client' ? 'client' : 'invitation'}?
            </h2>
            <p className="text-sm text-cb-secondary mb-5">
              Are you sure you want to remove <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-cb-border rounded-lg text-sm font-medium text-cb-secondary hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={() => confirmDelete.type === 'client'
                  ? handleDeleteClient(confirmDelete.id)
                  : handleDeleteInvitation(confirmDelete.id)
                }
                className="flex-1 px-4 py-2 bg-cb-danger text-white rounded-lg text-sm font-medium hover:bg-cb-danger/90 disabled:opacity-50"
              >
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
