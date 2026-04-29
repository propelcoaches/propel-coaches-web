// Serves Mission Control HTML with an in-route auth gate.
// Auth is enforced HERE rather than relying on middleware — Vercel's
// route-level optimisations meant the middleware wasn't applying.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import {
  MISSION_CONTROL_COOKIE_NAME,
  isMissionControlAccessKey,
  isMissionControlAccessKeyConfigured,
} from '@/lib/mission-control/auth.mjs';
import { hasMissionControlCookieAccess } from '@/lib/mission-control/server';

const HTML = readFileSync(
  join(process.cwd(), 'src/data/mission-control.html'),
  'utf-8',
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const providedKey = url.searchParams.get('key') || url.searchParams.get('access_key');

  if (providedKey && isMissionControlAccessKey(providedKey)) {
    const redirect = NextResponse.redirect(new URL('/mission-control', req.url));
    redirect.cookies.set(MISSION_CONTROL_COOKIE_NAME, providedKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return redirect;
  }

  if (!hasMissionControlCookieAccess()) {
    return new Response(renderAccessPage({
      configured: isMissionControlAccessKeyConfigured(),
      invalidKey: Boolean(providedKey),
    }), {
      status: isMissionControlAccessKeyConfigured() ? 401 : 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  return new Response(HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function renderAccessPage({ configured, invalidKey }: { configured: boolean; invalidKey: boolean }) {
  const message = configured
    ? invalidKey
      ? 'That access key did not match.'
      : 'Enter your private Mission Control key.'
    : 'Mission Control access is not configured yet.';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mission Control Access</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1020; color: #f7f8fb; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: min(420px, calc(100vw - 32px)); border: 1px solid rgba(148,163,184,.28); border-radius: 12px; background: #151a2a; padding: 28px; box-shadow: 0 22px 70px rgba(0,0,0,.35); }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 0 0 20px; color: #94a3b8; line-height: 1.5; }
    label { display: block; margin-bottom: 8px; color: #cbd5e1; font-size: 14px; }
    input { box-sizing: border-box; width: 100%; border: 1px solid rgba(148,163,184,.35); background: #0f1424; color: #f7f8fb; border-radius: 8px; padding: 12px 14px; font-size: 16px; }
    button { width: 100%; margin-top: 14px; border: 0; border-radius: 8px; background: #55d6ad; color: #07111d; font-weight: 700; padding: 12px 14px; font-size: 16px; cursor: pointer; }
    .error { color: #ff7171; }
  </style>
</head>
<body>
  <main>
    <h1>Mission Control</h1>
    <p class="${configured ? '' : 'error'}">${message}</p>
    ${configured ? `<form method="get" action="/mission-control">
      <label for="key">Access key</label>
      <input id="key" name="key" type="password" autocomplete="current-password" autofocus />
      <button type="submit">Enter</button>
    </form>` : ''}
  </main>
</body>
</html>`;
}
