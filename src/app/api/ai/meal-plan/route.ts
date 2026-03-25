export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder', // apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });

interface MealPlanRequest {
  client_id: string;
  title: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  dietary_preferences: string[];
  allergies: string[];
  cuisine_preferences: string[];
  meals_per_day: number;
  notes?: string;
}

const MEAL_TYPES_BY_COUNT: Record<number, string[]> = {
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'snack_1', 'lunch', 'dinner'],
  5: ['breakfast', 'snack_1', 'lunch', 'snack_2', 'dinner'],
  6: ['breakfast', 'snack_1', 'lunch', 'snack_2', 'dinner', 'snack_3'],
};

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: MealPlanRequest = await req.json();
    const {
      client_id,
      title,
      target_calories,
      target_protein_g,
      target_carbs_g,
      target_fat_g,
      dietary_preferences = [],
      allergies = [],
      cuisine_preferences = [],
      meals_per_day = 4,
      notes,
    } = body;

    // Validate
    if (!client_id || !target_calories || !target_protein_g || !target_carbs_g || !target_fat_g) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const mealTypes = MEAL_TYPES_BY_COUNT[meals_per_day] || MEAL_TYPES_BY_COUNT[4];

    // Build the AI prompt
    const prompt = buildPrompt({
      target_calories,
      target_protein_g,
      target_carbs_g,
      target_fat_g,
      dietary_preferences,
      allergies,
      cuisine_preferences,
      meals_per_day,
      mealTypes,
      notes,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert sports nutritionist and meal planning AI. You create detailed, practical meal plans with accurate macro counts. Always return valid JSON matching the exact schema requested. Be creative with meals — avoid repeating the same meal across days. Use whole, minimally processed foods where possible.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 16000,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    if (!aiResponse.days || !Array.isArray(aiResponse.days)) {
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 });
    }

    // Save to database
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        coach_id: user.id,
        client_id,
        title: title || `${target_calories}kcal Meal Plan`,
        status: 'draft',
        target_calories,
        target_protein_g,
        target_carbs_g,
        target_fat_g,
        dietary_preferences,
        allergies,
        cuisine_preferences,
        meals_per_day,
        notes,
        ai_model: 'gpt-4o',
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating meal plan:', planError);
      return NextResponse.json({ error: 'Failed to save meal plan' }, { status: 500 });
    }

    // Insert days and meals
    for (const day of aiResponse.days) {
      const { data: dayRow, error: dayError } = await supabase
        .from('meal_plan_days')
        .insert({
          meal_plan_id: mealPlan.id,
          day_number: day.day_number,
          day_label: DAY_LABELS[day.day_number - 1],
          total_calories: day.total_calories,
          total_protein_g: day.total_protein_g,
          total_carbs_g: day.total_carbs_g,
          total_fat_g: day.total_fat_g,
        })
        .select()
        .single();

      if (dayError) {
        console.error('Error creating meal plan day:', dayError);
        continue;
      }

      for (let i = 0; i < day.meals.length; i++) {
        const meal = day.meals[i];
        await supabase.from('meal_plan_meals').insert({
          meal_plan_day_id: dayRow.id,
          meal_type: meal.meal_type,
          sort_order: i,
          name: meal.name,
          description: meal.description,
          prep_time_minutes: meal.prep_time_minutes,
          cook_time_minutes: meal.cook_time_minutes,
          servings: meal.servings || 1,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
          fiber_g: meal.fiber_g,
          ingredients: meal.ingredients,
          instructions: meal.instructions,
        });
      }
    }

    // Generate and save shopping list
    if (aiResponse.shopping_list) {
      await supabase.from('meal_plan_shopping_lists').insert({
        meal_plan_id: mealPlan.id,
        items: aiResponse.shopping_list,
      });
    }

    // Fetch the complete plan to return
    const { data: completePlan } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_days (
          *,
          meal_plan_meals (*)
        ),
        meal_plan_shopping_lists (*)
      `)
      .eq('id', mealPlan.id)
      .single();

    return NextResponse.json({ meal_plan: completePlan });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

function buildPrompt(params: {
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  dietary_preferences: string[];
  allergies: string[];
  cuisine_preferences: string[];
  meals_per_day: number;
  mealTypes: string[];
  notes?: string;
}): string {
  return `Generate a complete 7-day meal plan with the following requirements:

DAILY MACRO TARGETS:
- Calories: ${params.target_calories} kcal (±50 kcal tolerance per day)
- Protein: ${params.target_protein_g}g (±5g tolerance)
- Carbs: ${params.target_carbs_g}g (±10g tolerance)
- Fat: ${params.target_fat_g}g (±5g tolerance)

MEALS PER DAY: ${params.meals_per_day}
MEAL TYPES TO USE: ${params.mealTypes.join(', ')}

${params.dietary_preferences.length > 0 ? `DIETARY PREFERENCES: ${params.dietary_preferences.join(', ')}` : ''}
${params.allergies.length > 0 ? `ALLERGIES/INTOLERANCES (MUST AVOID): ${params.allergies.join(', ')}` : ''}
${params.cuisine_preferences.length > 0 ? `CUISINE PREFERENCES: ${params.cuisine_preferences.join(', ')}` : ''}
${params.notes ? `ADDITIONAL NOTES: ${params.notes}` : ''}

Return JSON with this EXACT structure:
{
  "days": [
    {
      "day_number": 1,
      "total_calories": <number>,
      "total_protein_g": <number>,
      "total_carbs_g": <number>,
      "total_fat_g": <number>,
      "meals": [
        {
          "meal_type": "<one of: ${params.mealTypes.join(', ')}>",
          "name": "<meal name>",
          "description": "<1-2 sentence description>",
          "prep_time_minutes": <number>,
          "cook_time_minutes": <number>,
          "servings": 1,
          "calories": <number>,
          "protein_g": <number>,
          "carbs_g": <number>,
          "fat_g": <number>,
          "fiber_g": <number>,
          "ingredients": [
            {"name": "<ingredient>", "amount": "<quantity>", "unit": "<unit>"}
          ],
          "instructions": ["<step 1>", "<step 2>"]
        }
      ]
    }
  ],
  "shopping_list": [
    {"category": "<Produce|Protein|Dairy|Grains|Pantry|Frozen|Other>", "name": "<item>", "amount": "<total for week>", "unit": "<unit>", "checked": false}
  ]
}

RULES:
- Each day must have exactly ${params.meals_per_day} meals
- Day numbers go from 1 (Monday) to 7 (Sunday)
- Vary meals across days — do not repeat the same meal more than twice in the week
- Shopping list should aggregate ingredients across all 7 days
- All macro values must be numbers (not strings)
- Include fiber for each meal
- Keep recipes practical — under 30 min prep for most meals
- Snacks should be quick and simple`;
}
