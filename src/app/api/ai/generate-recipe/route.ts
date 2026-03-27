export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Lazy initialization — only evaluated at request time, not during build.
function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Missing OPENAI_API_KEY')
  return new OpenAI({ apiKey: key })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt, book_id } = await req.json()
    if (!prompt || !book_id) return NextResponse.json({ error: 'Missing prompt or book_id' }, { status: 400 })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert nutritionist and chef. Generate a single practical recipe based on the user's request. Return valid JSON only, no markdown.`,
        },
        {
          role: 'user',
          content: `Generate a recipe for: "${prompt}"

Return JSON with this EXACT structure:
{
  "name": "<recipe name>",
  "description": "<1-2 sentence description>",
  "prep_time": <minutes as integer>,
  "calories": <integer>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fats_g": <number>,
  "ingredients": ["<ingredient with quantity>", ...],
  "steps": ["<step 1>", ...],
  "tags": ["<tag>", ...]
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    })

    const parsed = JSON.parse(completion.choices[0].message.content || '{}')

    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        book_id,
        name: parsed.name,
        description: parsed.description ?? '',
        prep_time: parsed.prep_time ?? 0,
        calories: parsed.calories ?? 0,
        protein_g: parsed.protein_g ?? 0,
        carbs_g: parsed.carbs_g ?? 0,
        fats_g: parsed.fats_g ?? 0,
        ingredients: parsed.ingredients ?? [],
        steps: parsed.steps ?? [],
        tags: parsed.tags ?? [],
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ recipe })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate recipe'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
