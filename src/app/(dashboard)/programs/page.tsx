'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Dumbbell, Loader2, Layers, FileText, Calendar, Users, Sparkles, ArrowLeft, Hammer } from 'lucide-react'
import { toast } from '@/lib/toast'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import EmptyState from '@/components/EmptyState'
import WorkoutDayBuilder from '@/components/programs/WorkoutDayBuilder'
import { Workout } from '@/types/workout'

// ─── AI Generator Config ─────────────────────────────────────────────────────
const AI_GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophy (Muscle Growth)' },
  { value: 'strength', label: 'Strength' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'athletic_performance', label: 'Athletic Performance' },
  { value: 'general_fitness', label: 'General Fitness' },
]
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced']
const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Cables', 'Machines', 'Kettlebells',
  'Pull-up Bar', 'Resistance Bands', 'Bodyweight Only',
]
const SPLITS = [
  { value: 'auto', label: 'Auto (AI chooses best)' },
  { value: 'push_pull_legs', label: 'Push / Pull / Legs' },
  { value: 'upper_lower', label: 'Upper / Lower' },
  { value: 'full_body', label: 'Full Body' },
]

type AiClient = { id: string; full_name: string; isPending?: boolean }

type FilterTab = 'all' | 'templates' | 'assigned'

type RealProgram = {
  id: string
  name: string
  description: string | null
  duration_weeks: number | null
  days_per_week: number | null
  goal: string | null
  difficulty: string | null
  is_public: boolean
  coach_id: string
  created_at: string
  updated_at: string
}

export default function ProgramsPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [realPrograms, setRealPrograms] = useState<RealProgram[]>([])
  const [showNewProgramModal, setShowNewProgramModal] = useState(false)
  const [newProgramName, setNewProgramName] = useState('')
  const [newProgramWeeks, setNewProgramWeeks] = useState('8')
  const [newProgramDays, setNewProgramDays] = useState('4')
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<{ id: string; full_name: string | null }[]>([])

  // Workout builder state
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false)
  const [builderProgramId, setBuilderProgramId] = useState<string | null>(null)
  const [builderSaving, setBuilderSaving] = useState(false)

  // AI Generator state
  const [showAiGenerator, setShowAiGenerator] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiClients, setAiClients] = useState<AiClient[]>([])
  const [aiFormErrors, setAiFormErrors] = useState<Record<string, string>>({})
  const [aiForm, setAiForm] = useState({
    client_id: '',
    title: '',
    goal: 'hypertrophy',
    experience_level: 'intermediate',
    days_per_week: 4,
    session_duration_minutes: 60,
    equipment_available: ['Barbell', 'Dumbbells', 'Cables', 'Machines'],
    injuries_limitations: '',
    preferred_split: 'auto',
    notes: '',
    program_length_weeks: 4,
  })

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/program-templates')
      const json = await res.json()
      setRealPrograms(json.templates || [])
    } catch (e) {
      toast.error('Failed to load programs')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [activeRes, pendingRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('coach_id', user.id).eq('role', 'client'),
      supabase.from('client_invitations').select('id, client_name').eq('coach_id', user.id).eq('status', 'pending'),
    ])
    setClients(activeRes.data ?? [])
    const active = (activeRes.data ?? []).map(c => ({ id: c.id, full_name: c.full_name ?? '', isPending: false }))
    const pending = (pendingRes.data ?? []).map(i => ({ id: i.id, full_name: `${i.client_name} (Pending)`, isPending: true }))
    setAiClients([...active, ...pending])
  }, [])

  const handleAiGenerate = async () => {
    const errors: Record<string, string> = {}
    if (!aiForm.client_id) errors.client_id = 'Please select a client'
    if (!aiForm.title.trim()) errors.title = 'Program title is required'
    if (Object.keys(errors).length > 0) {
      setAiFormErrors(errors)
      toast.error('Please fill in all required fields')
      return
    }
    setAiFormErrors({})
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/workout-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      })
      const data = await res.json()
      if (data.program) {
        setShowAiGenerator(false)
        toast.info('AI workout program generated!')
        fetchPrograms()
      } else {
        toast.error(data.error || 'Failed to generate program')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleAiEquipment = (item: string) => {
    setAiForm(f => ({
      ...f,
      equipment_available: f.equipment_available.includes(item)
        ? f.equipment_available.filter(e => e !== item)
        : [...f.equipment_available, item],
    }))
  }

  useEffect(() => { fetchPrograms(); fetchClients() }, [fetchPrograms, fetchClients])

  const handleCreateProgram = async () => {
    if (!newProgramName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/program-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProgramName.trim(),
          duration_weeks: parseInt(newProgramWeeks) || 8,
          days_per_week: parseInt(newProgramDays) || 4,
        }),
      })
      if (res.ok) {
        setShowNewProgramModal(false)
        setNewProgramName('')
        toast.info('Program created!')
        fetchPrograms()
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || 'Failed to create program')
      }
    } catch (e) {
      toast.error('Failed to create program')
    } finally {
      setSaving(false)
    }
  }

  // Normalise real programs to the same shape as demo for rendering
  const normalizedRealPrograms = realPrograms.map(p => ({
    id: p.id,
    name: p.name,
    weeks: p.duration_weeks ?? 8,
    daysPerWeek: p.days_per_week ?? 3,
    totalExercises: 0,
    assignedClients: [] as string[],
    isTemplate: p.is_public,
    description: p.description ?? '',
    tags: [p.goal, p.difficulty].filter(Boolean) as string[],
    lastModified: p.updated_at?.slice(0, 10) ?? '',
    createdAt: p.created_at?.slice(0, 10) ?? '',
  }))

  const programs = normalizedRealPrograms

  // Filter programs
  const filteredPrograms = programs.filter(prog => {
    // Filter by tab
    if (filterTab === 'templates' && !prog.isTemplate) return false
    if (filterTab === 'assigned' && prog.isTemplate) return false

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        prog.name.toLowerCase().includes(search) ||
        prog.description.toLowerCase().includes(search) ||
        prog.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    return true
  })

  // Calculate stats
  const totalPrograms = programs.length
  const totalTemplates = programs.filter(p => p.isTemplate).length
  const avgWeeks = programs.length > 0
    ? (programs.reduce((sum, p) => sum + p.weeks, 0) / programs.length).toFixed(1)
    : '0'
  const uniqueClients = new Set(programs.flatMap(p => p.assignedClients)).size

  const getClientsByIds = (clientIds: string[]) => {
    return clientIds.map(id => clients.find(c => c.id === id)).filter(Boolean) as typeof clients
  }

  const truncateText = (text: string, lines: number) => {
    const lineArray = text.split('\n').slice(0, lines)
    return lineArray.join('\n') + (text.split('\n').length > lines ? '...' : '')
  }

  // ─── Save sport workout ──────────────────────────────────────────────────────
  async function handleSaveWorkout(workout: Workout) {
    setBuilderSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert into program_workouts with sport_category + format of first section
      const { error } = await supabase.from('program_workouts').upsert({
        id: workout.id,
        program_id: builderProgramId ?? workout.id,
        week_number: 1,
        day_number: 1,
        name: workout.title || 'Workout',
        notes: workout.coachNotes ?? null,
        sport_category: workout.sportCategory,
        format: workout.sections[0]?.format ?? 'custom',
      })
      if (error) throw error

      toast.info('Workout saved!')
      setShowWorkoutBuilder(false)
      setBuilderProgramId(null)
    } catch (e) {
      toast.error('Failed to save workout')
    } finally {
      setBuilderSaving(false)
    }
  }

  // ─── Workout Builder View ────────────────────────────────────────────────────
  if (showWorkoutBuilder) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setShowWorkoutBuilder(false); setBuilderProgramId(null) }}
            className="flex items-center gap-1.5 text-sm text-cb-secondary hover:text-cb-text transition-colors"
          >
            <ArrowLeft size={16} /> Back to Programs
          </button>
        </div>
        <h1 className="text-xl font-bold text-cb-text mb-1">Build Workout</h1>
        <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mb-6" />
        <WorkoutDayBuilder
          onSave={handleSaveWorkout}
          onCancel={() => { setShowWorkoutBuilder(false); setBuilderProgramId(null) }}
          saving={builderSaving}
        />
      </div>
    )
  }

  // ─── AI Generator View ──────────────────────────────────────────────────────
  if (showAiGenerator) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowAiGenerator(false)} className="flex items-center gap-1.5 text-sm text-cb-secondary hover:text-cb-text transition-colors">
            <ArrowLeft size={16} /> Back to Programs
          </button>
        </div>
        <h1 className="text-xl font-bold text-cb-text mb-1">AI Generate Workout Program</h1>
        <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mb-6" />

        <div className="space-y-6 bg-surface border border-cb-border rounded-xl p-6">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">
              Client <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={aiForm.client_id}
              onChange={e => { setAiForm(f => ({ ...f, client_id: e.target.value })); setAiFormErrors(p => ({ ...p, client_id: '' })) }}
              className={`w-full border border-cb-border rounded-lg px-3 py-2 bg-surface text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/40 ${aiFormErrors.client_id ? 'border-red-500' : ''}`}
            >
              <option value="">Select a client...</option>
              {aiClients.map(c => <option key={c.id} value={c.id} disabled={c.isPending}>{c.full_name}</option>)}
            </select>
            {aiFormErrors.client_id && <p className="text-red-500 text-xs mt-1">{aiFormErrors.client_id}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">
              Program Title <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={aiForm.title}
              onChange={e => { setAiForm(f => ({ ...f, title: e.target.value })); setAiFormErrors(p => ({ ...p, title: '' })) }}
              placeholder="e.g. 12-Week Hypertrophy Block"
              className={`w-full border border-cb-border rounded-lg px-3 py-2 bg-surface text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/40 ${aiFormErrors.title ? 'border-red-500' : ''}`}
            />
            {aiFormErrors.title && <p className="text-red-500 text-xs mt-1">{aiFormErrors.title}</p>}
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Training Goal</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AI_GOALS.map(g => (
                <button key={g.value} type="button" onClick={() => setAiForm(f => ({ ...f, goal: g.value }))}
                  className={clsx('px-3 py-2 rounded-lg border text-sm text-left transition-colors', aiForm.goal === g.value ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-surface border-cb-border text-cb-secondary hover:border-cb-secondary')}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Experience Level</label>
            <div className="flex gap-2">
              {EXPERIENCE_LEVELS.map(lvl => (
                <button key={lvl} type="button" onClick={() => setAiForm(f => ({ ...f, experience_level: lvl }))}
                  className={clsx('px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors', aiForm.experience_level === lvl ? 'bg-brand text-white border-brand' : 'bg-surface text-cb-secondary border-cb-border hover:border-cb-secondary')}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Days/week + duration + length */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Days/Week</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6].map(n => (
                  <button key={n} type="button" onClick={() => setAiForm(f => ({ ...f, days_per_week: n }))}
                    className={clsx('flex-1 py-2 rounded-lg border text-sm font-medium transition-colors', aiForm.days_per_week === n ? 'bg-brand text-white border-brand' : 'bg-surface text-cb-secondary border-cb-border')}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Session (min)</label>
              <input type="number" value={aiForm.session_duration_minutes}
                onChange={e => setAiForm(f => ({ ...f, session_duration_minutes: parseInt(e.target.value) || 60 }))}
                className="w-full border border-cb-border rounded-lg px-3 py-2 bg-surface text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Length (weeks)</label>
              <input type="number" value={aiForm.program_length_weeks} min={1} max={16}
                onChange={e => setAiForm(f => ({ ...f, program_length_weeks: parseInt(e.target.value) || 4 }))}
                className="w-full border border-cb-border rounded-lg px-3 py-2 bg-surface text-cb-text focus:outline-none focus:ring-2 focus:ring-brand/40" />
            </div>
          </div>

          {/* Split */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Training Split</label>
            <div className="flex flex-wrap gap-2">
              {SPLITS.map(s => (
                <button key={s.value} type="button" onClick={() => setAiForm(f => ({ ...f, preferred_split: s.value }))}
                  className={clsx('px-3 py-1.5 rounded-full text-sm border transition-colors', aiForm.preferred_split === s.value ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-surface border-cb-border text-cb-secondary hover:border-cb-secondary')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Equipment Available</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} type="button" onClick={() => toggleAiEquipment(eq)}
                  className={clsx('px-3 py-1 rounded-full text-sm border transition-colors', aiForm.equipment_available.includes(eq) ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-surface border-cb-border text-cb-secondary hover:border-cb-secondary')}>
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Injuries */}
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Injuries / Limitations</label>
            <textarea value={aiForm.injuries_limitations} rows={2}
              onChange={e => setAiForm(f => ({ ...f, injuries_limitations: e.target.value }))}
              placeholder="e.g. Previous ACL tear, avoid overhead pressing"
              className="w-full border border-cb-border rounded-lg px-3 py-2 bg-surface text-cb-text placeholder-cb-muted resize-none focus:outline-none focus:ring-2 focus:ring-brand/40" />
          </div>

          {/* Generate button */}
          <button onClick={handleAiGenerate} disabled={generating}
            className="w-full py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Generating program...</>
            ) : (
              <><Sparkles size={17} /> Generate Workout Program</>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Programs</h1>
          <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mt-1.5 mb-1" />
          <p className="text-sm text-cb-muted mt-0.5">Build and manage training templates</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiGenerator(true)}
            className="flex items-center gap-2 px-4 py-2 border border-brand text-brand rounded-lg hover:bg-brand/5 transition-colors font-medium text-sm"
          >
            <Sparkles size={15} />
            AI Generate
          </button>
          <button
            onClick={() => { setBuilderProgramId(null); setShowWorkoutBuilder(true) }}
            className="flex items-center gap-2 px-4 py-2 border border-cb-border text-cb-secondary rounded-lg hover:border-brand/40 hover:text-brand transition-colors font-medium text-sm"
          >
            <Hammer size={15} />
            Build Workout
          </button>
          <button
            onClick={() => setShowNewProgramModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            New Program
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Programs', value: totalPrograms.toString(), icon: Layers },
          { label: 'Templates', value: totalTemplates.toString(), icon: FileText },
          { label: 'Avg Weeks', value: avgWeeks, icon: Calendar },
          { label: 'Active Clients', value: uniqueClients.toString(), icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-cb-border border-l-4 border-l-brand rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className="text-brand opacity-70" />
              <p className="text-xs text-cb-muted">{label}</p>
            </div>
            <p className="text-xl font-bold text-cb-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs and search */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['all', 'templates', 'assigned'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filterTab === tab
                  ? 'bg-brand text-white'
                  : 'bg-surface border border-cb-border text-cb-secondary hover:bg-surface-light'
              )}
            >
              {tab === 'all' ? 'All' : tab === 'templates' ? 'Templates' : 'Assigned'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* New Program Modal */}
      {showNewProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-cb-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-cb-text mb-4">New Program</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-cb-muted mb-1 block">Program Name</label>
                <input
                  type="text"
                  value={newProgramName}
                  onChange={e => setNewProgramName(e.target.value)}
                  placeholder="e.g. 8-Week Fat Loss"
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-cb-muted mb-1 block">Duration (weeks)</label>
                  <input type="number" min="1" max="52" value={newProgramWeeks} onChange={e => setNewProgramWeeks(e.target.value)} className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="text-xs font-medium text-cb-muted mb-1 block">Days/week</label>
                  <input type="number" min="1" max="7" value={newProgramDays} onChange={e => setNewProgramDays(e.target.value)} className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewProgramModal(false)} className="flex-1 px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light transition-colors">Cancel</button>
              <button onClick={handleCreateProgram} disabled={saving || !newProgramName.trim()} className="flex-1 px-3 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs grid */}
      {loading ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <Loader2 size={24} className="mx-auto text-cb-muted mb-3 animate-spin" />
          <p className="text-cb-muted text-sm">Loading programs...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <EmptyState
          icon={<Layers size={48} />}
          title={searchTerm ? 'No programs match your search' : 'No programs yet'}
          description={searchTerm ? 'Try adjusting your search or filters.' : 'Build your first training program — assign it to clients and track their progress.'}
          actionLabel={!searchTerm ? 'New Program' : undefined}
          onAction={!searchTerm ? () => setShowNewProgramModal(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {filteredPrograms.map(program => {
            const assignedClients = getClientsByIds(program.assignedClients)
            const isExpanded = expandedProgram === program.id

            return (
              <div key={program.id} className="bg-surface border border-cb-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Card header - clickable to expand */}
                <button
                  onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                  className="w-full px-5 py-4 text-left hover:bg-surface-light transition-colors"
                >
                  {/* Program name and template badge */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-cb-text text-lg">{program.name}</h3>
                    {program.isTemplate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        Template
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-cb-secondary mb-3 line-clamp-2">
                    {truncateText(program.description, 2)}
                  </p>

                  {/* Tags */}
                  <div className="flex gap-2 mb-4">
                    {program.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-light border border-cb-border text-cb-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta row */}
                  <p className="text-xs text-cb-muted mb-4">
                    {program.weeks} weeks · {program.daysPerWeek}x/week · {program.totalExercises} exercises
                  </p>

                  {/* Assigned clients avatars */}
                  <div className="flex items-center gap-2">
                    {assignedClients.slice(0, 3).map(client => (
                      <div
                        key={client.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border border-cb-border bg-brand/10"
                        title={client.full_name ?? undefined}
                      >
                        <span className="text-[10px] font-semibold text-brand">
                          {(client.full_name ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {assignedClients.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-cb-muted">
                          +{assignedClients.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-cb-border flex items-center justify-between">
                    <p className="text-xs text-cb-muted">
                      Last modified {program.lastModified}
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:bg-brand/5 hover:border-brand transition-colors">
                        Assign
                      </button>
                      <button className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:bg-brand/5 hover:border-brand transition-colors">
                        Duplicate
                      </button>
                    </div>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-cb-border space-y-4 pt-4">
                    {/* Full description */}
                    <div>
                      <p className="text-xs font-semibold text-cb-muted mb-1 uppercase tracking-wide">Description</p>
                      <p className="text-sm text-cb-secondary">{program.description}</p>
                    </div>

                    {/* Assign dropdown */}
                    <div>
                      <label className="text-xs font-semibold text-cb-muted mb-2 block uppercase tracking-wide">
                        Assign to Client
                      </label>
                      <select className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand">
                        <option value="">Select a client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.full_name ?? 'Unknown'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Save as template toggle */}
                    <div className="flex items-center justify-between p-3 bg-surface-light rounded-lg border border-cb-border">
                      <p className="text-xs font-semibold text-cb-text">Save as Template</p>
                      <input type="checkbox" className="rounded" defaultChecked={program.isTemplate} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm">
                        Edit Program
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
