'use client'

import { useState, useEffect } from 'react'
import {
  X, Sparkles, ChevronRight, ChevronLeft, Loader2,
  CheckCircle2, Utensils, Calculator, Heart, Coffee,
} from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

function genId() { return crypto.randomUUID() }

interface Client { id: string; name?: string | null; email?: string }

type Unit = 'g' | 'kg' | 'ml' | 'L' | 'cup' | 'tbsp' | 'tsp' | 'oz' | 'piece'

interface GeneratedFood {
  name: string; brand?: string
  quantity: number; unit: Unit
  cal100: number; pro100: number; carb100: number
  fat100: number; fibre100: number; sodium100: number
}

interface GeneratedMeal {
  name: string; time: string; notes: string
  tags: string[]; foods: GeneratedFood[]
}

interface GeneratedDay {
  day_number: number; day_name: string
  meals: GeneratedMeal[]
}

interface GeneratedPlan {
  plan_name: string; description: string; dietitian_notes: string
  calories_target: number; protein_target: number
  carbs_target: number; fat_target: number; fibre_target: number
  days: GeneratedDay[]
}

export interface MealPlanOutput {
  name: string
  clientId: string | null
  clientName: string | null
  caloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  fibreTarget: number
  notes: string
  days: Array<{
    dayNumber: number; dayName: string
    meals: Array<{
      name: string; time: string; notes: string; tags: string[]
      foods: Array<GeneratedFood & { id: string }>
    } & { id: string }>
  } & { id: string }>
}

interface WizardState {
  clientId: string
  goal: string; sex: string; age: string
  weightKg: string; heightCm: string; activityLevel: string
  macroMode: 'auto' | 'manual'
  calories: string; protein: string; carbs: string; fats: string
  planDays: number; mealsPerDay: number
  dietType: string; restrictions: string
  lovedFoods: string; dislikedFoods: string; supplements: string
  cookingSkill: string; budget: string; cuisines: string
  mealPrepStyle: string; additionalNotes: string
}

// ─── TDEE Helper ──────────────────────────────────────────────────────────────

function calcTDEE(state: WizardState): { calories: number; protein: number; carbs: number; fats: number } | null {
  const age = parseFloat(state.age)
  const w = parseFloat(state.weightKg)
  const h = parseFloat(state.heightCm)
  if (!age || !w || !h || age <= 0 || w <= 0 || h <= 0) return null

  const bmr = state.sex === 'female'
    ? 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * age)
    : 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * age)

  const actMult: Record<string, number> = {
    sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55,
    very_active: 1.725, extremely_active: 1.9,
  }
  const tdee = bmr * (actMult[state.activityLevel] ?? 1.55)
  const goalAdj: Record<string, number> = {
    fat_loss: -500, aggressive_cut: -750, maintenance: 0,
    lean_bulk: 300, muscle_gain: 400, performance: 200,
  }
  const cal = Math.round(tdee + (goalAdj[state.goal] ?? 0))
  const pro = Math.round(w * 2.0)
  const fat = Math.round((cal * 0.25) / 9)
  const carb = Math.round((cal - pro * 4 - fat * 9) / 4)
  return { calories: cal, protein: pro, carbs: Math.max(carb, 50), fats: fat }
}

// ─── Reusable Pills ───────────────────────────────────────────────────────────

function Pills({ options, value, onChange, multi = false }: {
  options: Array<{ value: string; label: string }>
  value: string | string[]; onChange: (v: string | string[]) => void
  multi?: boolean
}) {
  function toggle(v: string) {
    if (!multi) { onChange(v); return }
    const arr = value as string[]
    onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }
  function isSelected(v: string) {
    return multi ? (value as string[]).includes(v) : value === v
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => toggle(o.value)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            isSelected(o.value)
              ? 'border-cb-teal bg-cb-teal/10 text-cb-teal'
              : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Loading Animation ────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Analysing client profile…',
  'Calculating nutritional targets…',
  'Designing meal structure…',
  'Building food combinations…',
  'Optimising macro distribution…',
  'Finalising your plan…',
]

// ─── Result View ──────────────────────────────────────────────────────────────

function ResultView({ plan, onUse, onRegenerate, loading }: {
  plan: GeneratedPlan
  onUse: () => void
  onRegenerate: () => void
  loading: boolean
}) {
  const [activeDay, setActiveDay] = useState(0)
  const day = plan.days[activeDay]

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        {/* Plan header */}
        <div className="bg-surface-light border border-cb-border rounded-xl p-4">
          <h3 className="text-base font-semibold text-cb-text mb-1">{plan.plan_name}</h3>
          <p className="text-xs text-cb-secondary leading-relaxed mb-3">{plan.description}</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', val: `${plan.calories_target}`, unit: 'kcal', color: 'text-orange-400' },
              { label: 'Protein',  val: `${plan.protein_target}g`,  unit: '', color: 'text-cb-teal' },
              { label: 'Carbs',    val: `${plan.carbs_target}g`,    unit: '', color: 'text-blue-400' },
              { label: 'Fats',     val: `${plan.fat_target}g`,      unit: '', color: 'text-yellow-400' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-surface rounded-lg p-2 border border-cb-border">
                <p className={clsx('text-sm font-bold', s.color)}>{s.val}{s.unit}</p>
                <p className="text-[10px] text-cb-muted uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dietitian notes */}
        {plan.dietitian_notes && (
          <div className="bg-cb-teal/5 border border-cb-teal/20 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-cb-teal uppercase tracking-wide mb-1.5">Dietitian Notes</p>
            <div className="space-y-0.5">
              {plan.dietitian_notes.split('\n').map((line, i) => (
                <p key={i} className="text-xs text-cb-secondary">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Day tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {plan.days.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)}
              className={clsx('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                activeDay === i
                  ? 'border-cb-teal bg-cb-teal/10 text-cb-teal'
                  : 'border-cb-border text-cb-secondary hover:border-cb-teal/30'
              )}>
              {d.day_name}
            </button>
          ))}
        </div>

        {/* Day meals */}
        {day && (
          <div className="space-y-3">
            {day.meals.map((meal, mi) => (
              <div key={mi} className="bg-surface-light border border-cb-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-cb-text">{meal.name}</p>
                  <span className="text-[10px] text-cb-muted">{meal.time}</span>
                </div>
                <div className="space-y-1">
                  {meal.foods.map((food, fi) => (
                    <div key={fi} className="flex items-center justify-between text-xs">
                      <span className="text-cb-secondary">{food.quantity}{food.unit} {food.name}</span>
                      <span className="text-cb-muted">{Math.round(food.cal100 * food.quantity / 100)} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-cb-border flex gap-3">
        <button onClick={onRegenerate} disabled={loading}
          className="flex-1 py-2 border border-cb-border text-sm text-cb-secondary hover:bg-surface-light rounded-lg transition-colors disabled:opacity-50">
          Regenerate
        </button>
        <button onClick={onUse} disabled={loading}
          className="flex-1 py-2.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
          <CheckCircle2 size={15} /> Use This Plan
        </button>
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Client & Goal',   icon: Heart },
  { label: 'Macro Targets',   icon: Calculator },
  { label: 'Preferences',     icon: Utensils },
  { label: 'Lifestyle',       icon: Coffee },
]

const GOALS = [
  { value: 'fat_loss',        label: 'Fat Loss' },
  { value: 'aggressive_cut',  label: 'Aggressive Cut' },
  { value: 'maintenance',     label: 'Maintenance' },
  { value: 'lean_bulk',       label: 'Lean Bulk' },
  { value: 'muscle_gain',     label: 'Muscle Gain' },
  { value: 'performance',     label: 'Performance' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary',          label: 'Sedentary' },
  { value: 'lightly_active',     label: 'Lightly Active' },
  { value: 'moderately_active',  label: 'Moderate' },
  { value: 'very_active',        label: 'Very Active' },
  { value: 'extremely_active',   label: 'Athlete' },
]

const DIET_TYPES = [
  { value: 'standard',        label: 'Standard' },
  { value: 'vegetarian',      label: 'Vegetarian' },
  { value: 'vegan',           label: 'Vegan' },
  { value: 'pescatarian',     label: 'Pescatarian' },
  { value: 'keto',            label: 'Keto' },
  { value: 'paleo',           label: 'Paleo' },
  { value: 'mediterranean',   label: 'Mediterranean' },
  { value: 'gluten_free',     label: 'Gluten Free' },
]

const COOKING_SKILLS = [
  { value: 'minimal',       label: 'Minimal (15 min max)' },
  { value: 'beginner',      label: 'Beginner' },
  { value: 'intermediate',  label: 'Intermediate' },
  { value: 'advanced',      label: 'Advanced / Enjoys cooking' },
]

const BUDGETS = [
  { value: 'budget',    label: 'Budget' },
  { value: 'moderate',  label: 'Moderate' },
  { value: 'premium',   label: 'Premium' },
]

const MEAL_PREP_STYLES = [
  { value: 'daily',       label: 'Cook daily' },
  { value: 'meal_prep',   label: 'Batch meal prep' },
  { value: 'both',        label: 'Mix of both' },
]

function inputCls(extra = '') {
  return `w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal ${extra}`
}

function labelCls() { return 'block text-xs font-medium text-cb-muted mb-1' }

export default function AIMealPlanWizard({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (plan: MealPlanOutput) => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [result, setResult] = useState<GeneratedPlan | null>(null)

  const [state, setState] = useState<WizardState>({
    clientId: '', goal: 'fat_loss', sex: 'male', age: '',
    weightKg: '', heightCm: '', activityLevel: 'moderately_active',
    macroMode: 'auto', calories: '', protein: '', carbs: '', fats: '',
    planDays: 7, mealsPerDay: 4, dietType: 'standard',
    restrictions: '', lovedFoods: '', dislikedFoods: '', supplements: '',
    cookingSkill: 'intermediate', budget: 'moderate', cuisines: '',
    mealPrepStyle: 'both', additionalNotes: '',
  })

  // Load clients
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('id, name, email').eq('coach_id', user.id).eq('role', 'client')
        .then(({ data }) => {
          const list = (data ?? []).map((c: { id: string; name: string | null; email: string }) => ({ id: c.id, name: c.name, email: c.email }))
          setClients(list)
          if (list.length > 0) setState((s) => ({ ...s, clientId: list[0].id }))
        })
    })
  }, [])

  const set = (k: keyof WizardState, v: WizardState[keyof WizardState]) =>
    setState((s) => ({ ...s, [k]: v }))

  // Auto-calc macros when step changes to 1 and mode is auto
  const tdee = calcTDEE(state)
  useEffect(() => {
    if (state.macroMode === 'auto' && tdee) {
      setState((s) => ({
        ...s,
        calories: String(tdee.calories),
        protein:  String(tdee.protein),
        carbs:    String(tdee.carbs),
        fats:     String(tdee.fats),
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.goal, state.sex, state.age, state.weightKg, state.heightCm, state.activityLevel, state.macroMode])

  async function generate() {
    setLoading(true)
    setResult(null)
    setLoadingStepIdx(0)
    const interval = setInterval(() => {
      setLoadingStepIdx((i) => (i < LOADING_STEPS.length - 1 ? i + 1 : i))
    }, 900)

    const selectedClient = clients.find((c) => c.id === state.clientId)
    try {
      const res = await fetch('/api/ai/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient?.name ?? 'Client',
          goal: state.goal,
          age: state.age, sex: state.sex,
          weightKg: state.weightKg, heightCm: state.heightCm,
          activityLevel: state.activityLevel,
          calories: state.calories || tdee?.calories,
          protein: state.protein || tdee?.protein,
          carbs: state.carbs || tdee?.carbs,
          fats: state.fats || tdee?.fats,
          planDays: state.planDays, mealsPerDay: state.mealsPerDay,
          dietType: state.dietType, restrictions: state.restrictions,
          lovedFoods: state.lovedFoods, dislikedFoods: state.dislikedFoods,
          supplements: state.supplements, cookingSkill: state.cookingSkill,
          budget: state.budget, cuisines: state.cuisines,
          mealPrepStyle: state.mealPrepStyle, additionalNotes: state.additionalNotes,
        }),
      })
      const data = await res.json()
      if (data.plan) {
        setResult(data.plan)
      } else {
        toast.error(data.error ?? 'Failed to generate meal plan')
      }
    } catch {
      toast.error('Failed to generate meal plan — please try again')
    } finally {
      clearInterval(interval)
      setLoadingStepIdx(LOADING_STEPS.length - 1)
      setLoading(false)
    }
  }

  function handleUsePlan() {
    if (!result) return
    const selectedClient = clients.find((c) => c.id === state.clientId)
    const plan: MealPlanOutput = {
      name: result.plan_name,
      clientId: state.clientId || null,
      clientName: selectedClient?.name ?? null,
      caloriesTarget: result.calories_target,
      proteinTarget: result.protein_target,
      carbsTarget: result.carbs_target,
      fatTarget: result.fat_target,
      fibreTarget: result.fibre_target,
      notes: result.dietitian_notes,
      days: result.days.map((d) => ({
        id: genId(),
        dayNumber: d.day_number,
        dayName: d.day_name,
        meals: d.meals.map((m) => ({
          id: genId(),
          name: m.name, time: m.time, notes: m.notes, tags: m.tags,
          foods: m.foods.map((f) => ({ id: genId(), ...f })),
        })),
      })),
    }
    onSave(plan)
  }

  function canProceed() {
    if (step === 0) return !!state.goal
    if (step === 1) {
      const c = parseInt(state.calories)
      const p = parseInt(state.protein)
      return c > 0 && p > 0
    }
    return true
  }

  // ── Step content ─────────────────────────────────────────────────────────

  const stepContent = [
    /* Step 0 — Client & Goal */
    <div key="s0" className="space-y-4">
      <div>
        <label className={labelCls()}>Client</label>
        <select value={state.clientId} onChange={(e) => set('clientId', e.target.value)} className={inputCls()}>
          <option value="">No specific client (template)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls()}>Primary Goal</label>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button key={g.value} type="button" onClick={() => set('goal', g.value)}
              className={clsx('py-2 px-3 rounded-lg text-xs font-medium border transition-colors text-center',
                state.goal === g.value
                  ? 'border-cb-teal bg-cb-teal/10 text-cb-teal'
                  : 'border-cb-border text-cb-secondary hover:border-cb-teal/40'
              )}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls()}>Sex</label>
          <div className="flex gap-2">
            {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map((s) => (
              <button key={s.value} type="button" onClick={() => set('sex', s.value)}
                className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                  state.sex === s.value ? 'border-cb-teal bg-cb-teal/10 text-cb-teal' : 'border-cb-border text-cb-secondary hover:border-cb-teal/40'
                )}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls()}>Age</label>
          <input type="number" min={16} max={80} placeholder="e.g. 28"
            value={state.age} onChange={(e) => set('age', e.target.value)} className={inputCls()} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls()}>Weight (kg)</label>
          <input type="number" min={40} max={200} placeholder="e.g. 80"
            value={state.weightKg} onChange={(e) => set('weightKg', e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className={labelCls()}>Height (cm)</label>
          <input type="number" min={140} max={220} placeholder="e.g. 178"
            value={state.heightCm} onChange={(e) => set('heightCm', e.target.value)} className={inputCls()} />
        </div>
      </div>
      <div>
        <label className={labelCls()}>Activity Level</label>
        <Pills options={ACTIVITY_LEVELS} value={state.activityLevel} onChange={(v) => set('activityLevel', v as string)} />
      </div>
    </div>,

    /* Step 1 — Macro Targets */
    <div key="s1" className="space-y-4">
      <div className="flex gap-2">
        {(['auto', 'manual'] as const).map((m) => (
          <button key={m} type="button" onClick={() => set('macroMode', m)}
            className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors',
              state.macroMode === m ? 'border-cb-teal bg-cb-teal/10 text-cb-teal' : 'border-cb-border text-cb-secondary hover:border-cb-teal/40'
            )}>
            {m === 'auto' ? 'Auto-calculate (TDEE)' : 'Set manually'}
          </button>
        ))}
      </div>

      {state.macroMode === 'auto' && tdee && (
        <div className="bg-cb-teal/5 border border-cb-teal/20 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-cb-teal uppercase tracking-wide mb-2">Calculated from body metrics</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Calories', val: tdee.calories, unit: 'kcal' },
              { label: 'Protein',  val: tdee.protein,  unit: 'g' },
              { label: 'Carbs',    val: tdee.carbs,    unit: 'g' },
              { label: 'Fats',     val: tdee.fats,     unit: 'g' },
            ].map((m) => (
              <div key={m.label} className="bg-surface rounded-lg p-2 border border-cb-border">
                <p className="text-sm font-bold text-cb-text">{m.val}</p>
                <p className="text-[10px] text-cb-muted">{m.unit}</p>
                <p className="text-[9px] text-cb-muted uppercase tracking-wide">{m.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-cb-muted mt-2">Goal adjustment applied. You can override below.</p>
        </div>
      )}

      {state.macroMode === 'auto' && !tdee && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-xs text-amber-400">Enter age, weight and height on Step 1 to auto-calculate TDEE.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls()}>Daily Calories (kcal)</label>
          <input type="number" min={1000} max={6000} placeholder="e.g. 2200"
            value={state.calories} onChange={(e) => { set('macroMode', 'manual'); set('calories', e.target.value) }} className={inputCls()} />
        </div>
        <div>
          <label className={labelCls()}>Protein (g)</label>
          <input type="number" min={50} max={400} placeholder="e.g. 165"
            value={state.protein} onChange={(e) => { set('macroMode', 'manual'); set('protein', e.target.value) }} className={inputCls()} />
        </div>
        <div>
          <label className={labelCls()}>Carbohydrates (g)</label>
          <input type="number" min={0} max={600} placeholder="e.g. 220"
            value={state.carbs} onChange={(e) => { set('macroMode', 'manual'); set('carbs', e.target.value) }} className={inputCls()} />
        </div>
        <div>
          <label className={labelCls()}>Fats (g)</label>
          <input type="number" min={20} max={300} placeholder="e.g. 65"
            value={state.fats} onChange={(e) => { set('macroMode', 'manual'); set('fats', e.target.value) }} className={inputCls()} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls()}>Plan Duration (days)</label>
          <Pills options={[{value:'5',label:'5 days'},{value:'6',label:'6 days'},{value:'7',label:'7 days'}]}
            value={String(state.planDays)} onChange={(v) => set('planDays', parseInt(v as string))} />
        </div>
        <div>
          <label className={labelCls()}>Meals per Day</label>
          <Pills options={[{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'},{value:'6',label:'6'}]}
            value={String(state.mealsPerDay)} onChange={(v) => set('mealsPerDay', parseInt(v as string))} />
        </div>
      </div>
    </div>,

    /* Step 2 — Dietary Preferences */
    <div key="s2" className="space-y-4">
      <div>
        <label className={labelCls()}>Diet Type</label>
        <div className="grid grid-cols-4 gap-2">
          {DIET_TYPES.map((d) => (
            <button key={d.value} type="button" onClick={() => set('dietType', d.value)}
              className={clsx('py-2 px-2 rounded-lg text-xs font-medium border transition-colors text-center',
                state.dietType === d.value
                  ? 'border-cb-teal bg-cb-teal/10 text-cb-teal'
                  : 'border-cb-border text-cb-secondary hover:border-cb-teal/40'
              )}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelCls()}>Allergies & Restrictions</label>
        <input type="text" placeholder="e.g. lactose, shellfish, gluten…"
          value={state.restrictions} onChange={(e) => set('restrictions', e.target.value)} className={inputCls()} />
      </div>
      <div>
        <label className={labelCls()}>Loved Foods (include more of these)</label>
        <input type="text" placeholder="e.g. chicken, sweet potato, berries, Greek yoghurt…"
          value={state.lovedFoods} onChange={(e) => set('lovedFoods', e.target.value)} className={inputCls()} />
      </div>
      <div>
        <label className={labelCls()}>Disliked Foods (avoid)</label>
        <input type="text" placeholder="e.g. broccoli, tuna, mushrooms…"
          value={state.dislikedFoods} onChange={(e) => set('dislikedFoods', e.target.value)} className={inputCls()} />
      </div>
      <div>
        <label className={labelCls()}>Supplements (include in plan)</label>
        <input type="text" placeholder="e.g. whey protein, creatine, fish oil…"
          value={state.supplements} onChange={(e) => set('supplements', e.target.value)} className={inputCls()} />
      </div>
    </div>,

    /* Step 3 — Lifestyle */
    <div key="s3" className="space-y-4">
      <div>
        <label className={labelCls()}>Cooking Skill & Time Available</label>
        <Pills options={COOKING_SKILLS} value={state.cookingSkill} onChange={(v) => set('cookingSkill', v as string)} />
      </div>
      <div>
        <label className={labelCls()}>Budget</label>
        <Pills options={BUDGETS} value={state.budget} onChange={(v) => set('budget', v as string)} />
      </div>
      <div>
        <label className={labelCls()}>Meal Prep Style</label>
        <Pills options={MEAL_PREP_STYLES} value={state.mealPrepStyle} onChange={(v) => set('mealPrepStyle', v as string)} />
      </div>
      <div>
        <label className={labelCls()}>Preferred Cuisines</label>
        <input type="text" placeholder="e.g. Mediterranean, Asian, Mexican…"
          value={state.cuisines} onChange={(e) => set('cuisines', e.target.value)} className={inputCls()} />
      </div>
      <div>
        <label className={labelCls()}>Additional Notes</label>
        <textarea rows={3} placeholder="Any other context for the AI…"
          value={state.additionalNotes} onChange={(e) => set('additionalNotes', e.target.value)}
          className={inputCls('resize-none')} />
      </div>
    </div>,
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cb-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cb-teal" />
            <h2 className="text-lg font-semibold text-cb-text">AI Meal Plan Generator</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>

        {/* Step indicator */}
        {!result && !loading && (
          <div className="flex items-center gap-1 px-5 py-3 border-b border-cb-border flex-shrink-0">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon
              const done = i < step
              const active = i === step
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                    active ? 'bg-cb-teal/10 text-cb-teal' : done ? 'text-cb-teal' : 'text-cb-muted'
                  )}>
                    {done ? <CheckCircle2 size={12} /> : <StepIcon size={12} />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={clsx('w-4 h-px', done ? 'bg-cb-teal' : 'bg-cb-border')} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-6">
            <div className="w-16 h-16 rounded-2xl bg-cb-teal/10 border border-cb-teal/20 flex items-center justify-center">
              <Sparkles size={28} className="text-cb-teal animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-cb-text mb-1">Building your meal plan</p>
              <p className="text-sm text-cb-muted">{LOADING_STEPS[loadingStepIdx]}</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              {LOADING_STEPS.map((s, i) => (
                <div key={i} className={clsx('flex items-center gap-2 text-xs transition-all',
                  i < loadingStepIdx ? 'text-cb-teal' : i === loadingStepIdx ? 'text-cb-text' : 'text-cb-muted'
                )}>
                  {i < loadingStepIdx
                    ? <CheckCircle2 size={12} className="text-cb-teal flex-shrink-0" />
                    : i === loadingStepIdx
                    ? <Loader2 size={12} className="animate-spin flex-shrink-0" />
                    : <div className="w-3 h-3 rounded-full border border-cb-border flex-shrink-0" />
                  }
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <ResultView
            plan={result}
            onUse={handleUsePlan}
            onRegenerate={() => { setResult(null); generate() }}
            loading={loading}
          />
        )}

        {/* Step content */}
        {!result && !loading && (
          <>
            <div className="flex-1 overflow-y-auto p-5">{stepContent[step]}</div>
            <div className="flex items-center justify-between p-5 border-t border-cb-border flex-shrink-0">
              <button
                type="button" onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">
                <ChevronLeft size={16} />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-cb-muted">{step + 1} / {STEPS.length}</span>
                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={generate} disabled={!canProceed() || loading}
                    className="flex items-center gap-2 px-5 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    <Sparkles size={15} /> Generate Plan
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
