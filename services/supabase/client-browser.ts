/**
 * Cliente Supabase para Browser (Client-Side)
 * 
 * Este cliente está optimizado para uso en el navegador:
 * - Hooks de React (useState, useEffect)
 * - Componentes client-side
 * - Manejo de estado de autenticación en tiempo real
 * - Acceso a localStorage para persistencia
 * 
 * CUÁNDO USAR:
 * ✅ En hooks personalizados (useAuth, useTransactions)
 * ✅ En componentes con 'use client'
 * ✅ Para suscripciones en tiempo real
 * ✅ Para manejo de estado de UI
 * 
 * CUÁNDO NO USAR:
 * ❌ En API routes (usar client-server.ts)
 * ❌ En Server Components (usar client-server.ts)
 * ❌ En middleware (usar client-middleware.ts)
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */

import { createBrowserClient } from '@supabase/ssr'
import { browserConfig, commonConfig } from './config'
import { 
  BrowserSupabaseClient, 
  ClientOptions, 
  DEFAULT_LOGGING_CONFIG,
  SupabaseError,
  SUPABASE_ERRORS,
  isRefreshTokenError 
} from './types'

/**
 * Instancia singleton del cliente browser
 * Evita crear múltiples conexiones innecesarias
 */
let browserClientInstance: BrowserSupabaseClient | null = null

/**
 * Crear o obtener instancia del cliente Supabase para browser
 * 
 * Implementa patrón singleton para evitar múltiples instancias
 * y optimizar el rendimiento en el lado del cliente.
 * 
 * @param options - Opciones de configuración del cliente
 * @returns Cliente Supabase configurado para browser
 */
export function getBrowserSupabaseClient(options: ClientOptions = {}): BrowserSupabaseClient {
  // Verificar que estamos en el browser
  if (typeof window === 'undefined') {
    throw new SupabaseError(
      SUPABASE_ERRORS.NETWORK_ERROR,
      'getBrowserSupabaseClient() can only be called in browser environment',
      undefined,
      { environment: 'server', function: 'getBrowserSupabaseClient' }
    )
  }

  // Retornar instancia existente si ya fue creada
  if (browserClientInstance) {
    logDebug('Returning existing browser client instance')
    return browserClientInstance
  }

  // Configuración por defecto
  const clientOptions: ClientOptions = {
    autoHandleCookies: true,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    ...options,
  }

  logInfo('Creating new browser Supabase client', { options: clientOptions })

  try {
    // Crear cliente browser con configuración SSR
    browserClientInstance = createBrowserClient(
      browserConfig.url,
      browserConfig.anonKey,
      {
        auth: {
          ...commonConfig.auth,
          autoRefreshToken: clientOptions.autoRefreshToken,
          persistSession: clientOptions.persistSession,
          detectSessionInUrl: clientOptions.detectSessionInUrl,
        },
        realtime: commonConfig.realtime,
      }
    )

    // Configurar manejo de errores de autenticación
    setupAuthErrorHandling(browserClientInstance)

    logInfo('Browser Supabase client created successfully')
    return browserClientInstance

  } catch (error) {
    logError('Failed to create browser Supabase client', error)
    throw new SupabaseError(
      SUPABASE_ERRORS.NETWORK_ERROR,
      'Failed to initialize browser Supabase client',
      error instanceof Error ? error : new Error(String(error)),
      { config: browserConfig, options: clientOptions }
    )
  }
}

/**
 * Configurar manejo especial de errores de autenticación
 * 
 * Maneja automáticamente errores comunes como refresh tokens inválidos
 * para evitar que rompan la experiencia del usuario.
 */
function setupAuthErrorHandling(client: BrowserSupabaseClient): void {
  // Interceptar errores de autenticación
  client.auth.onAuthStateChange((event, session) => {
    logDebug('Auth state changed', { event, hasSession: !!session })
    
    if (event === 'SIGNED_OUT' && !session) {
      // Limpiar datos locales cuando el usuario se desconecta
      clearLocalAuthData()
    }
    
    if (event === 'TOKEN_REFRESHED') {
      logDebug('Token refreshed successfully')
    }
  })
}

/**
 * Limpiar datos de autenticación locales
 * Útil cuando hay errores de refresh token o logout
 */
function clearLocalAuthData(): void {
  try {
    // Limpiar cookies relacionadas con Supabase
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-auth-token'
    ]
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
    
    logDebug('Local auth data cleared')
  } catch (error) {
    logError('Failed to clear local auth data', error)
  }
}

/**
 * Obtener usuario autenticado actual
 * 
 * Wrapper con manejo de errores mejorado para obtener
 * el usuario actual de manera segura.
 * 
 * @returns Usuario actual o null si no está autenticado
 */
export async function getCurrentUser() {
  try {
    const client = getBrowserSupabaseClient()
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error) {
      if (isRefreshTokenError(error)) {
        logDebug('Refresh token error, user not authenticated')
        return null
      }
      throw error
    }
    
    return user
  } catch (error) {
    logError('Failed to get current user', error)
    return null
  }
}

/**
 * Obtener sesión actual
 * 
 * Wrapper con manejo de errores para obtener la sesión actual.
 * 
 * @returns Sesión actual o null si no existe
 */
export async function getCurrentSession() {
  try {
    const client = getBrowserSupabaseClient()
    const { data: { session }, error } = await client.auth.getSession()
    
    if (error) {
      if (isRefreshTokenError(error)) {
        logDebug('Refresh token error, no valid session')
        return null
      }
      throw error
    }
    
    return session
  } catch (error) {
    logError('Failed to get current session', error)
    return null
  }
}

/**
 * Resetear instancia del cliente
 * Útil para testing o cuando se necesita recrear la conexión
 */
export function resetBrowserClient(): void {
  logInfo('Resetting browser client instance')
  browserClientInstance = null
}

// Funciones de logging internas
function logDebug(message: string, data?: any): void {
  if (DEFAULT_LOGGING_CONFIG.enabled && DEFAULT_LOGGING_CONFIG.level === 'debug') {
    console.debug(`${DEFAULT_LOGGING_CONFIG.prefix}[Browser]`, message, data || '')
  }
}

function logInfo(message: string, data?: any): void {
  if (DEFAULT_LOGGING_CONFIG.enabled) {
    console.info(`${DEFAULT_LOGGING_CONFIG.prefix}[Browser]`, message, data || '')
  }
}

function logError(message: string, error?: any): void {
  console.error(`${DEFAULT_LOGGING_CONFIG.prefix}[Browser]`, message, error || '')
}

/**
 * Export por defecto para compatibilidad con código legacy
 * 
 * NOTA: Este export se mantendrá durante la migración para
 * no romper el código existente. En Fase 2 se actualizarán
 * todos los imports para usar getBrowserSupabaseClient()
 */
export default getBrowserSupabaseClient

/**
 * Alias para compatibilidad con código legacy
 * @deprecated Usar getBrowserSupabaseClient() en su lugar
 */
export const createSupabaseClient = getBrowserSupabaseClient
