'use client'
import React, { useState, useEffect } from 'react'
import { Bell, Send, Users, CheckCircle, Megaphone, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TEMPLATES = [
  { id: 'checkin', title: '📋 Check-in Reminder', body: 'Hey! Don\'t forget to submit your weekly check-in. Your coach is waiting to review your progress.' },
  { id: 'motivation', title: '💪 Motivational Boost', body: 'You\'re crushing it! Remember why you started — keep showing up and the results will follow.' },
  { id: 'workout', title: '🏋️ Workout Reminder', body: 'Your workout is scheduled for today. Get after it — consistency is everything!' },
  { id: 'nutrition', title: '🥗 Nutrition Nudge', body: 'Remember to log your meals today. Staying on top of your nutrition is 80% of the results.' },
  { id: 'custom', title: '✏️ Custom Message', body: '' },
]

type Broadcast = {
  id: string
  title: string
  audience: string
  recipient_count: number
  sent_at: string
}

export default function BroadcastPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0])
  const [title, setTitle] = useState(TEMPLATES[0].title)
  const [body, setBody] = useState(TEMPLATES[0].body)
  const [audience, setAudience] = useState('all')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientCount, setClientCount] = useState<number>(0)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Load client count
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('role', 'client')
      setClientCount(count ?? 0)

      // Load broadcast history
      const { data } = await supabase
        .from('notification_broadcasts')
        .select('id, title, audience, recipient_count, sent_at')
        .eq('coach_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(10)
      setBroadcasts(data ?? [])
    })
  }, [])

  const handleTemplateSelect = (t: typeof TEMPLATES[0]) => {
    setSelectedTemplate(t)
    setTitle(t.title)
    setBody(t.body)
  }

  const handleSend = async () => {
    if (!userId || !title || !body) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, coachId: userId, audience }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to send')
      setSent(true)
      setTimeout(() => setSent(false), 4000)

      // Reload broadcast history
      const supabase = createClient()
      const { data } = await supabase
        .from('notification_broadcasts')
        .select('id, title, audience, recipient_count, sent_at')
        .eq('coach_id', userId)
        .order('sent_at', { ascending: false })
        .limit(10)
      setBroadcasts(data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Notifications</h1>
          <p className="text-gray-500 text-sm">Send push notifications to your clients</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Clients', value: clientCount, icon: Users, color: 'purple' },
          { label: 'Broadcasts Sent', value: broadcasts.length, icon: Send, color: 'blue' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 bg-${s.color}-50 rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Compose Broadcast</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                    selectedTemplate.id === t.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Notification title..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="Your message to clients..."
            />
            <div className="text-xs text-gray-400 text-right mt-1">{body.length}/150</div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select
              value={audience}
              onChange={e => setAudience(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="all">All Clients ({clientCount})</option>
              <option value="active">Active This Week</option>
              <option value="at_risk">At-Risk Clients</option>
            </select>
          </div>

          {/* Preview */}
          <div className="mb-4 bg-gray-900 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{title || 'Notification Title'}</div>
                <div className="text-gray-300 text-xs mt-0.5 leading-relaxed">{body || 'Your message here...'}</div>
              </div>
            </div>
            <div className="text-gray-500 text-xs mt-2 text-right">now · Propel Coach</div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!body || !title || sending || sent || !userId}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            {sent ? (
              <><CheckCircle className="w-4 h-4" /> Sent!</>
            ) : sending ? (
              <><Clock className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send to {audience === 'all' ? clientCount : 'selected'} clients</>
            )}
          </button>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Broadcasts</h2>
          {broadcasts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No broadcasts yet.</div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div key={b.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-gray-900 text-sm">{b.title}</div>
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0 capitalize">{b.audience}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(b.sent_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{b.recipient_count} sent</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
