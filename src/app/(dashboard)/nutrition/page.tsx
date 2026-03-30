'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, Plus, X, Save, Sparkles, Printer,
  MoreHorizontal, Copy, Trash2, Edit2, CheckCircle,
  ChevronDown, Search, Tag, Clock, FileText, RefreshCw, ArrowRight, Zap
} from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import AIMealPlanWizard, { type MealPlanOutput } from '@/components/ai/AIMealPlanWizard'

// ── Types ──────────────────────────────────────────────────────────────────────

type Unit = 'g' | 'kg' | 'ml' | 'L' | 'cup' | 'tbsp' | 'tsp' | 'oz' | 'piece'

const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'oz', 'piece']

const UNIT_TO_GRAMS: Record<Unit, number | null> = {
  g: 1, kg: 1000, ml: 1, L: 1000, cup: 240, tbsp: 15, tsp: 5, oz: 28.35, piece: null,
}

type FoodItem = {
  id: string
  name: string
  brand?: string
  quantity: number
  unit: Unit
  cal100: number
  pro100: number
  carb100: number
  fat100: number
  fibre100: number
  sodium100: number
}

type Meal = {
  id: string
  name: string
  time: string
  notes: string
  tags: string[]
  foods: FoodItem[]
}

type DayPlan = {
  id: string
  dayNumber: number
  dayName: string
  meals: Meal[]
}

type NutritionPlan = {
  id: string
  name: string
  clientId: string | null
  clientName: string | null
  status: 'draft' | 'published'
  caloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  fibreTarget: number
  days: DayPlan[]
  notes: string
  createdAt: string
  publishedAt?: string
}

type SearchResult = {
  id?: string
  name: string
  brand?: string
  cal100: number
  pro100: number
  carb100: number
  fat100: number
  fibre100: number
  sodium100: number
}

type Macros = { cal: number; pro: number; carb: number; fat: number; fibre: number; sodium: number }

// ── Utilities ─────────────────────────────────────────────────────────────────

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

// ── DB helpers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToPlan(row: any): NutritionPlan {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id ?? null,
    clientName: null,
    status: row.status as 'draft' | 'published',
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

/** Format a food item as a human-readable serving string, e.g. "80g Rolled Oats" */
function formatServing(qty: number, unit: Unit, name: string): string {
  const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1)
  if (unit === 'piece') return `${qtyStr} × ${name}`
  const compact: Unit[] = ['g', 'kg', 'ml', 'L', 'oz']
  return compact.includes(unit) ? `${qtyStr}${unit} ${name}` : `${qtyStr} ${unit} ${name}`
}

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── PDF Export ────────────────────────────────────────────────────────────────

function generatePrintHTML(plan: NutritionPlan): string {
  const dateStr = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const clientName = esc(plan.clientName ?? 'Client')
  const planName = esc(plan.name)

  const daysHtml = plan.days.map(day => {
    const dm = sumDayMacros(day)

    const mealsHtml = day.meals.map(meal => {
      const mm = sumMealMacros(meal)

      const foodRowsHtml = meal.foods.map(food => {
        const fm = calcFoodMacros(food)
        return `
          <tr>
            <td>
              <span class="food-name">${esc(food.name)}</span>
              ${food.brand ? `<span class="food-brand"> · ${esc(food.brand)}</span>` : ''}
            </td>
            <td class="serving">${esc(formatServing(food.quantity, food.unit, food.name))}</td>
            <td class="num">${fm.cal}</td>
            <td class="num pro">${fm.pro}g</td>
            <td class="num carb">${fm.carb}g</td>
            <td class="num fat">${fm.fat}g</td>
            <td class="num fibre">${fm.fibre}g</td>
          </tr>`
      }).join('')

      const notesHtml = meal.notes
        ? `<div class="meal-notes">📋 ${esc(meal.notes)}</div>`
        : ''

      return `
        <div class="meal-block">
          <div class="meal-header">
            <div>
              <span class="meal-name">${esc(meal.name)}</span>
              <span class="meal-time">${meal.time}</span>
            </div>
            <span class="meal-macro-pill">${mm.cal} kcal &nbsp;|&nbsp; P ${mm.pro}g &nbsp;C ${mm.carb}g &nbsp;F ${mm.fat}g</span>
          </div>
          ${notesHtml}
          ${meal.foods.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width:34%">Food</th>
                <th style="width:22%">Serving</th>
                <th class="num" style="width:9%">Cal</th>
                <th class="num pro" style="width:9%">Protein</th>
                <th class="num carb" style="width:9%">Carbs</th>
                <th class="num fat" style="width:9%">Fat</th>
                <th class="num fibre" style="width:8%">Fibre</th>
              </tr>
            </thead>
            <tbody>
              ${foodRowsHtml}
              <tr class="totals-row">
                <td colspan="2"><strong>Meal Total</strong></td>
                <td class="num"><strong>${mm.cal}</strong></td>
                <td class="num pro"><strong>${mm.pro}g</strong></td>
                <td class="num carb"><strong>${mm.carb}g</strong></td>
                <td class="num fat"><strong>${mm.fat}g</strong></td>
                <td class="num fibre"><strong>${mm.fibre}g</strong></td>
              </tr>
            </tbody>
          </table>` : `<p class="empty-meal">No foods added</p>`}
        </div>`
    }).join('')

    const pctCal = plan.caloriesTarget > 0 ? Math.round((dm.cal / plan.caloriesTarget) * 100) : 0

    return `
      <div class="day-section">
        <div class="day-header">
          <span>Day ${day.dayNumber} — ${esc(day.dayName)}</span>
          <span class="day-kcal">${dm.cal.toLocaleString()} kcal</span>
        </div>
        ${mealsHtml}
        <div class="day-summary">
          <div class="ds-item">
            <div class="ds-label">Daily Total</div>
            <div class="ds-val kcal">${dm.cal.toLocaleString()} kcal</div>
          </div>
          <div class="ds-sep"></div>
          <div class="ds-item">
            <div class="ds-label">Protein</div>
            <div class="ds-val pro">${dm.pro}g</div>
          </div>
          <div class="ds-item">
            <div class="ds-label">Carbs</div>
            <div class="ds-val carb">${dm.carb}g</div>
          </div>
          <div class="ds-item">
            <div class="ds-label">Fat</div>
            <div class="ds-val fat">${dm.fat}g</div>
          </div>
          <div class="ds-item">
            <div class="ds-label">Fibre</div>
            <div class="ds-val fibre">${dm.fibre}g</div>
          </div>
          <div class="ds-item">
            <div class="ds-label">Sodium</div>
            <div class="ds-val">${dm.sodium.toLocaleString()}mg</div>
          </div>
          <div class="ds-target">
            <div class="ds-label">vs. Target</div>
            <div class="ds-val ${pctCal > 110 ? 'over' : pctCal < 90 ? 'under' : 'on'}">${pctCal}%</div>
          </div>
        </div>
      </div>`
  }).join('')

  const planNotesHtml = plan.notes
    ? `<div class="plan-notes"><strong>Coach Notes:</strong> ${esc(plan.notes)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${planName} — ${clientName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      color: #1a2830;
      background: #fff;
      line-height: 1.45;
    }
    @page {
      size: A4;
      margin: 14mm 14mm 16mm 14mm;
    }

    /* ── Header ── */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 10px;
      border-bottom: 3px solid #5B9EAB;
      margin-bottom: 16px;
    }
    .doc-title { font-size: 20pt; font-weight: 800; color: #1a2830; letter-spacing: -0.02em; }
    .doc-subtitle { font-size: 9.5pt; color: #5B9EAB; font-weight: 600; margin-top: 1px; }
    .doc-meta { text-align: right; font-size: 8.5pt; color: #6b7280; line-height: 1.6; }

    /* ── Client info strip ── */
    .client-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0;
      border: 1px solid #cfe4e8;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 18px;
    }
    .cs-item {
      padding: 8px 12px;
      border-right: 1px solid #cfe4e8;
    }
    .cs-item:last-child { border-right: none; }
    .cs-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 700; }
    .cs-value { font-size: 11pt; font-weight: 700; color: #1a2830; margin-top: 2px; }
    .cs-item:first-child { background: #5B9EAB; }
    .cs-item:first-child .cs-label { color: rgba(255,255,255,0.75); }
    .cs-item:first-child .cs-value { color: #fff; }

    /* ── Plan notes ── */
    .plan-notes {
      background: #f0f7f9;
      border-left: 3px solid #5B9EAB;
      border-radius: 0 4px 4px 0;
      padding: 8px 12px;
      font-size: 9pt;
      color: #374151;
      margin-bottom: 18px;
    }

    /* ── Day section ── */
    .day-section {
      margin-bottom: 18px;
      border: 1px solid #cfe4e8;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #5B9EAB;
      color: #fff;
      padding: 7px 14px;
      font-weight: 700;
      font-size: 11pt;
      letter-spacing: -0.01em;
    }
    .day-kcal { font-size: 10pt; font-weight: 500; opacity: 0.88; }

    /* ── Meal block ── */
    .meal-block { border-top: 1px solid #e0eef1; }
    .meal-block:first-of-type { border-top: none; }
    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 14px;
      background: #f5fafc;
      border-bottom: 1px solid #e0eef1;
    }
    .meal-name { font-weight: 700; font-size: 10pt; color: #1a2830; }
    .meal-time { font-size: 8.5pt; color: #9ca3af; margin-left: 8px; }
    .meal-macro-pill { font-size: 8.5pt; color: #4b6978; background: #e8f4f7; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
    .meal-notes { font-size: 8.5pt; color: #5B9EAB; font-style: italic; padding: 4px 14px 5px; background: #f8fcfd; border-bottom: 1px solid #e8f3f5; }
    .empty-meal { padding: 8px 14px; font-size: 9pt; color: #9ca3af; font-style: italic; }

    /* ── Food table ── */
    table { width: 100%; border-collapse: collapse; }
    thead { background: #fafcfd; }
    th {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      font-weight: 700;
      padding: 5px 10px 4px;
      text-align: left;
      border-bottom: 1px solid #e0eef1;
    }
    th.num { text-align: right; }
    td {
      font-size: 9.5pt;
      padding: 5px 10px;
      color: #1a2830;
      border-bottom: 1px solid #f0f6f8;
      vertical-align: middle;
    }
    td.serving { color: #4b6978; font-size: 9pt; }
    td.num { text-align: right; }
    td.pro { color: #0e7490; }
    td.carb { color: #b45309; }
    td.fat { color: #b91c1c; }
    td.fibre { color: #6d28d9; }
    th.pro { color: #0e7490; }
    th.carb { color: #b45309; }
    th.fat { color: #b91c1c; }
    th.fibre { color: #6d28d9; }
    .food-name { font-weight: 500; }
    .food-brand { font-size: 8.5pt; color: #9ca3af; }
    tr:last-child td { border-bottom: none; }

    /* ── Totals row ── */
    .totals-row td {
      background: #eef7f9;
      border-top: 1.5px solid #b2d8e0;
      border-bottom: none !important;
      font-size: 9.5pt;
      padding: 5px 10px;
    }

    /* ── Day summary bar ── */
    .day-summary {
      display: flex;
      align-items: center;
      gap: 0;
      background: #1a2830;
      color: #fff;
      padding: 8px 14px;
    }
    .ds-item { text-align: center; padding: 0 14px; border-right: 1px solid rgba(255,255,255,0.12); }
    .ds-item:last-child { border-right: none; }
    .ds-item:first-child { padding-left: 0; }
    .ds-target { margin-left: auto; padding-left: 14px; text-align: center; border-right: none; }
    .ds-sep { width: 1px; background: rgba(255,255,255,0.15); margin: 0 4px; align-self: stretch; }
    .ds-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.5); font-weight: 700; }
    .ds-val { font-size: 12pt; font-weight: 800; color: #fff; margin-top: 1px; }
    .ds-val.kcal { color: #7AAFBE; }
    .ds-val.pro { color: #67e8f9; }
    .ds-val.carb { color: #fcd34d; }
    .ds-val.fat { color: #fca5a5; }
    .ds-val.fibre { color: #c4b5fd; }
    .ds-val.on { color: #86efac; }
    .ds-val.over { color: #fca5a5; }
    .ds-val.under { color: #fcd34d; }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #cfe4e8;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #9ca3af;
    }

    /* ── Print button (screen only) ── */
    .print-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #5B9EAB;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(91,158,171,0.45);
      z-index: 999;
      letter-spacing: -0.01em;
    }
    .print-btn:hover { background: #4d8f9b; }

    @media screen {
      body { max-width: 840px; margin: 0 auto; padding: 32px 24px 80px; background: #f9fafb; }
      .day-section, .client-strip { box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    }
    @media print {
      body { background: #fff !important; }
      .print-btn { display: none !important; }
      .day-section { page-break-inside: avoid; }
      * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF / Print</button>

  <div class="doc-header">
    <div>
      <div class="doc-title">Meal Plan</div>
      <div class="doc-subtitle">Propel</div>
    </div>
    <div class="doc-meta">
      <div><strong>${clientName}</strong></div>
      <div>${planName}</div>
      <div>Generated ${dateStr}</div>
    </div>
  </div>

  <div class="client-strip">
    <div class="cs-item">
      <div class="cs-label">Client</div>
      <div class="cs-value">${clientName}</div>
    </div>
    <div class="cs-item">
      <div class="cs-label">Plan</div>
      <div class="cs-value">${planName}</div>
    </div>
    <div class="cs-item">
      <div class="cs-label">Calorie Target</div>
      <div class="cs-value">${plan.caloriesTarget.toLocaleString()} kcal</div>
    </div>
    <div class="cs-item">
      <div class="cs-label">Protein Target</div>
      <div class="cs-value">${plan.proteinTarget}g</div>
    </div>
    <div class="cs-item">
      <div class="cs-label">Duration</div>
      <div class="cs-value">${plan.days.length} days</div>
    </div>
  </div>

  ${planNotesHtml}

  ${daysHtml}

  <div class="doc-footer">
    <span>Propel &nbsp;·&nbsp; propelcoaches.com</span>
    <span>${planName} &nbsp;·&nbsp; ${dateStr}</span>
  </div>
</body>
</html>`
}

function exportPDF(plan: NutritionPlan): void {
  const html = generatePrintHTML(plan)
  const win = window.open('', '_blank', 'width=900,height=800')
  if (!win) {
    toast.error('Pop-ups are blocked. Please allow pop-ups for this site and try again.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  // BUG FIX: added win.closed guard inside the timeout — if the browser closes
  // the popup before 400ms elapses (e.g. a popup-blocker extension intervenes
  // after the initial open) win.print() would throw "Cannot read properties of null".
  win.addEventListener('load', () => {
    setTimeout(() => { if (win && !win.closed) win.print() }, 400)
  })
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_TAGS = ['high protein', 'low carb', 'pre-workout', 'post-workout', 'meal prep', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'salicylate-free']

const MEAL_PRESETS = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack', 'Pre-Workout', 'Post-Workout', 'Custom']

const STANDARD_MEALS = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner']

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


// ── MacroBar ──────────────────────────────────────────────────────────────────

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
  const over = value > target
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-cb-muted">{label}</span>
        <span className={clsx('text-xs font-medium', over ? 'text-cb-danger' : 'text-cb-secondary')}>{value} / {target}</span>
      </div>
      <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color, over && 'opacity-60')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── FoodSearchModal ───────────────────────────────────────────────────────────

const FOOD_DB: SearchResult[] = [
  { name: 'Chicken Breast', cal100: 165, pro100: 31, carb100: 0, fat100: 3.6, fibre100: 0, sodium100: 74 },
  { name: 'Salmon', cal100: 208, pro100: 20, carb100: 0, fat100: 13, fibre100: 0, sodium100: 59 },
  { name: 'Rolled Oats', cal100: 389, pro100: 17, carb100: 66, fat100: 7, fibre100: 10.6, sodium100: 6 },
  { name: 'White Rice (cooked)', cal100: 130, pro100: 2.7, carb100: 28, fat100: 0.3, fibre100: 0.4, sodium100: 1 },
  { name: 'Brown Rice (cooked)', cal100: 123, pro100: 2.7, carb100: 26, fat100: 1, fibre100: 1.8, sodium100: 4 },
  { name: 'Sweet Potato', cal100: 86, pro100: 1.6, carb100: 20, fat100: 0.1, fibre100: 3, sodium100: 55 },
  { name: 'Broccoli', cal100: 34, pro100: 2.8, carb100: 7, fat100: 0.4, fibre100: 2.6, sodium100: 33 },
  { name: 'Spinach', cal100: 23, pro100: 2.9, carb100: 3.6, fat100: 0.4, fibre100: 2.2, sodium100: 79 },
  { name: 'Whey Protein', brand: 'Generic', cal100: 380, pro100: 75, carb100: 8, fat100: 6, fibre100: 1, sodium100: 80 },
  { name: 'Greek Yogurt (0%)', cal100: 59, pro100: 10, carb100: 3.6, fat100: 0.4, fibre100: 0, sodium100: 36 },
  { name: 'Eggs', cal100: 155, pro100: 13, carb100: 1.1, fat100: 11, fibre100: 0, sodium100: 124 },
  { name: 'Almonds', cal100: 579, pro100: 21, carb100: 22, fat100: 50, fibre100: 12.5, sodium100: 1 },
  { name: 'Olive Oil', cal100: 884, pro100: 0, carb100: 0, fat100: 100, fibre100: 0, sodium100: 2 },
  { name: 'Blueberries', cal100: 57, pro100: 0.7, carb100: 14.5, fat100: 0.3, fibre100: 2.4, sodium100: 1 },
  { name: 'Banana', cal100: 89, pro100: 1.1, carb100: 23, fat100: 0.3, fibre100: 2.6, sodium100: 1 },
  { name: 'Turkey Breast', cal100: 135, pro100: 29, carb100: 0, fat100: 1, fibre100: 0, sodium100: 70 },
  { name: 'Tuna (canned)', cal100: 116, pro100: 26, carb100: 0, fat100: 1, fibre100: 0, sodium100: 364 },
  { name: 'Cottage Cheese', cal100: 98, pro100: 11, carb100: 3.4, fat100: 4.3, fibre100: 0, sodium100: 364 },
  { name: 'Avocado', cal100: 160, pro100: 2, carb100: 9, fat100: 15, fibre100: 6.7, sodium100: 7 },
  { name: 'Quinoa (cooked)', cal100: 120, pro100: 4.4, carb100: 22, fat100: 1.9, fibre100: 2.8, sodium100: 7 },
]

function FoodSearchModal({ onClose, onAdd }: { onClose: () => void; onAdd: (food: FoodItem) => void }) {
  const [tab, setTab] = useState<'search' | 'custom'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>(FOOD_DB.slice(0, 8))
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState<Unit>('g')
  const [customName, setCustomName] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [customPro, setCustomPro] = useState('')
  const [customCarb, setCustomCarb] = useState('')
  const [customFat, setCustomFat] = useState('')
  const [customFibre, setCustomFibre] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setResults(FOOD_DB.slice(0, 8))
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.foods ?? [])
        } else {
          const q = query.toLowerCase()
          setResults(FOOD_DB.filter(f => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)))
        }
      } catch {
        const q = query.toLowerCase()
        setResults(FOOD_DB.filter(f => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)))
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const preview = selected ? calcFoodMacros({ id: '', name: '', quantity, unit, cal100: selected.cal100, pro100: selected.pro100, carb100: selected.carb100, fat100: selected.fat100, fibre100: selected.fibre100, sodium100: selected.sodium100 }) : null

  function handleAdd() {
    if (!selected) return
    onAdd({ id: genId(), name: selected.name, brand: selected.brand, quantity, unit, cal100: selected.cal100, pro100: selected.pro100, carb100: selected.carb100, fat100: selected.fat100, fibre100: selected.fibre100, sodium100: selected.sodium100 })
    onClose()
  }

  function handleAddCustom() {
    if (!customName.trim()) return
    onAdd({ id: genId(), name: customName.trim(), quantity, unit, cal100: parseFloat(customCal) || 0, pro100: parseFloat(customPro) || 0, carb100: parseFloat(customCarb) || 0, fat100: parseFloat(customFat) || 0, fibre100: parseFloat(customFibre) || 0, sodium100: 0 })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cb-border">
          <h2 className="text-base font-semibold text-cb-text flex items-center gap-2"><Search size={16} className="text-brand" /> Add Food</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={18} /></button>
        </div>

        <div className="flex border-b border-cb-border">
          {(['search', 'custom'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={clsx('flex-1 py-2.5 text-sm font-medium transition-colors', tab === t ? 'text-brand border-b-2 border-brand' : 'text-cb-muted hover:text-cb-secondary')}>
              {t === 'search' ? 'Search Library' : 'Custom Food'}
            </button>
          ))}
        </div>

        {tab === 'search' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
                <input autoFocus className="w-full bg-surface-light border border-cb-border rounded-lg pl-9 pr-3 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search foods…" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1">
              {loading && (
                <div className="flex items-center justify-center py-8 gap-2">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-cb-muted">Searching…</span>
                </div>
              )}
              {!loading && results.map((r, i) => (
                <button key={r.id ?? `${r.name}-${i}`} onClick={() => setSelected(r)} className={clsx('w-full text-left p-2.5 rounded-lg border transition-colors', selected?.name === r.name ? 'bg-brand/10 border-brand/40' : 'bg-surface-light border-transparent hover:border-cb-border')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-cb-text">{r.name}</span>
                      {r.brand && <span className="ml-2 text-xs text-cb-muted">{r.brand}</span>}
                    </div>
                    <span className="text-xs text-cb-muted">per 100g</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="font-semibold text-cb-secondary">{r.cal100} kcal</span>
                    <span className="text-brand">P {r.pro100}g</span>
                    <span className="text-amber-500">C {r.carb100}g</span>
                    <span className="text-red-400">F {r.fat100}g</span>
                  </div>
                </button>
              ))}
              {!loading && results.length === 0 && <p className="text-sm text-cb-muted text-center py-6">No foods found</p>}
            </div>

            {selected && (
              <div className="border-t border-cb-border px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-cb-muted shrink-0">Serving size</label>
                  {/* BUG FIX: min={0} only hints the stepper — typed values can still be
                      negative. onBlur clamps to 0 without disrupting the typing experience. */}
                  <input type="number" min={0} step={0.1} value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                    onBlur={e => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 bg-surface-light border border-cb-border rounded-lg px-2 py-1.5 text-sm text-cb-text focus:outline-none focus:border-brand text-center" />
                  <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className="bg-surface-light border border-cb-border rounded-lg px-2 py-1.5 text-sm text-cb-text focus:outline-none focus:border-brand">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                {preview && (
                  <div className="grid grid-cols-4 gap-2">
                    {[['Cal', `${preview.cal}`, 'text-cb-text'], ['Protein', `${preview.pro}g`, 'text-brand'], ['Carbs', `${preview.carb}g`, 'text-amber-500'], ['Fat', `${preview.fat}g`, 'text-red-400']].map(([l, v, c]) => (
                      <div key={l} className="bg-surface-light rounded-lg p-2 text-center">
                        <div className={clsx('text-sm font-semibold', c)}>{v}</div>
                        <div className="text-xs text-cb-muted">{l}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleAdd} className="w-full bg-brand text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity">Add to Meal</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <input className="w-full bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Food name *" value={customName} onChange={e => setCustomName(e.target.value)} />
            <p className="text-xs text-cb-muted">Values per 100g</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Calories', customCal, setCustomCal], ['Protein (g)', customPro, setCustomPro], ['Carbs (g)', customCarb, setCustomCarb], ['Fat (g)', customFat, setCustomFat], ['Fibre (g)', customFibre, setCustomFibre]].map(([label, val, setter]) => (
                <div key={label as string}>
                  <label className="text-xs text-cb-muted">{label as string}</label>
                  <input type="number" min={0} step={0.1} value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} className="w-full mt-1 bg-surface-light border border-cb-border rounded-lg px-2 py-1.5 text-sm text-cb-text focus:outline-none focus:border-brand" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" min={0} step={0.1} value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} className="w-20 bg-surface-light border border-cb-border rounded-lg px-2 py-1.5 text-sm text-cb-text focus:outline-none focus:border-brand text-center" />
              <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className="bg-surface-light border border-cb-border rounded-lg px-2 py-1.5 text-sm text-cb-text focus:outline-none focus:border-brand">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={handleAddCustom} disabled={!customName.trim()} className="w-full bg-brand text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">Add to Meal</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── NewPlanModal ──────────────────────────────────────────────────────────────

function NewPlanModal({ onClose, onAdd, clients }: { onClose: () => void; onAdd: (plan: NutritionPlan) => void; clients: { id: string; name: string }[] }) {
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [numDays, setNumDays] = useState(7)
  const [cal, setCal] = useState('')
  const [pro, setPro] = useState('')
  const [carb, setCarb] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')

  function handleCreate() {
    if (!name.trim()) return
    const client = clients.find(c => c.id === clientId) ?? null
    const days: DayPlan[] = Array.from({ length: numDays }, (_, i) => ({
      id: genId(), dayNumber: i + 1, dayName: DAY_NAMES[i] ?? `Day ${i + 1}`, meals: [],
    }))
    onAdd({
      id: genId(), name: name.trim(), clientId: client?.id ?? null, clientName: client?.name ?? null,
      status: 'draft', caloriesTarget: parseInt(cal) || 2000, proteinTarget: parseInt(pro) || 150,
      carbsTarget: parseInt(carb) || 200, fatTarget: parseInt(fat) || 65, fibreTarget: 30,
      days, notes, createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cb-border">
          <h2 className="text-base font-semibold text-cb-text">New Nutrition Plan</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs text-cb-muted">Plan Name *</label>
            <input autoFocus className="mt-1 w-full bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="e.g. Lean Bulk Phase 1" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-cb-muted">Client</label>
            <select className="mt-1 w-full bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">— No client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-cb-muted">Days in Plan</label>
            <input type="number" min={1} max={7} className="mt-1 w-full bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand" value={numDays} onChange={e => setNumDays(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['Calories Target', cal, setCal], ['Protein Target (g)', pro, setPro], ['Carbs Target (g)', carb, setCarb], ['Fat Target (g)', fat, setFat]].map(([label, val, setter]) => (
              <div key={label as string}>
                <label className="text-xs text-cb-muted">{label as string}</label>
                <input type="number" min={0} className="mt-1 w-full bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-cb-muted">Notes</label>
            <textarea rows={2} className="mt-1 w-full bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-4">
          <button onClick={onClose} className="flex-1 bg-surface-light border border-cb-border rounded-lg py-2 text-sm text-cb-secondary hover:border-cb-muted transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim()} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">Create Plan</button>
        </div>
      </div>
    </div>
  )
}

// ── MealCard ──────────────────────────────────────────────────────────────────

function MealCard({ meal, onUpdate, onDelete, onDuplicate }: { meal: Meal; onUpdate: (m: Meal) => void; onDelete: () => void; onDuplicate: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [notesOpen, setNotesOpen] = useState(!!meal.notes)
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [tagDropOpen, setTagDropOpen] = useState(false)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const macros = sumMealMacros(meal)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const q = encodeURIComponent(`${meal.name} food meal`)
    fetch(`/api/images/meal-photo?q=${q}`)
      .then(r => r.json())
      .then(d => { if (d.url) setImgUrl(d.url) })
      .catch(() => {})
  }, [meal.name])

  function updateFood(idx: number, updates: Partial<FoodItem>) {
    const foods = meal.foods.map((f, i) => i === idx ? { ...f, ...updates } : f)
    onUpdate({ ...meal, foods })
  }

  function removeFood(idx: number) {
    onUpdate({ ...meal, foods: meal.foods.filter((_, i) => i !== idx) })
  }

  function removeTag(tag: string) {
    onUpdate({ ...meal, tags: meal.tags.filter(t => t !== tag) })
  }

  function addTag(tag: string) {
    if (!meal.tags.includes(tag)) onUpdate({ ...meal, tags: [...meal.tags, tag] })
    setTagDropOpen(false)
  }

  return (
    <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
      {/* Meal image */}
      {imgUrl && (
        <div className="w-full h-36 overflow-hidden bg-surface-light">
          <img src={imgUrl} alt={meal.name} className="w-full h-full object-cover" />
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-light border-b border-cb-border">
        {editingName ? (
          <input autoFocus className="flex-1 bg-transparent text-sm font-medium text-cb-text focus:outline-none border-b border-brand" value={meal.name} onChange={e => onUpdate({ ...meal, name: e.target.value })} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === 'Enter' && setEditingName(false)} />
        ) : (
          <span className="flex-1 text-sm font-medium text-cb-text cursor-pointer hover:text-brand" onClick={() => setEditingName(true)}>{meal.name}</span>
        )}
        <div className="flex items-center gap-1.5 text-cb-muted">
          <Clock size={13} />
          <input type="time" value={meal.time} onChange={e => onUpdate({ ...meal, time: e.target.value })} className="bg-transparent text-xs text-cb-secondary focus:outline-none focus:text-cb-text" />
        </div>
        <button onClick={() => setNotesOpen(v => !v)} className={clsx('text-cb-muted hover:text-brand', notesOpen && 'text-brand')}><FileText size={14} /></button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} className="text-cb-muted hover:text-cb-secondary p-0.5"><MoreHorizontal size={16} /></button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 bg-surface border border-cb-border rounded-xl shadow-lg py-1 min-w-[150px]">
              <button onClick={() => { onDuplicate(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-cb-secondary hover:bg-surface-light"><Copy size={13} /> Duplicate meal</button>
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-cb-danger hover:bg-surface-light"><Trash2 size={13} /> Delete meal</button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {notesOpen && (
        <div className="px-3 py-2 border-b border-cb-border">
          <textarea rows={2} className="w-full bg-surface-light border border-cb-border rounded-lg px-2 py-1.5 text-xs text-cb-secondary placeholder-cb-muted focus:outline-none focus:border-brand resize-none" placeholder="Meal notes…" value={meal.notes} onChange={e => onUpdate({ ...meal, notes: e.target.value })} />
        </div>
      )}

      {/* Macro summary */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-cb-border text-xs">
        <span className="font-semibold text-cb-text">{macros.cal} kcal</span>
        <span className="text-brand">P {macros.pro}g</span>
        <span className="text-amber-500">C {macros.carb}g</span>
        <span className="text-red-400">F {macros.fat}g</span>
        <span className="text-purple-400">Fi {macros.fibre}g</span>
      </div>

      {/* Tags */}
      {(meal.tags.length > 0 || tagDropOpen) && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-cb-border">
          {meal.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-cb-danger"><X size={10} /></button>
            </span>
          ))}
          <div className="relative">
            <button onClick={() => setTagDropOpen(v => !v)} className="flex items-center gap-1 text-xs text-cb-muted hover:text-brand border border-dashed border-cb-border rounded-full px-2 py-0.5"><Tag size={10} /> tag</button>
            {tagDropOpen && (
              <div className="absolute left-0 top-6 z-20 bg-surface border border-cb-border rounded-xl shadow-lg py-1 w-44 max-h-48 overflow-y-auto">
                {PRESET_TAGS.filter(t => !meal.tags.includes(t)).map(t => (
                  <button key={t} onClick={() => addTag(t)} className="block w-full text-left px-3 py-1.5 text-xs text-cb-secondary hover:bg-surface-light">{t}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Food table */}
      {meal.foods.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cb-border text-cb-muted">
                <th className="text-left px-3 py-1.5 font-medium w-[35%]">Food</th>
                <th className="text-center px-1 py-1.5 font-medium w-[9%]">Qty</th>
                <th className="text-center px-1 py-1.5 font-medium w-[9%]">Unit</th>
                <th className="text-center px-1 py-1.5 font-medium w-[8%]">Cal</th>
                <th className="text-center px-1 py-1.5 font-medium w-[8%]">Pro</th>
                <th className="text-center px-1 py-1.5 font-medium w-[8%]">Carb</th>
                <th className="text-center px-1 py-1.5 font-medium w-[8%]">Fat</th>
                <th className="text-center px-1 py-1.5 font-medium w-[8%]">Fibre</th>
                <th className="w-[7%]" />
              </tr>
            </thead>
            <tbody>
              {meal.foods.map((food, idx) => {
                const fm = calcFoodMacros(food)
                return (
                  <tr key={food.id} className="border-b border-cb-border/50 hover:bg-surface-light/50">
                    <td className="px-3 py-1">
                      <input className="w-full bg-transparent text-cb-text focus:outline-none focus:border-b focus:border-brand" value={food.name} onChange={e => updateFood(idx, { name: e.target.value })} />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" min={0} step={0.1} className="w-full text-center bg-surface-light border border-transparent rounded focus:outline-none focus:border-brand px-1 py-0.5 text-cb-text" value={food.quantity} onChange={e => updateFood(idx, { quantity: parseFloat(e.target.value) || 0 })} />
                    </td>
                    <td className="px-1 py-1">
                      <select className="w-full text-center bg-surface-light border border-transparent rounded focus:outline-none focus:border-brand py-0.5 text-cb-text" value={food.unit} onChange={e => updateFood(idx, { unit: e.target.value as Unit })}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="text-center px-1 py-1 text-cb-secondary">{fm.cal}</td>
                    <td className="text-center px-1 py-1 text-brand">{fm.pro}</td>
                    <td className="text-center px-1 py-1 text-amber-500">{fm.carb}</td>
                    <td className="text-center px-1 py-1 text-red-400">{fm.fat}</td>
                    <td className="text-center px-1 py-1 text-purple-400">{fm.fibre}</td>
                    <td className="text-center px-1 py-1">
                      <button onClick={() => removeFood(idx)} className="text-cb-muted hover:text-cb-danger"><X size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add food */}
      <div className="px-3 py-2">
        <button onClick={() => setAddFoodOpen(true)} className="flex items-center gap-1.5 text-xs text-cb-muted hover:text-brand transition-colors">
          <Plus size={13} /> Add Food from Library
        </button>
      </div>

      {addFoodOpen && <FoodSearchModal onClose={() => setAddFoodOpen(false)} onAdd={food => { onUpdate({ ...meal, foods: [...meal.foods, food] }); setAddFoodOpen(false) }} />}
    </div>
  )
}

// ── WeekGridView ──────────────────────────────────────────────────────────────

function WeekGridView({ plan, onSelectDay }: { plan: NutritionPlan; onSelectDay: (dayIdx: number) => void }) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="min-w-[900px]">
        {/* Column headers: day names */}
        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
          <div />
          {plan.days.map((d, dayIdx) => {
            const dm = sumDayMacros(d)
            return (
              <button key={d.id} onClick={() => onSelectDay(dayIdx)} className="text-center pb-2 border-b-2 border-cb-border hover:border-brand/50 group transition-colors">
                <div className="text-xs font-semibold text-cb-text group-hover:text-brand transition-colors">{d.dayName.slice(0, 3)}</div>
                <div className="text-xs text-cb-muted mt-0.5">{dm.cal > 0 ? `${dm.cal} kcal` : '—'}</div>
              </button>
            )
          })}
        </div>

        {/* Meal-type rows */}
        {STANDARD_MEALS.map(mealType => (
          <div key={mealType} className="grid gap-2 mb-2 items-start" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
            {/* Row label */}
            <div className="pt-3 pr-2">
              <span className="text-xs font-medium text-cb-secondary">{mealType}</span>
            </div>

            {/* One cell per day */}
            {plan.days.map((day, dayIdx) => {
              const meal = day.meals.find(m =>
                m.name === mealType ||
                m.name.toLowerCase().startsWith(mealType.toLowerCase().split(' ')[0])
              )
              const mm = meal ? sumMealMacros(meal) : null
              return (
                <button
                  key={day.id}
                  onClick={() => onSelectDay(dayIdx)}
                  className={clsx(
                    'min-h-[88px] rounded-xl border p-2.5 text-left w-full transition-colors group',
                    meal
                      ? 'bg-surface border-cb-border hover:border-brand/40'
                      : 'bg-surface-light/60 border-dashed border-cb-border hover:border-brand/40 hover:bg-brand/5'
                  )}
                >
                  {meal ? (
                    <div className="flex flex-col h-full gap-1">
                      <div className="text-xs font-semibold text-cb-text">{mm!.cal} kcal</div>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {meal.foods.slice(0, 3).map(f => (
                          <div key={f.id} className="text-[11px] text-cb-muted truncate leading-tight">{f.name}</div>
                        ))}
                        {meal.foods.length > 3 && (
                          <div className="text-[11px] text-cb-muted">+{meal.foods.length - 3} more</div>
                        )}
                        {meal.foods.length === 0 && (
                          <div className="text-[11px] text-cb-muted italic">No foods yet</div>
                        )}
                      </div>
                      <div className="flex gap-1.5 pt-1.5 border-t border-cb-border/40">
                        <span className="text-[10px] font-semibold text-brand">P{mm!.pro}</span>
                        <span className="text-[10px] font-semibold text-amber-500">C{mm!.carb}</span>
                        <span className="text-[10px] font-semibold text-red-400">F{mm!.fat}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[60px]">
                      <span className="text-xs text-cb-muted group-hover:text-brand transition-colors">+ Edit day</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SyncMacrosModal ───────────────────────────────────────────────────────────

type SyncMacrosData = {
  program: { id: string; name: string; goal: string; goal_label: string; days_per_week: number; duration_weeks: number }
  current: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }
  recommended: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }
  delta: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
  body_weight_kg: number
  sync_notes: string | null
}

function SyncMacrosModal({ data, planId, onClose, onApplied }: {
  data: SyncMacrosData
  planId: string
  onClose: () => void
  onApplied: (updated: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }) => void
}) {
  const [applying, setApplying] = useState(false)

  async function handleApply() {
    setApplying(true)
    try {
      const res = await fetch('/api/nutrition/sync-macros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutrition_plan_id: planId,
          program_id: data.program.id,
          calories:   data.recommended.calories,
          protein_g:  data.recommended.protein_g,
          carbs_g:    data.recommended.carbs_g,
          fat_g:      data.recommended.fat_g,
          fibre_g:    data.recommended.fibre_g,
          sync_notes: data.sync_notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to apply')
      onApplied(data.recommended)
    } catch {
      // silent — parent handles feedback
    } finally {
      setApplying(false)
    }
  }

  function deltaLabel(val: number, unit = '') {
    if (val === 0) return <span className="text-cb-muted text-xs">no change</span>
    return (
      <span className={clsx('text-xs font-semibold', val > 0 ? 'text-cb-success' : 'text-red-500')}>
        {val > 0 ? '+' : ''}{val}{unit}
      </span>
    )
  }

  const rows: Array<{ label: string; current: number; recommended: number; delta: number; unit: string; color: string }> = [
    { label: 'Calories',  current: data.current.calories,  recommended: data.recommended.calories,  delta: data.delta.calories,  unit: ' kcal', color: 'bg-brand' },
    { label: 'Protein',   current: data.current.protein_g, recommended: data.recommended.protein_g, delta: data.delta.protein_g, unit: 'g',     color: 'bg-teal-400' },
    { label: 'Carbs',     current: data.current.carbs_g,   recommended: data.recommended.carbs_g,   delta: data.delta.carbs_g,   unit: 'g',     color: 'bg-amber-400' },
    { label: 'Fat',       current: data.current.fat_g,     recommended: data.recommended.fat_g,     delta: data.delta.fat_g,     unit: 'g',     color: 'bg-red-400' },
    { label: 'Fibre',     current: data.current.fibre_g,   recommended: data.recommended.fibre_g,   delta: 0,                    unit: 'g',     color: 'bg-purple-400' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-cb-border rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-cb-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Zap size={16} className="text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cb-text">Sync Macros to Training</p>
              <p className="text-xs text-cb-muted">{data.program.goal_label} · {data.program.days_per_week}d/wk · {data.program.duration_weeks}wk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-cb-muted hover:text-cb-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Macro comparison table */}
        <div className="px-5 py-4 space-y-2.5">
          <div className="grid grid-cols-4 gap-2 mb-1">
            <span className="text-[11px] font-semibold text-cb-muted uppercase tracking-wide col-span-1">Macro</span>
            <span className="text-[11px] font-semibold text-cb-muted uppercase tracking-wide text-right">Current</span>
            <span className="text-[11px] font-semibold text-cb-muted uppercase tracking-wide text-right">Recommended</span>
            <span className="text-[11px] font-semibold text-cb-muted uppercase tracking-wide text-right">Change</span>
          </div>
          {rows.map(row => (
            <div key={row.label} className="grid grid-cols-4 gap-2 items-center py-1.5 border-b border-cb-border/50 last:border-0">
              <div className="flex items-center gap-1.5 col-span-1">
                <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', row.color)} />
                <span className="text-xs text-cb-secondary">{row.label}</span>
              </div>
              <span className="text-xs text-cb-secondary text-right">{row.current}{row.unit}</span>
              <span className="text-xs font-semibold text-cb-text text-right">{row.recommended}{row.unit}</span>
              <div className="text-right">{deltaLabel(row.delta, row.label === 'Calories' ? '' : 'g')}</div>
            </div>
          ))}
        </div>

        {/* AI insight */}
        {data.sync_notes && (
          <div className="mx-5 mb-4 bg-brand/5 border border-brand/20 rounded-xl p-3 flex gap-2.5">
            <Sparkles size={14} className="text-brand flex-shrink-0 mt-0.5" />
            <p className="text-xs text-cb-secondary leading-relaxed">{data.sync_notes}</p>
          </div>
        )}

        {/* Body weight note */}
        <p className="text-center text-xs text-cb-muted px-5 mb-4">
          Based on {data.body_weight_kg} kg bodyweight · Evidence-based ISSN guidelines
        </p>

        {/* Actions */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 border border-cb-border text-cb-secondary text-sm py-2 rounded-xl hover:bg-surface-light transition-colors">
            Keep Current
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex-1 flex items-center justify-center gap-2 bg-brand text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {applying ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Applying…</>
            ) : (
              <><ArrowRight size={14} /> Apply Recommendation</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PlanBuilder ───────────────────────────────────────────────────────────────

function PlanBuilder({ plan, onBack, onChange, onSave, clients }: {
  plan: NutritionPlan
  onBack: () => void
  onChange: (p: NutritionPlan) => void
  onSave?: (p: NutritionPlan) => Promise<void>
  clients: { id: string; name: string }[]
}) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [activeDay, setActiveDay] = useState(0)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  const [addingMeal, setAddingMeal] = useState(false)
  const [newMealName, setNewMealName] = useState('Breakfast')
  const [newMealTime, setNewMealTime] = useState('08:00')
  const [editingPlanName, setEditingPlanName] = useState(false)
  const [syncData, setSyncData] = useState<SyncMacrosData | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)

  const day = plan.days[activeDay]
  const dayMacros = day ? sumDayMacros(day) : { cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0, sodium: 0 }

  // Weekly aggregates for week-grid sidebar
  const weekTotals = plan.days.reduce(
    (acc, d) => { const dm = sumDayMacros(d); return { cal: acc.cal + dm.cal, pro: +(acc.pro + dm.pro).toFixed(1), carb: +(acc.carb + dm.carb).toFixed(1), fat: +(acc.fat + dm.fat).toFixed(1), fibre: +(acc.fibre + dm.fibre).toFixed(1), sodium: acc.sodium + dm.sodium } },
    { cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0, sodium: 0 }
  )
  const n = plan.days.length || 1
  const weekAvg = { cal: Math.round(weekTotals.cal / n), pro: +(weekTotals.pro / n).toFixed(1), carb: +(weekTotals.carb / n).toFixed(1), fat: +(weekTotals.fat / n).toFixed(1), fibre: +(weekTotals.fibre / n).toFixed(1), sodium: Math.round(weekTotals.sodium / n) }

  function updateDay(updated: DayPlan) {
    onChange({ ...plan, days: plan.days.map((d, i) => i === activeDay ? updated : d) })
  }

  function updateMeal(mealIdx: number, updated: Meal) {
    if (!day) return
    updateDay({ ...day, meals: day.meals.map((m, i) => i === mealIdx ? updated : m) })
  }

  function deleteMeal(mealIdx: number) {
    if (!day) return
    updateDay({ ...day, meals: day.meals.filter((_, i) => i !== mealIdx) })
  }

  function duplicateMeal(mealIdx: number) {
    if (!day) return
    const orig = day.meals[mealIdx]
    if (!orig) return
    const copy: Meal = { ...orig, id: genId(), name: `${orig.name} (copy)`, foods: orig.foods.map(f => ({ ...f, id: genId() })) }
    const meals = [...day.meals]
    meals.splice(mealIdx + 1, 0, copy)
    updateDay({ ...day, meals })
  }

  function addMeal() {
    if (!day) return
    const label = newMealName === 'Custom' ? 'Custom Meal' : newMealName
    const meal: Meal = { id: genId(), name: label, time: newMealTime, notes: '', tags: [], foods: [] }
    updateDay({ ...day, meals: [...day.meals, meal] })
    setAddingMeal(false)
    setNewMealName('Breakfast')
    setNewMealTime('08:00')
  }

  async function handleSaveDraft() {
    const draft: NutritionPlan = { ...plan, status: 'draft' }
    onChange(draft)
    setSaving(true)
    try { await onSave?.(draft) } finally { setSaving(false) }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePublish() {
    const next = plan.status === 'published' ? 'draft' : 'published'
    const updated: NutritionPlan = {
      ...plan,
      status: next as 'draft' | 'published',
      ...(next === 'published' ? { publishedAt: new Date().toISOString() } : {}),
    }
    onChange(updated)
    setSaving(true)
    try { await onSave?.(updated) } finally { setSaving(false) }
    if (next === 'published') { setJustPublished(true); setTimeout(() => setJustPublished(false), 2500) }
  }

  async function handleSyncCheck() {
    if (!plan.clientId) return
    setSyncLoading(true)
    try {
      const res = await fetch('/api/nutrition/sync-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutrition_plan_id: plan.id, client_id: plan.clientId }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Could not load training sync data')
        return
      }
      const data: SyncMacrosData = await res.json()
      setSyncData(data)
    } catch {
      toast.error('Failed to check training sync')
    } finally {
      setSyncLoading(false)
    }
  }

  function handleSyncApplied(updated: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number }) {
    const next: NutritionPlan = {
      ...plan,
      caloriesTarget: updated.calories,
      proteinTarget:  updated.protein_g,
      carbsTarget:    updated.carbs_g,
      fatTarget:      updated.fat_g,
      fibreTarget:    updated.fibre_g,
    }
    onChange(next)
    onSave?.(next)
    setSyncData(null)
    toast.success('Macros synced to training goal')
  }

  function handleSelectDay(dayIdx: number) {
    setActiveDay(dayIdx)
    setViewMode('day')
  }

  const topBarH = 'top-[57px]'
  const sidebarH = 'max-h-[calc(100vh-57px)]'

  return (
    <div className="flex flex-col h-full min-h-screen">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2.5 px-5 py-2.5 border-b border-cb-border bg-surface sticky top-0 z-10 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 text-cb-muted hover:text-cb-text text-sm shrink-0">
          <ChevronLeft size={16} /> Plans
        </button>

        {/* Plan name */}
        <div className="flex-1 min-w-[140px]">
          {editingPlanName ? (
            <input autoFocus className="w-full text-base font-semibold text-cb-text bg-transparent border-b border-brand focus:outline-none" value={plan.name} onChange={e => onChange({ ...plan, name: e.target.value })} onBlur={() => setEditingPlanName(false)} onKeyDown={e => e.key === 'Enter' && setEditingPlanName(false)} />
          ) : (
            <button className="text-base font-semibold text-cb-text hover:text-brand truncate max-w-xs text-left" onClick={() => setEditingPlanName(true)}>
              {plan.name}
            </button>
          )}
        </div>

        {/* Client selector */}
        <select
          value={plan.clientId ?? ''}
          onChange={e => {
            const client = clients.find(c => c.id === e.target.value) ?? null
            onChange({ ...plan, clientId: client?.id ?? null, clientName: client?.name ?? null })
          }}
          className="bg-surface-light border border-cb-border rounded-lg px-2.5 py-1.5 text-sm text-cb-text focus:outline-none focus:border-brand shrink-0"
        >
          <option value="">— No client —</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex bg-surface-light border border-cb-border rounded-lg p-0.5 shrink-0">
          {(['day', 'week'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)} className={clsx('px-3 py-1 rounded text-xs font-medium transition-colors capitalize', viewMode === v ? 'bg-surface text-cb-text shadow-sm' : 'text-cb-muted hover:text-cb-secondary')}>
              {v === 'day' ? 'Day View' : 'Week Grid'}
            </button>
          ))}
        </div>

        <button onClick={() => exportPDF(plan)} className="flex items-center gap-1.5 text-sm text-cb-secondary hover:text-cb-text border border-cb-border rounded-lg px-3 py-1.5 shrink-0 transition-colors" title="Export PDF">
          <Printer size={14} /> Export PDF
        </button>

        {/* Sync to Training Goal */}
        {plan.clientId && (
          <button
            onClick={handleSyncCheck}
            disabled={syncLoading}
            className="flex items-center gap-1.5 text-sm text-brand border border-brand/30 bg-brand/5 hover:bg-brand/10 rounded-lg px-3 py-1.5 shrink-0 transition-colors disabled:opacity-60"
            title="Sync macros to client's active training program"
          >
            {syncLoading
              ? <><div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Checking…</>
              : <><RefreshCw size={13} /> Sync to Training</>
            }
          </button>
        )}

        {/* Save Draft */}
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className={clsx('flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors shrink-0 disabled:opacity-60', saved ? 'border-cb-success/40 text-cb-success bg-cb-success/5' : 'border-cb-border text-cb-secondary hover:border-cb-muted')}
        >
          {saving
            ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving…</>
            : saved
              ? <><CheckCircle size={14} /> Saved</>
              : <><Save size={14} /> Save Draft</>
          }
        </button>

        {/* Publish to Client */}
        <button
          onClick={handlePublish}
          className={clsx('flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0', plan.status === 'published' ? 'bg-cb-success/10 text-cb-success border border-cb-success/30 hover:bg-cb-success/20' : 'bg-brand text-white hover:opacity-90')}
        >
          <CheckCircle size={14} />
          {justPublished ? 'Published!' : plan.status === 'published' ? 'Published' : 'Publish to Client'}
        </button>
      </div>

      {/* ── Progress stepper ── */}
      <div className="flex items-center justify-center gap-0 px-5 py-2.5 bg-surface-light border-b border-cb-border shrink-0">
        {[
          { step: 1, label: 'Plan Details',  done: true },
          { step: 2, label: 'Add Meals',     done: false, active: true },
          { step: 3, label: 'Publish',       done: plan.status === 'published' },
        ].map((s, i, arr) => (
          <div key={s.step} className="flex items-center gap-0">
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
              s.active ? 'bg-brand/10 text-brand' : s.done ? 'text-brand' : 'text-cb-muted'
            )}>
              <div className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                s.done ? 'bg-brand text-white' : s.active ? 'border-2 border-brand text-brand' : 'border-2 border-cb-border text-cb-muted'
              )}>
                {s.done ? '✓' : s.step}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={clsx('w-8 h-px mx-1', s.done ? 'bg-brand' : 'bg-cb-border')} />
            )}
          </div>
        ))}
      </div>

      {/* ── Week Grid view ── */}
      {viewMode === 'week' && (
        <div className="flex flex-1 min-h-0">
          <WeekGridView plan={plan} onSelectDay={handleSelectDay} />

          {/* Weekly summary sidebar */}
          <aside className={clsx('w-60 shrink-0 border-l border-cb-border bg-surface-light overflow-y-auto sticky', topBarH, sidebarH)}>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-3">Avg / Day vs Target</p>
                <div className="space-y-2.5">
                  <MacroBar label="Calories" value={weekAvg.cal} target={plan.caloriesTarget} color="bg-brand" />
                  <MacroBar label="Protein (g)" value={weekAvg.pro} target={plan.proteinTarget} color="bg-cb-success" />
                  <MacroBar label="Carbs (g)" value={weekAvg.carb} target={plan.carbsTarget} color="bg-amber-400" />
                  <MacroBar label="Fat (g)" value={weekAvg.fat} target={plan.fatTarget} color="bg-red-400" />
                  <MacroBar label="Fibre (g)" value={weekAvg.fibre} target={plan.fibreTarget} color="bg-purple-400" />
                </div>
              </div>

              <div className="border-t border-cb-border pt-3 space-y-1.5">
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Weekly Totals</p>
                {([['Calories', `${weekTotals.cal.toLocaleString()} kcal`], ['Protein', `${weekTotals.pro}g`], ['Carbs', `${weekTotals.carb}g`], ['Fat', `${weekTotals.fat}g`], ['Sodium', `${weekTotals.sodium.toLocaleString()}mg`]] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-cb-muted">{l}</span>
                    <span className="text-cb-secondary font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-cb-border pt-3">
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Plan Details</p>
                <div className="space-y-1.5 text-xs">
                  {([['Client', plan.clientName ?? '—'], ['Status', plan.status === 'published' ? 'Published' : 'Draft'], ['Days', String(plan.days.length)]] as [string, string][]).map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-cb-muted">{l}</span>
                      <span className={l === 'Status' ? (plan.status === 'published' ? 'text-cb-success' : 'text-cb-warning') : 'text-cb-secondary'}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-cb-border pt-3">
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Click a day to edit</p>
                <div className="space-y-1">
                  {plan.days.map((d, i) => {
                    const dm = sumDayMacros(d)
                    return (
                      <button key={d.id} onClick={() => handleSelectDay(i)} className="w-full flex justify-between items-center text-xs py-1 px-2 rounded-lg hover:bg-surface transition-colors">
                        <span className="text-cb-secondary">{d.dayName.slice(0, 3)}</span>
                        <span className="text-cb-muted">{dm.cal > 0 ? `${dm.cal} kcal` : '—'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Day view ── */}
      {viewMode === 'day' && (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">

            {/* Day tabs */}
            <div className="flex border-b border-cb-border bg-surface-light overflow-x-auto shrink-0">
              {plan.days.map((d, i) => {
                const dm = sumDayMacros(d)
                return (
                  <button key={d.id} onClick={() => setActiveDay(i)} className={clsx('flex flex-col items-center px-4 py-2.5 min-w-[76px] border-b-2 transition-colors shrink-0', i === activeDay ? 'border-brand text-brand' : 'border-transparent text-cb-muted hover:text-cb-secondary')}>
                    <span className="text-xs font-medium">{d.dayName.slice(0, 3)}</span>
                    <span className="text-xs mt-0.5 opacity-70">{dm.cal > 0 ? `${dm.cal}` : '—'}</span>
                  </button>
                )
              })}
            </div>

            {/* Meals */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {day?.meals.map((meal, idx) => (
                <MealCard key={meal.id} meal={meal} onUpdate={m => updateMeal(idx, m)} onDelete={() => deleteMeal(idx)} onDuplicate={() => duplicateMeal(idx)} />
              ))}

              {addingMeal ? (
                <div className="bg-surface border border-brand/30 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-cb-text">Add Meal</p>
                  <div className="flex gap-2">
                    <select value={newMealName} onChange={e => setNewMealName(e.target.value)} className="flex-1 bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand">
                      {MEAL_PRESETS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input type="time" value={newMealTime} onChange={e => setNewMealTime(e.target.value)} className="bg-surface-light border border-cb-border rounded-lg px-3 py-2 text-sm text-cb-text focus:outline-none focus:border-brand" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAddingMeal(false)} className="flex-1 bg-surface-light border border-cb-border rounded-lg py-2 text-sm text-cb-secondary hover:border-cb-muted">Cancel</button>
                    <button onClick={addMeal} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium hover:opacity-90">Confirm</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingMeal(true)} className="flex items-center gap-2 w-full py-3 border border-dashed border-cb-border rounded-xl text-cb-muted hover:text-brand hover:border-brand/40 text-sm transition-colors justify-center">
                  <Plus size={15} /> Add Meal
                </button>
              )}
            </div>
          </div>

          {/* Day sidebar */}
          <aside className={clsx('w-64 shrink-0 border-l border-cb-border bg-surface-light overflow-y-auto sticky', topBarH, sidebarH)}>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-0.5">{day?.dayName ?? '—'}</p>
                <p className="text-xs text-cb-muted mb-3">Daily totals vs targets</p>
                <div className="space-y-2.5">
                  <MacroBar label="Calories" value={dayMacros.cal} target={plan.caloriesTarget} color="bg-brand" />
                  <MacroBar label="Protein (g)" value={dayMacros.pro} target={plan.proteinTarget} color="bg-cb-success" />
                  <MacroBar label="Carbs (g)" value={dayMacros.carb} target={plan.carbsTarget} color="bg-amber-400" />
                  <MacroBar label="Fat (g)" value={dayMacros.fat} target={plan.fatTarget} color="bg-red-400" />
                  <MacroBar label="Fibre (g)" value={dayMacros.fibre} target={plan.fibreTarget} color="bg-purple-400" />
                </div>
              </div>

              <div className="border-t border-cb-border pt-3">
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Micronutrients</p>
                <div className="flex justify-between text-xs">
                  <span className="text-cb-muted">Sodium</span>
                  <span className="text-cb-secondary">{dayMacros.sodium}mg</span>
                </div>
              </div>

              {day && day.meals.length > 0 && (
                <div className="border-t border-cb-border pt-3">
                  <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Meal Breakdown</p>
                  <div className="space-y-1.5">
                    {day.meals.map(m => {
                      const mm = sumMealMacros(m)
                      return (
                        <div key={m.id} className="flex justify-between items-center text-xs">
                          <span className="text-cb-secondary truncate">{m.name}</span>
                          <span className="text-cb-muted shrink-0 ml-2">{mm.cal} kcal</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-cb-border pt-3">
                <p className="text-xs font-semibold text-cb-muted uppercase tracking-wide mb-2">Targets</p>
                <div className="space-y-1 text-xs">
                  {([['Calories', `${plan.caloriesTarget} kcal`], ['Protein', `${plan.proteinTarget}g`], ['Carbs', `${plan.carbsTarget}g`], ['Fat', `${plan.fatTarget}g`], ['Fibre', `${plan.fibreTarget}g`]] as [string, string][]).map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-cb-muted">{l}</span>
                      <span className="text-cb-secondary">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {syncData && (
        <SyncMacrosModal
          data={syncData}
          planId={plan.id}
          onClose={() => setSyncData(null)}
          onApplied={handleSyncApplied}
        />
      )}
    </div>
  )
}

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, onEdit, onDuplicate, onDelete }: { plan: NutritionPlan; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const initials = plan.clientName ? plan.clientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '—'
  const date = new Date(plan.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-surface border border-cb-border rounded-xl overflow-hidden hover:border-brand/30 transition-colors flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-cb-text leading-tight">{plan.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center">{initials}</div>
              <span className="text-xs text-cb-muted">{plan.clientName ?? 'No client'}</span>
            </div>
          </div>
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', plan.status === 'published' ? 'bg-cb-success/10 text-cb-success' : 'bg-cb-warning/10 text-cb-warning')}>
            {plan.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>

        <div className="flex gap-3 text-xs mb-3">
          <span className="text-cb-muted">{plan.caloriesTarget} kcal</span>
          <span className="text-brand">P {plan.proteinTarget}g</span>
          <span className="text-amber-500">C {plan.carbsTarget}g</span>
          <span className="text-red-400">F {plan.fatTarget}g</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-cb-muted">
          <FileText size={12} />
          <span>{plan.days.length} days</span>
          <span className="mx-1">·</span>
          <span>{date}</span>
        </div>
      </div>

      <div className="flex items-center border-t border-cb-border divide-x divide-cb-border">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-cb-secondary hover:text-brand hover:bg-brand/5 transition-colors"><Edit2 size={12} /> Edit Plan</button>
        <button onClick={onDuplicate} className="px-4 py-2.5 text-xs text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors"><Copy size={13} /></button>
        <button onClick={onDelete} className="px-4 py-2.5 text-xs text-cb-muted hover:text-cb-danger hover:bg-surface-light transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const [plans, setPlans] = useState<NutritionPlan[]>([])
  const [activePlan, setActivePlan] = useState<NutritionPlan | null>(null)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setCoachId(data.user.id)
      loadPlansFromDB(supabase, data.user.id)
      Promise.all([
        supabase.from('profiles').select('id, name').eq('coach_id', data.user.id).eq('role', 'client'),
        supabase.from('client_invitations').select('id, client_name').eq('coach_id', data.user.id).eq('status', 'pending'),
      ]).then(([activeRes, pendingRes]) => {
        const active = (activeRes.data ?? []).map(c => ({ id: c.id, name: c.name ?? '' }))
        const pending = (pendingRes.data ?? []).map(i => ({ id: i.id, name: `${i.client_name} (Pending)` }))
        setClients([...active, ...pending])
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function seedDefaultPlans(supabase: ReturnType<typeof createClient>, coachUserId: string) {
    const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const makeDays = () => Array.from({ length: 7 }, (_, i) => ({
      id: genId(), dayNumber: i + 1, dayName: DAY_NAMES[i], meals: [],
    }))

    const STARTER_PLANS = [
      { name: 'Fat Loss – 1,800 kcal', calories_target: 1800, protein_target: 180, carbs_target: 120, fat_target: 60, fibre_target: 35, notes: 'High-protein, moderate-carb plan for fat loss. Adjust portion sizes to client body weight.' },
      { name: 'Muscle Building – 2,500 kcal', calories_target: 2500, protein_target: 200, carbs_target: 250, fat_target: 80, fibre_target: 30, notes: 'Calorie surplus plan focused on building lean muscle. Increase carbs on training days.' },
      { name: 'Maintenance – 2,200 kcal', calories_target: 2200, protein_target: 165, carbs_target: 220, fat_target: 70, fibre_target: 30, notes: 'Balanced maintenance plan. Suitable for active clients maintaining their current body composition.' },
    ]

    const rows = STARTER_PLANS.map(p => ({
      id: genId(),
      coach_id: coachUserId,
      client_id: null,
      name: p.name,
      status: 'draft',
      calories_target: p.calories_target,
      protein_target: p.protein_target,
      carbs_target: p.carbs_target,
      fat_target: p.fat_target,
      fibre_target: p.fibre_target,
      days: makeDays(),
      notes: p.notes,
      published_at: null,
      updated_at: new Date().toISOString(),
    }))

    const { data } = await supabase.from('nutrition_plans_v2').insert(rows).select()
    if (data) setPlans(data.map(dbRowToPlan))
  }

  async function loadPlansFromDB(supabase: ReturnType<typeof createClient>, coachUserId?: string) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('nutrition_plans_v2')
        .select('*')
        .order('created_at', { ascending: false })
      if (data && data.length === 0 && coachUserId) {
        await seedDefaultPlans(supabase, coachUserId)
      } else if (data) {
        setPlans(data.map(dbRowToPlan))
      }
    } finally {
      setLoading(false)
    }
  }

  async function persistPlan(plan: NutritionPlan): Promise<void> {
    if (!coachId) return
    const supabase = createClient()
    await supabase
      .from('nutrition_plans_v2')
      .upsert({
        id: plan.id,
        coach_id: coachId,
        client_id: plan.clientId ?? null,
        name: plan.name,
        status: plan.status,
        calories_target: plan.caloriesTarget,
        protein_target: plan.proteinTarget,
        carbs_target: plan.carbsTarget,
        fat_target: plan.fatTarget,
        fibre_target: plan.fibreTarget,
        days: plan.days,
        notes: plan.notes,
        published_at: plan.status === 'published'
          ? (plan.publishedAt ?? new Date().toISOString())
          : null,
        updated_at: new Date().toISOString(),
      })
  }

  async function deletePlanFromDB(id: string): Promise<void> {
    if (!coachId) return
    const supabase = createClient()
    await supabase.from('nutrition_plans_v2').delete().eq('id', id)
  }

  function addPlan(plan: NutritionPlan) {
    setPlans(prev => [plan, ...prev])
    setActivePlan(plan)
  }

  function addAIPlan(output: MealPlanOutput) {
    const plan: NutritionPlan = {
      id: genId(),
      name: output.name,
      clientId: output.clientId,
      clientName: output.clientName,
      status: 'draft',
      caloriesTarget: output.caloriesTarget,
      proteinTarget: output.proteinTarget,
      carbsTarget: output.carbsTarget,
      fatTarget: output.fatTarget,
      fibreTarget: output.fibreTarget,
      notes: output.notes,
      createdAt: new Date().toISOString(),
      days: output.days.map((d) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        dayName: d.dayName,
        meals: d.meals.map((m) => ({
          id: m.id,
          name: m.name,
          time: m.time,
          notes: m.notes,
          tags: m.tags,
          foods: m.foods.map((f) => ({
            id: f.id,
            name: f.name,
            brand: f.brand,
            quantity: f.quantity,
            unit: f.unit as Unit,
            cal100: f.cal100,
            pro100: f.pro100,
            carb100: f.carb100,
            fat100: f.fat100,
            fibre100: f.fibre100,
            sodium100: f.sodium100,
          })),
        })),
      })),
    }
    setPlans(prev => [plan, ...prev])
    setShowAIModal(false)
    setActivePlan(plan)
  }

  function updatePlan(updated: NutritionPlan) {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
    setActivePlan(updated)
  }

  async function deletePlan(id: string) {
    setPlans(prev => prev.filter(p => p.id !== id))
    await deletePlanFromDB(id)
  }

  function duplicatePlan(plan: NutritionPlan) {
    const copy: NutritionPlan = {
      ...plan,
      id: genId(),
      name: `${plan.name} (copy)`,
      status: 'draft',
      publishedAt: undefined,
      createdAt: new Date().toISOString(),
      days: plan.days.map(d => ({
        ...d, id: genId(),
        meals: d.meals.map(m => ({ ...m, id: genId(), foods: m.foods.map(f => ({ ...f, id: genId() })) })),
      })),
    }
    setPlans(prev => [copy, ...prev])
  }

  if (activePlan) {
    return (
      <PlanBuilder
        plan={activePlan}
        onBack={() => setActivePlan(null)}
        onChange={updatePlan}
        onSave={persistPlan}
        clients={clients}
      />
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Nutrition & Meal Plans</h1>
          <div className="h-0.5 w-12 bg-gradient-to-r from-brand to-brand/40 rounded-full mt-1.5 mb-1" />
          <p className="text-sm text-cb-muted mt-0.5">Build, manage and publish dietitian-grade meal plans</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAIModal(true)} className="flex items-center gap-2 border border-cb-border rounded-xl px-4 py-2 text-sm text-cb-secondary hover:border-brand/40 hover:text-brand transition-colors">
            <Sparkles size={15} /> AI Generate
          </button>
          <button onClick={() => setShowNewPlan(true)} className="flex items-center gap-2 bg-brand text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={15} /> New Plan
          </button>
        </div>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 bg-surface-light rounded-2xl flex items-center justify-center mb-4 border border-cb-border">
            <FileText size={22} className="text-cb-muted" />
          </div>
          <p className="text-cb-secondary font-medium">No meal plans yet</p>
          <p className="text-cb-muted text-sm mt-1">Create your first nutrition plan to get started.</p>
          <button onClick={() => setShowNewPlan(true)} className="mt-4 flex items-center gap-2 bg-brand text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            <Plus size={15} /> New Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => setActivePlan(plan)}
              onDuplicate={() => duplicatePlan(plan)}
              onDelete={() => deletePlan(plan.id)}
            />
          ))}
        </div>
      )}

      {showNewPlan && <NewPlanModal onClose={() => setShowNewPlan(false)} onAdd={addPlan} clients={clients} />}
      {showAIModal && (
        <AIMealPlanWizard
          onClose={() => setShowAIModal(false)}
          onSave={addAIPlan}
        />
      )}
    </div>
  )
}
