'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, ClientInvitation } from '@/lib/types'
import Link from 'next/link'
import { format } from 'date-fns'
import { Users, UserPlus, Search, X, ChevronRight, Trash2 } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS } from '@/lib/demo/mockData'

type InviteForm = {
  client_name: string
  client_email: string
  goal: string
}

export default function ClientsPage() {
  const isDemo = useIsDemo()
  const [clients, setClients] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<ClientInvitation[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState<InviteForm>({ client_name: '', client_email: '', goal: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'client' | 'invitation'; id: string; name: string } | null>(null)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo])

  async function loadData() {
    setLoading(true)

    if (isDemo) {
      setClients(DEMO_CLIENTS as unknown as Profile[])
      setInvitations([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: clientData }, { data: invitationData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('coach_id', user.id)
        .eq('role', 'client')
        .order('created_at', { ascending: false }),
      supabase
        .from('client_invitations')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setClients(clientData ?? [])
    setInvitations(invitationData ?? [])
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo) {
      setInviteSuccess(true)
      setTimeout(() => {
        setInviteSuccess(false)
        setShowInviteModal(false)
      }, 1500)
      return
    }

    setInviting(true)
    setInviteError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const res = await fetch('/api/clients/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientEmail: inviteForm.client_email,
        clientName: inviteForm.client_name,
        goal: inviteForm.goal || null,
        coachId: user.id,
      }),
    })
    const json = await res.json()
    if (!res.ok || json.error) {
      setInviteError(json.error ?? 'Failed to send invitation')
      setInviting(false)
      return
    }

    setInviteSuccess(true)
    setInviteForm({ client_name: '', client_email: '', goal: '' })
    setInviting(false)
    loadData()
    setTimeout(() => { setInviteSuccess(false); setShowInviteModal(false) }, 1500)
  }

  async function handleDeleteClient(clientId: string) {
    setDeletingId(clientId)
    const res = await fetch(`/api/clients/${clientId}/delete`, { method: 'DELETE' })
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== clientId))
    }
    setDeletingId(null)
    setConfirmDelete(null)
  }

  async function handleDeleteInvitation(invId: string) {
    setDeletingId(invId)
    const supabase = createClient()
    await supabase.from('client_invitations').delete().eq('id', invId)
    setInvitations((prev) => prev.filter((i) => i.id !== invId))
    setDeletingId(null)
    setConfirmDelete(null)
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.goal ?? '').toLowerCase().includes(q)
    )
  })

  const pendingCount = invitations.filter((i) => i.status === 'pending').length

  function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Clients</h1>
          <p className="text-sm text-cb-muted mt-0.5">Manage your coaching clients</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-cb-teal hover:bg-cb-teal/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-cb-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cb-teal/10 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-cb-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cb-text">{clients.length}</p>
              <p className="text-xs text-cb-muted">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-cb-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cb-success/15 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-cb-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cb-text">
                {clients.filter((c) => c.onboarding_completed).length}
              </p>
              <p className="text-xs text-cb-muted">Active (Onboarded)</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-cb-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cb-warning/15 rounded-lg flex items-center justify-center">
              <UserPlus size={18} className="text-cb-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cb-text">{pendingCount}</p>
              <p className="text-xs text-cb-muted">Pending Invitations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
        <input
          type="text"
          placeholder="Search clients by name, email or goal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal bg-surface-light"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto text-cb-muted mb-3" />
            <p className="text-cb-secondary font-medium">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
            {!search && (
              <p className="text-sm text-cb-muted mt-1">
                Add your first client using the button above
              </p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cb-border bg-surface-light">
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">
                  Client
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">
                  Goal
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">
                  Current Weight
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">
                  Started
                </th>
                <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cb-border">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-surface-light transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-cb-teal">
                          {getInitials(client.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cb-text">{client.name ?? '—'}</p>
                        <p className="text-xs text-cb-muted">{client.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-cb-secondary">{client.goal ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-cb-secondary">
                      {client.current_weight_kg ? `${client.current_weight_kg} kg` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-cb-muted">
                      {format(new Date(client.created_at), 'd MMM yyyy')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {client.onboarding_completed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cb-success/15 text-cb-success">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cb-warning/15 text-cb-warning">
                        Onboarding
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center gap-1 text-sm text-cb-teal hover:text-cb-teal/80 font-medium"
                      >
                        View
                        <ChevronRight size={14} />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete({ type: 'client', id: client.id, name: client.name ?? 'this client' })}
                        className="text-cb-muted hover:text-cb-danger transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === 'pending').length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-cb-secondary mb-3">Pending Invitations</h2>
          <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cb-border bg-surface-light">
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Goal</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Sent</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cb-border">
                {invitations.filter((i) => i.status === 'pending').map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 text-sm text-cb-text">{inv.client_name}</td>
                    <td className="px-4 py-3 text-sm text-cb-secondary">{inv.client_email}</td>
                    <td className="px-4 py-3 text-sm text-cb-secondary">{inv.goal ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-cb-muted">{format(new Date(inv.created_at), 'd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cb-warning/15 text-cb-warning">
                        Pending
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmDelete({ type: 'invitation', id: inv.id, name: inv.client_name })}
                        className="text-cb-muted hover:text-cb-danger transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-cb-border shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-cb-text mb-2">Remove {confirmDelete.type === 'client' ? 'Client' : 'Invitation'}?</h2>
            <p className="text-sm text-cb-secondary mb-6">
              Are you sure you want to remove <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-cb-border rounded-md text-sm font-medium text-cb-secondary hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                disabled={deletingId === confirmDelete.id}
                onClick={() => confirmDelete.type === 'client' ? handleDeleteClient(confirmDelete.id) : handleDeleteInvitation(confirmDelete.id)}
                className="flex-1 px-4 py-2 bg-cb-danger hover:bg-cb-danger/90 disabled:opacity-50 text-white rounded-md text-sm font-medium"
              >
                {deletingId === confirmDelete.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-cb-border shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cb-border">
              <h2 className="text-lg font-semibold text-cb-text">Add Client</h2>
              <button
                onClick={() => { setShowInviteModal(false); setInviteError(null); setInviteSuccess(false) }}
                className="text-cb-muted hover:text-cb-secondary"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-cb-secondary mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.client_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cb-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.client_email}
                  onChange={(e) => setInviteForm({ ...inviteForm, client_email: e.target.value })}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cb-secondary mb-1">Goal (optional)</label>
                <input
                  type="text"
                  value={inviteForm.goal}
                  onChange={(e) => setInviteForm({ ...inviteForm, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-cb-border rounded-md text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal"
                  placeholder="Lose weight, build muscle…"
                />
              </div>
              {inviteError && (
                <div className="bg-cb-danger/15 border border-cb-danger/30 rounded-md px-3 py-2">
                  <p className="text-sm text-cb-danger">{inviteError}</p>
                </div>
              )}
              {inviteSuccess && (
                <div className="bg-cb-success/15 border border-cb-success/30 rounded-md px-3 py-2">
                  <p className="text-sm text-cb-success">
                    {isDemo ? 'Demo: Invitation simulated!' : 'Invitation sent successfully!'}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteError(null) }}
                  className="flex-1 px-4 py-2 border border-cb-border rounded-md text-sm font-medium text-cb-secondary hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
