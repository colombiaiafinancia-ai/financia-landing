/**
 * Cliente Supabase para Middleware (Edge Runtime)
 * 
 * Este cliente está optimizado para uso en Next.js middleware:
 * - Corre en Edge Runtime (limitaciones de APIs)
 * - Manejo especial de cookies en requests/responses
 * - Optimizado para verificación rápida de autenticación
 * - Sin acceso a Node.js APIs
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { middlewareConfig, commonConfig } from './config'
import { 
  MiddlewareSupabaseClient, 
  DEFAULT_LOGGING_CONFIG,
  SupabaseError,
  SUPABASE_ERRORS,
  isRefreshTokenError,
  AuthResult 
} from './types'

/**
 * Crear cliente Supabase para middleware
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
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
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
 */
export async function verifyMiddlewareAuth(
  request: NextRequest,
  response?: NextResponse
): Promise<AuthResult> {
  try {
    const client = getMiddlewareSupabaseClient(request, response)

    const { data: { session }, error: sessionError } = await client.auth.getSession()

    if (sessionError) {
      if (isRefreshTokenError(sessionError)) {
        logDebug('Refresh token error in middleware, user not authenticated')
        return { user: null, session: null, error: null }
      }
      logError('Auth error in middleware', sessionError)
      return { user: null, session: null, error: sessionError }
    }

    if (!session) {
      return { user: null, session: null, error: null }
    }

    const { data: { user }, error: userError } = await client.auth.getUser()
    
    if (userError) {
      if (isRefreshTokenError(userError)) {
        logDebug('Refresh token error in middleware while fetching user')
        return { user: null, session: null, error: null }
      }
      logError('Auth error in middleware (getUser)', userError)
      return { user: null, session: null, error: userError }
    }

    logDebug('Auth verification completed', { hasUser: !!user, hasSession: !!session })
    return { user: user ?? null, session, error: null }

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
 */
export async function updateMiddlewareSession(request: NextRequest): Promise<NextResponse> {
  try {
    let response = NextResponse.next({ request })
    const client = getMiddlewareSupabaseClient(request, response)
    const { data: { user }, error } = await client.auth.getUser()
    if (error && !isRefreshTokenError(error)) {
      logError('Error updating session in middleware', error)
    }
    logDebug('Session update completed', { hasUser: !!user })
    return response
  } catch (error) {
    logError('Unexpected error updating session', error)
    return NextResponse.next({ request })
  }
}

/**
 * Limpiar cookies de autenticación en middleware
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
    /^\/api\/(?!auth\/).*/,
  ]
  if (protectedRoutes.includes(pathname)) return true
  return protectedPatterns.some(pattern => pattern.test(pathname))
}

/**
 * Verificar si una ruta es de autenticación
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

function logError(message: string, error?: any): void {
  console.error(`${DEFAULT_LOGGING_CONFIG.prefix}[Middleware]`, message, error || '')
}

export default getMiddlewareSupabaseClient