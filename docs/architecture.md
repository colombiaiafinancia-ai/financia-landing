# Arquitectura del Proyecto - Next.js + Supabase

## Resumen Ejecutivo

Este documento describe la arquitectura refactorizada del proyecto FinancIA, enfocándose en la nueva infraestructura de Supabase y la separación de responsabilidades por capas.

**Fecha de inicio del refactor**: Diciembre 2025  
**Fase actual**: Fase 1 - Infraestructura Supabase  
**Autor**: Tech Lead - Refactor Arquitectónico

---

## Problemas Identificados (Estado Anterior)

### 🔴 Problemas Críticos

1. **Supabase Desordenado**
   - Múltiples clientes creados en 7-8 lugares diferentes
   - Lógica duplicada en `utils/supabase/`
   - Inconsistencia entre browser, server y middleware

2. **Hooks Sobrecargados**
   - Mezclan UI state + business logic + data fetching
   - Dificultan testing y mantenimiento
   - Violación del principio de responsabilidad única

3. **Falta de Separación de Capas**
   - No hay distinción clara entre infrastructure, domain y presentation
   - Código de negocio mezclado con código de UI
   - Dificulta escalabilidad y trabajo en equipo

4. **Middleware Frágil**
   - Manejo inconsistente de errores de refresh token
   - Lógica de redirección compleja y difícil de mantener

---

## Arquitectura Objetivo

### Principios de Diseño

1. **Separación de Responsabilidades**: Cada capa tiene una responsabilidad específica
2. **Inversión de Dependencias**: Las capas superiores dependen de abstracciones
3. **Principio Abierto/Cerrado**: Extensible sin modificar código existente
4. **Principio de Responsabilidad Única**: Cada módulo tiene una razón para cambiar

### Estructura de Capas

```
┌─────────────────────────────────────────┐
│           PRESENTATION LAYER            │
│  components/ + hooks/ (UI state only)   │
├─────────────────────────────────────────┤
│          APPLICATION LAYER              │
│     features/ (business logic)          │
├─────────────────────────────────────────┤
│         INFRASTRUCTURE LAYER            │
│    services/supabase/ (data access)     │
└─────────────────────────────────────────┘
```

---

## Fase 1: Infraestructura Supabase

### Objetivos Completados ✅

1. **Centralización de Clientes Supabase**
2. **Manejo Robusto de Errores**
3. **Compatibilidad con Código Legacy**
4. **Middleware Refactorizado**

### Nueva Estructura

```
services/
  supabase/
    ├── config.ts              # Configuración centralizada
    ├── types.ts               # Tipos compartidos
    ├── client-browser.ts      # Cliente para browser/hooks
    ├── client-server.ts       # Cliente para API routes/SSR
    ├── client-middleware.ts   # Cliente para middleware
    └── index.ts               # Punto de entrada
```

### Clientes Especializados

#### 1. Browser Client (`client-browser.ts`)

**Propósito**: Optimizado para entorno del navegador
- Hooks de React (`useState`, `useEffect`)
- Componentes client-side (`'use client'`)
- Suscripciones en tiempo real
- Manejo de localStorage

**Cuándo usar**:
```typescript
// ✅ En hooks personalizados
import { getBrowserSupabaseClient } from '@/services/supabase'
const client = getBrowserSupabaseClient()

// ✅ En componentes client-side
'use client'
const client = getBrowserSupabaseClient()
```

**Cuándo NO usar**:
- API routes → usar `client-server.ts`
- Server Components → usar `client-server.ts`
- Middleware → usar `client-middleware.ts`

#### 2. Server Client (`client-server.ts`)

**Propósito**: Optimizado para entorno del servidor
- API routes de Next.js
- Server Components
- Server Actions
- Acceso a variables privadas

**Cuándo usar**:
```typescript
// ✅ En API routes
import { getServerSupabaseClient } from '@/services/supabase'
const client = await getServerSupabaseClient()

// ✅ En Server Components
const client = await getServerSupabaseClient()
```

**Características especiales**:
- Manejo automático de cookies con `next/headers`
- Cliente administrativo con service role
- Validación de autenticación server-side

#### 3. Middleware Client (`client-middleware.ts`)

**Propósito**: Optimizado para Edge Runtime
- Middleware de Next.js exclusivamente
- Verificación rápida de autenticación
- Manejo de cookies en requests/responses
- Sin acceso a Node.js APIs

**Cuándo usar**:
```typescript
// ✅ Solo en middleware.ts
import { verifyMiddlewareAuth } from '@/services/supabase'
const authResult = await verifyMiddlewareAuth(request)
```

### Beneficios de la Separación

1. **Optimización por Entorno**
   - Cada cliente está optimizado para su runtime específico
   - Mejor rendimiento y menor bundle size

2. **Manejo de Errores Robusto**
   - Errores de refresh token manejados automáticamente
   - Logging contextual por tipo de cliente

3. **Facilita Testing**
   - Cada cliente puede ser mockeado independientemente
   - Tests más focalizados y rápidos

4. **Mejor Developer Experience**
   - IntelliSense específico por entorno
   - Errores de compilación si se usa cliente incorrecto

---

## Compatibilidad con Código Legacy

### Estrategia de Migración

Durante la Fase 1, mantenemos **compatibilidad total** con el código existente:

```typescript
// ✅ Código legacy sigue funcionando
import { createSupabaseClient } from '@/utils/supabase/client'

// ✅ Nueva infraestructura disponible
import { getBrowserSupabaseClient } from '@/services/supabase'
```

### Aliases de Compatibilidad

Cada cliente nuevo exporta aliases para el código legacy:

```typescript
// client-browser.ts
export const createSupabaseClient = getBrowserSupabaseClient // Alias legacy

// client-server.ts  
export const createSupabaseClient = getServerSupabaseClient // Alias legacy
```

### Plan de Migración Incremental

1. **Fase 1** ✅: Crear infraestructura, mantener legacy
2. **Fase 2**: Migrar features uno por uno
3. **Fase 3**: Eliminar código legacy
4. **Fase 4**: Optimizaciones finales

---

## Middleware Refactorizado

### Antes (Problemático)

```typescript
// ❌ Lógica compleja y duplicada
const supabase = createServerClient(/* configuración manual */)
if (error.message.includes('Invalid Refresh Token')) {
  // Manejo manual de cookies
}
```

### Después (Limpio)

```typescript
// ✅ Lógica clara y reutilizable
const authResult = await verifyMiddlewareAuth(request)
if (authResult.error) {
  response = clearMiddlewareAuthCookies(response)
}
```

### Beneficios del Nuevo Middleware

1. **Lógica Declarativa**: Funciones con nombres claros
2. **Manejo Robusto de Errores**: Automático y consistente
3. **Fácil Testing**: Funciones puras y mockeable
4. **Mejor Rendimiento**: Optimizado para Edge Runtime

---

## Próximas Fases

### Fase 2: Services Layer (Planificada)

**Objetivo**: Separar lógica de negocio de lógica de UI

```
services/
  auth/
    ├── auth.service.ts
    ├── auth.types.ts
    └── auth.utils.ts
  transactions/
    ├── transactions.service.ts
    ├── transactions.types.ts
    └── transactions.utils.ts
  budgets/
    ├── budgets.service.ts
    ├── budgets.types.ts
    └── budgets.utils.ts
```

### Fase 3: Features Architecture (Planificada)

**Objetivo**: Organizar código por features, no por tipo de archivo

```
features/
  auth/
    ├── components/
    ├── hooks/
    ├── services/
    └── types/
  transactions/
    ├── components/
    ├── hooks/
    ├── services/
    └── types/
```

### Fase 4: Optimización y Limpieza (Planificada)

**Objetivo**: Eliminar código legacy y optimizar

1. Remover `utils/supabase/`
2. Consolidar tipos duplicados
3. Optimizar bundle size
4. Documentación final

---

## Decisiones Arquitecturales

### ¿Por qué 3 clientes Supabase separados?

**Problema**: Diferentes entornos de ejecución tienen diferentes limitaciones:
- **Browser**: Acceso a localStorage, no a variables privadas
- **Server**: Acceso a variables privadas, manejo de cookies diferente
- **Middleware**: Edge Runtime, APIs limitadas

**Solución**: Un cliente optimizado para cada entorno
- Mejor rendimiento
- Menos errores en runtime
- Código más claro y mantenible

### ¿Por qué mantener compatibilidad legacy?

**Problema**: El proyecto está en producción con deploy automático

**Solución**: Migración incremental
- No romper funcionalidad existente
- Permitir trabajo en paralelo del equipo
- Reducir riesgo de bugs en producción

### ¿Por qué separar por capas?

**Problema**: Código mezclado dificulta escalabilidad

**Solución**: Arquitectura en capas
- Facilita testing
- Permite trabajo en equipo
- Código más mantenible
- Escalabilidad para más features

---

## Métricas de Éxito

### Fase 1 - Completada ✅

- [x] 0 errores de compilación
- [x] 0 funcionalidad rota
- [x] Middleware más robusto
- [x] Código legacy funcional
- [x] Documentación completa

### Métricas Futuras

**Fase 2**:
- Reducir complejidad de hooks en 50%
- Separar 100% de lógica de negocio

**Fase 3**:
- Organizar 100% del código por features
- Eliminar duplicación de código

**Fase 4**:
- Reducir bundle size en 20%
- 100% cobertura de documentación

---

## Conclusiones

La Fase 1 del refactor ha establecido una **base sólida** para el crecimiento futuro del proyecto:

1. **Infraestructura Robusta**: Clientes Supabase especializados y optimizados
2. **Compatibilidad Garantizada**: Código legacy funciona sin cambios
3. **Fundación para Escalabilidad**: Base para features y servicios organizados
4. **Mejor Developer Experience**: Código más claro y fácil de mantener

El proyecto está ahora preparado para **escalar** con más usuarios, más features y más desarrolladores, manteniendo la **calidad** y **mantenibilidad** del código.

---

*Documento actualizado: Diciembre 2025*  
*Próxima revisión: Inicio de Fase 2*
