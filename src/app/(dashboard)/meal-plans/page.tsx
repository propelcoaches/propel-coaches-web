'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ─── Types ──────────────────────────────────────────────────────────
interface MealPlan {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'archived';
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  dietary_preferences: string[];
  allergies: string[];
  cuisine_preferences: string[];
  meals_per_day: number;
  notes: string | null;
  client_id: string;
  created_at: string;
  client?: { full_name: string; avatar_url: string | null };
  meal_plan_days?: MealPlanDay[];
  meal_plan_shopping_lists?: ShoppingList[];
}

interface MealPlanDay {
  id: string;
  day_number: number;
  day_label: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_plan_meals: Meal[];
}

interface Meal {
  id: string;
  meal_type: string;
  name: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: { name: string; amount: string; unit: string }[];
  instructions: string[];
}

interface ShoppingList {
  id: string;
  items: { category: string; name: string; amount: string; unit: string; checked: boolean }[];
}

interface Client {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

// ─── Dietary & Cuisine Options ──────────────────────────────────────
const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free',
  'Dairy-Free', 'Low-FODMAP', 'Halal', 'Kosher',
];

const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Soy',
  'Wheat', 'Milk', 'Sesame',
];

const CUISINE_OPTIONS = [
  'Mediterranean', 'Asian', 'Mexican', 'American', 'Indian',
  'Italian', 'Japanese', 'Middle Eastern', 'Thai', 'No Preference',
];

// ─── Helper Components ──────────────────────────────────────────────
function MacroBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-gray-600 w-16">{label}</span>
      <span className="font-semibold">{value}g</span>
    </div>
  );
}

function TagPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selected.includes(opt)
                ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────
export default function MealPlansPage() {
  const supabase = createClientComponentClient();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Form state
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    target_calories: 2200,
    target_protein_g: 180,
    target_carbs_g: 220,
    target_fat_g: 70,
    dietary_preferences: [] as string[],
    allergies: [] as string[],
    cuisine_preferences: [] as string[],
    meals_per_day: 4,
    notes: '',
  });

  // Fetch clients and existing plans
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [clientsRes, plansRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url').eq('role', 'client'),
      supabase
        .from('meal_plans')
        .select(`*, client:profiles!meal_plans_client_id_fkey(full_name, avatar_url)`)
        .order('created_at', { ascending: false }),
    ]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (plansRes.data) setMealPlans(plansRes.data as MealPlan[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle helpers
  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  // Generate meal plan
  const handleGenerate = async () => {
    if (!form.client_id) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.meal_plan) {
        setMealPlans((prev) => [data.meal_plan, ...prev]);
        setSelectedPlan(data.meal_plan);
        setShowGenerator(false);
        setActiveDay(1);
      } else {
        alert(data.error || 'Failed to generate meal plan');
      }
    } catch (err) {
      console.error(err);
      alert('Network error generating meal plan');
    } finally {
      setGenerating(false);
    }
  };

  // Activate / archive a plan
  const updatePlanStatus = async (planId: string, status: 'active' | 'archived') => {
    await supabase.from('meal_plans').update({ status }).eq('id', planId);
    setMealPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status } : p)));
    if (selectedPlan?.id === planId) setSelectedPlan((p) => (p ? { ...p, status } : p));
  };

  // View full plan
  const viewPlan = async (plan: MealPlan) => {
    const { data } = await supabase
      .from('meal_plans')
      .select(`
        *,
        client:profiles!meal_plans_client_id_fkey(full_name, avatar_url),
        meal_plan_days(*, meal_plan_meals(*)),
        meal_plan_shopping_lists(*)
      `)
      .eq('id', plan.id)
      .single();
    if (data) {
      setSelectedPlan(data as MealPlan);
      setActiveDay(1);
      setShowShoppingList(false);
    }
  };

  // ─── Render: Generator Form ─────────────────────────────────────
  if (showGenerator) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate AI Meal Plan</h1>
          <button onClick={() => setShowGenerator(false)} className="text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>

        <div className="space-y-6 bg-white rounded-xl shadow-sm border p-6">
          {/* Client selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Cut Phase — Week 1-4"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Macro targets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Daily Macro Targets</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'target_calories', label: 'Calories', unit: 'kcal' },
                { key: 'target_protein_g', label: 'Protein', unit: 'g' },
                { key: 'target_carbs_g', label: 'Carbs', unit: 'g' },
                { key: 'target_fat_g', label: 'Fat', unit: 'g' },
              ].map(({ key, label, unit }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label} ({unit})</label>
                  <input
                    type="number"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Meals per day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meals per Day</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, meals_per_day: n })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.meals_per_day === n
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Tag pickers */}
          <TagPicker
            label="Dietary Preferences"
            options={DIETARY_OPTIONS}
            selected={form.dietary_preferences}
            onToggle={(v) => setForm({ ...form, dietary_preferences: toggleArray(form.dietary_preferences, v) })}
          />
          <TagPicker
            label="Allergies & Intolerances"
            options={ALLERGY_OPTIONS}
            selected={form.allergies}
            onToggle={(v) => setForm({ ...form, allergies: toggleArray(form.allergies, v) })}
          />
          <TagPicker
            label="Cuisine Preferences"
            options={CUISINE_OPTIONS}
            selected={form.cuisine_preferences}
            onToggle={(v) => setForm({ ...form, cuisine_preferences: toggleArray(form.cuisine_preferences, v) })}
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="e.g. Client prefers meal prep on Sundays, dislikes broccoli..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !form.client_id}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating 7-day plan...
              </>
            ) : (
              <>✨ Generate Meal Plan</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Plan Detail View ───────────────────────────────────
  if (selectedPlan) {
    const days = (selectedPlan.meal_plan_days || []).sort((a, b) => a.day_number - b.day_number);
    const currentDay = days.find((d) => d.day_number === activeDay);
    const shoppingList = selectedPlan.meal_plan_shopping_lists?.[0];

    return (
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => setSelectedPlan(null)} className="text-indigo-600 hover:text-indigo-700 text-sm mb-1">
              ← Back to plans
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedPlan.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {selectedPlan.target_calories} kcal · {selectedPlan.target_protein_g}P / {selectedPlan.target_carbs_g}C / {selectedPlan.target_fat_g}F
              {selectedPlan.client && ` · ${selectedPlan.client.full_name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedPlan.status === 'active' ? 'bg-green-100 text-green-700' :
              selectedPlan.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {selectedPlan.status}
            </span>
            {selectedPlan.status === 'draft' && (
              <button
                onClick={() => updatePlanStatus(selectedPlan.id, 'active')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Assign to Client
              </button>
            )}
            {selectedPlan.status === 'active' && (
              <button
                onClick={() => updatePlanStatus(selectedPlan.id, 'archived')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              >
                Archive
              </button>
            )}
          </div>
        </div>

        {/* Day tabs + Shopping list toggle */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {days.map((day) => (
            <button
              key={day.day_number}
              onClick={() => { setActiveDay(day.day_number); setShowShoppingList(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeDay === day.day_number && !showShoppingList
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {day.day_label}
            </button>
          ))}
          {shoppingList && (
            <button
              onClick={() => setShowShoppingList(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                showShoppingList
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🛒 Shopping List
            </button>
          )}
        </div>

        {/* Shopping list view */}
        {showShoppingList && shoppingList ? (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Weekly Shopping List</h2>
            {Object.entries(
              shoppingList.items.reduce<Record<string, typeof shoppingList.items>>((acc, item) => {
                (acc[item.category] = acc[item.category] || []).push(item);
                return acc;
              }, {})
            ).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</h3>
                <div className="space-y-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm py-1">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-gray-900">{item.name}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-600">{item.amount} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : currentDay ? (
          <>
            {/* Day macro summary */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{currentDay.total_calories}</div>
                <div className="text-xs text-gray-500">kcal</div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <MacroBar label="Protein" value={currentDay.total_protein_g} color="bg-blue-500" />
              <MacroBar label="Carbs" value={currentDay.total_carbs_g} color="bg-amber-500" />
              <MacroBar label="Fat" value={currentDay.total_fat_g} color="bg-rose-500" />
            </div>

            {/* Meals */}
            <div className="space-y-4">
              {currentDay.meal_plan_meals
                .sort((a: Meal, b: Meal) => {
                  const order = ['breakfast', 'snack_1', 'lunch', 'snack_2', 'dinner', 'snack_3'];
                  return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
                })
                .map((meal: Meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-12">No data for this day.</p>
        )}
      </div>
    );
  }

  // ─── Render: Plans List ─────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
          <p className="text-gray-500 text-sm mt-1">AI-generated nutrition plans for your clients</p>
        </div>
        <button
          onClick={() => setShowGenerator(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          ✨ Generate New Plan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : mealPlans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="text-4xl mb-3">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No meal plans yet</h3>
          <p className="text-gray-500 mb-4">Generate your first AI-powered meal plan for a client.</p>
          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => viewPlan(plan)}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-green-100 text-green-700' :
                    plan.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {plan.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.client?.full_name || 'Unknown client'} · {plan.target_calories} kcal ·{' '}
                  {plan.target_protein_g}P / {plan.target_carbs_g}C / {plan.target_fat_g}F
                </p>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(plan.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Meal Card ──────────────────────────────────────────────────────
function MealCard({ meal }: { meal: Meal }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = meal.meal_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-indigo-600 tracking-wider">{typeLabel}</span>
            <h3 className="font-semibold text-gray-900 mt-1">{meal.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{meal.description}</p>
          </div>
          <div className="text-right text-sm shrink-0 ml-4">
            <div className="font-semibold text-gray-900">{meal.calories} kcal</div>
            <div className="text-gray-500 text-xs mt-0.5">
              {meal.protein_g}P · {meal.carbs_g}C · {meal.fat_g}F
            </div>
            {meal.prep_time_minutes > 0 && (
              <div className="text-gray-400 text-xs mt-0.5">
                ⏱ {meal.prep_time_minutes + meal.cook_time_minutes} min
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-4 bg-gray-50">
          {/* Ingredients */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients</h4>
          <ul className="grid grid-cols-2 gap-1 mb-4">
            {meal.ingredients.map((ing, i) => (
              <li key={i} className="text-sm text-gray-600">
                • {ing.amount} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>

          {/* Instructions */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Instructions</h4>
          <ol className="space-y-1">
            {meal.instructions.map((step, i) => (
              <li key={i} className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
