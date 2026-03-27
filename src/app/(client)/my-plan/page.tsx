'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CheckCircle2, Circle, X, Bell, Sun, Moon,
  ChevronLeft, ChevronRight, Sparkles, UtensilsCrossed, Info,
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────────

type Unit = 'g' | 'kg' | 'ml' | 'L' | 'cup' | 'tbsp' | 'tsp' | 'oz' | 'piece'

const UNIT_TO_GRAMS: Record<Unit, number | null> = {
  g: 1, kg: 1000, ml: 1, L: 1000, cup: 240, tbsp: 15, tsp: 5, oz: 28.35, piece: null,
}

type FoodItem = {
  id: string; name: string; brand?: string
  quantity: number; unit: Unit
  cal100: number; pro100: number; carb100: number; fat100: number
  fibre100: number; sodium100: number
}

type Meal = { id: string; name: string; time: string; notes: string; tags: string[]; foods: FoodItem[] }
type DayPlan = { id: string; dayNumber: number; dayName: string; meals: Meal[] }

type NutritionPlan = {
  id: string; name: string; clientId: string | null; clientName: string | null
  status: 'draft' | 'published'
  caloriesTarget: number; proteinTarget: number; carbsTarget: number
  fatTarget: number; fibreTarget: number
  days: DayPlan[]; notes: string; createdAt: string; publishedAt?: string
}

type Macros = { cal: number; pro: number; carb: number; fat: number; fibre: number; sodium: number }

// ── Utilities ─────────────────────────────────────────────────────────────────

function calcFoodMacros(food: FoodItem): Macros {
  const toG = UNIT_TO_GRAMS[food.unit]
  const grams = toG !== null ? food.quantity * toG : food.quantity * 100
  const factor = grams / 100
  return {
    cal: Math.round(food.cal100 * factor),
    pro: parseFloat((food.pro100 * factor).toFixed(1)),
    carb: parseFloat((food.carb100 * factor).toFixed(1)),
    fat: parseFloat((food.fat100 * factor).toFixed(1)),
    fibre: parseFloat((food.fibre100 * factor).toFixed(1)),
    sodium: Math.round(food.sodium100 * factor),
  }
}

function sumMealMacros(meal: Meal): Macros {
  return meal.foods.reduce((acc, f) => {
    const m = calcFoodMacros(f)
    return { cal: acc.cal + m.cal, pro: +(acc.pro + m.pro).toFixed(1), carb: +(acc.carb + m.carb).toFixed(1), fat: +(acc.fat + m.fat).toFixed(1), fibre: +(acc.fibre + m.fibre).toFixed(1), sodium: acc.sodium + m.sodium }
  }, { cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0, sodium: 0 })
}

function sumDayMacros(day: DayPlan): Macros {
  return day.meals.reduce((acc, m) => {
    const sm = sumMealMacros(m)
    return { cal: acc.cal + sm.cal, pro: +(acc.pro + sm.pro).toFixed(1), carb: +(acc.carb + sm.carb).toFixed(1), fat: +(acc.fat + sm.fat).toFixed(1), fibre: +(acc.fibre + sm.fibre).toFixed(1), sodium: acc.sodium + sm.sodium }
  }, { cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0, sodium: 0 })
}

function formatServing(qty: number, unit: Unit, name: string): string {
  const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1)
  if (unit === 'piece') return `${qtyStr} × ${name}`
  const compact: Unit[] = ['g', 'kg', 'ml', 'L', 'oz']
  return compact.includes(unit) ? `${qtyStr}${unit} ${name}` : `${qtyStr} ${unit} ${name}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToPlan(row: any): NutritionPlan {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id ?? null,
    clientName: null,
    status: row.status,
    caloriesTarget: row.calories_target,
    proteinTarget: row.protein_target,
    carbsTarget: row.carbs_target,
    fatTarget: row.fat_target,
    fibreTarget: row.fibre_target,
    days: row.days as DayPlan[],
    notes: row.notes ?? '',
    createdAt: row.created_at,
    publishedAt: row.published_at ?? undefined,
  }
}

// ── MacroBar ─────────────────────────────────────────────────────────────────

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
  const over = value > target
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-cb-muted">{label}</span>
        <span className={clsx('text-xs font-semibold tabular-nums', over ? 'text-cb-danger' : 'text-cb-secondary')}>
          {value} <span className="font-normal text-cb-muted">/ {target}</span>
        </span>
      </div>
      <div className="h-2 bg-surface-light rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-300', color, over && 'opacity-60')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── MealCard ─────────────────────────────────────────────────────────────────

function MealCard({ meal, completed, onToggle }: { meal: Meal; completed: boolean; onToggle: () => void }) {
  const macros = sumMealMacros(meal)
  const [notesOpen, setNotesOpen] = useState(false)

  return (
    <div className={clsx('rounded-2xl border transition-all duration-200', completed ? 'bg-surface-light border-cb-border opacity-60' : 'bg-surface border-cb-border shadow-sm')}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-cb-border">
        <button
          onClick={onToggle}
          className={clsx('shrink-0 transition-colors', completed ? 'text-cb-success' : 'text-cb-muted hover:text-brand')}
          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div className="flex-1 min-w-0">
          <span className={clsx('font-semibold text-sm', completed ? 'line-through text-cb-muted' : 'text-cb-text')}>{meal.name}</span>
          <span className="ml-2 text-xs text-cb-muted">{meal.time}</span>
        </div>
        <span className="text-xs font-semibold text-cb-secondary tabular-nums shrink-0">{macros.cal} kcal</span>
        {meal.notes && (
          <button onClick={() => setNotesOpen(v => !v)} className={clsx('text-cb-muted hover:text-brand transition-colors shrink-0', notesOpen && 'text-brand')} title="Coach note">
            <Info size={14} />
          </button>
        )}
      </div>

      {/* Coach note */}
      {notesOpen && meal.notes && (
        <div className="px-4 py-2.5 border-b border-cb-border bg-brand/5">
          <p className="text-xs text-cb-secondary leading-relaxed">
            <span className="font-semibold text-brand">Coach note: </span>{meal.notes}
          </p>
        </div>
      )}

      {/* Food list */}
      <ul className="divide-y divide-cb-border/50">
        {meal.foods.map(food => {
          const fm = calcFoodMacros(food)
          return (
            <li key={food.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cb-text">{formatServing(food.quantity, food.unit, food.name)}</p>
                {food.brand && <p className="text-xs text-cb-muted mt-0.5">{food.brand}</p>}
              </div>
              <div className="flex items-center gap-2.5 shrink-0 text-xs tabular-nums">
                <span className="text-cb-muted">{fm.cal} kcal</span>
                <span className="text-brand hidden sm:inline">P{fm.pro}</span>
                <span className="text-amber-500 hidden sm:inline">C{fm.carb}</span>
                <span className="text-red-400 hidden sm:inline">F{fm.fat}</span>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Meal footer */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-cb-border bg-surface-light/60 rounded-b-2xl">
        <span className="text-xs text-cb-muted">Total</span>
        <span className="text-xs font-semibold text-cb-secondary">{macros.cal} kcal</span>
        <span className="text-xs font-medium text-brand">P {macros.pro}g</span>
        <span className="text-xs font-medium text-amber-500">C {macros.carb}g</span>
        <span className="text-xs font-medium text-red-400">F {macros.fat}g</span>
        <span className="text-xs font-medium text-purple-400 hidden sm:inline">Fi {macros.fibre}g</span>
      </div>
    </div>
  )
}

// ── LocalStorage keys ─────────────────────────────────────────────────────────

const BANNER_LS_KEY = 'cb_plan_banner_dismissed'
const COMPLETED_LS_KEY = 'cb_plan_completed_meals'

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyPlanPage() {
  const { theme, toggleTheme } = useTheme()
  const [plan, setPlan] = useState<NutritionPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set())
  const [bannerVisible, setBannerVisible] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [mounted, setMounted] = useState(false)
  // Track the previous plan id so we can detect a genuinely new plan arriving via realtime
  const prevPlanIdRef = useRef<string | null>(null)

  // ── Hydrate from localStorage ────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(COMPLETED_LS_KEY)
      if (raw) setCompletedMeals(new Set(JSON.parse(raw) as string[]))
    } catch { /* ignore */ }
  }, [])

  // ── Live mode: load from Supabase + subscribe to Realtime ───────────────────
  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()
    let cleanup: (() => void) | null = null

    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id
      if (!userId) { setLoadingPlan(false); return }

      // Initial load: fetch the most recent published plan for this client
      const { data: planRow } = await supabase
        .from('nutrition_plans_v2')
        .select('*')
        .eq('client_id', userId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (planRow) {
        const loaded = dbRowToPlan(planRow)
        setPlan(loaded)
        prevPlanIdRef.current = loaded.id
        // Show banner if this is an unseen plan
        try {
          const dismissed = localStorage.getItem(`${BANNER_LS_KEY}_${loaded.id}`)
          if (!dismissed) { setBannerText(loaded.name); setBannerVisible(true) }
        } catch { /* ignore */ }
      }
      setLoadingPlan(false)

      // Subscribe to Realtime changes on this client's plans
      const channel = supabase
        .channel(`client_nutrition_plans_${userId}`)
        .on<RealtimePostgresChangesPayload<Record<string, unknown>>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'nutrition_plans_v2',
            filter: `client_id=eq.${userId}`,
          },
          (payload) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const row = payload.new as any
            if (!row || row.status !== 'published') return

            const incoming = dbRowToPlan(row)
            const isNewPlan = incoming.id !== prevPlanIdRef.current

            setPlan(incoming)
            prevPlanIdRef.current = incoming.id

            // Always show the banner on a realtime push (plan was just published)
            setBannerText(incoming.name)
            setBannerVisible(true)
            try {
              // Clear dismissed state so the banner reappears for the new version
              if (isNewPlan) localStorage.removeItem(`${BANNER_LS_KEY}_${incoming.id}`)
              // Reset completed meals when a new plan arrives
              if (isNewPlan) {
                setCompletedMeals(new Set())
                localStorage.removeItem(COMPLETED_LS_KEY)
              }
            } catch { /* ignore */ }
          }
        )
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    })

    return () => { cleanup?.() }
  }, [mounted])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const persistCompleted = useCallback((next: Set<string>) => {
    try { localStorage.setItem(COMPLETED_LS_KEY, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
  }, [])

  function toggleMeal(mealId: string) {
    setCompletedMeals(prev => {
      const next = new Set(prev)
      next.has(mealId) ? next.delete(mealId) : next.add(mealId)
      persistCompleted(next)
      return next
    })
  }

  function dismissBanner() {
    setBannerVisible(false)
    if (plan) {
      try { localStorage.setItem(`${BANNER_LS_KEY}_${plan.id}`, 'true') } catch { /* ignore */ }
    }
  }

  const day = plan?.days[activeDay] ?? null
  const dayMacros = day ? sumDayMacros(day) : { cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0, sodium: 0 }
  const completedCount = day ? day.meals.filter(ml => completedMeals.has(ml.id)).length : 0
  const totalMeals = day?.meals.length ?? 0
  const ringPct = totalMeals > 0 ? completedCount / totalMeals : 0

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* Top nav */}
      <header className="sticky top-0 z-20 bg-surface border-b border-cb-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <UtensilsCrossed size={18} className="text-brand shrink-0" />
          <span className="font-semibold text-cb-text text-sm flex-1">My Meal Plan</span>

          {mounted && bannerVisible && (
            <div className="relative mr-1">
              <Bell size={17} className="text-cb-muted" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand rounded-full" />
            </div>
          )}

          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors" title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* New plan banner */}
      {mounted && bannerVisible && (
        <div className="bg-brand/10 border-b border-brand/25">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
            <Sparkles size={15} className="text-brand shrink-0" />
            <p className="flex-1 text-sm text-cb-text">
              <span className="font-semibold text-brand">New plan published</span>
              {bannerText && <> — <span className="text-cb-secondary">{bannerText}</span></>}
              {' '}is now available from your coach.
            </p>
            <button onClick={dismissBanner} className="text-cb-muted hover:text-cb-secondary shrink-0 p-1" aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loadingPlan && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No plan state */}
      {!loadingPlan && !plan && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center text-center">
          <UtensilsCrossed size={36} className="text-cb-muted opacity-30 mb-4" />
          <p className="text-cb-secondary font-semibold">No active meal plan</p>
          <p className="text-cb-muted text-sm mt-1">Your coach hasn&apos;t published a plan for you yet.</p>
        </div>
      )}

      {/* Plan content */}
      {!loadingPlan && plan && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

          {/* Plan header */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-cb-text">{plan.name}</h1>
                <p className="text-sm text-cb-muted mt-0.5">
                  Prepared by your coach · {plan.days.length} days
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs shrink-0">
                {([['Target', `${plan.caloriesTarget} kcal`, 'text-cb-secondary'], ['Protein', `${plan.proteinTarget}g`, 'text-brand'], ['Carbs', `${plan.carbsTarget}g`, 'text-amber-500'], ['Fat', `${plan.fatTarget}g`, 'text-red-400']] as [string, string, string][]).map(([l, v, c]) => (
                  <div key={l} className="bg-surface border border-cb-border rounded-xl px-3 py-1.5 text-center">
                    <div className={clsx('font-semibold', c)}>{v}</div>
                    <div className="text-cb-muted mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {plan.notes && (
              <p className="mt-3 text-sm text-cb-secondary bg-surface border border-cb-border rounded-xl px-4 py-3 leading-relaxed">
                <span className="font-medium text-cb-text">Coach note: </span>{plan.notes}
              </p>
            )}
          </div>

          {/* Day selector */}
          <div className="flex items-center gap-1 mb-5">
            <button onClick={() => setActiveDay(d => Math.max(0, d - 1))} disabled={activeDay === 0} className="p-1.5 rounded-lg text-cb-muted hover:text-cb-secondary disabled:opacity-30 transition-colors">
              <ChevronLeft size={18} />
            </button>

            <div className="flex-1 flex gap-1 overflow-x-auto pb-0.5">
              {plan.days.map((d, i) => {
                const dm = sumDayMacros(d)
                const dayComplete = d.meals.length > 0 && d.meals.every(ml => completedMeals.has(ml.id))
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDay(i)}
                    className={clsx(
                      'flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all shrink-0 min-w-[62px] relative',
                      i === activeDay ? 'bg-brand text-white border-brand shadow-sm' : 'bg-surface border-cb-border text-cb-secondary hover:border-brand/40'
                    )}
                  >
                    {dayComplete && i !== activeDay && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cb-success rounded-full border-2 border-background flex items-center justify-center">
                        <CheckCircle2 size={8} className="text-white" />
                      </span>
                    )}
                    <span className={clsx('text-xs font-semibold', i === activeDay ? 'text-white' : 'text-cb-text')}>{d.dayName.slice(0, 3)}</span>
                    <span className={clsx('text-[11px] mt-0.5', i === activeDay ? 'text-white/80' : 'text-cb-muted')}>{dm.cal > 0 ? `${dm.cal}` : '—'}</span>
                  </button>
                )
              })}
            </div>

            <button onClick={() => setActiveDay(d => Math.min(plan.days.length - 1, d + 1))} disabled={activeDay === plan.days.length - 1} className="p-1.5 rounded-lg text-cb-muted hover:text-cb-secondary disabled:opacity-30 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Main content grid */}
          {day && (
            <div className="flex gap-6 items-start">
              {/* Meal cards */}
              <div className="flex-1 min-w-0 space-y-3">
                {day.meals.map(meal => (
                  <MealCard key={meal.id} meal={meal} completed={completedMeals.has(meal.id)} onToggle={() => toggleMeal(meal.id)} />
                ))}
                {day.meals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <UtensilsCrossed size={32} className="text-cb-muted mb-3 opacity-40" />
                    <p className="text-cb-secondary font-medium">No meals for this day</p>
                  </div>
                )}
              </div>

              {/* Sidebar ≥lg */}
              <aside className="w-64 shrink-0 sticky top-20 hidden lg:block space-y-3">
                {/* Progress */}
                <div className="bg-surface border border-cb-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide">Today&apos;s Progress</p>
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', completedCount === totalMeals && totalMeals > 0 ? 'bg-cb-success/10 text-cb-success' : 'bg-surface-light text-cb-muted')}>
                      {completedCount}/{totalMeals} meals
                    </span>
                  </div>
                  <div className="h-2 bg-surface-light rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-cb-success rounded-full transition-all duration-500" style={{ width: `${ringPct * 100}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {day.meals.map(meal => {
                      const done = completedMeals.has(meal.id)
                      return (
                        <button key={meal.id} onClick={() => toggleMeal(meal.id)} className="w-full flex items-center gap-2.5 text-left group">
                          {done ? <CheckCircle2 size={14} className="text-cb-success shrink-0" /> : <Circle size={14} className="text-cb-muted group-hover:text-brand shrink-0 transition-colors" />}
                          <span className={clsx('text-xs flex-1', done ? 'text-cb-muted line-through' : 'text-cb-secondary')}>{meal.name}</span>
                          <span className="text-xs text-cb-muted tabular-nums">{sumMealMacros(meal).cal}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Macros */}
                <div className="bg-surface border border-cb-border rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide">{day.dayName} Macros</p>
                  <MacroBar label="Calories" value={dayMacros.cal} target={plan.caloriesTarget} color="bg-brand" />
                  <MacroBar label="Protein (g)" value={dayMacros.pro} target={plan.proteinTarget} color="bg-cb-success" />
                  <MacroBar label="Carbs (g)" value={dayMacros.carb} target={plan.carbsTarget} color="bg-amber-400" />
                  <MacroBar label="Fat (g)" value={dayMacros.fat} target={plan.fatTarget} color="bg-red-400" />
                  <MacroBar label="Fibre (g)" value={dayMacros.fibre} target={plan.fibreTarget} color="bg-purple-400" />
                  <div className="pt-2 border-t border-cb-border flex justify-between text-xs">
                    <span className="text-cb-muted">Sodium</span>
                    <span className="text-cb-secondary tabular-nums">{dayMacros.sodium.toLocaleString()}mg</span>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* Mobile macro summary */}
          {day && (
            <div className="lg:hidden mt-6 bg-surface border border-cb-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide">{day.dayName} Macros</p>
                <span className="text-xs text-cb-muted">{completedCount}/{totalMeals} meals done</span>
              </div>
              <MacroBar label="Calories" value={dayMacros.cal} target={plan.caloriesTarget} color="bg-brand" />
              <MacroBar label="Protein (g)" value={dayMacros.pro} target={plan.proteinTarget} color="bg-cb-success" />
              <MacroBar label="Carbs (g)" value={dayMacros.carb} target={plan.carbsTarget} color="bg-amber-400" />
              <MacroBar label="Fat (g)" value={dayMacros.fat} target={plan.fatTarget} color="bg-red-400" />
              <MacroBar label="Fibre (g)" value={dayMacros.fibre} target={plan.fibreTarget} color="bg-purple-400" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
