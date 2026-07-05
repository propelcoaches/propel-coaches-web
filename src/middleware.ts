// This is the ONLY middleware in this app (app dir is src/, so Next resolves
// middleware from src/ — a root-level middleware.ts would be silently DEAD).
// It handles CORS only. There is deliberately no auth here: every layout,
// page, and API route enforces its own auth in-route.
import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = [
  'https://propelcoaches.com',
  'https://www.propelcoaches.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
];

export function middleware(request: NextRequest) {
  // Only enforce CORS on API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const origin = request.headers.get('origin') ?? '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : '';

  // Handle preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    return response;
  }

  const response = NextResponse.next();

  if (corsOrigin) {
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
