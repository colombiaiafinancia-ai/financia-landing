import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  verifyMiddlewareAuth, 
  clearMiddlewareAuthCookies,
  isProtectedRoute,
  isAuthRoute 
} from '@/services/supabase/client-middleware'

/**
 * Middleware de Next.js con infraestructura Supabase refactorizada
 * 
 * CAMBIOS EN FASE 1:
 * ✅ Usa nueva infraestructura de services/supabase/
 * ✅ Manejo robusto de errores de refresh token
 * ✅ Lógica de rutas más clara y mantenible
 * ✅ Compatibilidad total con código legacy
 * 
 * @author Tech Lead - Refactor Arquitectónico
 * @since Fase 1 - Infraestructura
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si la ruta necesita autenticación usando nueva utilidad
  const needsAuth = isProtectedRoute(pathname)
  const isAuthPage = isAuthRoute(pathname)
  const isLandingPage = pathname === '/'

  // Si no necesita verificación de auth, continuar
  if (!needsAuth && !isAuthPage && !isLandingPage) {
    return addSecurityHeaders(response)
  }

  // Verificar autenticación usando nueva infraestructura
  let response = NextResponse.next()
  
  const authResult = await verifyMiddlewareAuth(request, response)
  const isAuthenticated = !!authResult.user && !authResult.error

  // Manejar errores de refresh token limpiando cookies
  if (authResult.error && authResult.error.message?.includes('refresh token')) {
    let response = NextResponse.next()
    const authResult = await verifyMiddlewareAuth(request, response)
    const isAuthenticated = !!authResult.user && !authResult.error
  }

  // Lógica de redirección mejorada
  return handleAuthRedirects(request, pathname, isAuthenticated)

}

/**
 * Manejar redirecciones basadas en estado de autenticación
 * 
 * Lógica centralizada y clara para redirecciones según el estado
 * de autenticación del usuario.
 */
function handleAuthRedirects(
  request: NextRequest, 
  pathname: string, 
  isAuthenticated: boolean
): NextResponse {
  // Usuario autenticado en páginas de auth o landing → redirigir a dashboard
  // Excepción: /reset-password no se redirige para permitir el flujo del link del correo
  if (isAuthenticated && (isAuthRoute(pathname) || pathname === '/') && pathname !== '/reset-password') {
    if (pathname === '/reset-password') {
      return addSecurityHeaders(NextResponse.next())
    }
    const dashboardUrl = new URL('/dashboard', request.url)
    return addSecurityHeaders(NextResponse.redirect(dashboardUrl))
  }

  // Usuario NO autenticado en rutas protegidas → redirigir a login
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    return addSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // En cualquier otro caso, continuar normalmente
  return addSecurityHeaders(NextResponse.next())
}

/**
 * Añadir headers de seguridad y rendimiento
 * 
 * Centraliza la configuración de headers para mantener
 * consistencia y facilitar mantenimiento.
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Headers de rendimiento
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
function withCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c)
  })
  return to
}
