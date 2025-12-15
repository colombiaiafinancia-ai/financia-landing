/**
 * Cliente Supabase para Server (Server-Side)
 * 
 * Este cliente está optimizado para uso en el servidor:
 * - API routes de Next.js
 * - Server Components
 * - Server Actions
 * - Funciones que corren en Node.js runtime
 * 
 * CUÁNDO USAR:
 * ✅ En API routes (/api/*)
 * ✅ En Server Components (sin 'use client')
 * ✅ En server actions (actions/*)
 * ✅ Para operaciones que requieren variables privadas
 * 
 * CUÁNDO NO USAR:
 * ❌ En hooks de React (usar client-browser.ts)
 * ❌ En componentes client-side (usar client-browser.ts)
 * ❌ En middleware (usar client-middleware.ts)
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */

import { createServerClient } from '@supabase/ssr'
import { serverConfig, commonConfig } from './config'
import { 
  ServerSupabaseClient, 
  ClientOptions, 
  DEFAULT_LOGGING_CONFIG,
  SupabaseError,
  SUPABASE_ERRORS,
  isRefreshTokenError,
  CookieConfig 
} from './types'

/**
 * Crear cliente Supabase para server-side
 * 
 * Crea una nueva instancia del cliente configurada para el entorno servidor.
 * Maneja automáticamente las cookies de autenticación usando Next.js cookies().
 * 
 * @param options - Opciones de configuración del cliente
 * @returns Cliente Supabase configurado para server
 */
export async function getServerSupabaseClient(options: ClientOptions = {}): Promise<ServerSupabaseClient> {
  // Verificar que estamos en el servidor
  if (typeof window !== 'undefined') {
    throw new SupabaseError(
      SUPABASE_ERRORS.NETWORK_ERROR,
      'getServerSupabaseClient() can only be called in server environment',
      undefined,
      { environment: 'browser', function: 'getServerSupabaseClient' }
    )
  }

  // Configuración por defecto
  const clientOptions: ClientOptions = {
    autoHandleCookies: true,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // No necesario en server
    ...options,
  }

  logInfo('Creating server Supabase client', { options: clientOptions })

  try {
    // Importar cookies dinámicamente para evitar errores en build
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()

    // Crear cliente server con manejo de cookies
    const client = createServerClient(
      serverConfig.url,
      serverConfig.anonKey,
      {
        auth: {
          ...commonConfig.auth,
          autoRefreshToken: clientOptions.autoRefreshToken,
          persistSession: clientOptions.persistSession,
          detectSessionInUrl: clientOptions.detectSessionInUrl,
        },
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            if (!clientOptions.autoHandleCookies) return

            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // En algunos contextos (como middleware), no se pueden setear cookies
              // Esto es normal y no debe romper la aplicación
              logDebug('Could not set cookies (this is normal in some contexts)', error)
            }
          },
        },
      }
    )

    logInfo('Server Supabase client created successfully')
    return client

  } catch (error) {
    logError('Failed to create server Supabase client', error)
    throw new SupabaseError(
      SUPABASE_ERRORS.NETWORK_ERROR,
      'Failed to initialize server Supabase client',
      error instanceof Error ? error : new Error(String(error)),
      { config: serverConfig, options: clientOptions }
    )
  }
}

/**
 * Obtener usuario autenticado en el servidor
 * 
 * Wrapper con manejo de errores mejorado para obtener
 * el usuario actual en contexto de servidor.
 * 
 * @param options - Opciones del cliente
 * @returns Usuario actual o null si no está autenticado
 */
export async function getServerUser(options: ClientOptions = {}) {
  try {
    const client = await getServerSupabaseClient(options)
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
    logError('Failed to get server user', error)
    return null
  }
}

/**
 * Obtener sesión en el servidor
 * 
 * Wrapper con manejo de errores para obtener la sesión actual
 * en contexto de servidor.
 * 
 * @param options - Opciones del cliente
 * @returns Sesión actual o null si no existe
 */
export async function getServerSession(options: ClientOptions = {}) {
  try {
    const client = await getServerSupabaseClient(options)
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
    logError('Failed to get server session', error)
    return null
  }
}

/**
 * Crear cliente Supabase administrativo
 * 
 * Cliente con permisos elevados para operaciones administrativas.
 * USAR CON CUIDADO: Solo para operaciones que requieren bypass de RLS.
 * 
 * @param serviceRoleKey - Service role key (variable de entorno)
 * @returns Cliente con permisos administrativos
 */
export async function getServerSupabaseAdmin(serviceRoleKey?: string): Promise<ServerSupabaseClient> {
  const adminKey = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!adminKey) {
    throw new SupabaseError(
      SUPABASE_ERRORS.USER_NOT_AUTHENTICATED,
      'Service role key is required for admin client',
      undefined,
      { missingVar: 'SUPABASE_SERVICE_ROLE_KEY' }
    )
  }

  logInfo('Creating admin Supabase client')

  try {
    // Importar cookies dinámicamente para evitar errores en build
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()

    const client = createServerClient(
      serverConfig.url,
      adminKey, // Usar service role key en lugar de anon key
      {
        auth: {
          autoRefreshToken: false, // No necesario para admin
          persistSession: false,   // No persistir sesiones admin
        },
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No setear cookies para cliente admin
          },
        },
      }
    )

    logInfo('Admin Supabase client created successfully')
    return client

  } catch (error) {
    logError('Failed to create admin Supabase client', error)
    throw new SupabaseError(
      SUPABASE_ERRORS.NETWORK_ERROR,
      'Failed to initialize admin Supabase client',
      error instanceof Error ? error : new Error(String(error))
    )
  }
}

/**
 * Validar que el usuario tiene permisos para una operación
 * 
 * Utilidad para verificar autenticación antes de operaciones críticas.
 * 
 * @param requiredRole - Rol requerido (opcional)
 * @returns Usuario si está autenticado y autorizado
 * @throws SupabaseError si no está autenticado o autorizado
 */
export async function validateServerAuth(requiredRole?: string) {
  const user = await getServerUser()
  
  if (!user) {
    throw new SupabaseError(
      SUPABASE_ERRORS.USER_NOT_AUTHENTICATED,
      'User must be authenticated to perform this operation'
    )
  }
  
  if (requiredRole && user.role !== requiredRole) {
    throw new SupabaseError(
      SUPABASE_ERRORS.USER_NOT_AUTHENTICATED,
      `User must have role '${requiredRole}' to perform this operation`,
      undefined,
      { userRole: user.role, requiredRole }
    )
  }
  
  return user
}

// Funciones de logging internas
function logDebug(message: string, data?: any): void {
  if (DEFAULT_LOGGING_CONFIG.enabled && DEFAULT_LOGGING_CONFIG.level === 'debug') {
    console.debug(`${DEFAULT_LOGGING_CONFIG.prefix}[Server]`, message, data || '')
  }
}

function logInfo(message: string, data?: any): void {
  if (DEFAULT_LOGGING_CONFIG.enabled) {
    console.info(`${DEFAULT_LOGGING_CONFIG.prefix}[Server]`, message, data || '')
  }
}

function logError(message: string, error?: any): void {
  console.error(`${DEFAULT_LOGGING_CONFIG.prefix}[Server]`, message, error || '')
}

/**
 * Export por defecto para compatibilidad con código legacy
 * 
 * NOTA: Este export se mantendrá durante la migración para
 * no romper el código existente. En Fase 2 se actualizarán
 * todos los imports para usar getServerSupabaseClient()
 */
export default getServerSupabaseClient

/**
 * Alias para compatibilidad con código legacy
 * @deprecated Usar getServerSupabaseClient() en su lugar
 */
export const createSupabaseClient = getServerSupabaseClient
