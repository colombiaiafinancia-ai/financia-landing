/**
 * Desplaza la ventana hasta la posición vertical objetivo con una animación suave.
 * @param targetY - Posición vertical absoluta (en px) a la que scrollear
 * @param durationMs - Duración de la animación en milisegundos (por defecto 1400)
 * @param offset - Desplazamiento desde el borde superior del viewport (por defecto 24)
 */
export function smoothScrollTo(
  targetY: number,
  durationMs: number = 1400,
  offset: number = 24
): void {
  if (typeof window === 'undefined') return

  const startY = window.scrollY
  const target = Math.max(0, targetY - offset)
  const distance = target - startY

  if (Math.abs(distance) < 5) return

  const startTime = performance.now()

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function tick(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / durationMs, 1)
    const eased = easeInOutCubic(progress)
    window.scrollTo(0, startY + distance * eased)
    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

/**
 * Desplaza hasta un elemento del DOM de forma suave y precisa.
 */
export function smoothScrollToElement(
  element: HTMLElement,
  durationMs: number = 1400,
  offset: number = 24
): void {
  const rect = element.getBoundingClientRect()
  const targetY = rect.top + window.scrollY
  smoothScrollTo(targetY, durationMs, offset)
}
