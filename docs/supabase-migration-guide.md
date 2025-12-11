# Guía de Migración - Infraestructura Supabase

## Resumen

Esta guía explica cómo migrar del código legacy de Supabase a la nueva infraestructura centralizada, paso a paso y sin romper funcionalidad existente.

---

## Estado Actual (Post Fase 1)

### ✅ Disponible - Nueva Infraestructura

```typescript
// Nuevos clientes especializados
import { getBrowserSupabaseClient } from '@/services/supabase'
import { getServerSupabaseClient } from '@/services/supabase'  
import { getMiddlewareSupabaseClient } from '@/services/supabase'
```

### ✅ Funcional - Código Legacy

```typescript
// Código existente sigue funcionando
import { createSupabaseClient } from '@/utils/supabase/client'
import { createSupabaseClient } from '@/utils/supabase/server'
```

---

## Guía de Migración por Tipo de Archivo

### 1. Hooks de React

#### Antes (Legacy)
```typescript
// hooks/useAuth.ts
import { createSupabaseClient } from '@/utils/supabase/client'

export function useAuth() {
  const supabase = createSupabaseClient()
  // ...
}
```

#### Después (Recomendado)
```typescript
// hooks/useAuth.ts
import { getBrowserSupabaseClient } from '@/services/supabase'

export function useAuth() {
  const supabase = getBrowserSupabaseClient()
  // ...
}
```

#### Beneficios de Migrar
- ✅ Manejo automático de errores de refresh token
- ✅ Logging contextual para debugging
- ✅ Optimización de rendimiento (singleton)
- ✅ Mejor TypeScript IntelliSense

### 2. API Routes

#### Antes (Legacy)
```typescript
// app/api/auth/route.ts
import { createSupabaseClient } from '@/utils/supabase/server'

export async function POST() {
  const supabase = await createSupabaseClient()
  // ...
}
```

#### Después (Recomendado)
```typescript
// app/api/auth/route.ts
import { getServerSupabaseClient } from '@/services/supabase'

export async function POST() {
  const supabase = await getServerSupabaseClient()
  // ...
}
```

#### Beneficios de Migrar
- ✅ Manejo robusto de cookies
- ✅ Cliente administrativo disponible
- ✅ Validación de autenticación integrada
- ✅ Mejor manejo de errores

### 3. Server Actions

#### Antes (Legacy)
```typescript
// actions/auth.ts
import { createSupabaseClient } from '@/utils/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseClient()
  // ...
}
```

#### Después (Recomendado)
```typescript
// actions/auth.ts
import { getServerSupabaseClient, validateServerAuth } from '@/services/supabase'

export async function signUp(formData: FormData) {
  const supabase = await getServerSupabaseClient()
  // Bonus: validación automática si es necesaria
  // const user = await validateServerAuth()
  // ...
}
```

### 4. Middleware (Ya Migrado ✅)

El middleware ya fue migrado en Fase 1 y usa la nueva infraestructura:

```typescript
// middleware.ts
import { verifyMiddlewareAuth } from '@/services/supabase'

export async function middleware(request: NextRequest) {
  const authResult = await verifyMiddlewareAuth(request)
  // ...
}
```

---

## Funciones de Utilidad Disponibles

### Browser Client

```typescript
import { 
  getBrowserSupabaseClient,
  getCurrentUser,
  getCurrentSession,
  resetBrowserClient 
} from '@/services/supabase'

// Cliente básico
const client = getBrowserSupabaseClient()

// Obtener usuario actual (con manejo de errores)
const user = await getCurrentUser()

// Obtener sesión actual (con manejo de errores)  
const session = await getCurrentSession()

// Resetear cliente (útil para testing)
resetBrowserClient()
```

### Server Client

```typescript
import { 
  getServerSupabaseClient,
  getServerUser,
  getServerSession,
  getServerSupabaseAdmin,
  validateServerAuth 
} from '@/services/supabase'

// Cliente básico
const client = await getServerSupabaseClient()

// Obtener usuario (con manejo de errores)
const user = await getServerUser()

// Obtener sesión (con manejo de errores)
const session = await getServerSession()

// Cliente administrativo (bypass RLS)
const adminClient = await getServerSupabaseAdmin()

// Validar autenticación (lanza error si no está autenticado)
const user = await validateServerAuth()
const adminUser = await validateServerAuth('admin') // Con rol específico
```

### Middleware Client

```typescript
import { 
  verifyMiddlewareAuth,
  clearMiddlewareAuthCookies,
  isProtectedRoute,
  isAuthRoute 
} from '@/services/supabase'

// Verificar autenticación
const authResult = await verifyMiddlewareAuth(request, response)

// Limpiar cookies problemáticas
response = clearMiddlewareAuthCookies(response)

// Utilidades de rutas
const needsAuth = isProtectedRoute('/dashboard/settings')
const isLogin = isAuthRoute('/login')
```

---

## Manejo de Errores Mejorado

### Antes (Manual)
```typescript
try {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    if (error.message.includes('Invalid Refresh Token')) {
      // Manejo manual complejo
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      // ... más código manual
    }
    console.error('Auth error:', error)
  }
} catch (err) {
  console.error('Unexpected error:', err)
}
```

### Después (Automático)
```typescript
// El manejo de errores es automático
const user = await getCurrentUser() // null si hay error de refresh token
const session = await getCurrentSession() // null si hay error

// O usar el cliente directamente (manejo automático interno)
const client = getBrowserSupabaseClient()
const { data: { user }, error } = await client.auth.getUser()
// Los errores de refresh token se manejan automáticamente
```

---

## Configuración Centralizada

### Variables de Entorno Validadas

La nueva infraestructura valida automáticamente las variables de entorno:

```typescript
// Si falta alguna variable, obtienes un error claro:
// "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL"
```

Variables requeridas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_URL` (server-side)
- `SUPABASE_ANON_KEY` (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` (opcional, para admin)

### Configuración Personalizada

```typescript
import { getBrowserSupabaseClient } from '@/services/supabase'

// Con opciones personalizadas
const client = getBrowserSupabaseClient({
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: true,
})
```

---

## Plan de Migración Recomendado

### Prioridad Alta (Migrar Primero)
1. **Hooks críticos** (`useAuth`, `useTransactions`)
2. **API routes de autenticación** (`/api/auth/*`)
3. **Middleware** (ya migrado ✅)

### Prioridad Media (Migrar Después)
1. **Hooks de features** (`useBudgets`, `useCategories`)
2. **API routes de datos** (`/api/transactions/*`)
3. **Server actions** (`actions/auth.ts`)

### Prioridad Baja (Migrar Al Final)
1. **Componentes simples**
2. **Utilidades menores**
3. **Tests**

### Cronograma Sugerido

**Semana 1**: Hooks críticos + API auth
**Semana 2**: Hooks de features + API datos  
**Semana 3**: Server actions + componentes
**Semana 4**: Testing + limpieza

---

## Verificación de Migración

### Checklist por Archivo Migrado

- [ ] ✅ Imports actualizados
- [ ] ✅ Funcionalidad idéntica
- [ ] ✅ Manejo de errores mejorado
- [ ] ✅ No errores de TypeScript
- [ ] ✅ Tests pasando (si existen)

### Comando de Verificación

```bash
# Buscar imports legacy que faltan migrar
grep -r "from '@/utils/supabase" --include="*.ts" --include="*.tsx" .

# Buscar createSupabaseClient legacy
grep -r "createSupabaseClient" --include="*.ts" --include="*.tsx" .
```

### Testing de Migración

```typescript
// Antes de migrar: probar funcionalidad
// Después de migrar: probar que sigue funcionando igual

// Ejemplo para hooks
import { renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'

test('useAuth works after migration', () => {
  const { result } = renderHook(() => useAuth())
  // Verificar que funciona igual que antes
})
```

---

## Troubleshooting

### Error: "Cannot use getBrowserSupabaseClient in server environment"

**Causa**: Intentando usar cliente browser en servidor

**Solución**:
```typescript
// ❌ Incorrecto
import { getBrowserSupabaseClient } from '@/services/supabase'
// En API route o Server Component

// ✅ Correcto  
import { getServerSupabaseClient } from '@/services/supabase'
```

### Error: "Missing required Supabase environment variables"

**Causa**: Variables de entorno no configuradas

**Solución**: Verificar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_URL=https://xxx.supabase.co  
SUPABASE_ANON_KEY=eyJxxx
```

### Error: Refresh token issues persisten

**Causa**: Cookies corruptas en browser

**Solución**:
```typescript
import { resetBrowserClient } from '@/services/supabase'

// Resetear cliente y limpiar cookies
resetBrowserClient()
// O manualmente limpiar cookies del browser
```

---

## Beneficios Post-Migración

### Inmediatos
- ✅ Manejo automático de errores de refresh token
- ✅ Logging contextual para debugging
- ✅ Mejor rendimiento (clientes optimizados)
- ✅ TypeScript IntelliSense mejorado

### A Largo Plazo  
- ✅ Base sólida para Fase 2 (Services Layer)
- ✅ Código más mantenible y testeable
- ✅ Facilita trabajo en equipo
- ✅ Preparado para escalabilidad

---

## Soporte

### Durante la Migración

El código legacy **seguirá funcionando** durante toda la migración. No hay prisa por migrar todo de una vez.

### Después de Fase 2

Una vez completada la Fase 2 (Services Layer), se eliminará el código legacy de `utils/supabase/`.

### Documentación Adicional

- [Architecture.md](./architecture.md) - Visión general de la arquitectura
- [Services Guide](./services-guide.md) - Guía de servicios (Fase 2)
- [Features Guide](./features-guide.md) - Guía de features (Fase 3)

---

*Guía actualizada: Diciembre 2025*  
*Próxima actualización: Inicio de Fase 2*
