'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, CheckCircle, Clock, TrendingUp, Users, Send, Eye, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

type EmailLog = {
  id: string
  recipient: string
  recipient_name: string | null
  sequence: string | null
  email_type: string
  subject: string
  success: boolean
  sent_at: string
}

const EMAIL_SEQUENCES = [
  { id: 'welcome', name: 'Welcome', day: 0, emoji: '🎉' },
  { id: 'day3', name: 'Day 3 Tip', day: 3, emoji: '💡' },
  { id: 'day7', name: 'One Week In', day: 7, emoji: '🏆' },
  { id: 'trial_3day', name: 'Trial -3 Days', day: 11, emoji: '⏳' },
  { id: 'trial_1day', name: 'Trial -1 Day', day: 13, emoji: '🚨' },
  { id: 'trial_expired', name: 'Trial Expired', day: 14, emoji: '⏸️' },
]

type PreviewEmailType = 'welcome' | 'day3' | 'day7' | 'trial_3day' | 'trial_1day' | 'trial_expired' | null

export default function EmailSequencesPage() {
  const [previewEmail, setPreviewEmail] = useState<PreviewEmailType>(null)
  const [recentEmails, setRecentEmails] = useState<EmailLog[]>([])
  const [totalSent, setTotalSent] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingTest, setSendingTest] = useState(false)

  const loadLogs = useCallback(async () => {
    // email_logs is an internal table — use service role via admin API
    // Accessible via admin routes; for the dashboard we fetch via a simple API call
    try {
      const res = await fetch('/api/admin/email-logs')
      if (!res.ok) return
      const data = await res.json()
      setRecentEmails(data.logs ?? [])
      setTotalSent(data.total ?? 0)
    } catch {
      // Non-fatal — show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs() }, [loadLogs])

  const handleSendTest = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email || !previewEmail) return

    setSendingTest(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: previewEmail, email: user.email, name: 'Coach' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Test email sent to ${user.email}`)
        setPreviewEmail(null)
        loadLogs()
      } else {
        toast.error('Failed to send test email')
      }
    } catch {
      toast.error('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  const getPreviewTitle = (emailId: PreviewEmailType): string => {
    const seq = EMAIL_SEQUENCES.find(s => s.id === emailId)
    return seq ? `${seq.emoji} ${seq.name}` : ''
  }

  const getPreviewContent = (emailId: PreviewEmailType): string => {
    switch (emailId) {
      case 'welcome':
        return `Welcome to Propel, Coach! 🎉\n\nYou're 14 days away from transforming how you coach. Here's what to do first:\n\nStep 1: Add your first client via the Clients tab\nStep 2: Build a workout program and assign it\nStep 3: Set macro targets for your client`
      case 'day3':
        return `Day 3 Check-in 👋\n\nHey Coach, you've had 3 days with Propel. Here's a tip to get more out of it:\n\n💡 Pro Tip: Use Check-in Templates\nCoaches who set up weekly check-in questions see 3x higher client engagement.`
      case 'day7':
        return `One week in! 🏆\n\nYou're halfway through your free trial.\n\nYour trial ends in 7 days\nUpgrade now to keep all your client data, programs, and check-in history.`
      case 'trial_3day':
        return `3 days left on your trial ⏳\n\nHey Coach, your Propel trial expires in 3 days. Don't lose your data — upgrade now.\n\n⚠️ What happens when your trial ends\n- Your client profiles will be locked\n- Check-in history will be archived\n- Your programs will be saved but uneditable`
      case 'trial_1day':
        return `Last chance — trial ends tomorrow 🚨\n\nHey Coach, this is your final reminder. Your trial ends tomorrow.\n\nStill unsure? Reply to this email and we'll help you pick the right plan.`
      case 'trial_expired':
        return `Your trial has ended\n\nHey Coach, your Propel trial has expired. Your data is safe — upgrade anytime to get back in.\n\n✅ All your client data is preserved\n✅ Programs and check-ins are saved\n✅ Upgrade and pick up right where you left off`
      default:
        return ''
    }
  }

  const EMAIL_TYPE_LABELS: Record<string, string> = {
    welcome: 'Welcome', day3: 'Day 3 Tip', day7: 'One Week In',
    trial_3day: '3 Days Left', trial_1day: '1 Day Left',
    trial_expired: 'Trial Expired', payment_failed: 'Payment Failed',
    win_back: 'Win-Back', ai_summary: 'AI Summary',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cb-text">Email Sequences</h1>
        <p className="text-sm text-cb-muted mt-0.5">Automated onboarding and engagement emails</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Send size={16} className="text-brand" />
            <p className="text-xs text-cb-muted">Emails Sent</p>
          </div>
          <p className="text-xl font-bold text-cb-text">{totalSent ?? '—'}</p>
          <p className="text-xs text-cb-muted mt-1">All time</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-purple-500" />
            <p className="text-xs text-cb-muted">Open Rate</p>
          </div>
          <p className="text-xl font-bold text-cb-text">—</p>
          <p className="text-xs text-cb-muted mt-1">Tracking not configured</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-500" />
            <p className="text-xs text-cb-muted">Click Rate</p>
          </div>
          <p className="text-xl font-bold text-cb-text">—</p>
          <p className="text-xs text-cb-muted mt-1">Tracking not configured</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-green-500" />
            <p className="text-xs text-cb-muted">Active Sequences</p>
          </div>
          <p className="text-xl font-bold text-cb-text">{EMAIL_SEQUENCES.length}</p>
          <p className="text-xs text-cb-muted mt-1">Running</p>
        </div>
      </div>

      {/* Email Sequence Timeline */}
      <div className="bg-surface border border-cb-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-cb-text mb-6">Onboarding Sequence Timeline</h2>
        <div className="space-y-4">
          {EMAIL_SEQUENCES.map((seq) => (
            <div key={seq.id} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center">
                <span className="text-lg">{seq.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-cb-text">{seq.name}</span>
                  <span className="text-xs text-cb-muted">Day {seq.day}</span>
                </div>
                <p className="text-xs text-cb-muted mt-0.5">Triggered after signup</p>
              </div>
              <button
                onClick={() => setPreviewEmail(seq.id as PreviewEmailType)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:text-cb-text transition-colors"
              >
                Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Email Activity */}
      <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-cb-border">
          <h2 className="text-sm font-semibold text-cb-text">Recent Sends</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-cb-border bg-surface-light">
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">Recipient</th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">Sequence</th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">Email</th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">Sent At</th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cb-border">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-cb-muted">Loading…</td></tr>
            ) : recentEmails.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-cb-muted">No emails sent yet.</td></tr>
            ) : recentEmails.map((item) => (
              <tr key={item.id} className="hover:bg-surface-light">
                <td className="px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-cb-text">{item.recipient_name ?? item.recipient}</p>
                    <p className="text-xs text-cb-muted">{item.recipient}</p>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-cb-secondary">{item.sequence ?? '—'}</td>
                <td className="px-6 py-3 text-sm text-cb-secondary">{EMAIL_TYPE_LABELS[item.email_type] ?? item.email_type}</td>
                <td className="px-6 py-3 text-sm text-cb-secondary">
                  {new Date(item.sent_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                    item.success ? 'bg-cb-success/15 text-cb-success' : 'bg-red-50 text-red-600'
                  )}>
                    {item.success ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {item.success ? 'Sent' : 'Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-cb-border bg-surface-light">
              <h3 className="text-lg font-semibold text-cb-text">{getPreviewTitle(previewEmail)}</h3>
              <button onClick={() => setPreviewEmail(null)} className="text-cb-muted hover:text-cb-text transition-colors">✕</button>
            </div>
            <div className="px-6 py-6 whitespace-pre-wrap text-sm text-cb-secondary leading-relaxed">
              {getPreviewContent(previewEmail)}
            </div>
            <div className="px-6 py-4 border-t border-cb-border flex gap-3 justify-end">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:text-cb-text transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sendingTest && <Loader2 size={14} className="animate-spin" />}
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
