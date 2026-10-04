'use client'

/**
 * Caché en memoria (por pestaña) para los datos del dashboard.
 *
 * - El servidor entrega los datos iniciales con `fetchedAt`.
 * - Cada hook guarda aquí su último resultado.
 * - Al montar, el hook usa la versión más reciente entre la del servidor y la caché
 *   (p. ej. al volver al dashboard desde otra ruta con el Router Cache de Next).
 * - Si esa versión tiene más de `STALE_AFTER_MS`, se revalida en segundo plano
 *   sin mostrar loaders (stale-while-revalidate).
 */

export const STALE_AFTER_MS = 30_000

type Entry = { data: unknown; at: number }

const store = new Map<string, Entry>()

export function dashboardCacheKey(kind: string, userId: string, extra = '') {
  return `${kind}:${userId}${extra ? `:${extra}` : ''}`
}

export function writeDashboardCache<T>(key: string, data: T, at = Date.now()) {
  const current = store.get(key)
  if (current && current.at > at) return
  store.set(key, { data, at })
}

/** Devuelve el dato más reciente entre el del servidor y el de la caché. */
export function resolveInitial<T>(
  key: string | null,
  serverData: T | null | undefined,
  serverAt: number | undefined
): { data: T | null; at: number } {
  const cached = key ? store.get(key) : undefined
  const serverEntry = serverData != null ? { data: serverData, at: serverAt ?? 0 } : null

  if (cached && (!serverEntry || cached.at >= serverEntry.at)) {
    return { data: cached.data as T, at: cached.at }
  }
  if (serverEntry) {
    if (key) writeDashboardCache(key, serverEntry.data, serverEntry.at)
    return serverEntry
  }
  return { data: null, at: 0 }
}

export function isStale(at: number) {
  return Date.now() - at > STALE_AFTER_MS
}

export function clearDashboardCache() {
  store.clear()
}
