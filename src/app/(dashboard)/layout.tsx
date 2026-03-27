import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import GettingStartedChecklist from '@/components/GettingStartedChecklist'
import Toaster from '@/components/Toaster'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const userEmail = user.email ?? ''

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-bg min-h-0">
          {children}
        </main>
      </div>
      <GettingStartedChecklist />
      <Toaster />
    </div>
  )
}
