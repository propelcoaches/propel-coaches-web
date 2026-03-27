'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Target, Plus, X, Search, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'

type HabitCategory = 'Nutrition' | 'Training' | 'Sleep' | 'Mindset' | 'Recovery' | 'Hydration'

type HabitTemplate = {
  id: string
  coach_id: string
  title: string
  category: HabitCategory
  target: string | null
  unit: string | null
  streak_tracking: boolean
}

type ClientHabit = {
  id: string
  client_id: string
  template_id: string | null
  title: string
  category: HabitCategory
  target: string | null
  unit: string | null
  streak_tracking: boolean
  is_active: boolean
}

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Nutrition: 'bg-emerald-100 text-emerald-700',
  Training: 'bg-blue-100 text-blue-700',
  Sleep: 'bg-purple-100 text-purple-700',
  Mindset: 'bg-amber-100 text-amber-700',
  Recovery: 'bg-rose-100 text-rose-700',
  Hydration: 'bg-cyan-100 text-cyan-700',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS) as HabitCategory[]

export default function HabitsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [coachId, setCoachId] = useState<string | null>(null)

  const [templates, setTemplates] = useState<HabitTemplate[]>([])
  const [search, setSearch] = useState('')
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // New template form
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<HabitCategory>('Training')
  const [newTarget, setNewTarget] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)

  // Client panel
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [clientHabits, setClientHabits] = useState<ClientHabit[]>([])
  const [clientHabitsLoading, setClientHabitsLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)

  // Load coach ID, templates, and clients
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCoachId(user.id)

      const [{ data: tData }, { data: cData }] = await Promise.all([
        supabase.from('habit_templates').select('*').eq('coach_id', user.id).order('title'),
        supabase.from('profiles').select('id, full_name').eq('coach_id', user.id).eq('role', 'client').order('full_name'),
      ])
      if (tData) setTemplates(tData as HabitTemplate[])
      if (cData) setClients(cData.map((c: any) => ({ id: c.id, name: c.full_name ?? c.id })))
      setTemplatesLoading(false)
    }
    load()
  }, [supabase])

  // Load client's habits when a client is selected
  const loadClientHabits = useCallback(async (clientId: string) => {
    setClientHabitsLoading(true)
    const { data } = await supabase
      .from('client_habits')
      .select('*')
      .eq('client_id', clientId)
      .order('title')
    setClientHabits((data ?? []) as ClientHabit[])
    setClientHabitsLoading(false)
  }, [supabase])

  useEffect(() => {
    if (selectedClient) loadClientHabits(selectedClient)
    else setClientHabits([])
  }, [selectedClient, loadClientHabits])

  async function addTemplate() {
    if (!newTitle.trim() || !coachId) return
    setTemplateSaving(true)
    const { data } = await supabase
      .from('habit_templates')
      .insert({
        coach_id: coachId,
        title: newTitle.trim(),
        category: newCategory,
        target: newTarget.trim() || null,
        unit: newUnit.trim() || null,
        streak_tracking: true,
      })
      .select()
      .single()

    if (data) setTemplates((prev) => [...prev, data as HabitTemplate].sort((a, b) => a.title.localeCompare(b.title)))
    setNewTitle('')
    setNewTarget('')
    setNewUnit('')
    setShowNewTemplate(false)
    setTemplateSaving(false)
  }

  async function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('habit_templates').delete().eq('id', id)
  }

  async function assignHabit(template: HabitTemplate) {
    if (!selectedClient || !coachId) return
    setAssigning(template.id)
    const { data } = await supabase
      .from('client_habits')
      .insert({
        coach_id: coachId,
        client_id: selectedClient,
        template_id: template.id,
        title: template.title,
        category: template.category,
        target: template.target,
        unit: template.unit,
        streak_tracking: template.streak_tracking,
        is_active: true,
      })
      .select()
      .single()

    if (data) setClientHabits((prev) => [...prev, data as ClientHabit])
    setAssigning(null)
  }

  async function removeClientHabit(id: string) {
    setClientHabits((prev) => prev.filter((h) => h.id !== id))
    await supabase.from('client_habits').delete().eq('id', id)
  }

  const filteredTemplates = templates.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const assignedTitles = new Set(clientHabits.map((h) => h.title))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cb-text">Habits</h1>
        <p className="text-sm text-cb-muted mt-0.5">Build habit templates and assign them to clients</p>
      </div>

      <div className="flex gap-5">
        {/* Left: Habit Library */}
        <div className="w-80 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-cb-text">Habit Library</h2>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors"
            >
              <Plus size={12} /> New
            </button>
          </div>

          {showNewTemplate && (
            <div className="bg-surface border border-cb-border rounded-xl p-4 mb-3 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Habit title..."
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Target"
                  className="flex-1 px-2 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none"
                />
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Unit"
                  className="flex-1 px-2 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewTemplate(false)}
                  className="flex-1 py-1.5 text-xs text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  onClick={addTemplate}
                  disabled={!newTitle.trim() || templateSaving}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50"
                >
                  {templateSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search habits..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="text-brand animate-spin" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-xs text-cb-muted">
              {search ? 'No habits match your search.' : 'No habit templates yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((t) => {
                const alreadyAssigned = assignedTitles.has(t.title)
                return (
                  <div key={t.id} className="bg-surface border border-cb-border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="text-sm font-medium text-cb-text leading-snug flex-1 min-w-0 mr-2">{t.title}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {selectedClient && (
                          <button
                            onClick={() => !alreadyAssigned && assignHabit(t)}
                            disabled={alreadyAssigned || assigning === t.id}
                            className={clsx(
                              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                              alreadyAssigned
                                ? 'bg-brand/10 text-brand cursor-default'
                                : 'bg-brand text-white hover:bg-brand/90 disabled:opacity-50'
                            )}
                            title={alreadyAssigned ? 'Already assigned' : 'Assign to client'}
                          >
                            {assigning === t.id ? (
                              <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : alreadyAssigned ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <Plus size={10} />
                            )}
                            {alreadyAssigned ? 'Assigned' : 'Assign'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="text-cb-muted hover:text-red-500 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[t.category])}>
                        {t.category}
                      </span>
                      {t.target && <span className="text-[10px] text-cb-muted">{t.target} {t.unit}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Client Habits */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-cb-text">Client Habits</h2>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {!selectedClient ? (
            <div className="bg-surface border border-cb-border rounded-xl p-12 text-center">
              <Target size={36} className="mx-auto text-cb-muted mb-3" />
              <p className="text-sm text-cb-muted">Select a client to view and manage their habits.</p>
              <p className="text-xs text-cb-muted mt-1">You can then assign habits from the library on the left.</p>
            </div>
          ) : clientHabitsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="text-brand animate-spin" />
            </div>
          ) : clientHabits.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-xl p-12 text-center">
              <Target size={36} className="mx-auto text-cb-muted mb-3" />
              <p className="text-sm text-cb-muted">No habits assigned yet.</p>
              <p className="text-xs text-cb-muted mt-1">Click "Assign" on any habit in the library to add it here.</p>
            </div>
          ) : (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-cb-border bg-surface-light">
                <p className="text-xs font-medium text-cb-muted">{clientHabits.length} habit{clientHabits.length !== 1 ? 's' : ''} assigned</p>
              </div>
              <div className="divide-y divide-cb-border">
                {clientHabits.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cb-text truncate">{h.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[h.category])}>
                          {h.category}
                        </span>
                        {h.target && (
                          <span className="text-[10px] text-cb-muted">{h.target} {h.unit}</span>
                        )}
                        {h.streak_tracking && (
                          <span className="text-[10px] text-cb-muted">🔥 streak</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={clsx(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        h.is_active ? 'bg-brand/10 text-brand' : 'bg-surface-light text-cb-muted'
                      )}>
                        {h.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => removeClientHabit(h.id)}
                        className="text-cb-muted hover:text-red-500 transition-colors p-1"
                        title="Remove habit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
