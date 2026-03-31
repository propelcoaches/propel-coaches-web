export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Lazy initialization — only evaluated at request time, not during build.
function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("Missing OPENAI_API_KEY")
  return new OpenAI({ apiKey: key })
}
interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface FoodPhotoAnalysis {
  items: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  confidence_score: number;
  serving_size_notes: string;
  analysis_timestamp: string;
}

// Parse GPT-4 vision response to structured data
function parseGPTResponse(content: string): FoodPhotoAnalysis {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        items: parsed.items || [],
        total_calories: parsed.total_calories || 0,
        total_protein_g: parsed.total_protein_g || 0,
        total_carbs_g: parsed.total_carbs_g || 0,
        total_fat_g: parsed.total_fat_g || 0,
        confidence_score: parsed.confidence_score || 0.7,
        serving_size_notes: parsed.serving_size_notes || 'Estimated based on visual analysis',
        analysis_timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Error parsing GPT response:', error);
  }

  // Fallback: return empty analysis
  return {
    items: [],
    total_calories: 0,
    total_protein_g: 0,
    total_carbs_g: 0,
    total_fat_g: 0,
    confidence_score: 0.5,
    serving_size_notes: 'Unable to analyze image',
    analysis_timestamp: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const openai = getOpenAIClient()
  try {
    // Verify authentication via Supabase session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Rate limit per user
    if (!checkRateLimit(`food-photo:${userId}`)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const { image_base64 } = await request.json();

    if (!image_base64) {
      return NextResponse.json(
        { error: 'Missing image_base64 in request body' },
        { status: 400 }
      );
    }

    // Validate base64 format
    if (!image_base64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected data URL format.' },
        { status: 400 }
      );
    }

    // Limit image size (~10MB base64 ≈ 13.3MB string)
    if (image_base64.length > 13_000_000) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Call GPT-4o vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and provide a detailed nutritional breakdown.

              Please respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
              {
                "items": [
                  {
                    "name": "food item name",
                    "quantity": number,
                    "unit": "grams/cup/slice/etc",
                    "calories": number,
                    "protein_g": number,
                    "carbs_g": number,
                    "fat_g": number
                  }
                ],
                "total_calories": number,
                "total_protein_g": number,
                "total_carbs_g": number,
                "total_fat_g": number,
                "confidence_score": number between 0 and 1,
                "serving_size_notes": "description of estimated serving sizes"
              }

              Be as accurate as possible with portion sizes and nutritional values.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: image_base64,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    // Extract analysis from GPT response
    const gptContent = response.choices[0]?.message?.content || '';
    const analysis = parseGPTResponse(gptContent);

    // Validate analysis results
    if (!analysis.items || analysis.items.length === 0) {
      return NextResponse.json(
        {
          error: 'Could not identify any food items in the image',
          analysis: {
            items: [],
            total_calories: 0,
            total_protein_g: 0,
            total_carbs_g: 0,
            total_fat_g: 0,
            confidence_score: 0,
            serving_size_notes: 'No food detected',
            analysis_timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Food photo analysis error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';

    // Handle specific API errors
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'Configuration error: API key not set' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API credentials' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze food photo. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
