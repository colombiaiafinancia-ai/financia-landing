import { CategoriesProvider } from '@/contexts/CategoriesContext'
import { createSupabaseClient } from '@/utils/supabase/server'
import { isRefreshTokenError } from '@/services/supabase/types'
import { redirect } from 'next/navigation'

function hasDashboardAccess(profile: {
  subscription_status: string | null
  current_plan: string | null
  trial_ends_at: string | null
  is_super_user: boolean | null
}) {
  if (profile.is_super_user) return true

  const status = profile.subscription_status || 'free'
  const plan = profile.current_plan || 'free'
  const trialEndsAt = profile.trial_ends_at
    ? new Date(profile.trial_ends_at).getTime()
    : 0

  if (trialEndsAt > Date.now()) return true

  return plan !== 'free' && ['active', 'pending', 'trial'].includes(status)
}

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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_status,current_plan,trial_ends_at,is_super_user')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile || !hasDashboardAccess(profile)) {
    redirect('/subscribe?reason=plan_required')
  }

  return <CategoriesProvider>{children}</CategoriesProvider>
}
