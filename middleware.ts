import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  verifyMiddlewareAuth,
  clearMiddlewareAuthCookies,
  isProtectedRoute,
  isAuthRoute,
} from '@/services/supabase/client-middleware'
import { isRefreshTokenError } from '@/services/supabase/types'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth = isProtectedRoute(pathname)
  const isAuthPage = isAuthRoute(pathname)
  const isLandingPage = pathname === '/'

// Reset-password: dejar pasar sin verificar auth para permitir el flujo del link del correo.
  if (pathname === '/reset-password') {
    return addSecurityHeaders(NextResponse.next())
  }

 

  
  if (!needsAuth && !isAuthPage && !isLandingPage) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Response compartido para que Supabase pueda setear cookies (refresh, etc.)
  let response = NextResponse.next()

  const authResult = await verifyMiddlewareAuth(request, response)
  const isAuthenticated = !!authResult.user && !authResult.error

  // Si el refresh token es inválido/no existe, limpiamos cookies y seguimos como NO auth
  if (authResult.error && isRefreshTokenError(authResult.error)) {
    response = clearMiddlewareAuthCookies(response)
    return addSecurityHeaders(response)
  }

  // Redirecciones preservando cookies
  return handleAuthRedirects(request, pathname, isAuthenticated, response)
}

function handleAuthRedirects(
  request: NextRequest,
  pathname: string,
  isAuthenticated: boolean,
  response: NextResponse
): NextResponse {
  // Usuario autenticado en páginas de auth o landing → dashboard
  // Excepción: /reset-password para permitir flujo de link del correo
  if (
    isAuthenticated &&
    (isAuthRoute(pathname) || pathname === '/') &&
    pathname !== '/reset-password'
  ) {
    const dashboardUrl = new URL('/dashboard', request.url)
    const redirect = NextResponse.redirect(dashboardUrl)
    return addSecurityHeaders(withCookies(response, redirect))
  }

  // Usuario NO autenticado en rutas protegidas → login
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    const redirect = NextResponse.redirect(loginUrl)
    return addSecurityHeaders(withCookies(response, redirect))
  }

  // En cualquier otro caso, continuar usando el response compartido
  return addSecurityHeaders(response)
}

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

function withCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c)
  })
  return to
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
