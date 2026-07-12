'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Apple, ChevronLeft, ChevronRight, Coffee, Droplets, Loader2,
  Minus, Moon, Pencil, Plus, Search, Sun, Trash2, UtensilsCrossed, X,
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

// ── Types ─────────────────────────────────────────────────────────────────────

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

type NutritionLog = {
  id: string
  meal_type: MealType | 'drink' | 'supplement' | 'other' | null
  logged_at: string
  name: string
  brand: string | null
  serving_size_g: number | null
  servings_consumed: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sodium_mg: number | null
}

type FoodResult = {
  id: string
  name: string
  brand?: string
  cal100: number
  pro100: number
  carb100: number
  fat100: number
  fibre100: number
  sodium100: number
  source: 'openfoodfacts' | 'local'
}

type Targets = {
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
}

type WaterState = { glasses: number; targetGlasses: number }

const MEAL_SECTIONS: { type: MealType; label: string; icon: typeof Coffee }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Coffee },
  { type: 'lunch',     label: 'Lunch',     icon: UtensilsCrossed },
  { type: 'dinner',    label: 'Dinner',    icon: UtensilsCrossed },
  { type: 'snack',     label: 'Snacks',    icon: Apple },
]

const ML_PER_GLASS = 250

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayBounds(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(y, m - 1, d + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function formatDayLabel(dateStr: string): string {
  const today = toDateStr(new Date())
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000))
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return toDateStr(new Date(y, m - 1, d + days))
}

// ── MacroBar (matches my-plan) ────────────────────────────────────────────────

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
  const over = value > target
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-cb-muted">{label}</span>
        <span className={clsx('text-xs font-semibold tabular-nums', over ? 'text-cb-danger' : 'text-cb-secondary')}>
          {Math.round(value * 10) / 10} <span className="font-normal text-cb-muted">/ {target}</span>
        </span>
      </div>
      <div className="h-2 bg-surface-light rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-300', color, over && 'opacity-60')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Add-food modal ────────────────────────────────────────────────────────────

type ManualDraft = {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
  fibre: string
}

const EMPTY_MANUAL: ManualDraft = { name: '', calories: '', protein: '', carbs: '', fat: '', fibre: '' }

function AddFoodModal({
  mealLabel, onClose, onAdd, saving,
}: {
  mealLabel: string
  onClose: () => void
  onAdd: (entry: {
    name: string; brand: string | null; serving_size_g: number | null
    calories: number; protein_g: number; carbs_g: number; fat_g: number
    fiber_g: number | null; sodium_mg: number | null
  }) => void
  saving: boolean
}) {
  const [tab, setTab] = useState<'search' | 'manual'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const [grams, setGrams] = useState('100')
  const [manual, setManual] = useState<ManualDraft>(EMPTY_MANUAL)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced food search
  useEffect(() => {
    if (tab !== 'search') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.foods ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, tab])

  const gramsNum = parseFloat(grams) || 0
  const factor = gramsNum / 100
  const preview = selected ? {
    cal: Math.round(selected.cal100 * factor),
    pro: +(selected.pro100 * factor).toFixed(1),
    carb: +(selected.carb100 * factor).toFixed(1),
    fat: +(selected.fat100 * factor).toFixed(1),
    fibre: +(selected.fibre100 * factor).toFixed(1),
    sodium: Math.round(selected.sodium100 * factor),
  } : null

  function submitSearch() {
    if (!selected || !preview || gramsNum <= 0) return
    onAdd({
      name: selected.name,
      brand: selected.brand ?? null,
      serving_size_g: gramsNum,
      calories: preview.cal,
      protein_g: preview.pro,
      carbs_g: preview.carb,
      fat_g: preview.fat,
      fiber_g: preview.fibre,
      sodium_mg: preview.sodium,
    })
  }

  function submitManual() {
    const name = manual.name.trim()
    const cal = parseFloat(manual.calories)
    if (!name || isNaN(cal) || cal < 0) return
    onAdd({
      name,
      brand: null,
      serving_size_g: null,
      calories: Math.round(cal),
      protein_g: Math.max(0, parseFloat(manual.protein) || 0),
      carbs_g: Math.max(0, parseFloat(manual.carbs) || 0),
      fat_g: Math.max(0, parseFloat(manual.fat) || 0),
      fiber_g: manual.fibre ? Math.max(0, parseFloat(manual.fibre) || 0) : null,
      sodium_mg: null,
    })
  }

  const manualValid = manual.name.trim().length > 0 && manual.calories !== '' && !isNaN(parseFloat(manual.calories)) && parseFloat(manual.calories) >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-surface border border-cb-border w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cb-border shrink-0">
          <span className="font-semibold text-cb-text text-sm flex-1">Add to {mealLabel}</span>
          <button onClick={onClose} className="p-1 text-cb-muted hover:text-cb-secondary" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 shrink-0">
          {([['search', 'Search', Search], ['manual', 'Manual entry', Pencil]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                tab === key ? 'bg-brand/10 text-brand' : 'text-cb-muted hover:text-cb-secondary hover:bg-surface-light',
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {tab === 'search' ? (
          <>
            {/* Search input */}
            <div className="px-4 pt-3 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null) }}
                  placeholder="Search foods…"
                  className="w-full bg-surface-light border border-cb-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Results / detail */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px]">
              {selected ? (
                <div className="space-y-4">
                  <button onClick={() => setSelected(null)} className="text-xs text-brand font-medium flex items-center gap-1">
                    <ChevronLeft size={13} /> Back to results
                  </button>
                  <div>
                    <p className="font-semibold text-cb-text text-sm">{selected.name}</p>
                    {selected.brand && <p className="text-xs text-cb-muted">{selected.brand}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-cb-muted shrink-0">Amount (g/ml)</label>
                    <input
                      type="number"
                      min="1"
                      inputMode="decimal"
                      value={grams}
                      onChange={e => setGrams(e.target.value)}
                      className="w-24 bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand tabular-nums"
                    />
                    <div className="flex gap-1">
                      {[50, 100, 150, 200].map(g => (
                        <button
                          key={g}
                          onClick={() => setGrams(String(g))}
                          className={clsx(
                            'px-2 py-1 rounded-md text-xs transition-colors',
                            grams === String(g) ? 'bg-brand/10 text-brand font-medium' : 'bg-surface-light text-cb-muted hover:text-cb-secondary',
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  {preview && (
                    <div className="grid grid-cols-4 gap-2">
                      {([['Cal', preview.cal, ''], ['Protein', preview.pro, 'g'], ['Carbs', preview.carb, 'g'], ['Fat', preview.fat, 'g']] as [string, number, string][]).map(([l, v, u]) => (
                        <div key={l} className="bg-surface-light rounded-xl px-2 py-2.5 text-center">
                          <p className="text-sm font-semibold text-cb-text tabular-nums">{v}{u}</p>
                          <p className="text-[10px] text-cb-muted uppercase tracking-wide">{l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : searching ? (
                <div className="flex items-center justify-center py-10 text-cb-muted">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-center text-sm text-cb-muted py-10">No foods found — try the manual entry tab.</p>
              ) : (
                <div className="space-y-1">
                  {results.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setSelected(f); setGrams('100') }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-light text-left transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cb-text truncate">{f.name}</p>
                        <p className="text-xs text-cb-muted truncate">
                          {f.brand ? `${f.brand} · ` : ''}{f.cal100} kcal · P{f.pro100} C{f.carb100} F{f.fat100} per 100g
                        </p>
                      </div>
                      <Plus size={15} className="text-brand shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div className="px-4 py-3 border-t border-cb-border shrink-0">
                <button
                  onClick={submitSearch}
                  disabled={saving || gramsNum <= 0}
                  className="w-full bg-brand text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />} Log food
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div>
                <label className="text-xs text-cb-muted block mb-1">Food name</label>
                <input
                  autoFocus
                  value={manual.name}
                  onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                  placeholder="e.g. Chicken burrito"
                  className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2.5 text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([['calories', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)'], ['fibre', 'Fibre (g) — optional']] as [keyof ManualDraft, string][]).map(([key, label]) => (
                  <div key={key} className={clsx(key === 'fibre' && 'col-span-2')}>
                    <label className="text-xs text-cb-muted block mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={manual[key]}
                      onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))}
                      className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2.5 text-sm text-cb-text focus:outline-none focus:border-brand tabular-nums"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-cb-border shrink-0">
              <button
                onClick={submitManual}
                disabled={saving || !manualValid}
                className="w-full bg-brand text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />} Log food
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyNutritionPage() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [date, setDate] = useState(() => toDateStr(new Date()))
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [water, setWater] = useState<WaterState>({ glasses: 0, targetGlasses: 8 })
  const [targets, setTargets] = useState<Targets | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingTo, setAddingTo] = useState<MealType | null>(null)

  const todayStr = toDateStr(new Date())
  const isToday = date === todayStr

  useEffect(() => { setMounted(true) }, [])

  // Resolve user + macro targets once
  useEffect(() => {
    if (!mounted) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (!uid) { setLoading(false); return }

      const { data: planRow } = await supabase
        .from('nutrition_plans_v2')
        .select('calories_target, protein_target, carbs_target, fat_target, fibre_target')
        .eq('client_id', uid)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (planRow) {
        setTargets({
          calories: planRow.calories_target,
          protein: planRow.protein_target,
          carbs: planRow.carbs_target,
          fat: planRow.fat_target,
          fibre: planRow.fibre_target,
        })
      }
    })
  }, [mounted])

  // Load logs + water for the selected date
  const loadDay = useCallback(async (uid: string, dateStr: string) => {
    setLoading(true)
    const supabase = createClient()
    const { start, end } = dayBounds(dateStr)

    const [logsRes, waterRes] = await Promise.all([
      supabase
        .from('nutrition_logs')
        .select('id, meal_type, logged_at, name, brand, serving_size_g, servings_consumed, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg')
        .eq('client_id', uid)
        .gte('logged_at', start)
        .lt('logged_at', end)
        .order('logged_at', { ascending: true }),
      supabase
        .from('water_logs')
        .select('glasses, target_glasses')
        .eq('client_id', uid)
        .eq('logged_at', dateStr)
        .maybeSingle(),
    ])

    setLogs((logsRes.data ?? []) as NutritionLog[])
    setWater({
      glasses: waterRes.data?.glasses ?? 0,
      targetGlasses: waterRes.data?.target_glasses ?? 8,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (userId) loadDay(userId, date)
  }, [userId, date, loadDay])

  // ── Mutations ──────────────────────────────────────────────────────────────

  async function addLog(mealType: MealType, entry: {
    name: string; brand: string | null; serving_size_g: number | null
    calories: number; protein_g: number; carbs_g: number; fat_g: number
    fiber_g: number | null; sodium_mg: number | null
  }) {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()

    // Past dates get logged at midday so they land inside the right day
    const [y, m, d] = date.split('-').map(Number)
    const loggedAt = isToday ? new Date().toISOString() : new Date(y, m - 1, d, 12).toISOString()

    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        client_id: userId,
        meal_type: mealType,
        logged_at: loggedAt,
        servings_consumed: 1,
        ...entry,
      })
      .select('id, meal_type, logged_at, name, brand, serving_size_g, servings_consumed, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg')
      .single()

    setSaving(false)
    if (error || !data) {
      toast.error('Could not log food — please try again.')
      return
    }
    setLogs(prev => [...prev, data as NutritionLog].sort((a, b) => a.logged_at.localeCompare(b.logged_at)))
    setAddingTo(null)
    toast.success(`${entry.name} logged`)
  }

  async function deleteLog(id: string) {
    const prev = logs
    setLogs(l => l.filter(x => x.id !== id))
    const supabase = createClient()
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', id)
    if (error) {
      setLogs(prev)
      toast.error('Could not delete entry.')
    }
  }

  async function setGlasses(next: number) {
    if (!userId || next < 0 || next > 30) return
    const prevWater = water
    setWater(w => ({ ...w, glasses: next }))
    const supabase = createClient()
    const { error } = await supabase
      .from('water_logs')
      .upsert({
        client_id: userId,
        logged_at: date,
        glasses: next,
        ml_total: next * ML_PER_GLASS,
        target_glasses: water.targetGlasses,
        target_ml: water.targetGlasses * ML_PER_GLASS,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id,logged_at' })
    if (error) {
      setWater(prevWater)
      toast.error('Could not save water intake.')
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const totals = useMemo(() => logs.reduce(
    (acc, l) => ({
      cal: acc.cal + l.calories,
      pro: +(acc.pro + Number(l.protein_g)).toFixed(1),
      carb: +(acc.carb + Number(l.carbs_g)).toFixed(1),
      fat: +(acc.fat + Number(l.fat_g)).toFixed(1),
      fibre: +(acc.fibre + Number(l.fiber_g ?? 0)).toFixed(1),
      sodium: acc.sodium + Number(l.sodium_mg ?? 0),
    }),
    { cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0, sodium: 0 },
  ), [logs])

  const logsByMeal = useMemo(() => {
    const map = new Map<MealType, NutritionLog[]>()
    for (const { type } of MEAL_SECTIONS) map.set(type, [])
    for (const l of logs) {
      // Anything outside the four core meals shows under Snacks
      const key: MealType = l.meal_type === 'breakfast' || l.meal_type === 'lunch' || l.meal_type === 'dinner' ? l.meal_type : 'snack'
      map.get(key)!.push(l)
    }
    return map
  }, [logs])

  // ── Render ─────────────────────────────────────────────────────────────────

  const macroPanel = (
    <div className="bg-surface border border-cb-border rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide">Daily Totals</p>
      {targets ? (
        <>
          <MacroBar label="Calories" value={totals.cal} target={targets.calories} color="bg-brand" />
          <MacroBar label="Protein (g)" value={totals.pro} target={targets.protein} color="bg-cb-success" />
          <MacroBar label="Carbs (g)" value={totals.carb} target={targets.carbs} color="bg-amber-400" />
          <MacroBar label="Fat (g)" value={totals.fat} target={targets.fat} color="bg-red-400" />
          <MacroBar label="Fibre (g)" value={totals.fibre} target={targets.fibre} color="bg-purple-400" />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {([['Calories', `${totals.cal}`], ['Protein', `${totals.pro}g`], ['Carbs', `${totals.carb}g`], ['Fat', `${totals.fat}g`]] as [string, string][]).map(([l, v]) => (
            <div key={l} className="bg-surface-light rounded-xl px-3 py-2.5">
              <p className="text-sm font-semibold text-cb-text tabular-nums">{v}</p>
              <p className="text-[10px] text-cb-muted uppercase tracking-wide">{l}</p>
            </div>
          ))}
        </div>
      )}
      {totals.sodium > 0 && (
        <div className="pt-2 border-t border-cb-border flex justify-between text-xs">
          <span className="text-cb-muted">Sodium</span>
          <span className="text-cb-secondary tabular-nums">{totals.sodium.toLocaleString()}mg</span>
        </div>
      )}
    </div>
  )

  const waterPanel = (
    <div className="bg-surface border border-cb-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide flex items-center gap-1.5">
          <Droplets size={13} className="text-sky-400" /> Water
        </p>
        <span className="text-xs text-cb-muted tabular-nums">{(water.glasses * ML_PER_GLASS / 1000).toFixed(2)}L</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setGlasses(water.glasses - 1)}
          disabled={water.glasses <= 0}
          className="w-9 h-9 rounded-xl bg-surface-light text-cb-secondary hover:text-cb-text flex items-center justify-center disabled:opacity-40 transition-colors"
          aria-label="Remove a glass"
        >
          <Minus size={15} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-cb-text tabular-nums">
            {water.glasses}<span className="text-sm font-normal text-cb-muted"> / {water.targetGlasses} glasses</span>
          </p>
        </div>
        <button
          onClick={() => setGlasses(water.glasses + 1)}
          className="w-9 h-9 rounded-xl bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 flex items-center justify-center transition-colors"
          aria-label="Add a glass"
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="mt-3 h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-400 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, water.targetGlasses > 0 ? (water.glasses / water.targetGlasses) * 100 : 0)}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-20 bg-surface border-b border-cb-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Apple size={18} className="text-brand shrink-0" />
          <span className="font-semibold text-cb-text text-sm flex-1">My Nutrition</span>
          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors" title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Date navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setDate(d => shiftDate(d, -1))}
            className="p-2 rounded-xl text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-cb-text">{formatDayLabel(date)}</p>
            {!isToday && (
              <button onClick={() => setDate(todayStr)} className="text-xs text-brand font-medium">
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={() => setDate(d => shiftDate(d, 1))}
            disabled={isToday}
            className="p-2 rounded-xl text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {!mounted || (loading && userId === null) ? (
          <div className="flex items-center justify-center py-24 text-cb-muted">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : userId === null ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Apple size={32} className="text-cb-muted mb-3 opacity-40" />
            <p className="text-cb-secondary font-medium">Sign in to log your nutrition</p>
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            {/* Meal sections */}
            <div className="flex-1 min-w-0 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-24 text-cb-muted">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              ) : (
                MEAL_SECTIONS.map(({ type, label, icon: Icon }) => {
                  const entries = logsByMeal.get(type) ?? []
                  const mealCal = entries.reduce((s, e) => s + e.calories, 0)
                  return (
                    <div key={type} className="bg-surface border border-cb-border rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-cb-border">
                        <Icon size={16} className="text-brand shrink-0" />
                        <span className="font-semibold text-sm text-cb-text flex-1">{label}</span>
                        {mealCal > 0 && <span className="text-xs text-cb-muted tabular-nums">{mealCal} kcal</span>}
                        <button
                          onClick={() => setAddingTo(type)}
                          className="flex items-center gap-1 text-xs font-medium text-brand hover:bg-brand/10 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>
                      {entries.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-cb-muted">Nothing logged yet.</p>
                      ) : (
                        <div className="divide-y divide-cb-border">
                          {entries.map(e => (
                            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 group">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-cb-text truncate">{e.name}</p>
                                <p className="text-xs text-cb-muted truncate">
                                  {e.serving_size_g ? `${e.serving_size_g}g · ` : ''}
                                  P{Number(e.protein_g)} C{Number(e.carbs_g)} F{Number(e.fat_g)}
                                </p>
                              </div>
                              <span className="text-sm font-medium text-cb-secondary tabular-nums shrink-0">{e.calories}</span>
                              <button
                                onClick={() => deleteLog(e.id)}
                                className="p-1.5 rounded-lg text-cb-muted hover:text-cb-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                                aria-label={`Delete ${e.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Mobile panels */}
              <div className="lg:hidden space-y-3 pt-2">
                {waterPanel}
                {macroPanel}
              </div>
            </div>

            {/* Sidebar ≥lg */}
            <aside className="w-64 shrink-0 sticky top-20 hidden lg:block space-y-3">
              {macroPanel}
              {waterPanel}
            </aside>
          </div>
        )}
      </div>

      {/* Add food modal */}
      {addingTo && (
        <AddFoodModal
          mealLabel={MEAL_SECTIONS.find(s => s.type === addingTo)?.label ?? 'meal'}
          onClose={() => setAddingTo(null)}
          onAdd={entry => addLog(addingTo, entry)}
          saving={saving}
        />
      )}
    </div>
  )
}
