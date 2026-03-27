'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile } from '@/lib/types'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Send, MessageSquare, Bot, BotOff, SquareCheck, Search, Plus, CheckCheck, Check, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'

type ClientThread = {
  client: Profile
  lastMessage: Message | null
  unreadCount: number
}

type AiSession = {
  id: string
  is_active: boolean
}

// Deterministic avatar color from client id
const AVATAR_COLORS = [
  'bg-rose-400',
  'bg-orange-400',
  'bg-amber-400',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-pink-500',
]
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function initials(name: string | null, email: string | null) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (email ?? '??').slice(0, 2).toUpperCase()
}

// ─── Broadcast Modal ──────────────────────────────────────────────────────────

function BroadcastModal({ threads, userId, onClose }: {
  threads: ClientThread[]
  userId: string
  onClose: () => void
}) {
  const clients = threads.map(t => t.client)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(clients.map(c => c.id)))
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function toggleAll() {
    if (selected.size === clients.length) setSelected(new Set())
    else setSelected(new Set(clients.map(c => c.id)))
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function handleSend() {
    if (!message.trim() || selected.size === 0) return
    setSending(true)
    const supabase = createClient()
    const rows = Array.from(selected).map(clientId => ({
      coach_id: userId,
      client_id: clientId,
      sender_id: userId,
      sender_role: 'coach',
      content: message.trim(),
      message_type: 'text',
      read: false,
    }))
    await supabase.from('messages').insert(rows)
    setSending(false)
    setSent(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface border border-cb-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-base font-semibold text-cb-text">Broadcast Message</h2>
            <p className="text-xs text-cb-muted mt-0.5">Send a message to everyone</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-4">
          {sent ? (
            <div className="py-8 text-center">
              <CheckCheck size={32} className="text-cb-success mx-auto mb-2" />
              <p className="text-sm font-medium text-cb-text">Message sent to {selected.size} client{selected.size !== 1 ? 's' : ''}!</p>
            </div>
          ) : (
            <>
              <textarea
                autoFocus
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message to all selected clients…"
                className="w-full px-3 py-2.5 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />

              {/* Select/Deselect All */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === clients.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-cb-border text-brand accent-brand"
                />
                <span className="text-sm text-cb-secondary">Select/Deselect All</span>
              </label>

              {/* Client list */}
              <div className="max-h-48 overflow-y-auto space-y-1 border border-cb-border rounded-lg divide-y divide-cb-border">
                {clients.map(client => (
                  <label key={client.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-light transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(client.id)}
                      onChange={() => toggle(client.id)}
                      className="w-4 h-4 rounded border-cb-border accent-brand flex-shrink-0"
                    />
                    <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold', avatarColor(client.id))}>
                      {initials(client.name, client.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cb-text truncate">{client.name ?? client.email}</p>
                      {client.name && <p className="text-[11px] text-cb-muted truncate">{client.email}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-cb-border">
            <p className="text-xs text-cb-muted">
              Broadcasting to {selected.size} client{selected.size !== 1 ? 's' : ''}.
            </p>
            <button
              onClick={handleSend}
              disabled={!message.trim() || selected.size === 0 || sending}
              className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : null}
              Send Message &rsaquo;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [threads, setThreads] = useState<ClientThread[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [aiSession, setAiSession] = useState<AiSession | null>(null)
  const [togglingAi, setTogglingAi] = useState(false)
  const [creatingTaskFor, setCreatingTaskFor] = useState<string | null>(null)
  const [taskCreated, setTaskCreated] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const realtimeRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    loadThreads()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      loadMessages(selectedClientId)
      loadAiSession(selectedClientId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId])

  // Real-time subscription
  useEffect(() => {
    if (!selectedClientId || !userId) return

    const supabase = createClient()
    realtimeRef.current = supabase

    const channel = supabase
      .channel(`messages:${userId}:${selectedClientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `coach_id=eq.${userId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.client_id === selectedClientId) {
            setMessages((prev) => [...prev, msg])
            if (msg.sender_role === 'client') {
              supabase
                .from('messages')
                .update({ read: true })
                .eq('id', msg.id)
                .then(() => {})
            }
          }
          loadThreads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThreads() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: clientData } = await supabase
      .from('profiles')
      .select('*')
      .eq('coach_id', user.id)
      .eq('role', 'client')

    const threadList: ClientThread[] = []
    for (const client of (clientData ?? []) as Profile[]) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('coach_id', user.id)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('client_id', client.id)
        .eq('read', false)
        .eq('sender_role', 'client')

      threadList.push({
        client,
        lastMessage: msgs?.[0] ?? null,
        unreadCount: count ?? 0,
      })
    }

    threadList.sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    })

    setThreads(threadList)
    if (threadList.length > 0 && !selectedClientId) {
      setSelectedClientId(threadList[0].client.id)
    }
    setLoading(false)
  }

  async function loadMessages(clientId: string) {
    setLoadingMessages(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    setMessages(data ?? [])

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .eq('sender_role', 'client')
      .eq('read', false)

    setLoadingMessages(false)
  }

  async function loadAiSession(clientId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ai_mode_sessions')
      .select('id, is_active')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle()

    setAiSession(data ?? null)
  }

  async function toggleAiMode() {
    if (!selectedClientId || !userId) return
    setTogglingAi(true)
    const supabase = createClient()

    if (aiSession) {
      await supabase
        .from('ai_mode_sessions')
        .update({ is_active: false })
        .eq('id', aiSession.id)
      setAiSession(null)
    } else {
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + 7)
      const { data } = await supabase
        .from('ai_mode_sessions')
        .insert({
          coach_id: userId,
          client_id: selectedClientId,
          is_active: true,
          duration_days: 7,
          ends_at: endsAt.toISOString(),
        })
        .select('id, is_active')
        .single()
      setAiSession(data ?? null)
    }

    setTogglingAi(false)
  }

  async function createTaskFromMessage(msgId: string, content: string) {
    if (!selectedClientId || !userId) return
    setCreatingTaskFor(msgId)
    const supabase = createClient()
    const clientName = selectedThread?.client.name ?? selectedThread?.client.email ?? 'client'
    await supabase.from('tasks').insert({
      coach_id: userId,
      client_id: selectedClientId,
      title: `Follow up with ${clientName}`,
      description: content.slice(0, 200),
      source: 'message',
      priority: 'medium',
      completed: false,
    })
    setCreatingTaskFor(null)
    setTaskCreated(msgId)
    setTimeout(() => setTaskCreated(null), 2000)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedClientId || !userId) return
    setSending(true)
    const supabase = createClient()

    await supabase.from('messages').insert({
      coach_id: userId,
      client_id: selectedClientId,
      sender_id: userId,
      sender_role: 'coach',
      content: newMessage.trim(),
      message_type: 'text',
      read: false,
    })

    setNewMessage('')
    setSending(false)
    loadThreads()
  }

  const filteredThreads = threads.filter(t =>
    search === '' ||
    (t.client.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.client.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedThread = threads.find((t) => t.client.id === selectedClientId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ── Thread List ── */}
      <div className="w-72 flex-shrink-0 border-r border-cb-border bg-surface flex flex-col">
        {/* Search + actions header */}
        <div className="px-3 py-3 border-b border-cb-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-surface-light border border-cb-border rounded-lg text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
            <button
              onClick={() => setShowBroadcast(true)}
              title="Broadcast message"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-cb-border text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-sm text-cb-muted">
              {search ? 'No clients match your search.' : 'No clients to message.'}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isCoachMsg = thread.lastMessage?.sender_role === 'coach'
              const isRead = thread.lastMessage?.read ?? false
              return (
                <button
                  key={thread.client.id}
                  onClick={() => setSelectedClientId(thread.client.id)}
                  className={clsx(
                    'w-full px-3 py-3 flex items-center gap-3 text-left border-b border-cb-border hover:bg-surface-light transition-colors',
                    selectedClientId === thread.client.id ? 'bg-cb-teal/5 border-l-2 border-l-cb-teal' : ''
                  )}
                >
                  {/* Colored avatar */}
                  <div className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold',
                    avatarColor(thread.client.id)
                  )}>
                    {initials(thread.client.name, thread.client.email)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={clsx(
                        'text-sm truncate',
                        thread.unreadCount > 0 ? 'font-bold text-cb-text' : 'font-medium text-cb-text'
                      )}>
                        {thread.client.name ?? thread.client.email}
                      </span>
                      {thread.lastMessage && (
                        <span className="text-[10px] text-cb-muted flex-shrink-0 ml-1">
                          {formatDistanceToNowStrict(new Date(thread.lastMessage.created_at), { addSuffix: false })} ago
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Read receipt for coach messages */}
                      {isCoachMsg && (
                        isRead
                          ? <CheckCheck size={12} className="text-blue-500 flex-shrink-0" />
                          : <Check size={12} className="text-cb-muted flex-shrink-0" />
                      )}
                      <p className={clsx(
                        'text-xs truncate',
                        thread.unreadCount > 0 ? 'text-cb-text font-medium' : 'text-cb-muted'
                      )}>
                        {thread.lastMessage?.content ?? 'No messages yet'}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="ml-auto flex-shrink-0 w-4 h-4 bg-cb-teal rounded-full flex items-center justify-center">
                          <span className="text-[9px] text-white font-bold">{thread.unreadCount}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Message Thread ── */}
      <div className="flex-1 flex flex-col bg-bg">
        {!selectedClientId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-cb-muted">
            <MessageSquare size={48} className="mb-3" />
            <p className="text-sm">Select a client to view messages</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3 bg-surface border-b border-cb-border flex items-center gap-3">
              <div className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold',
                avatarColor(selectedClientId)
              )}>
                {initials(selectedThread?.client.name ?? null, selectedThread?.client.email ?? null)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-cb-text">{selectedThread?.client.name ?? selectedThread?.client.email}</p>
                <p className="text-xs text-cb-muted">{selectedThread?.client.email}</p>
              </div>

              {/* AI Mode Toggle */}
              <button
                onClick={toggleAiMode}
                disabled={togglingAi}
                title={aiSession ? 'AI mode is ON — click to disable' : 'Enable AI mode for this client'}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  aiSession
                    ? 'bg-brand/10 border-brand/30 text-brand hover:bg-brand/20'
                    : 'bg-surface-light border-cb-border text-cb-muted hover:text-cb-secondary hover:border-cb-secondary'
                )}
              >
                {togglingAi ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : aiSession ? (
                  <Bot size={14} />
                ) : (
                  <BotOff size={14} />
                )}
                {aiSession ? 'AI mode on' : 'AI mode off'}
              </button>
            </div>

            {/* AI mode banner */}
            {aiSession && (
              <div className="px-5 py-2 bg-brand/5 border-b border-brand/15 flex items-center gap-2 text-xs text-brand">
                <Bot size={13} />
                AI is responding to new messages from this client on your behalf.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-cb-muted">
                  <MessageSquare size={36} className="mb-2" />
                  <p className="text-sm">No messages yet. Send the first message!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCoach = msg.sender_role === 'coach'
                  const isCreating = creatingTaskFor === msg.id
                  const wasCreated = taskCreated === msg.id
                  return (
                    <div key={msg.id} className={clsx('flex group', isCoach ? 'justify-end' : 'justify-start')}>
                      <div className={clsx('flex items-end gap-1.5', isCoach ? 'flex-row-reverse' : 'flex-row')}>
                        <div
                          className={clsx(
                            'max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm',
                            isCoach
                              ? 'bg-cb-teal text-white rounded-br-sm'
                              : 'bg-surface text-cb-text border border-cb-border rounded-bl-sm'
                          )}
                        >
                          {(msg as Message & { is_ai_generated?: boolean }).is_ai_generated && (
                            <div className="flex items-center gap-1 mb-1 opacity-70">
                              <Bot size={11} />
                              <span className="text-[10px]">AI reply</span>
                            </div>
                          )}
                          <p className="leading-relaxed">{msg.content}</p>
                          <div className={clsx('flex items-center justify-end gap-1 mt-1', isCoach ? 'text-white/70' : 'text-cb-muted')}>
                            <span className="text-[10px]">{format(new Date(msg.created_at), 'h:mm a')}</span>
                            {isCoach && (
                              msg.read
                                ? <CheckCheck size={11} className="text-blue-300" />
                                : <Check size={11} className="opacity-60" />
                            )}
                          </div>
                        </div>
                        {/* Create task from message */}
                        {!isCoach && (
                          <button
                            onClick={() => createTaskFromMessage(msg.id, msg.content)}
                            disabled={isCreating || wasCreated}
                            title={wasCreated ? 'Task created!' : 'Create task from message'}
                            className={clsx(
                              'mb-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100',
                              wasCreated
                                ? 'bg-cb-success/20 text-cb-success opacity-100'
                                : 'bg-surface border border-cb-border text-cb-muted hover:text-brand hover:border-brand/40'
                            )}
                          >
                            {isCreating ? (
                              <div className="w-3 h-3 border border-cb-muted border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <SquareCheck size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 bg-surface border-t border-cb-border">
              <div className="flex items-end gap-3">
                <textarea
                  rows={1}
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border border-cb-border rounded-xl text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-surface-light text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Broadcast modal */}
      {showBroadcast && userId && (
        <BroadcastModal
          threads={threads}
          userId={userId}
          onClose={() => { setShowBroadcast(false); loadThreads() }}
        />
      )}
    </div>
  )
}
