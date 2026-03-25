'use client'

import { useState } from 'react'
import { Mail, CheckCircle, Clock, TrendingUp, Users, Send, Eye } from 'lucide-react'
import clsx from 'clsx'

const RECENT_EMAILS = [
  { recipient: 'alex@fitpro.com', name: 'Alex Thompson', sequence: 'Onboarding', email: 'Welcome', sentAt: '2026-03-24 09:00', status: 'opened' },
  { recipient: 'sarah@coachsarah.com', name: 'Sarah Chen', sequence: 'Onboarding', email: 'Day 3 Tip', sentAt: '2026-03-22 10:30', status: 'clicked' },
  { recipient: 'mike@strengthcoach.com', name: 'Mike Davis', sequence: 'Trial Expiry', email: '3 Days Left', sentAt: '2026-03-21 08:00', status: 'opened' },
  { recipient: 'jane@janefit.com', name: 'Jane Wilson', sequence: 'Trial Expiry', email: '1 Day Left', sentAt: '2026-03-20 08:00', status: 'sent' },
  { recipient: 'tom@tomcoaches.com', name: 'Tom Brown', sequence: 'Win-Back', email: 'We Miss You', sentAt: '2026-03-18 14:00', status: 'opened' },
]

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

  const handlePreview = (emailId: string) => {
    setPreviewEmail(emailId as PreviewEmailType)
  }

  const getPreviewTitle = (emailId: PreviewEmailType): string => {
    const seq = EMAIL_SEQUENCES.find(s => s.id === emailId)
    return seq ? `${seq.emoji} ${seq.name}` : ''
  }

  const getPreviewContent = (emailId: PreviewEmailType): string => {
    switch (emailId) {
      case 'welcome':
        return `Welcome to Propel, Coach! 🎉

You're 14 days away from transforming how you coach. Here's what to do first:

Step 1: Add your first client via the Clients tab
Step 2: Build a workout program and assign it
Step 3: Set macro targets for your client

This email introduces new coaches to the platform and guides them through the initial setup process.`
      case 'day3':
        return `Day 3 Check-in 👋

Hey Coach, you've had 3 days with Propel. Here's a tip to get more out of it:

💡 Pro Tip: Use Check-in Templates
Coaches who set up weekly check-in questions see 3x higher client engagement. Head to your dashboard and set up your first check-in template — it takes 2 minutes.

This email re-engages coaches on day 3 with a practical feature recommendation.`
      case 'day7':
        return `One week in! 🏆

You're halfway through your free trial. You have X clients already — great start!

Your trial ends in 7 days
Upgrade now to keep all your client data, programs, and check-in history. No interruption to your coaching.

This email reminds coaches of their trial timeline and encourages upgrade consideration.`
      case 'trial_3day':
        return `3 days left on your trial ⏳

Hey Coach, your Propel trial expires in 3 days. Don't lose your data — upgrade now.

⚠️ What happens when your trial ends
- Your client profiles will be locked
- Check-in history will be archived
- Your programs will be saved but uneditable

This email creates urgency with specific consequences of not upgrading.`
      case 'trial_1day':
        return `Last chance — trial ends tomorrow 🚨

Hey Coach, this is your final reminder. Your trial ends tomorrow.

Upgrade Now — Keep Everything →

Still unsure? Reply to this email and we'll help you pick the right plan.

This is the final high-urgency email before trial expiration.`
      case 'trial_expired':
        return `Your trial has ended

Hey Coach, your Propel trial has expired. Your data is safe — upgrade anytime to get back in.

✅ All your client data is preserved
✅ Programs and check-ins are saved
✅ Upgrade and pick up right where you left off

This email reassures coaches that their data is safe and they can reactivate anytime.`
      default:
        return ''
    }
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
          <p className="text-xl font-bold text-cb-text">1,248</p>
          <p className="text-xs text-cb-muted mt-1">Last 30 days</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-purple-500" />
            <p className="text-xs text-cb-muted">Open Rate</p>
          </div>
          <p className="text-xl font-bold text-cb-text">42%</p>
          <p className="text-xs text-cb-muted mt-1">Average</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-500" />
            <p className="text-xs text-cb-muted">Click Rate</p>
          </div>
          <p className="text-xl font-bold text-cb-text">18%</p>
          <p className="text-xs text-cb-muted mt-1">CTA clicks</p>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-green-500" />
            <p className="text-xs text-cb-muted">Active Sequences</p>
          </div>
          <p className="text-xl font-bold text-cb-text">6</p>
          <p className="text-xs text-cb-muted mt-1">Running</p>
        </div>
      </div>

      {/* Email Sequence Timeline */}
      <div className="bg-surface border border-cb-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-cb-text mb-6">Onboarding Sequence Timeline</h2>
        <div className="space-y-4">
          {EMAIL_SEQUENCES.map((seq, idx) => (
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
                onClick={() => handlePreview(seq.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:text-cb-text hover:bg-surface-light transition-colors"
              >
                Preview
              </button>
              {idx < EMAIL_SEQUENCES.length - 1 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-brand/30 to-transparent -ml-6" />
              )}
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
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">
                Recipient
              </th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">
                Sequence
              </th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">
                Email
              </th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">
                Sent At
              </th>
              <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cb-border">
            {RECENT_EMAILS.map((item, idx) => (
              <tr key={idx} className="hover:bg-surface-light">
                <td className="px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-cb-text">{item.name}</p>
                    <p className="text-xs text-cb-muted">{item.recipient}</p>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-cb-secondary">{item.sequence}</td>
                <td className="px-6 py-3 text-sm text-cb-secondary">{item.email}</td>
                <td className="px-6 py-3 text-sm text-cb-secondary">{item.sentAt}</td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                      item.status === 'opened'
                        ? 'bg-cb-success/15 text-cb-success'
                        : item.status === 'clicked'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                          : 'bg-cb-border text-cb-secondary'
                    )}
                  >
                    {item.status === 'opened' && <CheckCircle size={12} />}
                    {item.status === 'clicked' && <TrendingUp size={12} />}
                    {item.status === 'sent' && <Clock size={12} />}
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-cb-muted hover:text-cb-text transition-colors"
              >
                ✕
              </button>
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
              <button className="px-4 py-2 text-sm font-medium rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors">
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
