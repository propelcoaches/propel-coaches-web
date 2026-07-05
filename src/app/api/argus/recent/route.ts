// Feeds Mission Control with recent Argus audit reports.
// Mission Control is served same-origin at /mission-control, so this is
// gated by the same access cookie as /api/mission-control/*.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import {
  hasMissionControlCookieAccess,
  missionControlAccessErrorResponse,
} from '@/lib/mission-control/server';

const baseHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET(req: Request) {
  if (!hasMissionControlCookieAccess()) return missionControlAccessErrorResponse();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ reports: [] }, { headers: baseHeaders });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '7', 10)));
  const repo = searchParams.get('repo');

  const qs = new URLSearchParams();
  qs.set('select', '*');
  qs.set('order', 'created_at.desc');
  qs.set('limit', String(limit));
  if (repo) qs.set('repo', `eq.${repo}`);

  const res = await fetch(`${url}/rest/v1/audit_reports?${qs.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json(
      { reports: [], error: `supabase ${res.status}` },
      { status: 502, headers: baseHeaders },
    );
  }

  const reports = await res.json();
  return NextResponse.json({ reports }, { headers: baseHeaders });
}
