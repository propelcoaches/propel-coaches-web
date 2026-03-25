import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import GettingStartedChecklist from '@/components/GettingStartedChecklist'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const isDemo = cookieStore.get('demo_mode')?.value === 'true'

  let userEmail = 'demo@propelcoaches.com'

  if (!isDemo) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    userEmail = user.email ?? ''
  }

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar userEmail={userEmail} isDemo={isDemo} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-bg min-h-0">
          {children}
        </main>
      </div>
      <GettingStartedChecklist />
    </div>
  )
}
