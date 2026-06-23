export const PROMOTIONAL_TRIAL_END_LABEL = '25 de julio de 2026'
export const PROMOTIONAL_TRIAL_START_ISO = '2026-06-21T05:00:00.000Z'
export const PROMOTIONAL_TRIAL_END_ISO = '2026-07-26T04:59:59.999Z'

export function getEffectiveTrialEndsAt(profileTrialEndsAt?: string | null) {
  const now = Date.now()
  const promotionalEnd = new Date(PROMOTIONAL_TRIAL_END_ISO).getTime()
  const profileEnd = profileTrialEndsAt ? new Date(profileTrialEndsAt).getTime() : 0
  const effectiveEnd = Math.max(profileEnd, promotionalEnd)

  return effectiveEnd > now ? new Date(effectiveEnd).toISOString() : null
}

export function getPromotionalTrialTotalMs() {
  return Math.max(
    new Date(PROMOTIONAL_TRIAL_END_ISO).getTime() -
      new Date(PROMOTIONAL_TRIAL_START_ISO).getTime(),
    1
  )
}
