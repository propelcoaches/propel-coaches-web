import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    clientName, goal, experience, injuries,
    daysPerWeek, weeks, sessionLength, split,
    equipment, repRanges, trainingStyle, cardio,
    priorityExercises, avoidExercises,
    progressionModel, deload, includeTempo, includeRpe,
    additionalNotes,
  } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  const client = new Anthropic()

  const goalLabels: Record<string, string> = {
    hypertrophy: 'Maximum muscle hypertrophy',
    strength: 'Maximal strength (powerlifting-style)',
    fat_loss: 'Fat loss while preserving muscle',
    athletic_performance: 'Athletic performance and power',
    general_fitness: 'General fitness and health',
    powerlifting: 'Competitive powerlifting (Squat / Bench / Deadlift)',
  }
  const equipLabels: Record<string, string> = {
    full_gym: 'Full commercial gym (barbells, cables, machines, dumbbells)',
    home_barbell: 'Home gym with barbell and dumbbells',
    dumbbells_only: 'Dumbbells only',
    bodyweight: 'Bodyweight only (no equipment)',
  }
  const progressionLabels: Record<string, string> = {
    linear: 'Linear progression (add weight each session/week)',
    dup: 'Daily undulating periodisation (DUP)',
    wave: 'Wave loading across weeks',
    ai_decides: 'Optimal periodisation for the goal',
  }
  const deloadLabels: Record<string, string> = {
    every_4: 'Planned deload every 4th week (reduce volume 40–50%)',
    every_8: 'Planned deload every 8th week',
    auto: 'Auto-regulate — deload when performance drops',
    none: 'No deload',
  }
  const splitLabels: Record<string, string> = {
    full_body: 'Full body (each session trains all muscle groups)',
    upper_lower: 'Upper / Lower split',
    ppl: 'Push / Pull / Legs',
    bro_split: 'Body-part split',
    ai_decides: 'Optimal split for the goal',
  }

  const prompt = `You are an elite strength and conditioning coach building a professional training program.

CLIENT PROFILE:
- Name: ${clientName}
- Experience: ${experience}
- Injuries / Limitations: ${injuries || 'None'}

PROGRAM SPECS:
- Goal: ${goalLabels[goal] ?? goal}
- Split: ${splitLabels[split] ?? split}
- Duration: ${weeks} weeks, ${daysPerWeek} days/week
- Session length: ${sessionLength} min (${sessionLength === '45' ? '4–5 exercises' : sessionLength === '60' ? '5–6 exercises' : sessionLength === '75' ? '6–7 exercises' : '7–9 exercises'})
- Equipment: ${equipLabels[equipment] ?? equipment}
- Rep ranges: ${repRanges}
- Training style: ${trainingStyle}
- Cardio: ${cardio}
- Progression model: ${progressionLabels[progressionModel] ?? progressionModel}
- Deload: ${deloadLabels[deload] ?? deload}
- Include tempo: ${includeTempo ? 'Yes' : 'No'}
- Include RPE: ${includeRpe ? 'Yes' : 'No'}
- Must include: ${priorityExercises || 'none'}
- Avoid: ${avoidExercises || 'none'}
- Notes: ${additionalNotes || 'none'}

Return ONLY valid JSON in this exact format (no markdown):

{
  "name": "Program name",
  "description": "2–3 sentence professional description",
  "coaching_notes": "Bullet points separated by \\n",
  "progression_notes": "Specific week-by-week progression",
  "deload_notes": "Deload instructions or N/A",
  "goal": "${goal}",
  "difficulty": "${experience}",
  "days": [
    {
      "day_number": 1,
      "name": "Session name",
      "session_notes": "Focus for this session",
      "exercises": [
        {
          "name": "Exercise name",
          "muscle_group": "Primary muscle",
          "sets": 4,
          "reps_min": 8,
          "reps_max": 10,
          "rpe": ${includeRpe ? 7 : 'null'},
          "tempo": ${includeTempo ? '"3010"' : 'null'},
          "rest_seconds": 120,
          "notes": "Coaching cue",
          "superset_with_next": false
        }
      ]
    }
  ]
}

Generate exactly ${daysPerWeek} day objects. Equipment: ${equipLabels[equipment] ?? equipment}. Avoid: ${avoidExercises || 'nothing'}.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
    const program = JSON.parse(jsonMatch[0])
    return NextResponse.json({ program })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate workout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
