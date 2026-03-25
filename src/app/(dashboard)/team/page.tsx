'use client'

import { useState } from 'react'
import { Users, Mail, Shield, Plus, RotateCw, Trash2, ToggleLeft } from 'lucide-react'
import { format } from 'date-fns'

type TeamMember = {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'coach'
  clientsAssigned: number
  joinedDate: string
}

type PendingInvitation = {
  id: string
  email: string
  invitedBy: string
  sentDate: string
}

// Mock data
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'James Khoury',
    email: 'james@elitehm.com',
    role: 'owner',
    clientsAssigned: 12,
    joinedDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Sarah Mitchell',
    email: 'sarah@elitehm.com',
    role: 'admin',
    clientsAssigned: 8,
    joinedDate: '2024-02-20',
  },
  {
    id: '3',
    name: 'Tom Reid',
    email: 'tom@elitehm.com',
    role: 'coach',
    clientsAssigned: 5,
    joinedDate: '2024-03-01',
  },
  {
    id: '4',
    name: 'Lisa Park',
    email: 'lisa@elitehm.com',
    role: 'coach',
    clientsAssigned: 7,
    joinedDate: '2024-03-10',
  },
]

const MOCK_PENDING_INVITATIONS: PendingInvitation[] = [
  {
    id: '1',
    email: 'newcoach@example.com',
    invitedBy: 'James Khoury',
    sentDate: '2024-03-22',
  },
]

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-warning/20 text-warning'
    case 'admin':
      return 'bg-teal/20 text-teal'
    default:
      return 'bg-success/20 text-success'
  }
}

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('coach')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [allowSharedClients, setAllowSharedClients] = useState(true)

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setSendingInvite(true)
    setTimeout(() => {
      setSendingInvite(false)
      setInviteSent(true)
      setInviteEmail('')
      setTimeout(() => setInviteSent(false), 3000)
    }, 500)
  }

  return (
    <div className="space-y-8 p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-cb-text">Elite Fitness Collective</h1>
            <span className="px-3 py-1 bg-teal/20 text-teal text-sm font-semibold rounded-full">
              Pro Team
            </span>
          </div>
          <p className="text-cb-muted">Manage team members and settings</p>
        </div>
        <Users className="w-12 h-12 text-teal opacity-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Members & Invites */}
        <div className="lg:col-span-2 space-y-8">
          {/* Coaches Table */}
          <div className="bg-surface-light rounded-xl border border-cb-border p-6">
            <h2 className="text-lg font-bold text-cb-text mb-4">Team Coaches</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-cb-border">
                  <tr>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">
                      Name
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">
                      Email
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">
                      Role
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">
                      Clients
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">
                      Joined
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {MOCK_TEAM_MEMBERS.map((member) => (
                    <tr key={member.id} className="hover:bg-surface transition-colors">
                      <td className="py-3 px-3 font-medium text-cb-text">{member.name}</td>
                      <td className="py-3 px-3 text-cb-muted flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold ${getRoleBadgeColor(member.role)}`}
                        >
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-cb-text">{member.clientsAssigned}</td>
                      <td className="py-3 px-3 text-cb-muted">
                        {format(new Date(member.joinedDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-3 flex gap-2">
                        <button className="p-1.5 hover:bg-surface rounded transition-colors text-cb-muted hover:text-cb-text">
                          <Shield className="w-4 h-4" />
                        </button>
                        {member.role !== 'owner' && (
                          <button className="p-1.5 hover:bg-surface rounded transition-colors text-cb-muted hover:text-danger">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite Form */}
          <div className="bg-surface-light rounded-xl border border-cb-border p-6">
            <h2 className="text-lg font-bold text-cb-text mb-4">Invite a Coach</h2>
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-cb-text mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="coach@example.com"
                    className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-teal/40"
                    disabled={sendingInvite}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cb-text mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-2 focus:ring-teal/40"
                    disabled={sendingInvite}
                  >
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {inviteSent && (
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-sm font-medium">
                  Invitation sent successfully!
                </div>
              )}
              <button
                type="submit"
                disabled={!inviteEmail.trim() || sendingInvite}
                className="w-full px-4 py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {sendingInvite ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>

          {/* Pending Invitations */}
          {MOCK_PENDING_INVITATIONS.length > 0 && (
            <div className="bg-surface-light rounded-xl border border-cb-border p-6">
              <h2 className="text-lg font-bold text-cb-text mb-4">Pending Invitations</h2>
              <div className="space-y-3">
                {MOCK_PENDING_INVITATIONS.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-surface rounded-lg border border-cb-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-cb-text flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cb-muted" />
                        {invitation.email}
                      </p>
                      <p className="text-sm text-cb-muted">
                        Invited by {invitation.invitedBy} on{' '}
                        {format(new Date(invitation.sentDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-surface-light rounded transition-colors text-cb-muted hover:text-cb-text">
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-surface-light rounded transition-colors text-cb-muted hover:text-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6">
          {/* Shared Clients Setting */}
          <div className="bg-surface-light rounded-xl border border-cb-border p-6">
            <h2 className="text-lg font-bold text-cb-text mb-4">Team Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex-1">
                  <label className="block font-medium text-cb-text text-sm mb-0.5">
                    Shared Client View
                  </label>
                  <p className="text-xs text-cb-muted">
                    Allow coaches to view each other's clients
                  </p>
                </div>
                <button
                  onClick={() => setAllowSharedClients(!allowSharedClients)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowSharedClients ? 'bg-teal' : 'bg-cb-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowSharedClients ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="text-xs text-cb-muted bg-info/10 border border-info/30 rounded-lg p-3">
                Team coaches can view shared clients and their progress data when this is enabled.
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="bg-surface-light rounded-xl border border-cb-border p-6 space-y-4">
            <h3 className="font-bold text-cb-text">Team Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cb-muted">Total Coaches</span>
                <span className="font-semibold text-cb-text">{MOCK_TEAM_MEMBERS.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cb-muted">Total Clients</span>
                <span className="font-semibold text-cb-text">
                  {MOCK_TEAM_MEMBERS.reduce((sum, m) => sum + m.clientsAssigned, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cb-muted">Plan</span>
                <span className="font-semibold text-teal">Pro Team</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
