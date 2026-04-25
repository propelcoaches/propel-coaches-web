import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

// Mission Control is a private ops dashboard — only these emails get through.
const MISSION_CONTROL_ALLOWED_EMAILS = new Set<string>([
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
])

export async function middleware(request: NextRequest) {
  if (request.cookies.get('demo_mode')?.value === 'true') {
    return NextResponse.next()
  }
  const pathname = request.nextUrl.pathname

  // Mission Control gate: logged-in + email on allow-list.
  // The HTML itself lives in /public/mission-control.html; this guards access.
  if (pathname === '/mission-control.html' || pathname.startsWith('/mission-control/')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() { /* no-op — read-only gate */ },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (!MISSION_CONTROL_ALLOWED_EMAILS.has(user.email ?? '')) {
      return new NextResponse('Not authorised', { status: 403 })
    }
    return NextResponse.next()
  }

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
