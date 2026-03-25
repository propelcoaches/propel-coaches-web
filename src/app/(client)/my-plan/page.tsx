'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CheckCircle2, Circle, X, Bell, Sun, Moon,
  ChevronLeft, ChevronRight, Sparkles, UtensilsCrossed, Info,
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '@/contexts/ThemeContext'
import { useIsDemo } from '@/lib/demo/useDemoMode'
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

// ── Demo data ─────────────────────────────────────────────────────────────────

function genId(): string {
  return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function f(name: string, qty: number, unit: Unit, cal100: number, pro100: number, carb100: number, fat100: number, fibre100: number, sodium100: number, brand?: string): FoodItem {
  return { id: genId(), name, brand, quantity: qty, unit, cal100, pro100, carb100, fat100, fibre100, sodium100 }
}

function m(name: string, time: string, foods: FoodItem[], notes = ''): Meal {
  return { id: genId(), name, time, notes, tags: [], foods }
}

function buildClientPlan(): NutritionPlan {
  const days: DayPlan[] = [
    {
      id: genId(), dayNumber: 1, dayName: 'Monday', meals: [
        m('Breakfast', '07:00', [f('Rolled Oats', 80, 'g', 389, 17, 66, 7, 10.6, 6), f('Whey Protein', 30, 'g', 380, 75, 8, 6, 1, 80, 'Generic'), f('Blueberries', 100, 'g', 57, 0.7, 14.5, 0.3, 2.4, 1), f('Almond Milk', 250, 'ml', 17, 0.6, 0.7, 1.1, 0.4, 65)], 'Mix protein into oats after cooking with water.'),
        m('Lunch', '12:30', [f('Chicken Breast', 200, 'g', 165, 31, 0, 3.6, 0, 74), f('White Rice', 150, 'g', 130, 2.7, 28, 0.3, 0.4, 1), f('Broccoli', 120, 'g', 34, 2.8, 7, 0.4, 2.6, 33), f('Olive Oil', 10, 'ml', 884, 0, 0, 100, 0, 2)]),
        m('Afternoon Snack', '15:30', [f('Greek Yogurt', 200, 'g', 59, 10, 3.6, 0.4, 0, 36), f('Almonds', 30, 'g', 579, 21, 22, 50, 12.5, 1), f('Banana', 1, 'piece', 89, 1.1, 23, 0.3, 2.6, 1)]),
        m('Dinner', '18:30', [f('Atlantic Salmon', 200, 'g', 208, 20, 0, 13, 0, 59), f('Sweet Potato', 250, 'g', 86, 1.6, 20, 0.1, 3, 55), f('Spinach', 80, 'g', 23, 2.9, 3.6, 0.4, 2.2, 79), f('Olive Oil', 15, 'ml', 884, 0, 0, 100, 0, 2)], 'Bake salmon at 200°C for 18 mins.'),
      ],
    },
    {
      id: genId(), dayNumber: 2, dayName: 'Tuesday', meals: [
        m('Breakfast', '07:00', [f('Eggs', 3, 'piece', 155, 13, 1.1, 11, 0, 124), f('Whole Grain Toast', 60, 'g', 247, 9, 47, 3, 6, 380), f('Avocado', 80, 'g', 160, 2, 9, 15, 6.7, 7)]),
        m('Lunch', '12:30', [f('Turkey Breast', 180, 'g', 135, 29, 0, 1, 0, 70), f('Brown Rice', 140, 'g', 123, 2.7, 26, 1, 1.8, 4), f('Asparagus', 120, 'g', 20, 2.2, 3.9, 0.1, 2.1, 2), f('Olive Oil', 10, 'ml', 884, 0, 0, 100, 0, 2)]),
        m('Dinner', '18:30', [f('Lean Beef Mince', 200, 'g', 215, 26, 0, 12, 0, 79), f('Pasta', 80, 'g', 371, 13, 75, 1.5, 2.7, 6), f('Tomato Passata', 100, 'g', 35, 1.5, 7, 0.3, 1.5, 320), f('Parmesan', 20, 'g', 431, 38, 4, 29, 0, 1529)]),
        m('Evening Snack', '21:00', [f('Cottage Cheese', 200, 'g', 98, 11, 3.4, 4.3, 0, 364)]),
      ],
    },
    {
      id: genId(), dayNumber: 3, dayName: 'Wednesday', meals: [
        m('Breakfast', '07:00', [f('Rolled Oats', 80, 'g', 389, 17, 66, 7, 10.6, 6), f('Whey Protein', 30, 'g', 380, 75, 8, 6, 1, 80, 'Generic'), f('Strawberries', 100, 'g', 32, 0.7, 7.7, 0.3, 2, 1)]),
        m('Lunch', '12:30', [f('Chicken Breast', 200, 'g', 165, 31, 0, 3.6, 0, 74), f('Quinoa', 100, 'g', 120, 4.4, 22, 1.9, 2.8, 7), f('Kale', 80, 'g', 49, 4.3, 8.8, 0.9, 3.6, 38), f('Olive Oil', 10, 'ml', 884, 0, 0, 100, 0, 2)]),
        m('Afternoon Snack', '15:30', [f('Greek Yogurt', 200, 'g', 59, 10, 3.6, 0.4, 0, 36), f('Mixed Nuts', 30, 'g', 607, 20, 21, 54, 6, 4)]),
        m('Dinner', '18:30', [f('Tuna Steak', 200, 'g', 116, 26, 0, 1, 0, 45), f('Sweet Potato', 200, 'g', 86, 1.6, 20, 0.1, 3, 55), f('Green Beans', 120, 'g', 31, 1.8, 7, 0.1, 2.7, 6)]),
      ],
    },
    {
      id: genId(), dayNumber: 4, dayName: 'Thursday', meals: [
        m('Breakfast', '07:00', [f('Eggs', 4, 'piece', 155, 13, 1.1, 11, 0, 124), f('Rolled Oats', 60, 'g', 389, 17, 66, 7, 10.6, 6), f('Banana', 1, 'piece', 89, 1.1, 23, 0.3, 2.6, 1)]),
        m('Lunch', '12:30', [f('Chicken Breast', 220, 'g', 165, 31, 0, 3.6, 0, 74), f('White Rice', 160, 'g', 130, 2.7, 28, 0.3, 0.4, 1), f('Broccoli', 150, 'g', 34, 2.8, 7, 0.4, 2.6, 33)]),
        m('Pre-Workout', '16:00', [f('Whey Protein', 30, 'g', 380, 75, 8, 6, 1, 80, 'Generic'), f('Apple', 1, 'piece', 52, 0.3, 14, 0.2, 2.4, 1)], 'Have 30 mins before training.'),
        m('Dinner', '19:00', [f('Atlantic Salmon', 200, 'g', 208, 20, 0, 13, 0, 59), f('Brown Rice', 150, 'g', 123, 2.7, 26, 1, 1.8, 4), f('Zucchini', 120, 'g', 17, 1.2, 3.1, 0.3, 1, 8)]),
      ],
    },
    {
      id: genId(), dayNumber: 5, dayName: 'Friday', meals: [
        m('Breakfast', '07:00', [f('Rolled Oats', 80, 'g', 389, 17, 66, 7, 10.6, 6), f('Whey Protein', 30, 'g', 380, 75, 8, 6, 1, 80, 'Generic'), f('Blueberries', 80, 'g', 57, 0.7, 14.5, 0.3, 2.4, 1)]),
        m('Lunch', '12:30', [f('Turkey Breast', 200, 'g', 135, 29, 0, 1, 0, 70), f('Pasta', 90, 'g', 371, 13, 75, 1.5, 2.7, 6), f('Spinach', 60, 'g', 23, 2.9, 3.6, 0.4, 2.2, 79)]),
        m('Dinner', '18:30', [f('Beef Steak', 220, 'g', 271, 26, 0, 18, 0, 54), f('Sweet Potato', 200, 'g', 86, 1.6, 20, 0.1, 3, 55), f('Asparagus', 100, 'g', 20, 2.2, 3.9, 0.1, 2.1, 2), f('Butter', 10, 'g', 717, 0.9, 0.1, 81, 0, 714)]),
      ],
    },
    {
      id: genId(), dayNumber: 6, dayName: 'Saturday', meals: [
        m('Breakfast', '08:30', [f('Eggs', 3, 'piece', 155, 13, 1.1, 11, 0, 124), f('Avocado', 100, 'g', 160, 2, 9, 15, 6.7, 7), f('Whole Grain Toast', 80, 'g', 247, 9, 47, 3, 6, 380), f('Smoked Salmon', 80, 'g', 117, 18, 0, 4.3, 0, 784)]),
        m('Lunch', '13:00', [f('Chicken Breast', 200, 'g', 165, 31, 0, 3.6, 0, 74), f('Mixed Salad', 150, 'g', 17, 1.5, 3.3, 0.2, 1.8, 28), f('Olive Oil', 15, 'ml', 884, 0, 0, 100, 0, 2), f('Feta Cheese', 40, 'g', 264, 14, 4, 21, 0, 917)]),
        m('Dinner', '19:00', [f('Atlantic Salmon', 200, 'g', 208, 20, 0, 13, 0, 59), f('Quinoa', 120, 'g', 120, 4.4, 22, 1.9, 2.8, 7), f('Bell Pepper', 120, 'g', 31, 1, 6, 0.3, 2.1, 4), f('Olive Oil', 10, 'ml', 884, 0, 0, 100, 0, 2)]),
      ],
    },
    {
      id: genId(), dayNumber: 7, dayName: 'Sunday', meals: [
        m('Breakfast', '09:00', [f('Protein Pancakes', 100, 'g', 220, 18, 28, 4, 2, 380), f('Greek Yogurt', 150, 'g', 59, 10, 3.6, 0.4, 0, 36), f('Mixed Berries', 100, 'g', 50, 1, 12, 0.3, 3, 1)]),
        m('Lunch', '13:00', [f('Lean Beef Mince', 180, 'g', 215, 26, 0, 12, 0, 79), f('White Rice', 150, 'g', 130, 2.7, 28, 0.3, 0.4, 1), f('Broccoli', 150, 'g', 34, 2.8, 7, 0.4, 2.6, 33)]),
        m('Dinner', '18:30', [f('Chicken Breast', 220, 'g', 165, 31, 0, 3.6, 0, 74), f('Sweet Potato', 250, 'g', 86, 1.6, 20, 0.1, 3, 55), f('Kale', 80, 'g', 49, 4.3, 8.8, 0.9, 3.6, 38), f('Olive Oil', 10, 'ml', 884, 0, 0, 100, 0, 2)]),
      ],
    },
  ]

  return {
    id: 'demo-client-plan-1',
    name: 'Lean Bulk Phase 1',
    clientId: 'client-liam', clientName: 'Liam Carter',
    status: 'published',
    caloriesTarget: 2800, proteinTarget: 200, carbsTarget: 300, fatTarget: 80, fibreTarget: 35,
    days,
    notes: 'Focus on progressive overload. Adjust portions based on your weekly weigh-in trend. Drink at least 3L of water daily.',
    createdAt: '2026-02-01T08:00:00Z',
    publishedAt: '2026-03-09T10:00:00Z',
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
  const isDemo = useIsDemo()
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

  // ── Demo mode: use local data ────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    if (!isDemo) return
    const demoPlan = buildClientPlan()
    setPlan(demoPlan)
    setLoadingPlan(false)
    // Show banner in demo mode if not previously dismissed
    try {
      const dismissed = localStorage.getItem(`${BANNER_LS_KEY}_${demoPlan.id}`)
      if (!dismissed) {
        setBannerText(demoPlan.name)
        setBannerVisible(true)
      }
    } catch { /* ignore */ }
  }, [isDemo, mounted])

  // ── Live mode: load from Supabase + subscribe to Realtime ───────────────────
  useEffect(() => {
    if (!mounted || isDemo) return

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
  }, [isDemo, mounted])

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
