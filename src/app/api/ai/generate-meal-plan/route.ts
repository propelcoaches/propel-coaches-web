import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    clientName, goal, age, sex, weightKg, heightCm, activityLevel,
    calories, protein, carbs, fats,
    planDays, mealsPerDay,
    dietType, restrictions, lovedFoods, dislikedFoods, supplements,
    cookingSkill, budget, cuisines, mealPrepStyle,
    additionalNotes,
  } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
  }

  const client = new Anthropic()

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Build muscle mass (caloric surplus)',
    fat_loss: 'Lose body fat while preserving muscle (caloric deficit)',
    recomposition: 'Body recomposition (build muscle, lose fat simultaneously)',
    performance: 'Optimise athletic performance and recovery',
    health: 'General health and longevity',
    maintenance: 'Maintain current body composition',
  }
  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary (desk job, minimal exercise)',
    light: 'Lightly active (1–3 days/week exercise)',
    moderate: 'Moderately active (3–5 days/week)',
    active: 'Very active (6–7 days/week hard exercise)',
    very_active: 'Extremely active (twice daily or physical job)',
  }
  const cookingLabels: Record<string, string> = {
    minimal: 'Minimal prep — foods that take under 10 minutes, no cooking skills needed',
    simple: 'Simple cooking — 10–30 minutes, basic kitchen skills',
    comfortable: 'Comfortable — 30–60 minutes, comfortable in the kitchen',
    advanced: 'Advanced — 60+ minutes, enjoys cooking and meal prep',
  }
  const dietLabels: Record<string, string> = {
    standard: 'Standard balanced diet',
    high_protein: 'High protein (30%+ of calories from protein)',
    low_carb: 'Low carbohydrate (under 100g carbs/day)',
    ketogenic: 'Ketogenic (under 50g carbs/day, high fat)',
    mediterranean: 'Mediterranean diet (olive oil, fish, vegetables, legumes)',
    intermittent_fasting: 'Intermittent fasting (16:8 or 18:6 eating window)',
    plant_based: 'Plant-based (vegetarian, may include eggs/dairy)',
    vegan: 'Fully vegan (no animal products)',
  }

  const prompt = `You are an expert sports dietitian creating a professional, personalised nutrition plan.

CLIENT PROFILE:
- Name: ${clientName}
- Age: ${age || 'Not provided'}, Sex: ${sex || 'Not provided'}
- Weight: ${weightKg ? `${weightKg} kg` : 'Not provided'}, Height: ${heightCm ? `${heightCm} cm` : 'Not provided'}
- Activity Level: ${activityLabels[activityLevel] ?? activityLevel}

NUTRITION TARGETS:
- Primary Goal: ${goalLabels[goal] ?? goal}
- Daily Calories: ${calories} kcal
- Daily Protein: ${protein}g
- Daily Carbohydrates: ${carbs}g
- Daily Fats: ${fats}g
- Plan Duration: ${planDays} days
- Meals Per Day: ${mealsPerDay}

DIETARY PROFILE:
- Diet Type: ${dietLabels[dietType] ?? dietType}
- Restrictions / Allergies: ${(restrictions as string[])?.join(', ') || 'None'}
- Foods They Love: ${lovedFoods || 'No preference stated'}
- Foods They Dislike or Must Avoid: ${dislikedFoods || 'None stated'}
- Supplements to Integrate: ${(supplements as string[])?.join(', ') || 'None'}

LIFESTYLE:
- Cooking Skill: ${cookingLabels[cookingSkill] ?? cookingSkill}
- Budget: ${budget === 'budget' ? 'Budget-friendly (minimise cost)' : budget === 'moderate' ? 'Moderate budget' : 'No budget constraint'}
- Cuisine Preferences: ${(cuisines as string[])?.join(', ') || 'No preference'}
- Meal Prep Style: ${mealPrepStyle === 'fresh_daily' ? 'Prefers to cook fresh each day' : mealPrepStyle === 'meal_prep' ? 'Meal preps in bulk weekly' : 'Mix of fresh cooking and batch prep'}
- Additional Notes: ${additionalNotes || 'None'}

Create a ${planDays}-day meal plan with ${mealsPerDay} meals per day. Hit macro targets within ±5% each day. Make it feel achievable for this client's cooking skill and lifestyle.

Return ONLY valid JSON — no markdown — in this exact format:

{
  "plan_name": "Descriptive plan name",
  "description": "2–3 sentence description of the plan approach and expected outcomes",
  "dietitian_notes": "Key bullet points of nutrition guidance, separated by \\n",
  "daily_calories": ${calories},
  "daily_protein": ${protein},
  "daily_carbs": ${carbs},
  "daily_fats": ${fats},
  "days": [
    {
      "day_number": 1,
      "day_name": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "time": "07:30",
          "meal_notes": "Preparation tips for this meal",
          "foods": [
            {
              "name": "Food item name",
              "quantity": 80,
              "unit": "g",
              "cal100": 389,
              "pro100": 17,
              "carb100": 66,
              "fat100": 7,
              "fibre100": 10,
              "sodium100": 6
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. cal100, pro100, carb100, fat100, fibre100, sodium100 are ALL per 100g or 100ml of the food — NOT for the given quantity
2. Round quantities to practical amounts (e.g. 80g oats, 200g chicken, 250ml milk — not 137g or 183ml)
3. Each day must hit exactly ${calories}±50 kcal, ${protein}±5g protein
4. Vary meals significantly across all ${planDays} days — no repeated breakfasts
5. Use realistic, commonly available ingredients
6. Respect ALL dietary restrictions strictly: ${(restrictions as string[])?.join(', ') || 'none'}
7. Completely avoid: ${dislikedFoods || 'nothing stated'}
8. Incorporate loved foods where appropriate: ${lovedFoods || 'none stated'}
9. Cooking complexity must match ${cookingLabels[cookingSkill] ?? cookingSkill}
10. unit must be one of: "g", "ml", "piece", "tbsp", "tsp", "cup", "oz", "L", "kg"
11. Include ${mealsPerDay} meals per day — name them appropriately (e.g. Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack)
12. If supplements are included, add them as food items (e.g. "Whey Protein" 30g in appropriate meals)`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ plan })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate meal plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
