/**
 * Configuración centralizada para Supabase
 * 
 * Este archivo centraliza todas las variables de entorno y configuraciones
 * relacionadas con Supabase para evitar duplicación y facilitar mantenimiento.
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */

// Validación de variables de entorno requeridas
const requiredEnvVars = {
  // Variables públicas (accesibles en browser)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Variables privadas (solo server-side)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
} as const

// Validar que las variables críticas existan
function validateEnvironmentVariables() {
  const missing: string[] = []
  
  // Validar variables públicas (siempre requeridas)
  if (!requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  // Validar variables privadas (solo en server-side)
  if (typeof window === 'undefined') {
    if (!requiredEnvVars.SUPABASE_URL) {
      missing.push('SUPABASE_URL')
    }
    if (!requiredEnvVars.SUPABASE_ANON_KEY) {
      missing.push('SUPABASE_ANON_KEY')
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all variables are set correctly.'
    )
  }
}

// Ejecutar validación al importar el módulo
validateEnvironmentVariables()

/**
 * Configuración para cliente browser (client-side)
 * Usa variables NEXT_PUBLIC_ que son seguras para el navegador
 */
export const browserConfig = {
  url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const

/**
 * Configuración para cliente server (server-side)
 * Usa variables privadas que no se exponen al navegador
 */
export const serverConfig = {
  url: requiredEnvVars.SUPABASE_URL!,
  anonKey: requiredEnvVars.SUPABASE_ANON_KEY!,
} as const

/**
 * Configuración para cliente middleware (edge runtime)
 * Usa variables NEXT_PUBLIC_ ya que el middleware corre en edge runtime
 */
export const middlewareConfig = {
  url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const

/**
 * Configuraciones comunes para todos los clientes
 */
export const commonConfig = {
  auth: {
    // Configuración de autenticación
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  
  // Configuración de realtime (opcional)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
} as const

/**
 * Tipos para configuración de Supabase
 */
export type SupabaseConfig = {
  url: string
  anonKey: string
}

export type ClientType = 'browser' | 'server' | 'middleware'

/**
 * Obtener configuración según el tipo de cliente
 */
export function getSupabaseConfig(clientType: ClientType): SupabaseConfig {
  switch (clientType) {
    case 'browser':
      return browserConfig
    case 'server':
      return serverConfig
    case 'middleware':
      return middlewareConfig
    default:
      throw new Error(`Unknown Supabase client type: ${clientType}`)
  }
}
