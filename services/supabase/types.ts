/**
 * Tipos compartidos para la infraestructura de Supabase
 * 
 * Este archivo centraliza todos los tipos relacionados con Supabase
 * para mantener consistencia entre los diferentes clientes.
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Tipo base para el cliente Supabase
 * Extiende el cliente oficial con nuestras customizaciones
 */
export type BaseSupabaseClient = SupabaseClient

/**
 * Cliente Supabase para uso en browser (client-side)
 * - Usado en hooks, componentes React
 * - Maneja estado de autenticación en el navegador
 * - Acceso a localStorage para persistencia de sesión
 */
export type BrowserSupabaseClient = BaseSupabaseClient

/**
 * Cliente Supabase para uso en server (server-side)
 * - Usado en API routes, Server Components, actions
 * - Maneja cookies de servidor para autenticación
 * - No tiene acceso a localStorage
 */
export type ServerSupabaseClient = BaseSupabaseClient

/**
 * Cliente Supabase para uso en middleware (edge runtime)
 * - Usado exclusivamente en middleware de Next.js
 * - Optimizado para edge runtime (limitaciones de APIs)
 * - Manejo especial de cookies en requests/responses
 */
export type MiddlewareSupabaseClient = BaseSupabaseClient

/**
 * Contexto de middleware para manejo de cookies
 */
export interface MiddlewareContext {
  request: NextRequest
  response?: NextResponse
}

/**
 * Resultado de operaciones de autenticación
 */
export interface AuthResult {
  user: any | null
  session: any | null
  error: Error | null
}

/**
 * Configuración de cookies para diferentes entornos
 */
export interface CookieConfig {
  name: string
  value: string
  options?: {
    domain?: string
    expires?: Date
    httpOnly?: boolean
    maxAge?: number
    path?: string
    sameSite?: 'strict' | 'lax' | 'none'
    secure?: boolean
  }
}

/**
 * Opciones para creación de clientes Supabase
 */
export interface ClientOptions {
  /**
   * Si debe manejar cookies automáticamente
   * @default true
   */
  autoHandleCookies?: boolean
  
  /**
   * Si debe refrescar tokens automáticamente
   * @default true
   */
  autoRefreshToken?: boolean
  
  /**
   * Si debe persistir la sesión
   * @default true
   */
  persistSession?: boolean
  
  /**
   * Si debe detectar sesión en URL (para magic links)
   * @default true
   */
  detectSessionInUrl?: boolean
}

/**
 * Errores comunes de Supabase que manejamos especialmente
 */
export const SUPABASE_ERRORS = {
  INVALID_REFRESH_TOKEN: 'Invalid Refresh Token',
  REFRESH_TOKEN_NOT_FOUND: 'Refresh Token Not Found',
  SESSION_NOT_FOUND: 'Session not found',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  NETWORK_ERROR: 'Network error',
} as const

export type SupabaseErrorType = typeof SUPABASE_ERRORS[keyof typeof SUPABASE_ERRORS]

/**
 * Wrapper para errores de Supabase con contexto adicional
 */
export class SupabaseError extends Error {
  public readonly type: SupabaseErrorType
  public readonly originalError?: Error
  public readonly context?: Record<string, any>
  
  constructor(
    type: SupabaseErrorType,
    message?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message || type)
    this.name = 'SupabaseError'
    this.type = type
    this.originalError = originalError
    this.context = context
  }
}

/**
 * Utilidad para verificar si un error es de tipo Supabase
 */
export function isSupabaseError(error: any): error is SupabaseError {
  return error instanceof SupabaseError
}

/**
 * Utilidad para verificar si un error es de refresh token
 */
export function isRefreshTokenError(error: any): boolean {
  // 1) Si es nuestro wrapper
  if (isSupabaseError(error)) {
    return (
      error.type === SUPABASE_ERRORS.INVALID_REFRESH_TOKEN ||
      error.type === SUPABASE_ERRORS.REFRESH_TOKEN_NOT_FOUND
    )
  }

  // 2) Si viene de supabase-js: AuthApiError suele traer "code"
  const code = error?.code
  if (code) {
    return (
      code === 'refresh_token_not_found' ||
      code === 'invalid_refresh_token'
    )
  }

  // 3) Fallback por mensaje
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('refresh token') &&
    (message.includes('invalid') || message.includes('not found'))
  )
}
/**
 * Configuración de logging para diferentes entornos
 */
export interface LoggingConfig {
  enabled: boolean
  level: 'error' | 'warn' | 'info' | 'debug'
  prefix: string
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: 'info',
  prefix: '[Supabase]',
}
