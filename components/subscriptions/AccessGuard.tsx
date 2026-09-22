'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/utils/supabase/client'
import { hasPlatformAccess, type AccessProfile } from '@/lib/trial'

export function AccessGuard({ userId, profile, children }: {
  userId: string
  profile: AccessProfile
  children: React.ReactNode
}) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(() => hasPlatformAccess(profile))

  useEffect(() => {
    const supabase = createSupabaseClient()
    let disposed = false
    let currentProfile = profile
    const check = async () => {
      if (!hasPlatformAccess(currentProfile)) {
        setAllowed(false)
      }
      const { data, error } = await supabase.from('user_profiles')
        .select('is_super_user,subscription_status,current_plan,trial_ends_at')
        .eq('user_id', userId).maybeSingle()
      if (disposed) return
      const access = !error && hasPlatformAccess(data)
      if (data) currentProfile = data
      setAllowed(access)
      if (!access) router.replace('/subscribe')
    }
    const interval = window.setInterval(check, 30_000)
    // Recheck at expiry, even when the dashboard stays open. Cap long timeouts.
    const remaining = profile.trial_ends_at ? Date.parse(profile.trial_ends_at) - Date.now() : 0
    const timeout = remaining > 0 && remaining < 2_147_483_647
      ? window.setTimeout(check, remaining + 1) : undefined
    window.addEventListener('focus', check)
    return () => {
      disposed = true
      window.clearInterval(interval)
      window.clearTimeout(timeout)
      window.removeEventListener('focus', check)
    }
  }, [profile, router, userId])

  return allowed ? <>{children}</> : <p className="p-8">Elige un plan para continuar.</p>
}
