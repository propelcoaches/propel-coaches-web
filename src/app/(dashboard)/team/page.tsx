'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Shield, Plus, RotateCw, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type TeamMember = {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'coach'
  joinedDate: string
}

type PendingInvitation = {
  id: string
  email: string
  role: string
  sentDate: string
}

type TeamData = {
  id: string
  name: string
  plan: string
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner': return 'bg-warning/20 text-warning'
    case 'admin': return 'bg-teal/20 text-teal'
    default: return 'bg-success/20 text-success'
  }
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamData | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('coach')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      // Find team where this coach is a member
      const { data: memberRow } = await supabase
        .from('team_members')
        .select('team_id, role, joined_at, teams(id, name, plan)')
        .eq('coach_id', user.id)
        .limit(1)
        .single()

      if (!memberRow) { setLoading(false); return }

      const teamData = (memberRow.teams as unknown as TeamData)
      setTeam({ id: teamData.id, name: teamData.name, plan: teamData.plan })

      // Load all members of this team
      const { data: memberRows } = await supabase
        .from('team_members')
        .select('id, role, joined_at, profiles(id, full_name, email)')
        .eq('team_id', teamData.id)
        .order('joined_at', { ascending: true })

      setMembers(
        (memberRows ?? []).map((m: any) => ({
          id: m.profiles.id,
          name: m.profiles.full_name ?? m.profiles.email,
          email: m.profiles.email,
          role: m.role as TeamMember['role'],
          joinedDate: m.joined_at,
        }))
      )

      // Load pending invitations
      const { data: inviteRows } = await supabase
        .from('team_invitations')
        .select('id, email, role, created_at')
        .eq('team_id', teamData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setInvitations(
        (inviteRows ?? []).map((i: any) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          sentDate: i.created_at,
        }))
      )

      setLoading(false)
    })
  }, [])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !team || !userId) return
    setSendingInvite(true)
    setInviteError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('team_invitations').insert({
        team_id: team.id,
        invited_by: userId,
        email: inviteEmail.trim(),
        role: inviteRole,
        status: 'pending',
      })
      if (error) throw error

      setInvitations(prev => [{
        id: Date.now().toString(),
        email: inviteEmail.trim(),
        role: inviteRole,
        sentDate: new Date().toISOString(),
      }, ...prev])
      setInviteEmail('')
      setInviteSent(true)
      setTimeout(() => setInviteSent(false), 3000)
    } catch (e: unknown) {
      setInviteError(e instanceof Error ? e.message : 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    const supabase = createClient()
    await supabase.from('team_invitations').delete().eq('id', inviteId)
    setInvitations(prev => prev.filter(i => i.id !== inviteId))
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return
    const supabase = createClient()
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('coach_id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-cb-muted text-sm">Loading team…</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-8 max-w-lg">
        <div className="bg-surface-light border border-cb-border rounded-xl p-10 text-center">
          <Users className="w-12 h-12 text-cb-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-cb-text mb-2">No team yet</h2>
          <p className="text-sm text-cb-muted">
            Team features are available on multi-coach plans. Upgrade to create or join a team.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-cb-text">{team.name}</h1>
            <span className="px-3 py-1 bg-teal/20 text-teal text-sm font-semibold rounded-full capitalize">
              {team.plan}
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
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">Name</th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">Email</th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">Role</th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">Joined</th>
                    <th className="text-left py-3 px-3 font-semibold text-cb-muted text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-surface transition-colors">
                      <td className="py-3 px-3 font-medium text-cb-text">{member.name}</td>
                      <td className="py-3 px-3 text-cb-muted flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getRoleBadgeColor(member.role)}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-cb-muted">
                        {format(new Date(member.joinedDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-3 flex gap-2">
                        <button className="p-1.5 hover:bg-surface rounded transition-colors text-cb-muted hover:text-cb-text">
                          <Shield className="w-4 h-4" />
                        </button>
                        {member.role !== 'owner' && member.id !== userId && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 hover:bg-surface rounded transition-colors text-cb-muted hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-cb-muted">No team members yet.</td>
                    </tr>
                  )}
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
                  <label className="block text-sm font-medium text-cb-text mb-1">Email Address</label>
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
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {inviteError}
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
          {invitations.length > 0 && (
            <div className="bg-surface-light rounded-xl border border-cb-border p-6">
              <h2 className="text-lg font-bold text-cb-text mb-4">Pending Invitations</h2>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-cb-border">
                    <div className="flex-1">
                      <p className="font-medium text-cb-text flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cb-muted" />
                        {invitation.email}
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(invitation.role)}`}>
                          {invitation.role}
                        </span>
                      </p>
                      <p className="text-sm text-cb-muted">
                        Sent {format(new Date(invitation.sentDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeInvite(invitation.id)}
                      className="p-2 hover:bg-surface-light rounded transition-colors text-cb-muted hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <div className="bg-surface-light rounded-xl border border-cb-border p-6 space-y-4">
            <h3 className="font-bold text-cb-text">Team Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cb-muted">Total Coaches</span>
                <span className="font-semibold text-cb-text">{members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cb-muted">Pending Invites</span>
                <span className="font-semibold text-cb-text">{invitations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cb-muted">Plan</span>
                <span className="font-semibold text-teal capitalize">{team.plan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
