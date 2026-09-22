import { CategoriesProvider } from '@/contexts/CategoriesContext'
import { createSupabaseClient } from '@/utils/supabase/server'
import { isRefreshTokenError } from '@/services/supabase/types'
import { redirect } from 'next/navigation'
import { hasPlatformAccess } from '@/lib/trial'
import { AccessGuard } from '@/components/subscriptions/AccessGuard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && isRefreshTokenError(userError)) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase.from('user_profiles')
    .select('is_super_user,subscription_status,current_plan,trial_ends_at')
    .eq('user_id', user.id).maybeSingle()
  if (error || !profile || !hasPlatformAccess(profile)) redirect('/subscribe')

  return <AccessGuard userId={user.id} profile={profile}>
    <CategoriesProvider>{children}</CategoriesProvider>
  </AccessGuard>
}
