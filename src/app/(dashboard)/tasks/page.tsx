'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, isToday, isThisWeek, isPast, parseISO } from 'date-fns'
import { SquareCheck, Plus, X, Check, Trash2, AlertCircle, Loader2, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type Priority = 'low' | 'medium' | 'high'
type FilterTab = 'all' | 'today' | 'week' | 'completed'

type Client = { id: string; name: string | null; email: string }

type Task = {
  id: string
  coach_id: string
  client_id: string | null
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  priority: Priority
  source: string | null   // 'check_in' | 'message' | 'manual' | null
  created_at: string
  client?: Client
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'bg-cb-danger/15 text-cb-danger border-cb-danger/30',
  medium: 'bg-cb-warning/15 text-cb-warning border-cb-warning/30',
  low: 'bg-surface-light text-cb-secondary border-cb-border',
}
const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-cb-danger',
  medium: 'bg-cb-warning',
  low: 'bg-cb-secondary/40',
}
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

// ─── Add Task Modal ────────────────────────────────────────────────────────────

function AddTaskModal({ clients, onClose, onAdd }: {
  clients: Client[]
  onClose: () => void
  onAdd: (task: Task) => void
}) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [clientId, setClientId] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!title.trim()) { setError('Task name is required'); return }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: err } = await supabase
        .from('tasks')
        .insert({
          coach_id: user.id,
          client_id: clientId || null,
          title: title.trim(),
          due_date: dueDate || null,
          completed: false,
          priority,
          source: 'manual',
        })
        .select()
        .single()

      if (err) throw err
      const client = clients.find(c => c.id === clientId)
      onAdd({ ...data, client, source: 'manual' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface border border-cb-border rounded-2xl w-full max-w-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <SquareCheck size={20} className="text-cb-text" />
            <h2 className="text-lg font-semibold text-cb-text">Add Task</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-cb-danger/10 border border-cb-danger/30 rounded-lg">
              <AlertCircle size={14} className="text-cb-danger flex-shrink-0" />
              <p className="text-xs text-cb-danger">{error}</p>
            </div>
          )}

          {/* Task name */}
          <div>
            <label className="block text-sm font-semibold text-cb-text mb-1.5">
              Task <span className="text-cb-danger">*</span>
            </label>
            <textarea
              autoFocus
              rows={3}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter task name e.g. Setup client profile"
              className="w-full px-3 py-2.5 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-cb-text mb-1.5">Due Date</label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-48 px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Client + Priority row (optional detail) */}
          {clients.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-cb-muted mb-1">Link to client</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-cb-muted mb-1">Priority</label>
                <div className="flex gap-1.5">
                  {(['low', 'medium', 'high'] as Priority[]).map(p => (
                    <button key={p} onClick={() => setPriority(p)}
                      className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors',
                        priority === p ? PRIORITY_COLORS[p] : 'border-cb-border text-cb-secondary hover:border-cb-border/70'
                      )}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cb-border">
          <button onClick={onClose} className="text-sm text-cb-secondary hover:text-cb-text font-medium transition-colors">
            Close
          </button>
          <button onClick={handleAdd} disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-brand hover:bg-brand/90 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete }: {
  task: Task
  onToggle: () => void
  onDelete: () => void
}) {
  const isOverdue = task.due_date && !task.completed && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3.5 hover:bg-surface-light transition-colors group border-b border-cb-border last:border-0',
      task.completed && 'opacity-55'
    )}>
      <button onClick={onToggle}
        className={clsx(
          'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          task.completed ? 'bg-cb-success border-cb-success' : 'border-cb-border hover:border-cb-success'
        )}>
        {task.completed && <Check size={10} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className={clsx('text-sm font-medium leading-snug', task.completed ? 'line-through text-cb-muted' : 'text-cb-text')}>
            {task.title}
          </p>
          <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize', PRIORITY_COLORS[task.priority])}>
            {task.priority}
          </span>
          {task.source && task.source !== 'manual' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand/10 text-brand border border-brand/20">
              auto
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {task.client && (
            <span className="text-xs text-cb-teal">{task.client.name ?? task.client.email}</span>
          )}
          {task.due_date && (
            <span className={clsx('text-xs flex items-center gap-1', isOverdue ? 'text-cb-danger font-medium' : 'text-cb-muted')}>
              <Calendar size={10} />
              {isOverdue ? 'Overdue · ' : ''}{format(parseISO(task.due_date), 'd MMM yyyy')}
            </span>
          )}
        </div>
      </div>

      <button onClick={onDelete} className="text-cb-muted hover:text-cb-danger opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [filterClient, setFilterClient] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [tasksRes, clientsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, client:profiles!tasks_client_id_fkey(id, name, email)')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, name, email')
          .eq('coach_id', user.id)
          .eq('role', 'client')
          .order('name'),
      ])

      if (tasksRes.error) throw tasksRes.error
      if (clientsRes.error) throw clientsRes.error

      setTasks((tasksRes.data ?? []) as Task[])
      setClients((clientsRes.data ?? []) as Client[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newVal = !task.completed
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newVal } : t))
    try {
      const supabase = createClient()
      const { error } = await supabase.from('tasks').update({ completed: newVal }).eq('id', id)
      if (error) throw error
    } catch {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !newVal } : t))
    }
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      const supabase = createClient()
      await supabase.from('tasks').delete().eq('id', id)
    } catch {
      load()
    }
  }

  function handleAdded(task: Task) {
    setTasks(prev => [task, ...prev])
    setShowAddModal(false)
  }

  // Filtering
  const filtered = tasks.filter(t => {
    const clientMatch = filterClient === 'all' || t.client_id === filterClient
    if (!clientMatch) return false
    if (activeFilter === 'today') return !!t.due_date && isToday(parseISO(t.due_date))
    if (activeFilter === 'week') return !!t.due_date && isThisWeek(parseISO(t.due_date), { weekStartsOn: 1 })
    if (activeFilter === 'completed') return t.completed
    return !t.completed
  })

  const sorted = [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  const grouped: Record<string, Task[]> = {}
  sorted.forEach(t => {
    if (!grouped[t.priority]) grouped[t.priority] = []
    grouped[t.priority].push(t)
  })

  const totalOpen = tasks.filter(t => !t.completed).length
  const todayCount = tasks.filter(t => !t.completed && !!t.due_date && isToday(parseISO(t.due_date))).length
  const overdueCount = tasks.filter(t => !t.completed && !!t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-surface-light rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-light rounded-lg animate-pulse" />)}
        </div>
        <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="h-14 border-b border-cb-border animate-pulse bg-surface-light/50 last:border-0" />)}
        </div>
      </div>
    )
  }

  // Full-page empty state when no tasks at all
  if (tasks.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-24 h-24 mb-6 rounded-2xl bg-surface border border-cb-border flex items-center justify-center">
            <SquareCheck size={40} className="text-cb-border" />
          </div>
          <h2 className="text-xl font-bold text-cb-text mb-2">No tasks found</h2>
          <p className="text-sm text-cb-muted mb-6 max-w-sm">
            No tasks found! Create your first task to get started.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
        {showAddModal && <AddTaskModal clients={clients} onClose={() => setShowAddModal(false)} onAdd={handleAdded} />}
      </>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cb-text">Tasks</h1>
          <p className="text-sm text-cb-muted mt-0.5">Manage your coaching tasks and to-dos</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> Add Task
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-cb-danger/10 border border-cb-danger/30 rounded-xl mb-5">
          <AlertCircle size={16} className="text-cb-danger flex-shrink-0" />
          <p className="text-sm text-cb-danger flex-1">{error}</p>
          <button onClick={load} className="text-sm text-cb-danger underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Open', value: totalOpen, color: 'text-cb-text' },
          { label: 'Due Today', value: todayCount, color: 'text-cb-warning' },
          { label: 'Overdue', value: overdueCount, color: overdueCount > 0 ? 'text-cb-danger' : 'text-cb-text' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-lg p-3 text-center">
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-cb-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex bg-surface border border-cb-border rounded-lg overflow-hidden">
          {([
            { id: 'all', label: 'Open' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'completed', label: 'Completed' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
              className={clsx('px-3 py-2 text-xs font-medium transition-colors',
                activeFilter === tab.id ? 'bg-brand text-white' : 'text-cb-secondary hover:text-cb-text hover:bg-surface-light'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
        {clients.length > 0 && (
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
            className="px-3 py-2 border border-cb-border rounded-lg text-xs text-cb-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
          </select>
        )}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SquareCheck size={32} className="text-cb-border mb-3" />
          <p className="text-sm font-medium text-cb-secondary">
            {activeFilter === 'completed' ? 'No completed tasks yet.' : 'No tasks match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(['high', 'medium', 'low'] as Priority[]).map(priority => {
            const group = grouped[priority]
            if (!group?.length) return null
            return (
              <div key={priority} className="bg-surface border border-cb-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cb-border bg-surface-light">
                  <div className={clsx('w-2 h-2 rounded-full', PRIORITY_DOT[priority])} />
                  <span className="text-xs font-semibold text-cb-secondary uppercase tracking-wide capitalize">{priority} Priority</span>
                  <span className="ml-auto text-xs text-cb-muted">{group.length}</span>
                </div>
                {group.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && <AddTaskModal clients={clients} onClose={() => setShowAddModal(false)} onAdd={handleAdded} />}
    </div>
  )
}
