import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface WorkoutProgramRequest {
  client_id: string;
  title: string;
  goal: string;                    // e.g. 'hypertrophy', 'strength', 'fat_loss', 'athletic_performance', 'general_fitness'
  experience_level: string;        // 'beginner', 'intermediate', 'advanced'
  days_per_week: number;           // 2-6
  session_duration_minutes: number; // 30-90
  equipment_available: string[];   // e.g. ['barbell', 'dumbbells', 'cables', 'bodyweight']
  injuries_limitations: string;
  preferred_split: string;         // e.g. 'push_pull_legs', 'upper_lower', 'full_body', 'bro_split', 'auto'
  notes?: string;
  program_length_weeks: number;    // 4-12
}

const SPLIT_TEMPLATES: Record<string, Record<number, string[]>> = {
  push_pull_legs: {
    3: ['Push', 'Pull', 'Legs'],
    4: ['Push', 'Pull', 'Legs', 'Upper'],
    5: ['Push', 'Pull', 'Legs', 'Push', 'Pull'],
    6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
  },
  upper_lower: {
    2: ['Upper', 'Lower'],
    3: ['Upper', 'Lower', 'Full Body'],
    4: ['Upper', 'Lower', 'Upper', 'Lower'],
    5: ['Upper', 'Lower', 'Upper', 'Lower', 'Upper'],
    6: ['Upper', 'Lower', 'Upper', 'Lower', 'Upper', 'Lower'],
  },
  full_body: {
    2: ['Full Body A', 'Full Body B'],
    3: ['Full Body A', 'Full Body B', 'Full Body C'],
    4: ['Full Body A', 'Full Body B', 'Full Body C', 'Full Body D'],
  },
  bro_split: {
    4: ['Chest/Triceps', 'Back/Biceps', 'Shoulders/Abs', 'Legs'],
    5: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
    6: ['Chest', 'Back', 'Shoulders', 'Arms', 'Quads/Calves', 'Hamstrings/Glutes'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: WorkoutProgramRequest = await req.json();
    const {
      client_id,
      title,
      goal,
      experience_level,
      days_per_week,
      session_duration_minutes = 60,
      equipment_available = [],
      injuries_limitations = '',
      preferred_split = 'auto',
      notes,
      program_length_weeks = 4,
    } = body;

    if (!client_id || !goal || !days_per_week) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Build AI prompt
    const prompt = buildWorkoutPrompt({
      goal,
      experience_level,
      days_per_week,
      session_duration_minutes,
      equipment_available,
      injuries_limitations,
      preferred_split,
      notes,
      program_length_weeks,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert strength & conditioning coach and exercise scientist. You design periodized, evidence-based training programs. Always return valid JSON matching the exact schema requested. Use proper exercise names, prescribe appropriate set/rep ranges for the goal, and include warm-up sets where appropriate.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 12000,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    if (!aiResponse.days || !Array.isArray(aiResponse.days)) {
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 });
    }

    // Save program to existing workout_programs / workout_days / workout_exercises tables
    const { data: program, error: progError } = await supabase
      .from('workout_programs')
      .insert({
        coach_id: user.id,
        client_id,
        title: title || `${goal.replace('_', ' ')} Program`,
        description: aiResponse.program_description || '',
        status: 'draft',
        goal,
        experience_level,
        days_per_week,
        session_duration_minutes,
        equipment_available,
        injuries_limitations,
        preferred_split,
        program_length_weeks,
        ai_generated: true,
        notes,
      })
      .select()
      .single();

    if (progError) {
      console.error('Error creating program:', progError);
      return NextResponse.json({ error: 'Failed to save program' }, { status: 500 });
    }

    // Insert days and exercises
    for (const day of aiResponse.days) {
      const { data: dayRow, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          program_id: program.id,
          day_number: day.day_number,
          name: day.name,
          focus: day.focus,
          notes: day.notes || '',
          estimated_duration_minutes: day.estimated_duration_minutes || session_duration_minutes,
        })
        .select()
        .single();

      if (dayError) {
        console.error('Error creating workout day:', dayError);
        continue;
      }

      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        await supabase.from('workout_exercises').insert({
          workout_day_id: dayRow.id,
          sort_order: i,
          exercise_name: ex.exercise_name,
          muscle_group: ex.muscle_group,
          sets: ex.sets,
          reps: ex.reps,               // e.g. "8-12" or "5"
          rpe: ex.rpe || null,          // e.g. 7, 8, 9
          rest_seconds: ex.rest_seconds,
          tempo: ex.tempo || null,      // e.g. "3-1-1-0"
          notes: ex.notes || '',
          superset_group: ex.superset_group || null,
          is_warmup: ex.is_warmup || false,
        });
      }
    }

    // Fetch complete program
    const { data: completeProgram } = await supabase
      .from('workout_programs')
      .select(`
        *,
        workout_days(*, workout_exercises(*))
      `)
      .eq('id', program.id)
      .single();

    return NextResponse.json({ program: completeProgram });
  } catch (error) {
    console.error('Workout program generation error:', error);
    return NextResponse.json({ error: 'Failed to generate program' }, { status: 500 });
  }
}

function buildWorkoutPrompt(params: {
  goal: string;
  experience_level: string;
  days_per_week: number;
  session_duration_minutes: number;
  equipment_available: string[];
  injuries_limitations: string;
  preferred_split: string;
  notes?: string;
  program_length_weeks: number;
}): string {
  const splitHint = params.preferred_split !== 'auto'
    ? `USE THIS SPLIT: ${params.preferred_split.replace(/_/g, ' ')} — ${
        SPLIT_TEMPLATES[params.preferred_split]?.[params.days_per_week]?.join(', ') || 'assign appropriate focus per day'
      }`
    : `Choose the optimal training split for ${params.days_per_week} days/week given the goal.`;

  return `Design a complete ${params.program_length_weeks}-week training program (output week 1 as the template):

GOAL: ${params.goal.replace(/_/g, ' ')}
EXPERIENCE LEVEL: ${params.experience_level}
TRAINING DAYS PER WEEK: ${params.days_per_week}
SESSION DURATION: ~${params.session_duration_minutes} minutes
EQUIPMENT AVAILABLE: ${params.equipment_available.length > 0 ? params.equipment_available.join(', ') : 'Full gym'}
${params.injuries_limitations ? `INJURIES/LIMITATIONS: ${params.injuries_limitations}` : ''}
${splitHint}
${params.notes ? `ADDITIONAL NOTES: ${params.notes}` : ''}

PROGRAMMING GUIDELINES:
- ${params.goal === 'hypertrophy' ? 'Focus on 8-15 rep range, moderate-heavy loads, sufficient volume (10-20 sets/muscle group/week)' : ''}
- ${params.goal === 'strength' ? 'Focus on 3-6 rep range for compounds, include accessory work at higher reps' : ''}
- ${params.goal === 'fat_loss' ? 'Include compound movements, circuits, and higher rep ranges. Minimize rest times.' : ''}
- ${params.goal === 'athletic_performance' ? 'Include explosive movements, compound lifts, and sport-specific conditioning' : ''}
- ${params.goal === 'general_fitness' ? 'Balance of compound movements, moderate volume, mix of rep ranges' : ''}
- Include progressive overload notes
- ${params.experience_level === 'beginner' ? 'Stick to fundamental movement patterns, avoid complex lifts' : ''}
- ${params.experience_level === 'advanced' ? 'Include advanced techniques like drop sets, supersets, rest-pause where appropriate' : ''}
- Mark warm-up sets explicitly
- Group supersets with matching superset_group letters (A, B, C...)

Return JSON with this EXACT structure:
{
  "program_description": "<2-3 sentence overview of the program>",
  "progression_notes": "<how to progress week over week>",
  "days": [
    {
      "day_number": 1,
      "name": "<e.g. Push Day>",
      "focus": "<primary muscle groups>",
      "estimated_duration_minutes": <number>,
      "notes": "<optional day-level coaching cues>",
      "exercises": [
        {
          "exercise_name": "<full exercise name>",
          "muscle_group": "<primary muscle group>",
          "sets": <number>,
          "reps": "<rep range as string, e.g. '8-12' or '5'>",
          "rpe": <number or null>,
          "rest_seconds": <number>,
          "tempo": "<tempo string or null>",
          "notes": "<form cues, progression notes>",
          "superset_group": "<letter or null>",
          "is_warmup": <boolean>
        }
      ]
    }
  ]
}

RULES:
- Day numbers go from 1 to ${params.days_per_week}
- Each day must have 6-10 exercises (including warm-up sets)
- First 1-2 exercises per day should be compound movements
- Include at least one warm-up set marked with is_warmup: true per major compound
- RPE should be a number 6-10 or null
- Rest seconds: 60-90 for isolation, 120-180 for compounds, 30-45 for circuits
- All values must match the JSON types specified above`;
}
