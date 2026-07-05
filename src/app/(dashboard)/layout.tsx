import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'
import GettingStartedChecklist from '@/components/GettingStartedChecklist'
import Toaster from '@/components/Toaster'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const userEmail = user.email ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, name, role, onboarding_completed')
    .eq('id', user.id)
    .single()

  // Coaches must finish onboarding before using the dashboard.
  if (profile?.role === 'coach' && !profile.onboarding_completed) redirect('/onboarding')

  const userName = (profile?.full_name || profile?.name || '').split(' ')[0] || null

  return (
    <>
      <DashboardShell userEmail={userEmail} userName={userName}>
        {children}
      </DashboardShell>
      <GettingStartedChecklist />
      <Toaster />
    </>
  )
}
