import { CategoriesProvider } from '@/contexts/CategoriesContext'
import { createSupabaseClient } from '@/utils/supabase/server'
import { isRefreshTokenError } from '@/services/supabase/types'
import { redirect } from 'next/navigation'

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

  return <CategoriesProvider>{children}</CategoriesProvider>
}
