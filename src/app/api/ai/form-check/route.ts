import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  let parsedFormCheckId: string | undefined;

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_check_id } = await req.json();
    parsedFormCheckId = form_check_id;

    if (!form_check_id) {
      return NextResponse.json({ error: 'Missing form_check_id' }, { status: 400 });
    }

    // Fetch the form check record
    const { data: formCheck, error: fetchError } = await supabase
      .from('form_checks')
      .select('*')
      .eq('id', form_check_id)
      .single();

    if (fetchError || !formCheck) {
      return NextResponse.json({ error: 'Form check not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('form_checks')
      .update({ ai_status: 'processing' })
      .eq('id', form_check_id);

    // Use GPT-4o Vision to analyze the video frames
    // For video analysis, we extract key frames and send them as images
    // In production, you'd use a video processing service to extract frames
    // Here we use the video URL directly with GPT-4o's vision capabilities
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert strength coach and biomechanics analyst. You analyze exercise form from video descriptions and provide detailed, actionable feedback. Always return valid JSON.

Your analysis should cover:
1. Overall movement quality (score 1-10)
2. Specific form cues (what's good, what needs work)
3. Safety concerns if any
4. Coaching cues the athlete should focus on

Be constructive and specific. Reference body positions, joint angles, bar path, tempo, and common compensations.`,
        },
        {
          role: 'user',
          content: `Analyze the form for this exercise submission:

EXERCISE: ${formCheck.exercise_name}
${formCheck.weight_used ? `WEIGHT: ${formCheck.weight_used}` : ''}
${formCheck.reps_performed ? `REPS: ${formCheck.reps_performed}` : ''}
${formCheck.set_number ? `SET: ${formCheck.set_number}` : ''}

VIDEO URL: ${formCheck.video_url}

Please analyze the exercise form and return JSON with this EXACT structure:
{
  "overall_score": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": [
    {"cue": "<what they're doing well>", "detail": "<specific explanation>"}
  ],
  "improvements": [
    {"cue": "<what needs work>", "detail": "<specific explanation>", "priority": "<high|medium|low>", "drill": "<corrective exercise or drill to fix this>"}
  ],
  "safety_concerns": [
    {"concern": "<safety issue>", "recommendation": "<what to do>"}
  ],
  "coaching_cues": ["<short, memorable cue 1>", "<cue 2>", "<cue 3>"],
  "recommended_deload": <boolean - true if form is compromised enough to suggest reducing weight>
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 3000,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Save analysis
    const { error: updateError } = await supabase
      .from('form_checks')
      .update({
        ai_analysis: analysis,
        ai_status: 'completed',
        ai_model: 'gpt-4o',
        ai_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', form_check_id);

    if (updateError) {
      console.error('Error saving analysis:', updateError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({ analysis, form_check_id });
  } catch (error) {
    console.error('Form check analysis error:', error);

    // Update status to failed using the pre-parsed ID
    try {
      if (parsedFormCheckId) {
        const supabase = createRouteHandlerClient({ cookies });
        await supabase
          .from('form_checks')
          .update({ ai_status: 'failed' })
          .eq('id', parsedFormCheckId);
      }
    } catch {}

    return NextResponse.json({ error: 'Failed to analyze form' }, { status: 500 });
  }
}

// GET: Fetch form checks for a coach
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('form_checks')
      .select('*, client:profiles!form_checks_client_id_fkey(full_name, avatar_url)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (clientId) query = query.eq('client_id', clientId);
    if (status) query = query.eq('ai_status', status);

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch form checks' }, { status: 500 });
    }

    return NextResponse.json({ form_checks: data });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
