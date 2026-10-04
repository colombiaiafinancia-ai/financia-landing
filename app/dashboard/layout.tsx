import { redirect } from 'next/navigation'
import { hasPlatformAccess } from '@/lib/trial'
import { AccessGuard } from '@/components/subscriptions/AccessGuard'
import { DashboardSessionProvider } from '@/contexts/DashboardSessionContext'
import { getDashboardSession } from '@/lib/dashboard/server-data'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, profileError } = await getDashboardSession()

  if (!user) redirect('/login')
  if (profileError || !profile || !hasPlatformAccess(profile)) redirect('/subscribe')

  return (
    <DashboardSessionProvider user={user} profile={profile}>
      <AccessGuard userId={user.id} profile={profile}>{children}</AccessGuard>
    </DashboardSessionProvider>
  )
}
