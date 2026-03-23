import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  if (request.cookies.get('demo_mode')?.value === 'true') {
    return NextResponse.next()
  }
  const pathname = request.nextUrl.pathname
  // Public routes — no auth required
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/client-onboarding')
  ) {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
