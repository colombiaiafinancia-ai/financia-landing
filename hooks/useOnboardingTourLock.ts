'use client'

import { useEffect } from 'react'
import type { OnboardingStep } from '@/components/dashboard/OnboardingVignette'
import {
  smoothScrollToElement,
  ONBOARDING_SCROLL_DURATION_MS,
  ONBOARDING_SCROLL_DELAY_MS,
} from '@/utils/scroll'

function isInsideAllowedZone(target: EventTarget | null) {
  if (!(target instanceof Node)) return false

  if (
    Array.from(document.querySelectorAll('[data-onboarding-active]')).some(
      (el) => el === target || el.contains(target)
    )
  ) {
    return true
  }

  if (
    target instanceof Element &&
    target.closest(
      '[role="dialog"], [data-radix-popper-content-wrapper], [data-radix-select-viewport]'
    )
  ) {
    return true
  }

  return false
}

function getScrollAnchor(step: OnboardingStep): HTMLElement | null {
  const activeZone = document.querySelector('[data-onboarding-active]')
  if (activeZone instanceof HTMLElement) return activeZone

  if (!step) return null

  const section = document.querySelector(`[data-onboarding-section="${step}"]`)
  if (section instanceof HTMLElement) return section

  return null
}

type TourLockMode = 'fixed' | 'body-only'

let tourLockCount = 0
let tourLockMode: TourLockMode | null = null
let savedScrollY = 0

function onPreventBackgroundScroll(event: Event) {
  if (!tourLockMode) return
  if (isInsideAllowedZone(event.target)) return
  event.preventDefault()
}

function applyTourLock(mode: TourLockMode) {
  tourLockCount++
  if (tourLockCount > 1) return

  tourLockMode = mode
  savedScrollY = window.scrollY
  document.body.style.overflow = 'hidden'

  if (mode === 'fixed') {
    document.body.style.position = 'fixed'
    document.body.style.top = `-${savedScrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
  }

  window.addEventListener('wheel', onPreventBackgroundScroll, { passive: false })
  window.addEventListener('touchmove', onPreventBackgroundScroll, { passive: false })
}

function releaseTourLock() {
  tourLockCount = Math.max(0, tourLockCount - 1)
  if (tourLockCount > 0) return

  window.removeEventListener('wheel', onPreventBackgroundScroll)
  window.removeEventListener('touchmove', onPreventBackgroundScroll)

  if (tourLockMode === 'fixed') {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    window.scrollTo(0, savedScrollY)
  }

  document.body.style.overflow = ''
  tourLockMode = null
}

export function useOnboardingTourLock({
  active,
  step,
  isLoading,
}: {
  active: boolean
  step: OnboardingStep
  isLoading: boolean
}) {
  useEffect(() => {
    if (!active || isLoading) {
      releaseTourLock()
      return
    }

    let scrollTimer: number | undefined
    let lockTimer: number | undefined

    const isBudgetsStep = step === 'budgets'
    const isNotificationsStep = step === 'notifications'

    scrollTimer = window.setTimeout(() => {
      if (isNotificationsStep) {
        applyTourLock('fixed')
        return
      }

      const anchor = getScrollAnchor(step)
      if (!anchor) return

      smoothScrollToElement(anchor, ONBOARDING_SCROLL_DURATION_MS, 96)

      lockTimer = window.setTimeout(() => {
        applyTourLock(isBudgetsStep ? 'body-only' : 'fixed')
      }, ONBOARDING_SCROLL_DURATION_MS + 80)
    }, ONBOARDING_SCROLL_DELAY_MS)

    return () => {
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer)
      if (lockTimer !== undefined) window.clearTimeout(lockTimer)
      releaseTourLock()
    }
  }, [active, step, isLoading])

  useEffect(() => () => releaseTourLock(), [])
}
