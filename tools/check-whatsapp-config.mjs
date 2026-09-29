// Read-only deployment preflight. Never prints configuration values or sends requests.
import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
const env = process.env
const failures = []
const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'MISSING'} ${label}`); if (!ok) failures.push(label) }
check(env.WHATSAPP_IDENTITY_ENABLED === env.NEXT_PUBLIC_WHATSAPP_IDENTITY_ENABLED,
  'Los flags de backend y build web coinciden')
check(env.WHATSAPP_IDENTITY_ENABLED === 'true', 'Identidad habilitada en este entorno de integración')
for (const name of ['WHATSAPP_BUSINESS_ID', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_PHONE']) {
  check(/^\d+$/.test(env[name] || ''), `${name} configurada con identificador numérico`)
}
check(/^v\d+\.\d+$/.test(env.WHATSAPP_GRAPH_VERSION || ''), 'WHATSAPP_GRAPH_VERSION configurada (compatibilidad real requiere prueba)')
check(Buffer.byteLength(env.WHATSAPP_INTERNAL_SECRET || '') >= 32, 'WHATSAPP_INTERNAL_SECRET de al menos 32 bytes')
for (const name of ['WHATSAPP_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  check(Boolean(env[name]), `${name} presente`)
}
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SITE_URL']) {
  let valid = false
  try { valid = new URL(env[name]).protocol === 'https:' } catch {}
  check(valid, `${name} es HTTPS`)
}
check(['test', 'live'].includes(env.WHATSAPP_ROLLOUT_MODE), 'WHATSAPP_ROLLOUT_MODE explícito')
if (env.WHATSAPP_ROLLOUT_MODE !== 'live') {
  check(Boolean(env.WHATSAPP_TEST_SENDERS?.split(',').some(s => s.trim())), 'Remitente de prueba configurado')
}
console.log('Este chequeo no acredita acceso a Meta, configuración de n8n ni pruebas de entrega.')
process.exitCode = failures.length ? 1 : 0
