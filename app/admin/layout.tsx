import { createSupabaseClient } from '@/utils/supabase/server'
import { isRefreshTokenError } from '@/services/supabase/types'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && isRefreshTokenError(userError)) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_super_user')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.is_super_user) redirect('/dashboard')

  return <>{children}</>
}
