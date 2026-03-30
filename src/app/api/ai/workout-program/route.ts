export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SportCategory, WorkoutFormat } from '@/types/workout'
import { getSportConfig, getFormatConfig } from '@/constants/workoutConfigs'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateRequest {
  client_id: string
  title: string
  goal: string
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  days_per_week: number
  session_duration_minutes: number
  equipment_available: string[]
  injuries_limitations: string
  preferred_split: string
  notes?: string
  program_length_weeks: number
  sport_category?: SportCategory
  preferred_formats?: WorkoutFormat[]
}

interface ExerciseRow {
  id: string
  name: string
  primary_muscle_group: string
  equipment: string[]
  difficulty_level: string
  coaching_cues: string[]
  tags: string[]
  sets_default: number | null
  reps_default: number | null
  rest_seconds: number | null
}

interface AiExercise {
  exercise_id: string
  exercise_name: string
  sets: number | null
  reps_min: number | null
  reps_max: number | null
  rpe: number | null
  tempo: string | null
  rest_seconds: number | null
  duration_seconds: number | null
  distance_meters: number | null
  notes: string
  superset_group: string | null
  is_warmup: boolean
  order_index: number
}

interface AiDay {
  day_number: number
  name: string
  focus: string
  estimated_duration_minutes: number
  notes: string
  exercises: AiExercise[]
}

interface AiProgram {
  program_description: string
  coaching_notes: string
  progression_notes: string
  deload_notes: string
  days: AiDay[]
}

// ─── Equipment normalisation ──────────────────────────────────────────────────

const EQUIPMENT_MAP: Record<string, string[]> = {
  'Barbell':          ['barbell'],
  'Dumbbells':        ['dumbbell'],
  'Cables':           ['cable_machine'],
  'Machines':         ['machine', 'leg_press_machine', 'lat_pulldown_machine',
                       'leg_extension_machine', 'lying_leg_curl_machine', 'seated_leg_curl_machine',
                       'hack_squat_machine', 'calf_raise_machine', 'seated_calf_raise_machine',
                       'pec_deck_machine', 'low_row_machine', 't_bar_machine', 'lateral_raise_machine'],
  'Kettlebells':      ['kettlebell'],
  'Pull-up Bar':      ['pullup_bar'],
  'Resistance Bands': ['resistance_band'],
  'Bodyweight Only':  ['bodyweight'],
}

const SPORT_CATEGORIES: Record<string, string[]> = {
  strength:        ['strength', 'functional'],
  running:         ['running', 'cardio', 'strength', 'mobility'],
  cycling:         ['cardio', 'strength'],
  swimming:        ['cardio', 'strength'],
  functional:      ['functional', 'strength', 'plyometric'],
  sports_specific: ['sport_specific', 'strength', 'functional', 'plyometric'],
  rehab:           ['rehab', 'mobility', 'warm_up', 'cool_down'],
  hiit:            ['cardio', 'strength', 'plyometric', 'functional'],
  yoga_pilates:    ['yoga_pilates', 'mobility', 'warm_up', 'cool_down'],
}

const SPLIT_LABELS: Record<string, string> = {
  push_pull_legs: 'Push / Pull / Legs',
  upper_lower:    'Upper / Lower',
  full_body:      'Full Body',
  bro_split:      'Body-part split',
  auto:           'Optimal for the goal (AI decides)',
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: GenerateRequest = await req.json()
  const {
    client_id,
    title,
    goal,
    experience_level = 'intermediate',
    days_per_week,
    session_duration_minutes = 60,
    equipment_available = [],
    injuries_limitations = '',
    preferred_split = 'auto',
    notes,
    program_length_weeks = 4,
    sport_category = 'strength',
    preferred_formats = [],
  } = body

  if (!client_id || !goal || !days_per_week) {
    return NextResponse.json({ error: 'Missing required fields: client_id, goal, days_per_week' }, { status: 400 })
  }

  // Verify client belongs to this coach
  const { data: clientProfile, error: clientError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', client_id)
    .eq('coach_id', user.id)
    .single()

  if (clientError || !clientProfile) {
    return NextResponse.json({ error: 'Client not found' }, { status: 403 })
  }

  // ── 1. Query exercise library ─────────────────────────────────────────────
  const equipmentDbValues = equipment_available.flatMap(e => EQUIPMENT_MAP[e] ?? [])
  const exerciseCategories = SPORT_CATEGORIES[sport_category] ?? ['strength', 'functional']
  const difficultyLevels = experience_level === 'beginner' ? ['beginner']
    : experience_level === 'intermediate' ? ['beginner', 'intermediate']
    : ['beginner', 'intermediate', 'advanced']

  const { data: allExercises, error: exError } = await supabase
    .from('exercises')
    .select('id, name, primary_muscle_group, equipment, difficulty_level, coaching_cues, tags, sets_default, reps_default, rest_seconds')
    .eq('is_system', true)
    .in('category', exerciseCategories)
    .in('difficulty_level', difficultyLevels)
    .order('name')
    .limit(400)

  if (exError || !allExercises) {
    return NextResponse.json({ error: 'Failed to query exercise library' }, { status: 500 })
  }

  // Filter by equipment overlap — include exercise if client has any required piece
  const exercises: ExerciseRow[] = (allExercises as ExerciseRow[]).filter(ex => {
    if (!ex.equipment?.length) return true
    if (ex.equipment.includes('bodyweight')) return true
    if (equipmentDbValues.length === 0) return ex.equipment.includes('bodyweight')
    return ex.equipment.some(e => equipmentDbValues.includes(e))
  }).slice(0, 200)

  // Build compact catalog for the prompt
  const exerciseCatalog = exercises.map(ex => {
    const cue = ex.coaching_cues?.[0] ?? ''
    return `${ex.id} | ${ex.name} | ${ex.primary_muscle_group} | ${ex.equipment?.join('+') ?? 'bw'} | ${ex.tags?.slice(0, 3).join(',') ?? ''} | ${cue}`
  }).join('\n')

  // ── 2. Build prompt ───────────────────────────────────────────────────────
  const sportCfg = getSportConfig(sport_category)
  const formatLabel = preferred_formats.length > 0
    ? preferred_formats.map(f => getFormatConfig(f).label).join(', ')
    : getFormatConfig(sportCfg.defaultFormat).label

  const injuryNote = injuries_limitations.trim()
    ? `INJURIES/LIMITATIONS: ${injuries_limitations} — avoid exercises whose contraindications match these conditions.`
    : 'No known injuries.'

  const systemPrompt = `You are an elite certified strength and conditioning coach (CSCS) with 20 years designing evidence-based periodised programs. You MUST select exercises exclusively from the provided catalog using their exact UUIDs. Never invent exercises or UUIDs.`

  const userPrompt = `Design a ${program_length_weeks}-week ${sportCfg.label} training program.

CLIENT GOAL: ${goal.replace(/_/g, ' ')}
EXPERIENCE: ${experience_level}
DAYS/WEEK: ${days_per_week}
SESSION LENGTH: ~${session_duration_minutes} min
SPLIT: ${SPLIT_LABELS[preferred_split] ?? SPLIT_LABELS.auto}
FORMAT: ${formatLabel}
${injuryNote}
${notes ? `NOTES: ${notes}` : ''}

━━━ EXERCISE LIBRARY (select ONLY from this list) ━━━
UUID | Name | Primary Muscle | Equipment | Tags | Key Cue
${exerciseCatalog}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Generate exactly ${days_per_week} day objects
- Each session: 5–8 exercises scaled to ${session_duration_minutes} min
- Use exercise UUIDs exactly as shown — never fabricate IDs
- Avoid exercises contraindicated for the client's injuries
- Do not repeat the same muscle group on consecutive days
- Mark warm-up exercises with is_warmup: true (1–2 per session)
- Use superset_group letters ("A", "B") where appropriate
- For cardio/running: use duration_seconds and distance_meters; set sets/reps to null
- Prescribe rest based on intensity: strength=150s, hypertrophy=75s, metabolic=40s

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "program_description": "<2-3 sentence professional overview>",
  "coaching_notes": "<bullet points for the coach, separated by \\n>",
  "progression_notes": "<week-by-week progression across ${program_length_weeks} weeks>",
  "deload_notes": "<deload week recommendations>",
  "days": [
    {
      "day_number": 1,
      "name": "<e.g. Push A / Tempo Run / Upper Hypertrophy>",
      "focus": "<primary muscles or training focus>",
      "estimated_duration_minutes": <number>,
      "notes": "<session coaching notes>",
      "exercises": [
        {
          "exercise_id": "<UUID from catalog>",
          "exercise_name": "<exact name from catalog>",
          "sets": <number|null>,
          "reps_min": <number|null>,
          "reps_max": <number|null>,
          "rpe": <1-10|null>,
          "tempo": "<e.g. 3-1-2-0|null>",
          "rest_seconds": <number|null>,
          "duration_seconds": <number|null>,
          "distance_meters": <number|null>,
          "notes": "<coaching cue for this client>",
          "superset_group": "<letter|null>",
          "is_warmup": <boolean>,
          "order_index": <0-based int>
        }
      ]
    }
  ]
}`

  // ── 3. Call Claude ────────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const anthropic = new Anthropic()
  let aiProgram: AiProgram

  try {
    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 16000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No valid JSON found in Claude response')
    aiProgram = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[workout-program] Claude error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI generation failed' },
      { status: 500 },
    )
  }

  if (!Array.isArray(aiProgram.days) || aiProgram.days.length === 0) {
    return NextResponse.json({ error: 'AI returned invalid program structure' }, { status: 500 })
  }

  // ── 4. Validate & enrich exercise references ──────────────────────────────
  const libraryIds  = new Set(exercises.map(e => e.id))
  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  let totalDropped = 0
  for (const day of aiProgram.days) {
    const before = day.exercises?.length ?? 0
    day.exercises = (day.exercises ?? []).filter(ex => {
      if (!ex.exercise_id || !libraryIds.has(ex.exercise_id)) {
        console.warn(`[workout-program] Dropped invalid exercise_id "${ex.exercise_id}" (${ex.exercise_name})`)
        return false
      }
      return true
    })
    totalDropped += before - day.exercises.length

    // Back-fill defaults from library where Claude left nulls
    day.exercises = day.exercises.map((ex, i) => {
      const lib = exerciseMap.get(ex.exercise_id)
      return {
        ...ex,
        order_index:  i,
        sets:         ex.sets        ?? lib?.sets_default    ?? 3,
        reps_min:     ex.reps_min    ?? lib?.reps_default    ?? null,
        reps_max:     ex.reps_max    ?? lib?.reps_default    ?? null,
        rest_seconds: ex.rest_seconds ?? lib?.rest_seconds   ?? 90,
      }
    })
  }

  if (totalDropped > 0) {
    console.warn(`[workout-program] Dropped ${totalDropped} exercises with invalid IDs`)
  }

  // ── 5. Save to program_templates ─────────────────────────────────────────
  const structure = {
    program_description: aiProgram.program_description,
    coaching_notes:      aiProgram.coaching_notes,
    progression_notes:   aiProgram.progression_notes,
    deload_notes:        aiProgram.deload_notes,
    days:                aiProgram.days,
    meta: {
      sport_category, goal, experience_level,
      days_per_week, session_duration_minutes,
      equipment_available, preferred_split,
      preferred_formats, injuries_limitations,
      program_length_weeks,
      exercise_library_size: exercises.length,
    },
  }

  const { data: template, error: saveError } = await supabase
    .from('program_templates')
    .insert({
      coach_id:             user.id,
      name:                 title || `${goal.replace(/_/g, ' ')} — AI Program`,
      description:          aiProgram.program_description,
      duration_weeks:       program_length_weeks,
      days_per_week,
      goal,
      difficulty:           experience_level,
      is_public:            false,
      structure,
      ai_generated:         true,
      ai_model:             'claude-sonnet-4-6',
      ai_generation_params: { client_id, sport_category, equipment_available, injuries_limitations, preferred_split, notes },
    })
    .select()
    .single()

  if (saveError) {
    console.error('[workout-program] Save error:', saveError)
    return NextResponse.json({ error: 'Failed to save generated program' }, { status: 500 })
  }

  return NextResponse.json({
    program: { ...template, structure },
    stats: {
      exercises_in_library: exercises.length,
      exercises_used: aiProgram.days.reduce((n: number, d: AiDay) => n + d.exercises.length, 0),
      days_generated: aiProgram.days.length,
    },
  })
}
