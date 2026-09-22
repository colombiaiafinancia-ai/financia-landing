export const TRIAL_DAYS = 30

export function getEffectiveTrialEndsAt(profileTrialEndsAt?: string | null, now = Date.now()) {
  const end = profileTrialEndsAt ? Date.parse(profileTrialEndsAt) : NaN
  return Number.isFinite(end) && end > now ? new Date(end).toISOString() : null
}

export function getTrialTotalMs() {
  return TRIAL_DAYS * 24 * 60 * 60 * 1000
}

export type AccessProfile = {
  is_super_user?: boolean | null
  subscription_status?: string | null
  current_plan?: string | null
  trial_ends_at?: string | null
}

export function hasPlatformAccess(profile: AccessProfile | null, now = Date.now()) {
  if (!profile) return false
  return profile.is_super_user === true ||
    (profile.subscription_status === 'active' && Boolean(profile.current_plan) && profile.current_plan !== 'free') ||
    getEffectiveTrialEndsAt(profile.trial_ends_at, now) !== null
}
