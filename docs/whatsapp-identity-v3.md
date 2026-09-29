# FinancIA — WhatsApp identidad v3

Estado al 29 de septiembre de 2026: implementación preparada, **sin publicación ni cambio del receptor de producción**. Las pruebas con Meta y la reversión del callback siguen pendientes. No dar por validado el transporte BSUID por haber pasado fixtures.

## Entregables y estado

- Migraciones aplicadas en `cslqdvufvgsxnpwenilc`: `whatsapp_verified_identity`, `whatsapp_atomic_batches_and_uuid_helpers` y `whatsapp_preserve_verified_aliases`. Los archivos versionados están en `supabase/migrations/`.
- Web: elección de username, tarjeta de vinculación y cambio con contraseña, código temporal, estado desde servidor, retorno a `/dashboard#whatsapp` después del login. El teléfono de contacto sigue siendo obligatorio.
- Backend: generación de códigos, estado propio, perfil declarado, resolver, operaciones y transporte común. Desactivado por defecto mediante flags.
- Copias n8n creadas inactivas, con referencias exclusivas a subflujos v3. Los originales se compararon antes y después de importarlas: nodos, conexiones y activación sin cambios.
- Exportaciones privadas originales: `n8n/private/`, excluidas de Git porque contienen cabeceras con credenciales. No adjuntarlas a PR ni a documentación pública.
- Exportaciones revisables sin tokens: `n8n/generated/`. `main.json` usa marcadores para IDs de las copias; el importador los resuelve usando `n8n/import-state.json`.

| Flujo | Original | Copia inactiva |
|---|---|---|
| Principal | `ME1Bja8SRYLJVsf7` | `tl7gipoFs3eGkJEa` |
| Confirmación | `mpwuLhBmIYDfd4fm` | `lF5y8su5akPgOn37` |
| Cancelación | `GmeQZiQXlEVQx1qN` | `AasUdqGn0EDb9IQw` |
| Automated trades | `0tNGQyAJJu8hh3as` | Sin cambios ni copia |

Carpeta verificada en la interfaz: proyecto `B3gYYsM2KvGkA1pa`, carpeta `7bDP1dzY3AJ8iuTq`. Las tres copias se movieron allí y permanecen inactivas. Evidencia: `n8n-whatsapp-v3.png`.

## Cambios en n8n

El trigger nativo autentica `x-hub-signature-256` con el secreto de la app antes de entregar eventos. Se verificó en el [código oficial de n8n 1.110.1](https://github.com/n8n-io/n8n/blob/n8n%401.110.1/packages/nodes-base/nodes/WhatsApp/WhatsAppTrigger.node.ts). Conservar esa credencial y ese trigger; no reemplazarlo por un webhook anónimo.

La entrada llama al normalizador/resolver firmado. Cada mensaje resultante entra en una ejecución individual mediante `Contexto WhatsApp`; esto conserva el significado de los nodos existentes que usan `.first()` o `.all()[0]`. La copia principal se invoca a sí misma con Execute Sub-workflow: el punto de entrada de la subejecución es Execute Workflow Trigger, no WhatsApp Trigger. Esta selección debe comprobarse también en una ejecución de integración antes de activar.

`If` solo deja pasar `process_financial=true`. Las búsquedas iniciales por teléfono quedan desactivadas y desconectadas. `Datos whtas`, audio, texto y botones consumen el evento normalizado; `Get a row` busca por UUID. La segunda rama de imagen continúa desconectada; se conserva el aviso existente de imágenes no admitidas.

`Edit Fields1` conserva la primera interpretación del agente. Antes de continuar por las ramas existentes, `Guardar movimientos del mensaje` aplica todo el lote en una transacción. Las escrituras posteriores consultan el resultado idempotente por mensaje e índice. Confirmación captura ingresos y gastos en una misma transacción; cancelación mantiene la semántica original de eliminar los pendientes capturados, y guarda el resultado para no afectar pendientes posteriores en un reintento.

Todos los envíos pasan por el backend firmado, incluidos texto, botones, avisos de vinculación y recordatorios. Los JSON se construyen con objetos. El transporte reserva una clave de envío antes de llamar a Meta y diferencia aceptación, entrega, fallo y resultado desconocido. Los recibos que llegan antes que la respuesta del envío se guardan y concilian después.

## Configuración pendiente

No insertar secretos en el JSON del workflow ni usar variables públicas de Next.js para ellos.

| Variable | Ubicación | Valor o requisito |
|---|---|---|
| `WHATSAPP_IDENTITY_ENABLED` | Backend | `false` hasta pruebas controladas |
| `NEXT_PUBLIC_WHATSAPP_IDENTITY_ENABLED` | Build web | `false` hasta habilitar UI; requiere reconstruir al cambiar |
| `WHATSAPP_INTERNAL_SECRET` | Backend y proceso/runner n8n | Mismo secreto criptográfico, mínimo 32 bytes; guardar en gestores de secretos |
| `FINANCIA_BACKEND_URL` | n8n | Origen HTTPS del despliegue elegido, sin `/api` |
| `WHATSAPP_BUSINESS_ID` | Backend | Ámbito de negocio verificado con Meta; no inventar ni derivar del teléfono |
| `WHATSAPP_PHONE_NUMBER_ID` | Backend | `681184581749789`, comprobar contra la app real |
| `WHATSAPP_BUSINESS_PHONE` | Backend | `573227031301`, destino del enlace de vinculación |
| `WHATSAPP_GRAPH_VERSION` | Backend | Versión confirmada para texto, botones y plantilla con BSUID |
| `WHATSAPP_ROLLOUT_MODE` | Backend | `test` al inicio; solo `live` tras aceptación |
| `WHATSAPP_TEST_SENDERS` | Backend | Teléfonos/BSUID autorizados para prueba, separados por comas |
| `WHATSAPP_API_KEY` | Backend | Token de Meta existente y vigente |
| `WHATSAPP_REMINDER_TEMPLATE_*` | Backend | Conservar nombre, idioma y parámetros aprobados actuales |
| `NEXT_PUBLIC_SITE_URL` | Backend/web | Origen real de FinancIA para enlaces de retorno |

Mantener también la configuración Supabase, QStash, promociones y pagos existente. Los cambios nuevos no sustituyen sus credenciales.

Los Code nodes usan el módulo integrado `crypto` y dos variables concretas de entorno. Comprobar que están disponibles en el proceso/runner de n8n. Si la instalación los restringe, preparar una credencial/nodo de firma compatible o ajustar la configuración de forma acotada con el administrador; no desactivar globalmente protecciones para resolverlo.

Durante staging mantener ambos flags desactivados en la web pública. Para integración usar un despliegue de prueba con ambos activados y el modo `test`. No activar solo el backend en la web pública con el formulario antiguo: el registro pasaría a exigir una elección que aún no se muestra.

## Validaciones realizadas

| Validación | Resultado |
|---|---|
| `npm run build` | PASS, compilación, TypeScript y 34 páginas |
| `node --experimental-strip-types tools/tests/whatsapp.test.mjs` | 12 PASS: normalización, identidad, lotes, medios, botones, firma, destinatario, entrega, redirect, ámbito de recibos y entradas malformadas |
| `node --experimental-strip-types tools/tests/whatsapp-workflows.test.mjs` | 4 PASS: sintaxis, conexiones, escrituras/envíos centralizados, firma compatible, aislamiento por mensaje |
| `supabase/tests/whatsapp_identity_verification.sql` | PASS en Supabase, transacción revertida íntegramente |
| SQL: duplicados por teléfono de contacto | Perfiles conservan UUID distintos; no autoriza por contacto |
| SQL: vinculación/replay/conflicto/vencimiento | PASS |
| SQL: revincular el mismo remitente conserva el BSUID omitido por Meta | PASS |
| SQL: escritura parcial de lote/repetición/confirmación/cancelación | PASS |
| SQL: helper UUID con BSUID sin teléfono | PASS; no se inventa teléfono |
| SQL: recibo temprano y orden delivered/read/failed | PASS |
| SQL: permisos y versión anterior de identidad | PASS |
| HTTP: start con Origin ajeno | 403 esperado |
| HTTP: status sin sesión | 401 esperado |
| HTTP: resolve/send/operation sin firma | 401 esperado, sin llamadas a Meta |
| API n8n: copias guardadas, inactivas y originales intactos | PASS |
| UI local: registro muestra ambas opciones; campo aparece al elegir Tengo; explicación aparece al elegir No tengo | PASS, sin enviar registro; evidencia `whatsapp-register.png` |

La prueba SQL usa cuentas sintéticas `.invalid`, revierte todos los cambios y no deja perfiles ni movimientos. No equivale a probar dos conexiones simultáneas: el ensayo de concurrencia real sigue pendiente.

Los recibos de entrega conservan el número empresarial del webhook. El resolver valida el ámbito de todo el lote antes de procesar recibos o mensajes; un lote de otro número devuelve 403.

Acceso de despliegue revisado: el repositorio declara Vercel, pero la CLI no tiene sesión/configuración local y el navegador redirige a login. Se requiere iniciar sesión en Vercel para desplegar el backend. No se ha intentado sustituir el proveedor de hosting.

VPS localizado el 29 de septiembre: proyecto `n8n-financia`, VM `n8n-financia`, zona `us-central1-c`, estado en ejecución. El proyecto anterior `n8n-pruebas-drive` no era el VPS. El usuario autorizó una ventana inmediata de prueba y facilitó su celular; la lista local de remitentes de prueba quedó en `.env.local`, sin habilitar flags. La autorización de ventana no sustituye los requisitos de configuración e integración antes del corte. Aún no se ejecutaron comandos en el VPS ni se cambió el receptor.

`node tools/check-whatsapp-config.mjs` comprueba variables locales sin mostrar valores ni realizar solicitudes. Es un requisito de preparación, no una prueba de integración. No activar flags en producción para hacer pasar este chequeo: usar el entorno de pruebas.

## Matriz pendiente para aceptar publicación

- Registro real de cuenta de prueba: con @ y sin @, email de verificación, promociones/trial, teléfono obligatorio.
- Onboarding completo y usuario antiguo: abrir el chat no completa; recargar mantiene estado; continuar en web no marca vinculación; no repetir tour ya terminado.
- Vinculación con teléfono y con BSUID reales; ambos IDs; cambio con reautenticación; perfil declarado distinto al observado; conflicto entre dos cuentas.
- Dos solicitudes simultáneas para el mismo código y dos mensajes del mismo usuario. Fallo de red tras una escritura: no duplicar finanzas ni enviar confirmación antes del guardado.
- Texto, audio, ingresos, gastos, múltiples movimientos, presupuesto, balance, sí/no y botones. Historial y planes web sin regresiones.
- Recordatorio con consentimiento/acceso/vinculación; sin cada requisito; cambio de destinatario después de encolar; lote repetido.
- Meta: aceptación con message ID, delivered/read y rechazo; texto, botones y plantilla mediante BSUID en la versión elegida.
- Fallo del backend antes de resolver, fallo después de resolver y timeout de Meta: observar alerta/estado y recuperación. El trigger nativo acusa recepción antes de que terminen los nodos; comprobar manejo de ejecuciones fallidas y no asumir que Meta repetirá el evento.
- Cambio de callback y restauración del receptor original comprobados con el celular en la ventana acordada.

## Publicación y reversión

1. Confirmar proveedor/acceso del despliegue web y del servidor n8n; definir cuenta, remitente y horario de pruebas. No activar mientras falte configuración.
2. Desplegar backend/UI en staging con variables completas y modo `test`. Verificar firmas válidas, rechazo de replay, y recorridos anteriores con servicios simulados.
3. Confirmar las tres copias en la misma carpeta, sus credenciales cifradas y que principal llama solo a IDs v3. No usar “Execute workflow from WhatsApp Trigger” del editor mientras el original está activo: puede intentar cambiar la suscripción de Meta.
4. En la ventana acordada, guardar callback y configuración de suscripción actuales desde Meta y estados desde n8n. Pausar recordatorios durante el cambio.
5. Desactivar el principal original; comprobar retiro del callback. Activar únicamente el principal v3; comprobar nuevo callback y un evento auténtico. Los subflujos siguen inactivos y se invocan internamente.
6. Probar con el remitente autorizado. Los demás reciben mantenimiento sin finanzas; no reproducir luego sus mensajes automáticamente.
7. Ante conflicto de identidad, duplicados o errores sistemáticos: desactivar principal v3, pausar recordatorios, restaurar principal original y verificar callback/evento real. Volver flags web/backend a `false` y reconstruir la web si cambió el flag público. Conservar SQL aditivo y vinculaciones.
8. Una vez probada la reversión y pasados todos los casos, repetir corte controlado; cambiar modo a `live`, habilitar UI/requisito y reanudar recordatorios con captura de versión de vínculo.

La reversión restaura el comportamiento anterior por teléfono. No proporciona soporte BSUID. No borrar tablas ni columnas como rollback. Los estados `unknown` o `sending` después de un fallo se concilian antes de cualquier reenvío; nunca resetearlos masivamente a `queued`.

## Reproducción local

### Revisión previa al push (29 de septiembre de 2026)

Se revisaron 221 archivos rastreados o candidatos a Git: no se encontraron coincidencias con los secretos de `.env.local`, JWT literales, claves privadas ni los patrones de tokens de proveedores comprobados. `.env.local`, `n8n/private/` y `supabase/.temp/` están excluidos y no hay archivos de credenciales rastreados en esas rutas. Esta comprobación no sustituye una auditoría del historial Git.

Pasaron las 12 pruebas de identidad y las 4 de workflows. El push de código no configura Vercel ni activa las copias n8n. Para publicar primero con la función oculta, ambas variables `WHATSAPP_IDENTITY_ENABLED` y `NEXT_PUBLIC_WHATSAPP_IDENTITY_ENABLED` deben estar ausentes o en `false` en Vercel. Los valores remotos no se han podido inspeccionar. No forzar la inclusión de exportaciones privadas ni archivos ignorados.

```powershell
node tools/build-whatsapp-workflows.mjs
node --experimental-strip-types tools/tests/whatsapp.test.mjs
node --experimental-strip-types tools/tests/whatsapp-workflows.test.mjs
npx tsc --noEmit
npm run build
```

El generador necesita las exportaciones originales privadas en `$env:TEMP/financia-n8n-identity-audit` o `N8N_BACKUP_DIR`. El importador requiere `N8N_API_KEY` solo en el proceso y verifica los originales; no tiene operación de activación. No regenerar/importar tras cambios manuales a las copias sin revisar primero el diff.
