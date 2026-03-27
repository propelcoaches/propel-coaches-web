'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Profile, CheckIn, CoachNote, WeightLog, WorkoutProgram,
  WorkoutDay, MacroTargets, FoodLog, ProgressPhoto, PersonalRecord, MealPlan,
} from '@/lib/types'
import { format, differenceInDays, addDays, startOfWeek, formatDistanceToNowStrict } from 'date-fns'
import { ArrowLeft, Pin, Plus, Save, ChevronDown, ChevronUp, Edit2, Check, X, Dumbbell, UtensilsCrossed, Sparkles, ChevronLeft, ChevronRight, Bot, Loader2, Mail, CheckCircle2, Clock, Calendar, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import clsx from 'clsx'
import ClientProgressTab from '@/components/training/ClientProgressTab'

type Tab = 'overview' | 'checkins' | 'training' | 'progress' | 'nutrition' | 'habits' | 'autoflow' | 'photos' | 'metrics' | 'notes' | 'settings'

type ClientInvoice = {
  id: string
  description: string
  amount_cents: number
  currency: string
  status: string
  due_date: string | null
  paid_at: string | null
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'checkins',  label: 'Check Ins' },
  { id: 'training',  label: 'Training' },
  { id: 'progress',  label: 'Progress' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'habits',    label: 'Habits' },
  { id: 'autoflow',  label: 'Autoflow' },
  { id: 'photos',    label: 'Photos' },
  { id: 'metrics',   label: 'Metrics' },
  { id: 'notes',     label: 'Notes' },
  { id: 'settings',  label: 'Settings' },
]

const FEATURE_TOGGLE_GROUPS = [
  {
    group: 'General',
    toggles: [
      { key: 'messaging', label: 'Messaging', description: 'Message your client directly through the platform', icon: '💬' },
      { key: 'check_ins', label: 'Check-Ins', description: 'Send scheduled check-in forms to track progress', icon: '✅' },
      { key: 'habit', label: 'Habit', description: 'Assign and track daily habits for your client', icon: '🔥' },
      { key: 'photos', label: 'Photos', description: 'Visualize improvement with progress photos', icon: '📷' },
      { key: 'metrics', label: 'Metrics', description: 'Track client progress using body metrics', icon: '📈' },
      { key: 'vault', label: 'Vault', description: 'Share resources, PDFs, and guides with your client', icon: '🗂️' },
    ],
  },
  {
    group: 'Training',
    toggles: [
      { key: 'workout', label: 'Workout', description: 'Assign and manage workout programs for your client', icon: '🏋️' },
      { key: 'workout_tracker', label: 'Workout Tracker', description: 'Let your client log sets, reps, and weights', icon: '📊' },
    ],
  },
  {
    group: 'Nutrition',
    toggles: [
      { key: 'nutrition', label: 'Nutrition', description: 'Assign meal plans and track nutrition compliance', icon: '🥗' },
    ],
  },
]

function ScoreBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className="text-cb-muted text-xs">—</span>
  const color =
    value >= 8 ? 'bg-cb-success/15 text-cb-success' :
    value >= 5 ? 'bg-cb-warning/15 text-cb-warning' :
    'bg-cb-danger/15 text-cb-danger'
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={clsx('px-2 py-0.5 rounded text-xs font-semibold', color)}>{value}</span>
      <span className="text-[10px] text-cb-muted">{label}</span>
    </div>
  )
}

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [client, setClient] = useState<Profile | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [programs, setPrograms] = useState<WorkoutProgram[]>([])
  const [programDays, setProgramDays] = useState<WorkoutDay[]>([])
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null)
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [prs, setPrs] = useState<PersonalRecord[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [loading, setLoading] = useState(true)

  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [editingMacros, setEditingMacros] = useState(false)
  const [macroForm, setMacroForm] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, fibre_g: 0 })
  const [savingMacros, setSavingMacros] = useState(false)

  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [savingComment, setSavingComment] = useState<string | null>(null)
  const [expandedCheckIn, setExpandedCheckIn] = useState<string | null>(null)

  // Training calendar state
  const [calendarView, setCalendarView] = useState<1 | 2 | 4>(4)
  const [calendarMode, setCalendarMode] = useState<'assignment' | 'history'>('assignment')
  const [calendarStartDate, setCalendarStartDate] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [programsAccordionOpen, setProgramsAccordionOpen] = useState(false)

  // Settings feature toggles
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({
    messaging: true,
    check_ins: true,
    habit: true,
    photos: true,
    metrics: true,
    vault: true,
    workout: true,
    workout_tracker: true,
    nutrition: true,
  })

  // Nutrition sub-tab
  const [nutritionSubTab, setNutritionSubTab] = useState<'meal_plans' | 'logger'>('meal_plans')

  type HabitLog = { date: string; value: string; memo: string }
  type Habit = { id: string; title: string; category: string; currentStreak: number; bestStreak: number; completions: number; totalDays: number; completionRate: number; logs: HabitLog[] }
  type AutoflowEvent = { id: string; date: string; type: string; title: string; color: string }

  const [habits, setHabits] = useState<Habit[]>([])
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  const [autoflowEvents] = useState<AutoflowEvent[]>([])
  const [autoflowView, setAutoflowView] = useState<'month' | 'week' | 'agenda'>('month')
  const [autoflowDate, setAutoflowDate] = useState(new Date())
  const [showAutoflowEventModal, setShowAutoflowEventModal] = useState(false)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')

  // AI Mode state
  const [aiModeActive, setAiModeActive] = useState(false)
  const [aiSession, setAiSession] = useState<{ id: string; ends_at: string; started_at: string } | null>(null)
  const [aiDurationDays, setAiDurationDays] = useState(7)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Manual creation modals
  const [showManualProgramModal, setShowManualProgramModal] = useState(false)
  const [showManualMealPlanModal, setShowManualMealPlanModal] = useState(false)

  const handleSaveManualProgram = async (data: {
    name: string; description: string; goal: string
    programType: 'fixed' | 'calendar'; weeks: number; daysPerWeek: number
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newProg, error } = await supabase.from('workout_programs').insert({
      client_id: clientId,
      coach_id: user?.id ?? null,
      name: data.name,
      description: data.description || null,
      goal: data.goal || null,
      weeks: data.weeks,
      current_week: 1,
      days_per_week: data.daysPerWeek,
      is_active: true,
      ai_generated: false,
      coach_approved: true,
    }).select().single()
    if (!error && newProg) {
      setPrograms(prev => [newProg as WorkoutProgram, ...prev])
      setShowManualProgramModal(false)
    }
  }

  const handleSaveManualMealPlan = async (data: {
    name: string; description: string; planType: 'meal' | 'macros'
    calories: string; protein: string; carbs: string; fat: string
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newPlan, error } = await supabase.from('meal_plans').insert({
      client_id: clientId,
      coach_id: user?.id ?? '',
      name: data.name,
      description: data.description || null,
      plan_type: data.planType,
      calories_target: parseInt(data.calories) || null,
      protein_target: parseInt(data.protein) || null,
      carbs_target: parseInt(data.carbs) || null,
      fats_target: parseInt(data.fat) || null,
      is_template: false,
    }).select().single()
    if (!error && newPlan) {
      setMealPlans(prev => [newPlan as MealPlan, ...prev])
      setShowManualMealPlanModal(false)
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [
      { data: clientData },
      { data: checkInData },
      { data: notesData },
      { data: weightData },
      { data: programData },
      { data: macroData },
      { data: foodData },
      { data: photoData },
      { data: prData },
      { data: mealPlanData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', clientId).single(),
      supabase.from('check_ins').select('*').eq('client_id', clientId).order('date', { ascending: false }),
      supabase.from('coach_notes').select('*').eq('client_id', clientId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('weight_logs').select('*').eq('client_id', clientId).order('date', { ascending: false }),
      supabase.from('workout_programs').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('macro_targets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('food_logs').select('*').eq('client_id', clientId).order('date', { ascending: false }).limit(50),
      supabase.from('progress_photos').select('*').eq('client_id', clientId).eq('visible_to_coach', true).order('date', { ascending: false }),
      supabase.from('personal_records').select('*').eq('client_id', clientId).order('date', { ascending: false }),
      supabase.from('meal_plans').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    ])

    setClient(clientData)
    setCheckIns(checkInData ?? [])
    setNotes(notesData ?? [])
    setWeightLogs(weightData ?? [])
    setPrograms(programData ?? [])
    setMacroTargets(macroData ?? null)
    setFoodLogs(foodData ?? [])
    setPhotos(photoData ?? [])
    setPrs(prData ?? [])
    setMealPlans(mealPlanData ?? [])

    // Load invoices for this client
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('id, description, amount_cents, currency, status, due_date, paid_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(4)
    setInvoices(invoiceData ?? [])

    if (macroData) {
      setMacroForm({
        calories: macroData.calories,
        protein_g: macroData.protein_g,
        carbs_g: macroData.carbs_g,
        fats_g: macroData.fats_g,
        fibre_g: macroData.fibre_g ?? 0,
      })
    }

    if (programData && programData.length > 0) {
      const activeProgram = programData.find((p) => p.is_active) ?? programData[0]
      const { data: daysData } = await supabase
        .from('workout_days')
        .select('*')
        .eq('program_id', activeProgram.id)
        .order('day_number')
      setProgramDays(daysData ?? [])
    }

    const drafts: Record<string, string> = {}
    ;(checkInData ?? []).forEach((c: CheckIn) => {
      drafts[c.id] = c.coach_comment ?? ''
    })
    setCommentDraft(drafts)

    // Load active AI Mode session
    const { data: aiSessionData } = await supabase
      .from('ai_mode_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    if (aiSessionData) {
      setAiSession(aiSessionData)
      setAiModeActive(true)
    }

    setLoading(false)
  }, [clientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      // BUG FIX: wrapped in try-catch-finally so setSavingNote(false) always runs,
      // preventing the UI from getting stuck in a "saving" state on network errors.
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('coach_notes').insert({
        coach_id: user.id, client_id: clientId,
        content: newNote.trim(), is_pinned: false,
      })
      if (error) throw error
      setNewNote('')
      loadData()
    } catch {
      // Surface error non-intrusively — could be wired to a toast system
      console.error('Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  async function saveMacros() {
    setSavingMacros(true)
    try {
      // BUG FIX: wrapped in try-catch-finally so saving state always resets,
      // even if the Supabase call throws (e.g. RLS policy rejection).
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let error
      if (macroTargets) {
        ({ error } = await supabase.from('macro_targets').update({
          ...macroForm, set_by_coach: true, updated_at: new Date().toISOString(),
        }).eq('id', macroTargets.id))
      } else {
        ({ error } = await supabase.from('macro_targets').insert({
          client_id: clientId, ...macroForm, set_by_coach: true,
        }))
      }
      if (error) throw error
      setEditingMacros(false)
      loadData()
    } catch {
      console.error('Failed to save macros')
    } finally {
      setSavingMacros(false)
    }
  }

  async function saveComment(checkInId: string) {
    setSavingComment(checkInId)
    try {
      // BUG FIX: try-finally ensures setSavingComment(null) always runs,
      // preventing the save button from staying in a perpetual loading state.
      const supabase = createClient()
      const { error } = await supabase.from('check_ins')
        .update({ coach_comment: commentDraft[checkInId] })
        .eq('id', checkInId)
      if (error) throw error
      loadData()
    } catch {
      console.error('Failed to save comment')
    } finally {
      setSavingComment(null)
    }
  }

  async function togglePin(noteId: string, currentPinned: boolean) {
    try {
      // BUG FIX: added try-catch so a failed pin toggle doesn't leave UI
      // in an inconsistent state without any feedback.
      const supabase = createClient()
      const { error } = await supabase.from('coach_notes')
        .update({ is_pinned: !currentPinned })
        .eq('id', noteId)
      if (error) throw error
      loadData()
    } catch {
      console.error('Failed to toggle pin')
    }
  }

  async function handleActivateAI() {
    setAiLoading(true); setAiError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const endsAt = new Date(Date.now() + aiDurationDays * 86400000).toISOString()
    // First deactivate any existing sessions
    await supabase.from('ai_mode_sessions').update({ is_active: false }).eq('client_id', clientId).eq('coach_id', user.id)
    // Auto-pull sample messages for AI profile
    const { data: recentMsgs } = await supabase.from('messages').select('content').eq('coach_id', user.id).eq('sender_role', 'coach').order('created_at', { ascending: false }).limit(50)
    if (recentMsgs && recentMsgs.length > 0) {
      await supabase.from('coach_ai_profiles').upsert({ coach_id: user.id, sample_messages: recentMsgs.map((m: { content: string }) => ({ role: 'assistant', content: m.content })) }, { onConflict: 'coach_id' })
    }
    const { data: session, error } = await supabase.from('ai_mode_sessions').insert({ coach_id: user.id, client_id: clientId, duration_days: aiDurationDays, ends_at: endsAt, is_active: true }).select().single()
    if (error) { setAiError(error.message); setAiLoading(false); return }
    setAiSession(session)
    setAiModeActive(true)
    setAiLoading(false)
  }

  async function handleEndAISession() {
    if (!aiSession) return
    setAiLoading(true)
    // Call summarise endpoint
    await fetch('/api/ai-coach/summarise', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-webhook-secret': '' }, body: JSON.stringify({ sessionId: aiSession.id }) })
    const supabase = createClient()
    await supabase.from('ai_mode_sessions').update({ is_active: false }).eq('id', aiSession.id)
    setAiSession(null); setAiModeActive(false); setAiLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return <div className="p-6 text-center text-cb-muted">Client not found.</div>
  }

  const weightChange = client.current_weight_kg && client.starting_weight_kg
    ? client.current_weight_kg - client.starting_weight_kg
    : null

  const daysSinceStart = client.created_at
    ? differenceInDays(new Date(), new Date(client.created_at))
    : null

  const latestCheckIn = checkIns[0] ?? null
  const latestWeight = weightLogs[0] ?? null
  const programAdherence = programs.length > 0
    ? Math.round((programs.filter((p) => p.is_active).length / programs.length) * 100)
    : 0

  // Group food logs by date
  const foodByDate: Record<string, FoodLog[]> = {}
  foodLogs.forEach((log) => {
    if (!foodByDate[log.date]) foodByDate[log.date] = []
    foodByDate[log.date].push(log)
  })

  // Weight chart data (last 8 entries, reversed to chronological)
  const chartData = [...weightLogs].reverse().slice(-8)
  const maxWeight = Math.max(...chartData.map((w) => w.weight_kg), 1)
  const minWeight = Math.min(...chartData.map((w) => w.weight_kg), 0)
  const chartRange = maxWeight - minWeight || 10

  const startingWeight = weightLogs[weightLogs.length - 1]?.weight_kg ?? client.starting_weight_kg
  const currentWeight = weightLogs[0]?.weight_kg ?? client.current_weight_kg
  const totalChange = startingWeight && currentWeight ? currentWeight - startingWeight : null
  const pctChange = startingWeight && totalChange ? (totalChange / startingWeight) * 100 : null

  // Calendar helpers
  const calendarRangeLabel = (() => {
    const end = addDays(calendarStartDate, calendarView * 7 - 1)
    return `${format(calendarStartDate, 'MMM d')} – ${format(end, 'MMM d')}`
  })()

  // For demo: figure out which cell indices should show a workout (active programs on Mondays)
  const activeProgram = programs.find((p) => p.is_active)
  const workoutCellIndices: Set<number> = new Set()
  if (activeProgram) {
    for (let week = 0; week < calendarView; week++) {
      workoutCellIndices.add(week * 7) // Monday of each week
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back + Header */}
      <div className="mb-6">
        <Link href="/clients" className="flex items-center gap-1 text-sm text-cb-muted hover:text-cb-secondary mb-4">
          <ArrowLeft size={14} />
          Back to Clients
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-cb-teal">
              {(client.name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cb-text">{client.name ?? 'Unnamed Client'}</h1>
            <p className="text-sm text-cb-muted">{client.email} {client.phone ? `· ${client.phone}` : ''}</p>
          </div>
          <div className="ml-auto">
            {client.onboarding_completed ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cb-success/15 text-cb-success border border-cb-success/30">Active</span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cb-warning/15 text-cb-warning border border-cb-warning/30">Onboarding</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-cb-border mb-6">
        <nav className="flex gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-cb-teal text-cb-teal'
                  : 'border-transparent text-cb-secondary hover:text-cb-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-5">

          {/* ── Left column: Client Details + Notes ── */}
          <div className="space-y-4">
            {/* Client Details */}
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-cb-text mb-4">Client Details</h2>
              <div className="space-y-3">
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-cb-teal">
                      {(client.name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-cb-muted uppercase tracking-wide">Name</p>
                    <p className="text-sm text-cb-text font-medium">{client.name ?? '—'}</p>
                  </div>
                </div>
                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0">
                    <Mail size={13} className="text-cb-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-cb-muted uppercase tracking-wide">Email</p>
                    <p className="text-xs text-cb-secondary truncate">{client.email ?? '—'}</p>
                  </div>
                </div>
                {/* Last Check-In */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={13} className="text-cb-muted" />
                  </div>
                  <div>
                    <p className="text-[10px] text-cb-muted uppercase tracking-wide">Last Check-In</p>
                    <p className="text-xs text-cb-secondary">
                      {latestCheckIn ? format(new Date(latestCheckIn.date), 'd MMM yyyy') : '—'}
                    </p>
                  </div>
                </div>
                {/* Last Active */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0">
                    <Clock size={13} className="text-cb-muted" />
                  </div>
                  <div>
                    <p className="text-[10px] text-cb-muted uppercase tracking-wide">Last Active</p>
                    <p className="text-xs text-cb-secondary">
                      {latestCheckIn
                        ? formatDistanceToNowStrict(new Date(latestCheckIn.created_at ?? latestCheckIn.date), { addSuffix: true })
                        : '—'}
                    </p>
                  </div>
                </div>
                {/* Duration */}
                {activeProgram && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0">
                      <Calendar size={13} className="text-cb-muted" />
                    </div>
                    <div>
                      <p className="text-[10px] text-cb-muted uppercase tracking-wide">Duration</p>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-0.5',
                        activeProgram.current_week <= activeProgram.weeks
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {activeProgram.current_week <= activeProgram.weeks
                          ? `Week ${activeProgram.current_week} of ${activeProgram.weeks}`
                          : 'Finished'}
                      </span>
                    </div>
                  </div>
                )}
                {/* Tags */}
                <div className="pt-1">
                  <p className="text-[10px] text-cb-muted uppercase tracking-wide mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {((client as unknown as { tags: string[] }).tags ?? []).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cb-teal/10 text-cb-teal border border-cb-teal/20">{tag}</span>
                    ))}
                    <button className="px-2 py-0.5 rounded-full text-[11px] border border-dashed border-cb-border text-cb-muted hover:border-cb-teal hover:text-cb-teal transition-colors">
                      +
                    </button>
                  </div>
                </div>
                {/* Questionnaires */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-cb-muted uppercase tracking-wide">Questionnaires</p>
                  <button className="text-xs text-cb-teal hover:underline font-medium">+ Add</button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-cb-text mb-4">Notes</h2>
              {notes.length === 0 ? (
                <p className="text-xs text-cb-muted text-center py-3">No notes yet.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {notes.slice(0, 4).map((note) => (
                    <div key={note.id} className="pb-2 border-b border-cb-border last:border-0 last:pb-0">
                      <p className="text-xs text-cb-secondary leading-relaxed">{note.content}</p>
                      <p className="text-[10px] text-cb-muted mt-1">{format(new Date(note.created_at), 'd MMM yyyy')}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add a note…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  className="flex-1 px-2.5 py-1.5 border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal"
                />
                <button
                  onClick={addNote}
                  disabled={savingNote || !newNote.trim()}
                  className="px-2.5 py-1.5 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-surface-light text-white rounded-lg flex items-center"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Middle column: Metrics Avg + Recent Photos ── */}
          <div className="space-y-4">
            {/* Metrics Avg */}
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-cb-text mb-4">Metrics Avg</h2>
              {currentWeight ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-cb-muted uppercase tracking-wide mb-1">Weight</p>
                      <p className="text-2xl font-bold text-cb-text">{currentWeight} kg</p>
                    </div>
                    {pctChange !== null && (
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-semibold',
                        pctChange <= 0 ? 'bg-cb-success/15 text-cb-success' : 'bg-cb-danger/15 text-cb-danger'
                      )}>
                        {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {totalChange !== null && (
                    <p className="text-[11px] text-cb-muted">
                      {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} kg since start
                    </p>
                  )}
                  {chartData.length >= 2 && (
                    <div className="mt-4 flex items-end gap-0.5 h-12">
                      {chartData.map((entry, i) => {
                        const heightPct = ((entry.weight_kg - minWeight) / chartRange) * 100
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-cb-teal/40 rounded-sm"
                            style={{ height: `${Math.max(heightPct, 8)}%` }}
                            title={`${entry.weight_kg} kg`}
                          />
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-cb-muted py-2">No weight data yet.</p>
              )}
            </div>

            {/* Recent Photos */}
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-cb-text mb-4">Recent Photos</h2>
              {photos.length === 0 ? (
                <div className="py-6 text-center">
                  <ImageIcon size={24} className="text-cb-muted mx-auto mb-2" />
                  <p className="text-xs text-cb-muted">No photos yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.slice(0, 6).map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-surface-light">
                      <img src={photo.public_url ?? photo.storage_path} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Activity Log + Payments ── */}
          <div className="space-y-4">
            {/* Activity Log */}
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-cb-text mb-4">Activity Log</h2>
              {programDays.filter((d) => d.completed).length === 0 ? (
                <p className="text-xs text-cb-muted py-2">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {programDays.filter((d) => d.completed).slice(0, 5).map((day) => (
                    <li key={day.id} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-cb-success/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Dumbbell size={11} className="text-cb-success" />
                      </div>
                      <div>
                        <p className="text-xs text-cb-secondary leading-snug">
                          Completed {day.name} workout.
                        </p>
                        {day.completed_at && (
                          <p className="text-[10px] text-cb-muted mt-0.5">
                            {format(new Date(day.completed_at), 'MMMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Payments */}
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-cb-text">Payments</h2>
                <Link href="/payments" className="text-xs text-cb-teal hover:underline font-medium">View all</Link>
              </div>
              {invoices.length === 0 ? (
                <div className="space-y-2.5">
                  {[75, 55, 40].map((w) => (
                    <div key={w} className="h-5 bg-surface-light rounded-md" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-xs">
                      <span className="text-cb-secondary truncate flex-1 mr-2">{inv.description}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-cb-text font-medium">
                          ${(inv.amount_cents / 100).toFixed(0)} {inv.currency.toUpperCase()}
                        </span>
                        <span className={clsx(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                          inv.status === 'paid' ? 'bg-cb-success/15 text-cb-success' :
                          inv.status === 'overdue' ? 'bg-cb-danger/15 text-cb-danger' :
                          'bg-surface-light text-cb-muted border border-cb-border'
                        )}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ─── CHECK INS TAB ─── */}
      {activeTab === 'checkins' && (
        <div className="space-y-3">
          {checkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-surface border border-cb-border flex items-center justify-center">
                <CheckCircle2 size={28} className="text-cb-border" />
              </div>
              <p className="text-sm font-semibold text-cb-secondary mb-1">No check ins found</p>
              <p className="text-xs text-cb-muted">This client hasn&apos;t submitted any check-ins yet.</p>
            </div>
          ) : checkIns.map((ci) => (
            <div key={ci.id} className={clsx('bg-surface border rounded-xl overflow-hidden', ci.submitted ? 'border-cb-success/30' : 'border-cb-border')}>
              <button
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-surface-light transition-colors"
                onClick={() => setExpandedCheckIn(expandedCheckIn === ci.id ? null : ci.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-cb-text">{format(new Date(ci.date), 'd MMMM yyyy')}</span>
                    {ci.bodyweight_kg && <span className="text-sm text-cb-secondary">{ci.bodyweight_kg} kg</span>}
                    <span className={clsx('ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      ci.submitted ? 'bg-cb-success/15 text-cb-success' : 'bg-surface-light text-cb-muted'
                    )}>
                      {ci.submitted ? 'Submitted' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ScoreBadge value={ci.energy} label="Energy" />
                    <ScoreBadge value={ci.stress} label="Stress" />
                    <ScoreBadge value={ci.sleep_quality} label="Sleep" />
                    <ScoreBadge value={ci.training_difficulty} label="Training" />
                  </div>
                </div>
                {expandedCheckIn === ci.id ? <ChevronUp size={16} className="text-cb-muted" /> : <ChevronDown size={16} className="text-cb-muted" />}
              </button>

              {expandedCheckIn === ci.id && (
                <div className="px-5 pb-5 border-t border-cb-border space-y-4">
                  {/* Score grid */}
                  <div className="grid grid-cols-4 gap-3 pt-4">
                    {[
                      { label: 'Energy', value: ci.energy },
                      { label: 'Stress', value: ci.stress },
                      { label: 'Sleep Quality', value: ci.sleep_quality },
                      { label: 'Training Difficulty', value: ci.training_difficulty },
                    ].map(({ label, value }) => {
                      const color = value === null ? 'bg-surface-light text-cb-muted' :
                        value >= 8 ? 'bg-cb-success/15 text-cb-success border border-cb-success/30' :
                        value >= 5 ? 'bg-cb-warning/15 text-cb-warning border border-cb-warning/30' :
                        'bg-cb-danger/15 text-cb-danger border border-cb-danger/30'
                      return (
                        <div key={label} className={clsx('rounded-xl p-3 text-center', color)}>
                          <p className="text-xl font-bold">{value ?? '—'}</p>
                          <p className="text-[10px] mt-0.5 opacity-80">{label}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-cb-muted mb-1 uppercase tracking-wide">Wins</p>
                      <p className="text-sm text-cb-secondary">{ci.wins || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-cb-muted mb-1 uppercase tracking-wide">Struggles</p>
                      <p className="text-sm text-cb-secondary">{ci.struggles || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-cb-muted mb-2 uppercase tracking-wide">Coach Comment</p>
                    <div className="flex gap-2">
                      <textarea rows={3} value={commentDraft[ci.id] ?? ''} onChange={(e) => setCommentDraft({ ...commentDraft, [ci.id]: e.target.value })}
                        placeholder="Add your feedback…"
                        className="flex-1 px-3 py-2 border border-cb-border rounded-xl text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none" />
                      <button onClick={() => saveComment(ci.id)} disabled={savingComment === ci.id}
                        className="px-3 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-cb-teal/50 text-white rounded-xl flex items-center gap-1 text-sm self-start">
                        {savingComment === ci.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={14} /> Save</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── TRAINING TAB ─── */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          {/* Calendar header */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setCalendarStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 py-1.5 text-xs font-medium border border-cb-border rounded-xl text-cb-secondary hover:bg-surface-light"
            >
              TODAY
            </button>
            <button
              onClick={() => setCalendarStartDate(d => addDays(d, -calendarView * 7))}
              className="p-1.5 rounded-xl border border-cb-border text-cb-secondary hover:bg-surface-light"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-cb-text min-w-[120px] text-center">{calendarRangeLabel}</span>
            <button
              onClick={() => setCalendarStartDate(d => addDays(d, calendarView * 7))}
              className="p-1.5 rounded-xl border border-cb-border text-cb-secondary hover:bg-surface-light"
            >
              <ChevronRight size={14} />
            </button>
            <div className="flex rounded-xl border border-cb-border overflow-hidden ml-2">
              {(['Assignment', 'History'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCalendarMode(m.toLowerCase() as 'assignment' | 'history')}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    calendarMode === m.toLowerCase()
                      ? 'bg-cb-teal text-white'
                      : 'text-cb-secondary hover:bg-surface-light'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs border border-cb-border rounded-xl text-cb-secondary hover:bg-surface-light flex items-center gap-1">
                <Save size={12} /> Save as Program
              </button>
              <div className="flex items-center gap-2">
                <Link href="/training" className="flex items-center gap-1.5 px-3 py-1.5 border border-cb-teal/50 text-cb-teal hover:bg-cb-teal/10 rounded-xl text-xs font-medium transition-colors">
                  <Sparkles size={12} /> AI Generate
                </Link>
                <button
                  onClick={() => setShowManualProgramModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  <Plus size={12} /> Create Program
                </button>
              </div>
              <div className="flex rounded-xl border border-cb-border overflow-hidden">
                {([1, 2, 4] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setCalendarView(w)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium transition-colors',
                      calendarView === w
                        ? 'bg-cb-teal text-white'
                        : 'text-cb-secondary hover:bg-surface-light'
                    )}
                  >
                    {w}W
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0 border border-cb-border rounded-xl overflow-hidden">
            {/* Header row */}
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
              <div key={d} className="bg-surface-light border-b border-cb-border px-3 py-2 text-xs font-semibold text-cb-secondary text-center">{d}</div>
            ))}
            {/* Date cells */}
            {Array.from({ length: calendarView * 7 }, (_, i) => {
              const date = addDays(calendarStartDate, i)
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              const colIndex = i % 7
              const isWeekend = colIndex >= 5
              const hasWorkout = workoutCellIndices.has(i)
              return (
                <div
                  key={i}
                  className={clsx(
                    'min-h-[90px] border-b border-r border-cb-border p-2 relative',
                    isWeekend ? 'bg-surface-light/50' : 'bg-surface',
                    colIndex === 6 ? 'border-r-0' : ''
                  )}
                >
                  <span className={clsx(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-cb-teal text-white' : 'text-cb-secondary'
                  )}>
                    {format(date, 'd')}
                  </span>
                  {hasWorkout && activeProgram && (
                    <div className="mt-1 px-2 py-1 rounded-md bg-cb-teal/15 border border-cb-teal/30 text-[10px] font-medium text-cb-teal truncate">
                      {activeProgram.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Assigned Programs accordion */}
          <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
            <button
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-surface-light transition-colors"
              onClick={() => setProgramsAccordionOpen(!programsAccordionOpen)}
            >
              <span className="text-sm font-semibold text-cb-text">Assigned Programs</span>
              {programsAccordionOpen ? <ChevronUp size={16} className="text-cb-muted" /> : <ChevronDown size={16} className="text-cb-muted" />}
            </button>
            {programsAccordionOpen && (
              <div className="border-t border-cb-border p-4 space-y-3">
                {programs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Dumbbell size={28} className="mx-auto text-cb-muted mb-2" />
                    <p className="text-sm text-cb-muted">No workout programs assigned yet.</p>
                  </div>
                ) : programs.map((program) => (
                  <div key={program.id} className={clsx('bg-surface border rounded-xl p-4', program.is_active ? 'border-cb-teal/30' : 'border-cb-border')}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-cb-text">{program.name}</h3>
                          {program.is_active && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cb-teal/10 text-cb-teal">Active</span>
                          )}
                          {program.ai_generated && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-light text-cb-muted">AI</span>
                          )}
                        </div>
                        <p className="text-xs text-cb-muted mt-0.5">
                          Week {program.current_week} of {program.weeks} · {program.days_per_week} days/week
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-surface-light rounded-full overflow-hidden">
                          <div className="h-full bg-cb-teal rounded-full" style={{ width: `${Math.min((program.current_week / program.weeks) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-cb-muted">{Math.round((program.current_week / program.weeks) * 100)}%</span>
                      </div>
                    </div>
                    {program.description && <p className="text-xs text-cb-muted mb-2">{program.description}</p>}
                    {program.is_active && programDays.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {programDays.map((day) => (
                          <div key={day.id} className={clsx('rounded-xl px-3 py-2 text-xs font-medium',
                            day.completed ? 'bg-cb-success/15 text-cb-success border border-cb-success/30' : 'bg-surface-light text-cb-secondary border border-cb-border'
                          )}>
                            <p>Day {day.day_number}</p>
                            <p className="truncate mt-0.5">{day.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PROGRESS TAB ─── */}
      {activeTab === 'progress' && (
        <ClientProgressTab
          clientId={params.id as string}
          clientName={client?.name ?? 'Client'}
        />
      )}

      {/* ─── NUTRITION TAB ─── */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-1 border-b border-cb-border -mt-2 mb-2">
            {[
              { id: 'meal_plans' as const, label: 'Meal Plans' },
              { id: 'logger' as const, label: 'Nutrition Logger' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setNutritionSubTab(st.id)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                  nutritionSubTab === st.id
                    ? 'border-cb-teal text-cb-teal'
                    : 'border-transparent text-cb-secondary hover:text-cb-text'
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* ── Meal Plans sub-tab ── */}
          {nutritionSubTab === 'meal_plans' && (<>
          {/* Macro Targets */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-cb-text">Macro Targets</h2>
              <button onClick={() => setEditingMacros(!editingMacros)} className="text-xs text-cb-teal hover:text-cb-teal/80 flex items-center gap-1">
                <Edit2 size={12} />
                {editingMacros ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingMacros ? (
              <div className="grid grid-cols-5 gap-3">
                {(['calories', 'protein_g', 'carbs_g', 'fats_g', 'fibre_g'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-xs text-cb-muted mb-1 capitalize">{field.replace('_g', '').replace('calories', 'Cals')}</label>
                    <input type="number" value={macroForm[field]} onChange={(e) => setMacroForm({ ...macroForm, [field]: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-cb-border rounded text-sm text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal" />
                  </div>
                ))}
                <div className="col-span-5 flex gap-2">
                  <button onClick={() => setEditingMacros(false)} className="px-4 py-1.5 border border-cb-border rounded text-sm text-cb-secondary hover:bg-surface-light">Cancel</button>
                  <button onClick={saveMacros} disabled={savingMacros} className="px-4 py-1.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded text-sm flex items-center gap-1">
                    {savingMacros ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            ) : macroTargets ? (
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: 'Calories', value: `${macroTargets.calories}`, unit: 'kcal', color: 'text-cb-text' },
                  { label: 'Protein', value: `${macroTargets.protein_g}`, unit: 'g', color: 'text-cb-warning' },
                  { label: 'Carbs', value: `${macroTargets.carbs_g}`, unit: 'g', color: 'text-cb-teal' },
                  { label: 'Fats', value: `${macroTargets.fats_g}`, unit: 'g', color: 'text-cb-danger' },
                  { label: 'Fibre', value: macroTargets.fibre_g ? `${macroTargets.fibre_g}` : '—', unit: 'g', color: 'text-cb-secondary' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="text-center bg-surface-light rounded-xl p-3">
                    <p className={clsx('text-xl font-bold', color)}>{value}</p>
                    <p className="text-xs text-cb-muted">{unit}</p>
                    <p className="text-xs font-medium text-cb-secondary mt-1">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-cb-muted">No macro targets set. Click Edit to add them.</p>
            )}
          </div>

          {/* Macro compliance bars (if food logs today) */}
          {macroTargets && (
            <div className="bg-surface border border-cb-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-cb-text mb-4">Today&apos;s Compliance</h2>
              {Object.values(foodByDate)[0] ? (() => {
                const todayLogs = Object.values(foodByDate)[0]
                const totals = todayLogs.reduce((acc, l) => ({
                  calories: acc.calories + l.calories,
                  protein: acc.protein + l.protein_g,
                  carbs: acc.carbs + l.carbs_g,
                  fats: acc.fats + l.fats_g,
                }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
                return (
                  <div className="space-y-3">
                    {[
                      { label: 'Calories', current: totals.calories, target: macroTargets.calories, unit: 'kcal', color: 'bg-cb-teal' },
                      { label: 'Protein', current: totals.protein, target: macroTargets.protein_g, unit: 'g', color: 'bg-cb-warning' },
                      { label: 'Carbs', current: totals.carbs, target: macroTargets.carbs_g, unit: 'g', color: 'bg-cb-teal' },
                      { label: 'Fats', current: totals.fats, target: macroTargets.fats_g, unit: 'g', color: 'bg-cb-danger' },
                    ].map(({ label, current, target, unit, color }) => {
                      const pct = Math.min((current / target) * 100, 100)
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-cb-secondary">{label}</span>
                            <span className="text-cb-muted">{current} / {target} {unit}</span>
                          </div>
                          <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })() : (
                <p className="text-sm text-cb-muted">No food logs for today.</p>
              )}
            </div>
          )}

          {/* Meal Plans */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-cb-text">Meal Plans</h2>
              <div className="flex items-center gap-2">
                <Link href="/nutrition" className="flex items-center gap-1.5 px-3 py-1.5 border border-cb-teal/50 text-cb-teal hover:bg-cb-teal/10 rounded-xl text-xs font-medium transition-colors">
                  <Sparkles size={12} /> AI Generate
                </Link>
                <button
                  onClick={() => setShowManualMealPlanModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  <Plus size={12} /> Create Plan
                </button>
              </div>
            </div>
            {mealPlans.length === 0 ? (
              <div className="py-8 text-center">
                <UtensilsCrossed size={28} className="mx-auto text-cb-muted mb-2" />
                <p className="text-sm text-cb-muted">No meal plans assigned yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mealPlans.map((mp) => (
                  <div key={mp.id} className="flex items-center justify-between px-4 py-3 bg-surface-light rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-cb-text">{mp.name}</p>
                      <p className="text-xs text-cb-muted">{mp.plan_type === 'meal' ? 'Meal Plan' : 'Macros Plan'} · Created {format(new Date(mp.created_at), 'd MMM yyyy')}</p>
                    </div>
                    <Link href="/nutrition" className="text-xs text-cb-teal hover:text-cb-teal/80 font-medium">Edit</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Food Logs */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-cb-text mb-4">Recent Food Logs</h2>
            {Object.keys(foodByDate).length === 0 ? (
              <p className="text-sm text-cb-muted">No food logs recorded.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(foodByDate).slice(0, 3).map(([date, logs]) => {
                  const totals = logs.reduce((acc, l) => ({
                    calories: acc.calories + l.calories,
                    protein: acc.protein + l.protein_g,
                    carbs: acc.carbs + l.carbs_g,
                    fats: acc.fats + l.fats_g,
                  }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
                  return (
                    <div key={date}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-cb-secondary">{format(new Date(date), 'EEEE, d MMM yyyy')}</p>
                        <p className="text-xs text-cb-muted">{totals.calories} kcal · P:{totals.protein}g C:{totals.carbs}g F:{totals.fats}g</p>
                      </div>
                      <div className="space-y-1">
                        {logs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between text-xs py-1 border-b border-cb-border last:border-0">
                            <div className="flex items-center gap-2">
                              <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
                                log.meal === 'breakfast' ? 'bg-cb-warning/15 text-cb-warning' :
                                log.meal === 'lunch' ? 'bg-cb-teal/10 text-cb-teal' :
                                log.meal === 'dinner' ? 'bg-cb-teal-dark/20 text-cb-teal' :
                                'bg-surface-light text-cb-muted'
                              )}>
                                {log.meal}
                              </span>
                              <span className="text-cb-secondary">{log.name}</span>
                            </div>
                            <span className="text-cb-muted">{log.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          </>)}

          {/* ── Nutrition Logger sub-tab ── */}
          {nutritionSubTab === 'logger' && (
            <div className="grid grid-cols-3 gap-6">
              {/* Left: weekly macro chart + compliance */}
              <div className="col-span-2 space-y-5">
                {/* Weekly macro summary chart */}
                <div className="bg-surface border border-cb-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-cb-text">Weekly Macros</h3>
                    <span className="text-xs text-cb-muted">Last 7 days</span>
                  </div>
                  {/* Simple bar chart */}
                  <div className="space-y-3">
                    {[
                      { label: 'Calories', values: [1820, 2100, 1950, 2200, 1780, 2050, 1900], max: 2200, target: macroTargets?.calories ?? 2000, color: 'bg-cb-teal' },
                      { label: 'Protein (g)', values: [142, 168, 155, 172, 138, 160, 145], max: 180, target: macroTargets?.protein_g ?? 160, color: 'bg-cb-warning' },
                      { label: 'Carbs (g)', values: [210, 250, 230, 265, 195, 240, 220], max: 280, target: macroTargets?.carbs_g ?? 250, color: 'bg-cb-success' },
                      { label: 'Fats (g)', values: [68, 75, 72, 80, 65, 77, 70], max: 85, target: macroTargets?.fats_g ?? 75, color: 'bg-cb-danger' },
                    ].map(row => {
                      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                      return (
                        <div key={row.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-cb-secondary">{row.label}</span>
                            <span className="text-xs text-cb-muted">Target: {row.target}</span>
                          </div>
                          <div className="flex items-end gap-1 h-10">
                            {row.values.map((v, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                <div
                                  className={clsx('w-full rounded-t transition-all', row.color, 'opacity-80')}
                                  style={{ height: `${(v / row.max) * 100}%` }}
                                />
                                <span className="text-[9px] text-cb-muted">{days[i]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Macro breakdown table */}
                <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-cb-border">
                    <h3 className="text-sm font-semibold text-cb-text">Weekly Breakdown</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-surface-light border-b border-cb-border">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Macro</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Avg / Day</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Weekly Total</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Target</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Compliance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cb-border">
                      {[
                        { label: 'Calories', avg: 1971, total: 13800, target: macroTargets?.calories ?? 2000, unit: 'kcal' },
                        { label: 'Protein', avg: 154, total: 1080, target: macroTargets?.protein_g ?? 160, unit: 'g' },
                        { label: 'Carbs', avg: 230, total: 1610, target: macroTargets?.carbs_g ?? 250, unit: 'g' },
                        { label: 'Fat', avg: 72, total: 507, target: macroTargets?.fats_g ?? 75, unit: 'g' },
                        { label: 'Fibre', avg: 28, total: 196, target: macroTargets?.fibre_g ?? 30, unit: 'g' },
                        { label: 'Sugar', avg: 42, total: 294, target: 50, unit: 'g' },
                        { label: 'Sodium', avg: 1850, total: 12950, target: 2300, unit: 'mg' },
                      ].map(row => {
                        const compliance = Math.round((row.avg / row.target) * 100)
                        const color = compliance >= 90 && compliance <= 110 ? 'text-cb-success' : compliance >= 75 ? 'text-cb-warning' : 'text-cb-danger'
                        return (
                          <tr key={row.label} className="hover:bg-surface-light/50">
                            <td className="px-5 py-3 font-medium text-cb-text">{row.label}</td>
                            <td className="px-5 py-3 text-right text-cb-secondary">{row.avg} {row.unit}</td>
                            <td className="px-5 py-3 text-right text-cb-secondary">{row.total} {row.unit}</td>
                            <td className="px-5 py-3 text-right text-cb-muted">{row.target} {row.unit}</td>
                            <td className={clsx('px-5 py-3 text-right font-semibold', color)}>{compliance}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: compliance calendar */}
              <div className="space-y-4">
                <div className="bg-surface border border-cb-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-cb-text mb-1">Weekly Compliance</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-3xl font-black text-cb-teal">71%</div>
                    <div>
                      <p className="text-xs text-cb-muted">5 of 7 days</p>
                      <p className="text-xs text-cb-secondary">logged this week</p>
                    </div>
                  </div>
                  {/* Mini calendar dots */}
                  <div className="grid grid-cols-7 gap-1">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-cb-muted">{d}</span>
                        <div className={clsx(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[9px]',
                          [true, true, false, true, true, true, false][i]
                            ? 'bg-cb-teal text-white'
                            : 'bg-surface-light text-cb-muted border border-cb-border'
                        )}>
                          {[true, true, false, true, true, true, false][i] ? '✓' : '–'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent meals */}
                <div className="bg-surface border border-cb-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-cb-text mb-3">Today&apos;s Log</h3>
                  {Object.values(foodByDate)[0] ? (
                    <div className="space-y-2">
                      {Object.values(foodByDate)[0].slice(0, 4).map(log => (
                        <div key={log.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0',
                              log.meal === 'breakfast' ? 'bg-cb-warning' :
                              log.meal === 'lunch' ? 'bg-cb-teal' :
                              log.meal === 'dinner' ? 'bg-purple-400' : 'bg-cb-muted'
                            )} />
                            <span className="text-cb-secondary">{log.name}</span>
                          </div>
                          <span className="text-cb-muted">{log.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-cb-muted">No logs today.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── HABITS TAB ─── */}
      {activeTab === 'habits' && (
        habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-surface border border-cb-border flex items-center justify-center">
              <span className="text-3xl">🔥</span>
            </div>
            <p className="text-sm font-semibold text-cb-secondary mb-1">No habits assigned</p>
            <p className="text-xs text-cb-muted">Assign habits to this client to track their daily consistency.</p>
          </div>
        ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Habit list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-cb-text">Assigned Habits</h2>
              <button className="flex items-center gap-1 text-xs text-cb-teal hover:text-cb-teal/80 font-medium">
                <Plus size={12} /> Add Habit
              </button>
            </div>
            {habits.map(habit => (
              <button
                key={habit.id}
                onClick={() => setSelectedHabit(habit)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border transition-colors',
                  selectedHabit?.id === habit.id
                    ? 'bg-cb-teal/10 border-cb-teal/40'
                    : 'bg-surface border-cb-border hover:border-cb-teal/30'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🔥</span>
                  <span className="text-sm font-medium text-cb-text">{habit.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-cb-muted">
                  <span className="px-1.5 py-0.5 rounded bg-surface-light text-cb-secondary">{habit.category}</span>
                  <span>{habit.currentStreak} day streak</span>
                  <span className="ml-auto font-medium text-cb-teal">{habit.completionRate}%</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Habit detail */}
          <div className="col-span-2 space-y-5">
            {!selectedHabit ? (
              <p className="text-sm text-cb-muted py-8 text-center">Select a habit to view details.</p>
            ) : (<>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Current Streak', value: `${selectedHabit.currentStreak}`, unit: 'days', icon: '🔥', color: 'text-cb-warning' },
                { label: 'Longest Streak', value: `${selectedHabit.bestStreak}`, unit: 'days', icon: '🏆', color: 'text-cb-teal' },
                { label: 'Habit Completed', value: `${selectedHabit.completions}`, unit: 'times', icon: '✅', color: 'text-cb-success' },
                { label: 'Completion Rate', value: `${selectedHabit.completionRate}%`, unit: '', icon: '📊', color: 'text-cb-text' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface border border-cb-border rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className={clsx('text-2xl font-bold', stat.color)}>{stat.value}</p>
                  {stat.unit && <p className="text-xs text-cb-muted">{stat.unit}</p>}
                  <p className="text-xs text-cb-secondary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Log table */}
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-cb-border">
                <h3 className="text-sm font-semibold text-cb-text">Log History</h3>
              </div>
              {selectedHabit.logs.length === 0 ? (
                <p className="text-sm text-cb-muted p-5">No logs yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-surface-light border-b border-cb-border">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Value</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-cb-muted uppercase">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cb-border">
                    {selectedHabit.logs.map((log, i) => (
                      <tr key={i} className="hover:bg-surface-light/50">
                        <td className="px-5 py-3 text-cb-secondary">{format(new Date(log.date), 'd MMM yyyy')}</td>
                        <td className="px-5 py-3 font-medium text-cb-text">{log.value}</td>
                        <td className="px-5 py-3 text-cb-muted">{log.memo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            </>)}
          </div>
        </div>
        )
      )}

      {/* ─── AUTOFLOW TAB ─── */}
      {activeTab === 'autoflow' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoflowDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="p-1.5 rounded-xl border border-cb-border text-cb-secondary hover:bg-surface-light"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold text-cb-text min-w-[140px] text-center">
                {format(autoflowDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setAutoflowDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="p-1.5 rounded-xl border border-cb-border text-cb-secondary hover:bg-surface-light"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-cb-border overflow-hidden">
                {(['month', 'week', 'agenda'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setAutoflowView(v)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                      autoflowView === v ? 'bg-cb-teal text-white' : 'text-cb-secondary hover:bg-surface-light'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAutoflowEventModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-xl text-xs font-medium"
              >
                <Plus size={12} /> Add Event
              </button>
            </div>
          </div>

          {/* Month calendar grid */}
          {autoflowView === 'month' && (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-cb-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-cb-muted bg-surface-light">{d}</div>
                ))}
              </div>
              {(() => {
                const year = autoflowDate.getFullYear()
                const month = autoflowDate.getMonth()
                const firstDay = new Date(year, month, 1).getDay()
                const daysInMonth = new Date(year, month + 1, 0).getDate()
                const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, i) => {
                  const day = i - firstDay + 1
                  return day > 0 && day <= daysInMonth ? day : null
                })
                const rows = []
                for (let r = 0; r < cells.length / 7; r++) {
                  rows.push(cells.slice(r * 7, r * 7 + 7))
                }
                return rows.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7 border-b border-cb-border last:border-b-0">
                    {row.map((day, ci) => {
                      const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
                      const events = autoflowEvents.filter(e => e.date === dateStr)
                      const isToday = day && format(new Date(), 'yyyy-MM-dd') === dateStr
                      return (
                        <div key={ci} className="min-h-[90px] border-r border-cb-border last:border-r-0 p-2">
                          {day && (
                            <>
                              <span className={clsx(
                                'inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1',
                                isToday ? 'bg-cb-teal text-white' : 'text-cb-secondary'
                              )}>{day}</span>
                              <div className="space-y-1">
                                {events.map(ev => (
                                  <div key={ev.id} className={clsx('px-1.5 py-0.5 rounded text-[10px] font-medium border truncate', ev.color)}>
                                    {ev.title}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>
          )}

          {/* Agenda view */}
          {autoflowView === 'agenda' && (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-cb-border">
                <p className="text-sm font-semibold text-cb-text">Upcoming Events</p>
              </div>
              {autoflowEvents.length === 0 ? (
                <div className="py-12 text-center text-cb-muted text-sm">No events scheduled.</div>
              ) : (
                <div className="divide-y divide-cb-border">
                  {autoflowEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-4 px-5 py-4">
                      <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', ev.color.includes('warning') ? 'bg-cb-warning' : ev.color.includes('teal') ? 'bg-cb-teal' : 'bg-cb-success')} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cb-text">{ev.title}</p>
                        <p className="text-xs text-cb-muted capitalize">{ev.type.replace('_', ' ')}</p>
                      </div>
                      <span className="text-xs text-cb-secondary">{format(new Date(ev.date), 'd MMM yyyy')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Week view */}
          {autoflowView === 'week' && (
            <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-cb-border">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = addDays(startOfWeek(autoflowDate, { weekStartsOn: 0 }), i)
                  const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  return (
                    <div key={i} className={clsx('py-3 text-center border-r border-cb-border last:border-r-0', isToday ? 'bg-cb-teal/10' : 'bg-surface-light')}>
                      <p className="text-xs font-semibold text-cb-muted">{format(d, 'EEE').toUpperCase()}</p>
                      <p className={clsx('text-sm font-bold mt-0.5', isToday ? 'text-cb-teal' : 'text-cb-secondary')}>{format(d, 'd')}</p>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-7 min-h-[200px]">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = addDays(startOfWeek(autoflowDate, { weekStartsOn: 0 }), i)
                  const dateStr = format(d, 'yyyy-MM-dd')
                  const events = autoflowEvents.filter(e => e.date === dateStr)
                  return (
                    <div key={i} className="border-r border-cb-border last:border-r-0 p-2 space-y-1">
                      {events.map(ev => (
                        <div key={ev.id} className={clsx('px-2 py-1 rounded text-[10px] font-medium border', ev.color)}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PHOTOS TAB ─── */}
      {activeTab === 'photos' && (
        <div className="bg-surface border border-cb-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-cb-text mb-4">Progress Photos</h2>
          {photos.length === 0 ? (
            <p className="text-sm text-cb-muted">No progress photos shared.</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="space-y-1">
                  <div className="aspect-square rounded-xl overflow-hidden bg-surface-light">
                    {photo.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.public_url} alt={photo.angle ?? 'Progress photo'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cb-muted text-xs">No image</div>
                    )}
                  </div>
                  <p className="text-xs text-cb-secondary">{format(new Date(photo.date), 'd MMM yyyy')}</p>
                  {photo.angle && <p className="text-xs text-cb-muted capitalize">{photo.angle}</p>}
                  {photo.weight_kg && <p className="text-xs text-cb-muted">{photo.weight_kg} kg</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── METRICS TAB ─── */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Weight summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Starting Weight', value: startingWeight ? `${startingWeight} kg` : '—' },
              { label: 'Current Weight', value: currentWeight ? `${currentWeight} kg` : '—' },
              { label: 'Total Change', value: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg` : '—', color: totalChange !== null && totalChange < 0 ? 'text-cb-success' : totalChange !== null ? 'text-cb-danger' : undefined },
              { label: '% Change', value: pctChange !== null ? `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%` : '—', color: pctChange !== null && pctChange < 0 ? 'text-cb-success' : pctChange !== null ? 'text-cb-danger' : undefined },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface border border-cb-border rounded-xl p-4">
                <p className="text-xs text-cb-muted mb-1">{label}</p>
                <p className={clsx('text-xl font-bold', color ?? 'text-cb-text')}>{value}</p>
              </div>
            ))}
          </div>

          {/* Weight Chart */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-cb-text mb-4">Weight Over Time</h2>
            {chartData.length < 2 ? (
              <p className="text-sm text-cb-muted">Not enough weight data to display chart.</p>
            ) : (
              <div className="relative h-48">
                <div className="flex items-end justify-between h-full gap-1.5">
                  {chartData.map((entry, i) => {
                    const heightPct = ((entry.weight_kg - minWeight) / chartRange) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[10px] text-cb-muted">{entry.weight_kg}</span>
                        <div className="w-full bg-cb-teal rounded-t" style={{ height: `${Math.max(heightPct, 5)}%` }} />
                        <span className="text-[10px] text-cb-muted rotate-45 origin-left whitespace-nowrap">
                          {format(new Date(entry.date), 'd/M')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Personal Records */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-cb-text mb-4">Personal Records</h2>
            {prs.length === 0 ? (
              <p className="text-sm text-cb-muted">No personal records logged.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cb-border">
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase pb-2">Exercise</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase pb-2">Weight</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase pb-2">Reps</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase pb-2">Est. 1RM</th>
                    <th className="text-left text-xs font-semibold text-cb-muted uppercase pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cb-border">
                  {prs.map((pr) => (
                    <tr key={pr.id}>
                      <td className="py-2.5 text-sm font-medium text-cb-text">{pr.exercise_name}</td>
                      <td className="py-2.5 text-sm text-cb-secondary">{pr.weight_kg} kg</td>
                      <td className="py-2.5 text-sm text-cb-secondary">{pr.reps}</td>
                      <td className="py-2.5 text-sm text-cb-secondary">{pr.estimated_1rm ? `${pr.estimated_1rm.toFixed(1)} kg` : '—'}</td>
                      <td className="py-2.5 text-sm text-cb-muted">{format(new Date(pr.date), 'd MMM yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── NOTES TAB ─── */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-cb-text mb-3">Add Note</h2>
            <div className="flex gap-3">
              <textarea rows={3} placeholder="Write a note about this client…" value={newNote} onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-3 py-2 border border-cb-border rounded-xl text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none" />
              <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                className="px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-surface-light text-white rounded-xl text-sm font-medium self-start flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-xl p-12 text-center text-cb-muted">No notes yet.</div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className={clsx('bg-surface border rounded-xl p-4', note.is_pinned ? 'border-cb-warning/30 bg-cb-warning/5' : 'border-cb-border')}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-cb-secondary leading-relaxed flex-1">{note.content}</p>
                  <button onClick={() => togglePin(note.id, note.is_pinned)} className={clsx('flex-shrink-0 mt-0.5', note.is_pinned ? 'text-cb-warning' : 'text-cb-muted hover:text-cb-secondary')} title={note.is_pinned ? 'Unpin' : 'Pin'}>
                    <Pin size={16} />
                  </button>
                </div>
                <p className="text-xs text-cb-muted mt-2">{format(new Date(note.created_at), 'd MMM yyyy · h:mm a')}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── SETTINGS TAB ─── */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* AI Mode */}
          <div className="bg-surface border border-cb-border rounded-xl p-5">
            <div className="mb-6 pb-6 border-b border-cb-border">
              <div className="flex items-center gap-2 mb-1">
                <Bot size={16} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-cb-text">AI Mode</h3>
                {aiModeActive && (
                  <span className="px-2 py-0.5 text-xs bg-purple-500/15 text-purple-400 rounded-full font-medium">Active</span>
                )}
              </div>
              <p className="text-xs text-cb-muted mb-4">Enable AI to handle client messages in your voice for a set period.</p>

              {aiModeActive && aiSession ? (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-400">🤖 AI Mode Active</p>
                      <p className="text-xs text-cb-muted mt-1">
                        {Math.max(0, Math.ceil((new Date(aiSession.ends_at).getTime() - Date.now()) / 86400000))} days remaining · Ends {new Date(aiSession.ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <button onClick={handleEndAISession} disabled={aiLoading} className="text-xs text-cb-danger border border-cb-danger/30 px-3 py-1.5 rounded-md hover:bg-cb-danger/10 transition-colors">
                      End Early
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-cb-secondary font-medium">Duration</label>
                    <input type="number" min={1} max={30} value={aiDurationDays} onChange={(e) => setAiDurationDays(Number(e.target.value))} className="w-16 px-2 py-1.5 border border-cb-border rounded-md text-sm text-cb-text bg-surface-light text-center" />
                    <span className="text-xs text-cb-muted">days</span>
                  </div>
                  {aiError && <p className="text-xs text-cb-danger">{aiError}</p>}
                  <button onClick={handleActivateAI} disabled={aiLoading} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {aiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bot size={14} />}
                    Activate AI Mode
                  </button>
                </div>
              )}
            </div>

            {/* Features */}
            <div>
              <h2 className="font-semibold text-cb-text mb-1">Feature Control</h2>
              <p className="text-xs text-cb-secondary mt-0.5 mb-4">Control which features are visible to this client</p>
              <div className="space-y-5">
                {FEATURE_TOGGLE_GROUPS.map(group => (
                  <div key={group.group}>
                    <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">{group.group}</p>
                    <div className="divide-y divide-cb-border border border-cb-border rounded-xl overflow-hidden">
                      {group.toggles.map((f) => (
                        <div key={f.key} className="flex items-center gap-4 px-5 py-4">
                          <div className="w-9 h-9 rounded-full bg-surface-light flex items-center justify-center flex-shrink-0 text-base">
                            {f.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-cb-text">{f.label}</p>
                            <p className="text-xs text-cb-secondary mt-0.5">{f.description}</p>
                          </div>
                          <button
                            onClick={() => setFeatureToggles(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                            className={clsx(
                              'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                              featureToggles[f.key] ? 'bg-cb-teal' : 'bg-surface-light border border-cb-border'
                            )}
                          >
                            <span className={clsx(
                              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                              featureToggles[f.key] ? 'translate-x-5' : 'translate-x-0'
                            )} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workout Settings */}
          <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-cb-border">
              <h2 className="font-semibold text-cb-text">Workout Settings</h2>
            </div>
            <div className="p-5 space-y-4 text-sm text-cb-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cb-text">Weight Unit</p>
                  <p className="text-xs text-cb-secondary mt-0.5">Unit used for exercises and body weight</p>
                </div>
                <div className="flex rounded-xl border border-cb-border overflow-hidden">
                  {(['kg', 'lbs'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setWeightUnit(unit)}
                      className={clsx(
                        'px-4 py-1.5 text-xs font-medium transition-colors',
                        weightUnit === unit
                          ? 'bg-cb-teal text-white'
                          : 'text-cb-secondary hover:bg-surface-light'
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-cb-border">
                <div>
                  <p className="text-sm font-medium text-cb-text">Timezone</p>
                  <p className="text-xs text-cb-secondary mt-0.5">Used for scheduling and notifications</p>
                </div>
                <select className="px-3 py-1.5 border border-cb-border rounded-xl text-xs text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal">
                  <option>Australia/Sydney</option>
                  <option>America/New_York</option>
                  <option>America/Los_Angeles</option>
                  <option>Europe/London</option>
                  <option>Asia/Singapore</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Autoflow Add Event Modal ────────────────────────────────── */}
      {showAutoflowEventModal && (
        <AutoflowAddEventModal onClose={() => setShowAutoflowEventModal(false)} />
      )}

      {/* ── Manual Program Modal ────────────────────────────────────── */}
      {showManualProgramModal && (
        <ManualProgramModal
          clientName={client?.name ?? client?.email ?? 'this client'}
          onClose={() => setShowManualProgramModal(false)}
          onSave={handleSaveManualProgram}
        />
      )}

      {/* ── Manual Meal Plan Modal ──────────────────────────────────── */}
      {showManualMealPlanModal && (
        <ManualMealPlanModal
          clientName={client?.name ?? client?.email ?? 'this client'}
          onClose={() => setShowManualMealPlanModal(false)}
          onSave={handleSaveManualMealPlan}
        />
      )}
    </div>
  )
}

// ── ManualProgramModal ─────────────────────────────────────────────────────────

function ManualProgramModal({
  clientName,
  onClose,
  onSave,
}: {
  clientName: string
  onClose: () => void
  onSave: (data: { name: string; description: string; goal: string; programType: 'fixed' | 'calendar'; weeks: number; daysPerWeek: number }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [programType, setProgramType] = useState<'fixed' | 'calendar'>('fixed')
  const [weeks, setWeeks] = useState(8)
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), description, goal, programType, weeks, daysPerWeek })
    } catch {
      setError('Failed to save program. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cb-border">
          <div>
            <h2 className="text-base font-semibold text-cb-text">New Workout Program</h2>
            <p className="text-xs text-cb-muted mt-0.5">For {clientName}</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Program Name *</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hypertrophy Block A"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Goal</label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal"
            >
              <option value="">— Select a goal —</option>
              {['Hypertrophy', 'Strength', 'Fat Loss', 'Athletic Performance', 'General Fitness', 'Rehabilitation', 'Endurance'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief overview of the program…"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Program Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'fixed', label: 'Fixed', desc: 'Repeating weekly structure (e.g. Upper / Lower).' },
                { value: 'calendar', label: 'Calendar', desc: 'Workouts on specific calendar dates.' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setProgramType(opt.value as 'fixed' | 'calendar')}
                  className={clsx(
                    'text-left p-3 rounded-lg border transition-colors',
                    programType === opt.value ? 'border-cb-teal bg-cb-teal/10' : 'border-cb-border bg-surface-light hover:border-cb-teal/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={clsx('w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center', programType === opt.value ? 'border-cb-teal' : 'border-cb-muted')}>
                      {programType === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-cb-teal" />}
                    </div>
                    <span className="text-sm font-medium text-cb-text">{opt.label}</span>
                  </div>
                  <p className="text-xs text-cb-muted leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Duration (weeks)</label>
              <input
                type="number" min={1} max={52} value={weeks}
                onChange={e => setWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Days per Week</label>
              <input
                type="number" min={1} max={7} value={daysPerWeek}
                onChange={e => setDaysPerWeek(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
          </div>
          {error && <p className="text-xs text-cb-danger">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 bg-surface-light border border-cb-border rounded-lg py-2 text-sm text-cb-secondary hover:border-cb-muted transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="flex-1 bg-cb-teal text-white rounded-lg py-2 text-sm font-medium hover:bg-cb-teal/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Creating…' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ManualMealPlanModal ────────────────────────────────────────────────────────

function ManualMealPlanModal({
  clientName,
  onClose,
  onSave,
}: {
  clientName: string
  onClose: () => void
  onSave: (data: { name: string; description: string; planType: 'meal' | 'macros'; calories: string; protein: string; carbs: string; fat: string }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [planType, setPlanType] = useState<'meal' | 'macros'>('meal')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), description, planType, calories, protein, carbs, fat })
    } catch {
      setError('Failed to save meal plan. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cb-border">
          <div>
            <h2 className="text-base font-semibold text-cb-text">New Meal Plan</h2>
            <p className="text-xs text-cb-muted mt-0.5">For {clientName}</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Plan Name *</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Lean Bulk Phase 1"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Plan Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'meal', label: 'Full Meal Plan', desc: 'Specify meals, foods, and portions for each day.' },
                { value: 'macros', label: 'Macros Only', desc: 'Set daily macro targets without prescribing specific meals.' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPlanType(opt.value as 'meal' | 'macros')}
                  className={clsx(
                    'text-left p-3 rounded-lg border transition-colors',
                    planType === opt.value ? 'border-cb-teal bg-cb-teal/10' : 'border-cb-border bg-surface-light hover:border-cb-teal/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={clsx('w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center', planType === opt.value ? 'border-cb-teal' : 'border-cb-muted')}>
                      {planType === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-cb-teal" />}
                    </div>
                    <span className="text-sm font-medium text-cb-text">{opt.label}</span>
                  </div>
                  <p className="text-xs text-cb-muted leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Any notes for this plan…"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Daily Targets</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories (kcal)', value: calories, set: setCalories, placeholder: '2000' },
                { label: 'Protein (g)', value: protein, set: setProtein, placeholder: '150' },
                { label: 'Carbs (g)', value: carbs, set: setCarbs, placeholder: '200' },
                { label: 'Fat (g)', value: fat, set: setFat, placeholder: '65' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs text-cb-muted mb-1">{label}</label>
                  <input
                    type="number" min={0} value={value} placeholder={placeholder}
                    onChange={e => set(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
                  />
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-cb-danger">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 bg-surface-light border border-cb-border rounded-lg py-2 text-sm text-cb-secondary hover:border-cb-muted transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="flex-1 bg-cb-teal text-white rounded-lg py-2 text-sm font-medium hover:bg-cb-teal/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AutoflowAddEventModal ──────────────────────────────────────────────────────

const AUTOFLOW_EVENT_TYPES = [
  { type: 'workout_program', label: 'Add Workout Program', desc: 'Assign a workout phase on a specific date', icon: '🏋️', premium: false, color: 'border-cb-warning/40 bg-cb-warning/5' },
  { type: 'resources', label: 'Add Resources', desc: 'Share files and guides from your vault', icon: '📂', premium: false, color: 'border-cb-teal/40 bg-cb-teal/5' },
  { type: 'message', label: 'Automated Message', desc: 'Send a scheduled in-app message', icon: '💬', premium: true, color: 'border-cb-success/40 bg-cb-success/5' },
  { type: 'email', label: 'Automated Email', desc: 'Send a scheduled email to your client', icon: '📧', premium: true, color: 'border-purple-400/40 bg-purple-400/5' },
  { type: 'notification', label: 'In-App Notification', desc: 'Push a reminder to your client', icon: '🔔', premium: true, color: 'border-cb-warning/40 bg-cb-warning/5' },
  { type: 'note', label: 'Automated Note', desc: 'Create a coach note automatically', icon: '📝', premium: true, color: 'border-cb-muted/40 bg-surface-light' },
]

function AutoflowAddEventModal({ onClose }: { onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cb-border">
          <div>
            <h2 className="text-base font-semibold text-cb-text">Add Event</h2>
            <p className="text-xs text-cb-muted mt-0.5">Choose an event type to add to the autoflow calendar</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {AUTOFLOW_EVENT_TYPES.map(ev => (
            <button
              key={ev.type}
              onClick={() => setSelectedType(ev.type)}
              disabled={ev.premium}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border transition-colors',
                ev.premium ? 'opacity-50 cursor-not-allowed border-cb-border bg-surface' :
                selectedType === ev.type ? `border-cb-teal bg-cb-teal/10` : `${ev.color} hover:border-cb-teal/50`
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ev.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-cb-text">{ev.label}</span>
                    {ev.premium && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cb-warning/15 text-cb-warning">Premium</span>
                    )}
                  </div>
                  <p className="text-xs text-cb-muted mt-0.5">{ev.desc}</p>
                </div>
                {selectedType === ev.type && !ev.premium && (
                  <Check size={16} className="text-cb-teal flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 bg-surface-light border border-cb-border rounded-lg py-2 text-sm text-cb-secondary hover:border-cb-muted transition-colors">Cancel</button>
          <button
            disabled={!selectedType}
            onClick={onClose}
            className="flex-1 bg-cb-teal text-white rounded-lg py-2 text-sm font-medium hover:bg-cb-teal/90 disabled:opacity-50 transition-colors"
          >
            Add Event
          </button>
        </div>
      </div>
    </div>
  )
}
