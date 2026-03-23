'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/utils/supabase/client'
import {
  type OnboardingStatus,
  isOnboardingStatus,
  shouldShowGuidedTourFromDb,
} from '@/types/onboardingStatus'

/** Estado en BD cuando el usuario debe ver el tour guiado */
export const ONBOARDING_STATUS_VERIFICADO: OnboardingStatus = 'verificado'
export const ONBOARDING_STATUS_COMPLETADO: OnboardingStatus = 'completado'

/**
 * Onboarding desde `public.user_profiles.onboarding` (tipo enum `onboarding_status`).
 */
export function useOnboardingStatus(user: User | null) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setStatus(null)
      setProfileLoading(true)
      return
    }

    let cancelled = false
    const uid = user.id

    ;(async () => {
      setProfileLoading(true)
      const supabase = createSupabaseClient()

      const { data: row, error: selectError } = await supabase
        .from('user_profiles')
        .select('onboarding')
        .eq('user_id', uid)
        .maybeSingle()

      if (cancelled) return

      if (selectError) {
        setStatus(null)
        setProfileLoading(false)
        return
      }

      const raw = row?.onboarding
      if (raw != null && isOnboardingStatus(String(raw))) {
        setStatus(raw)
        setProfileLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('user_profiles').insert({
        user_id: uid,
        onboarding: ONBOARDING_STATUS_VERIFICADO,
        email: user.email ?? null,
        name: (user.user_metadata?.full_name as string | undefined) ?? null,
        phone: (user.user_metadata?.phone as string | undefined) ?? null,
      })

      if (cancelled) return

      if (!insertError) {
        setStatus(ONBOARDING_STATUS_VERIFICADO)
        setProfileLoading(false)
        return
      }

      const { data: again } = await supabase
        .from('user_profiles')
        .select('onboarding')
        .eq('user_id', uid)
        .maybeSingle()

      if (cancelled) return

      const againRaw = again?.onboarding
      if (againRaw != null && isOnboardingStatus(String(againRaw))) {
        setStatus(againRaw)
      } else {
        setStatus(null)
      }
      setProfileLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [
    user?.id,
    user?.email,
    user?.user_metadata?.full_name,
    user?.user_metadata?.phone,
  ])

  const loading = !user || profileLoading

  const shouldShowTour = useMemo(
    () => (user ? shouldShowGuidedTourFromDb(status) : false),
    [user, status]
  )

  const markCompleted = useCallback(async () => {
    if (!user?.id) {
      return { error: new Error('Sin usuario') as Error | null }
    }
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding: ONBOARDING_STATUS_COMPLETADO })
      .eq('user_id', user.id)

    if (!error) {
      setStatus(ONBOARDING_STATUS_COMPLETADO)
    }
    return { error }
  }, [user?.id])

  return { status, loading, shouldShowTour, markCompleted }
}
