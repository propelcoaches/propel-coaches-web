// Coach-initiated multi-modality program generator proxy.
//
// Forwards to the Supabase edge function named in EDGE_FN_BY_MODALITY for the
// chosen modality. We proxy server-side rather than calling edge functions
// from the browser so the coach's session JWT is verified here (not exposed
// to the engine), and so we can use the SUPABASE_SERVICE_ROLE_KEY to assert
// "this coach owns this client" before kicking off generation.
//
// Strength is intentionally NOT routed through here — it still uses the
// existing /api/ai/workout-program route which has the legacy contract.

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { EDGE_FN_BY_MODALITY, isModality, type Modality } from '@/lib/modalities';

type GenerateBody = {
  modality: Modality;
  client_id: string;
  /** Free-form override fields the engine consumes. Keys come from
   *  MODALITY_INPUT_SCHEMA in @/lib/modalities. */
  overrides?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isModality(body.modality)) {
    return NextResponse.json(
      { success: false, error: 'Unknown modality' },
      { status: 400 },
    );
  }
  if (body.modality === 'strength') {
    return NextResponse.json(
      {
        success: false,
        error: 'Use /api/ai/workout-program for strength.',
      },
      { status: 400 },
    );
  }
  if (!body.client_id) {
    return NextResponse.json(
      { success: false, error: 'client_id is required' },
      { status: 400 },
    );
  }

  // ── 1. Verify coach session and ownership of the client ──────────────────
  const supabase = createServerSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: client, error: clientErr } = await supabase
    .from('profiles')
    .select('id, coach_id')
    .eq('id', body.client_id)
    .single();
  if (clientErr || !client) {
    return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
  }
  if (client.coach_id !== user.id) {
    return NextResponse.json(
      { success: false, error: 'You do not coach this client' },
      { status: 403 },
    );
  }

  // ── 2. Dispatch to the modality edge function ────────────────────────────
  const edgeFn = EDGE_FN_BY_MODALITY[body.modality];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { success: false, error: 'Server misconfigured (Supabase env vars)' },
      { status: 500 },
    );
  }

  const admin = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const enginePayload = {
    client_id: body.client_id,
    from_profile: true,
    ...(body.overrides ?? {}),
  };

  const { data, error } = await admin.functions.invoke(edgeFn, {
    body: enginePayload,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Engine call failed',
      },
      { status: 502 },
    );
  }

  return NextResponse.json(data ?? { success: true });
}
