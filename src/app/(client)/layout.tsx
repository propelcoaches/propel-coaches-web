import { createClient } from '@/lib/supabase/server'
import ClientLayoutShell from './ClientLayoutShell'

interface CoachBranding {
  brand_name: string | null
  logo_url: string | null
  accent_color: string | null
  secondary_color: string | null
}

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  // Get current client's coach_id
  const { data: { user } } = await supabase.auth.getUser()

  let branding: CoachBranding | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', user.id)
      .single()

    if (profile?.coach_id) {
      const { data } = await supabase
        .from('coach_branding')
        .select('brand_name, logo_url, accent_color, secondary_color')
        .eq('coach_id', profile.coach_id)
        .single()
      branding = data ?? null
    }
  }

  return (
    <ClientLayoutShell
      brandName={branding?.brand_name ?? null}
      logoUrl={branding?.logo_url ?? null}
      accentColor={branding?.accent_color ?? null}
      secondaryColor={branding?.secondary_color ?? null}
    >
      {children}
    </ClientLayoutShell>
  )
}
