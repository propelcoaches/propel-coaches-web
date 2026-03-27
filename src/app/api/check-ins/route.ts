export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      energy, stress, sleep_quality, training_difficulty,
      wins, struggles, bodyweight_kg, date,
    } = body;

    const { data: checkIn, error: insertError } = await supabase
      .from('check_ins')
      .insert({
        client_id: user.id,
        energy,
        stress,
        sleep_quality,
        training_difficulty,
        wins: wins || null,
        struggles: struggles || null,
        bodyweight_kg: bodyweight_kg || null,
        date,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Look up this client's coach to create a notification
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('coach_id, full_name')
      .eq('id', user.id)
      .single();

    if (clientProfile?.coach_id) {
      const clientName = clientProfile.full_name || 'A client';
      const energyLabel = energy <= 3 ? 'Low' : energy <= 6 ? 'Moderate' : 'High';

      await supabase.from('coach_notifications').insert({
        coach_id: clientProfile.coach_id,
        type: 'check_in_submitted',
        title: `${clientName} submitted their check-in`,
        body: `Energy: ${energy}/10 (${energyLabel}) · Sleep: ${sleep_quality}/10 · Stress: ${stress}/10${bodyweight_kg ? ` · ${bodyweight_kg}kg` : ''}`,
        client_id: user.id,
        read: false,
      });
    }

    return NextResponse.json({ check_in: checkIn });
  } catch (error) {
    console.error('Check-in submission error:', error);
    return NextResponse.json({ error: 'Failed to submit check-in' }, { status: 500 });
  }
}
