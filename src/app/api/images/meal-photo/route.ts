export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth check — only authenticated users
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    // Graceful degradation — no image but not an error
    return NextResponse.json({ url: null })
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: apiKey }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return NextResponse.json({ url: null })
    const data = await res.json()
    const photo = data.photos?.[0]
    return NextResponse.json({ url: photo?.src?.medium ?? null })
  } catch {
    return NextResponse.json({ url: null })
  }
}
