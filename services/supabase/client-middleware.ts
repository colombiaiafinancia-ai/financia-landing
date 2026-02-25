/**
 * Cliente Supabase para Middleware (Edge Runtime)
 * 
 * Este cliente está optimizado para uso en Next.js middleware:
 * - Corre en Edge Runtime (limitaciones de APIs)
 * - Manejo especial de cookies en requests/responses
 * - Optimizado para verificación rápida de autenticación
 * - Sin acceso a Node.js APIs
 * 
 * CUÁNDO USAR:
 * ✅ En middleware.ts de Next.js
 * ✅ Para verificación de autenticación en rutas
 * ✅ Para redirecciones basadas en auth
 * ✅ Para manejo de cookies en edge runtime
 * 
 * CUÁNDO NO USAR:
 * ❌ En API routes (usar client-server.ts)
 * ❌ En hooks de React (usar client-browser.ts)
 * ❌ En Server Components (usar client-server.ts)
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { middlewareConfig, commonConfig } from './config'
import { 
  MiddlewareSupabaseClient, 
  MiddlewareContext,
  ClientOptions, 
  DEFAULT_LOGGING_CONFIG,
  SupabaseError,
  SUPABASE_ERRORS,
  isRefreshTokenError,
  AuthResult 
} from './types'

/**
 * Crear cliente Supabase para middleware
 * 
 * Crea una instancia optimizada para Edge Runtime con manejo
 * especial de cookies entre request y response.
 * 
 * @param request - Request de Next.js
 * @param response - Response de Next.js (opcional)
 * @returns Cliente Supabase configurado para middleware
 */
export function getMiddlewareSupabaseClient(
  request: NextRequest,
  response?: NextResponse
): MiddlewareSupabaseClient {
  logDebug('Creating middleware Supabase client')

  try {
    const client = createServerClient(
      middlewareConfig.url,
      middlewareConfig.anonKey,
      {
        auth: {
          ...commonConfig.auth,
          // En middleware, configuraciones más conservadoras
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false, // No necesario en middleware
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Si hay response, también setear ahí para el cliente
            if (response) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            }
          },
        },
      }
    )

    logDebug('Middleware Supabase client created successfully')
    return client

  } catch (error) {
    logError('Failed to create middleware Supabase client', error)
    throw new SupabaseError(
      SUPABASE_ERRORS.NETWORK_ERROR,
      'Failed to initialize middleware Supabase client',
      error instanceof Error ? error : new Error(String(error)),
      { config: middlewareConfig }
    )
  }
}

/**
 * Verificar autenticación en middleware
 * 
 * Función optimizada para verificar rápidamente si un usuario
 * está autenticado en el contexto de middleware.
 * 
 * @param request - Request de Next.js
 * @param response - Response de Next.js (opcional)
 * @returns Resultado de autenticación
 */
export async function verifyMiddlewareAuth(
  request: NextRequest,
  response?: NextResponse
): Promise<AuthResult> {
  try {
    const client = getMiddlewareSupabaseClient(request, response)

    // 1) En middleware: usar sesión (no revienta si no hay)
    const { data: { session }, error: sessionError } = await client.auth.getSession()

    if (sessionError) {
      if (isRefreshTokenError(sessionError)) {
        logDebug('Refresh token error in middleware, user not authenticated')
        return { user: null, session: null, error: null }
      }

      logError('Auth error in middleware', sessionError)
      return { user: null, session: null, error: sessionError }
    }

    // 2) Sin sesión => no autenticado (sin error)
    if (!session) {
      return { user: null, session: null, error: null }
    }

    // 3) Con sesión => user disponible
    const user = session.user ?? null

    logDebug('Auth verification completed', { hasUser: !!user, hasSession: !!session })
    return { user, session, error: null }

  } catch (error) {
    logError('Unexpected error during auth verification', error)
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}
/**
 * Actualizar sesión en middleware
 * 
 * Maneja la actualización de sesión y cookies en el contexto
 * de middleware, asegurando que los tokens se mantengan válidos.
 * 
 * @param request - Request de Next.js
 * @returns Response actualizado con cookies de sesión
 */
export async function updateMiddlewareSession(request: NextRequest): Promise<NextResponse> {
  try {
    // Crear response inicial
    let response = NextResponse.next({ request })
    
    // Crear cliente con el response para manejo de cookies
    const client = getMiddlewareSupabaseClient(request, response)
    
    // Intentar obtener usuario para forzar refresh si es necesario
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error && !isRefreshTokenError(error)) {
      logError('Error updating session in middleware', error)
    }
    
    logDebug('Session update completed', { hasUser: !!user })
    return response

  } catch (error) {
    logError('Unexpected error updating session', error)
    
    // En caso de error, retornar response básico
    return NextResponse.next({ request })
  }
}

/**
 * Limpiar cookies de autenticación en middleware
 * 
 * Utilidad para limpiar cookies cuando hay errores de autenticación
 * o cuando el usuario hace logout.
 * 
 * @param response - Response de Next.js
 * @returns Response con cookies limpiadas
 */
export function clearMiddlewareAuthCookies(response: NextResponse): NextResponse {
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'sb-auth-token'
  ]
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
  })
  
  logDebug('Auth cookies cleared from response')
  return response
}

/**
 * Verificar si una ruta requiere autenticación
 * 
 * Utilidad para determinar si una ruta específica requiere
 * que el usuario esté autenticado.
 * 
 * @param pathname - Ruta a verificar
 * @returns true si la ruta requiere autenticación
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/api/protected',
  ]
  
  const protectedPatterns = [
    /^\/dashboard\/.*/,
    /^\/api\/(?!auth\/).*/,  // Todas las API routes excepto /api/auth/*
  ]
  
  // Verificar rutas exactas
  if (protectedRoutes.includes(pathname)) {
    return true
  }
  
  // Verificar patrones
  return protectedPatterns.some(pattern => pattern.test(pathname))
}

/**
 * Verificar si una ruta es de autenticación
 * 
 * Utilidad para determinar si una ruta es parte del flujo de auth
 * (login, register, etc.) donde usuarios autenticados deberían ser redirigidos.
 * 
 * @param pathname - Ruta a verificar
 * @returns true si es una ruta de autenticación
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]
  
  return authRoutes.includes(pathname) || pathname.startsWith('/auth/')
}

// Funciones de logging internas
function logDebug(message: string, data?: any): void {
  if (DEFAULT_LOGGING_CONFIG.enabled && DEFAULT_LOGGING_CONFIG.level === 'debug') {
    console.debug(`${DEFAULT_LOGGING_CONFIG.prefix}[Middleware]`, message, data || '')
  }
}

function logInfo(message: string, data?: any): void {
  if (DEFAULT_LOGGING_CONFIG.enabled) {
    console.info(`${DEFAULT_LOGGING_CONFIG.prefix}[Middleware]`, message, data || '')
  }
}

function logError(message: string, error?: any): void {
  console.error(`${DEFAULT_LOGGING_CONFIG.prefix}[Middleware]`, message, error || '')
}

/**
 * Export por defecto para compatibilidad
 */
export default getMiddlewareSupabaseClient
