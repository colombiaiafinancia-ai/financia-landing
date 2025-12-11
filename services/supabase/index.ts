/**
 * Punto de entrada para la infraestructura de Supabase
 * 
 * Este archivo centraliza todos los exports de la infraestructura
 * de Supabase para facilitar imports y mantener consistencia.
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */

// Configuración
export * from './config'
export * from './types'

// Clientes especializados
export {
  getBrowserSupabaseClient,
  getCurrentUser,
  getCurrentSession,
  resetBrowserClient,
  createSupabaseClient as createBrowserClient, // Alias legacy
} from './client-browser'

export {
  getServerSupabaseClient,
  getServerUser,
  getServerSession,
  getServerSupabaseAdmin,
  validateServerAuth,
  createSupabaseClient as createServerClient, // Alias legacy
} from './client-server'

export {
  getMiddlewareSupabaseClient,
  verifyMiddlewareAuth,
  updateMiddlewareSession,
  clearMiddlewareAuthCookies,
  isProtectedRoute,
  isAuthRoute,
} from './client-middleware'

// Re-exports de tipos importantes para conveniencia
export type {
  BrowserSupabaseClient,
  ServerSupabaseClient,
  MiddlewareSupabaseClient,
  ClientOptions,
  AuthResult,
  SupabaseErrorType,
} from './types'

/**
 * Funciones de conveniencia para detectar entorno y usar cliente apropiado
 */

/**
 * Obtener cliente Supabase apropiado según el entorno
 * 
 * NOTA: Esta función es para casos especiales. En general,
 * es mejor usar el cliente específico para cada entorno.
 * 
 * @returns Cliente apropiado para el entorno actual
 */
export function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    // Browser environment
    return getBrowserSupabaseClient()
  } else {
    // Server environment - requiere await
    throw new Error(
      'getSupabaseClient() cannot be used in server environment. ' +
      'Use getServerSupabaseClient() instead (requires await).'
    )
  }
}

/**
 * Verificar si estamos en entorno browser
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Verificar si estamos en entorno server
 */
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined'
}

/**
 * Guía de uso rápida (comentarios para desarrolladores)
 * 
 * BROWSER (hooks, componentes client-side):
 * ```typescript
 * import { getBrowserSupabaseClient } from '@/services/supabase'
 * const client = getBrowserSupabaseClient()
 * ```
 * 
 * SERVER (API routes, server components, actions):
 * ```typescript
 * import { getServerSupabaseClient } from '@/services/supabase'
 * const client = await getServerSupabaseClient()
 * ```
 * 
 * MIDDLEWARE (middleware.ts):
 * ```typescript
 * import { getMiddlewareSupabaseClient } from '@/services/supabase'
 * const client = getMiddlewareSupabaseClient(request, response)
 * ```
 */
