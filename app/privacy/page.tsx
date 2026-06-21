import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad y protección de datos de FinancIA, app de finanzas personales con IA.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Política de Privacidad
            </h1>
            <p className="text-gray-300 text-lg">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
            <div className="prose prose-invert max-w-none">
              
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introducción</h2>
              <p className="text-gray-300 mb-6">
                En FinancIA valoramos su privacidad y nos comprometemos a proteger sus datos personales. Esta Política de Privacidad 
                explica cómo recopilamos, utilizamos, almacenamos y protegemos su información cuando utiliza nuestros servicios.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">2. Información que Recopilamos</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">2.1 Información Personal</h3>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Nombre completo y dirección de correo electrónico</li>
                <li>• Información de contacto (teléfono, dirección)</li>
                <li>• Fecha de nacimiento y información demográfica</li>
                <li>• Credenciales de acceso (usuario y contraseña encriptada)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.2 Información Financiera</h3>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Datos de transacciones financieras</li>
                <li>• Información de cuentas bancarias (solo metadatos, no credenciales)</li>
                <li>• Categorías de gastos e ingresos</li>
                <li>• Objetivos y presupuestos financieros</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.3 Información Técnica</h3>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Dirección IP y datos de geolocalización</li>
                <li>• Información del dispositivo y navegador</li>
                <li>• Cookies y tecnologías similares</li>
                <li>• Logs de actividad y uso del servicio</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">3. Cómo Utilizamos su Información</h2>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• <strong>Provisión del Servicio:</strong> Para proporcionar y mejorar nuestros servicios de gestión financiera</li>
                <li>• <strong>Personalización:</strong> Para personalizar su experiencia y proporcionar recomendaciones relevantes</li>
                <li>• <strong>Comunicación:</strong> Para enviar actualizaciones del servicio, notificaciones y soporte técnico</li>
                <li>• <strong>Seguridad:</strong> Para proteger su cuenta y prevenir fraudes</li>
                <li>• <strong>Análisis:</strong> Para analizar tendencias y mejorar nuestros algoritmos de IA</li>
                <li>• <strong>Cumplimiento Legal:</strong> Para cumplir con obligaciones legales y regulatorias</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">4. Base Legal para el Procesamiento</h2>
              <p className="text-gray-300 mb-4">Procesamos sus datos basándose en:</p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• <strong>Consentimiento:</strong> Cuando usted nos ha dado consentimiento específico</li>
                <li>• <strong>Ejecución de Contrato:</strong> Para cumplir con nuestros términos de servicio</li>
                <li>• <strong>Interés Legítimo:</strong> Para mejorar nuestros servicios y prevenir fraudes</li>
                <li>• <strong>Obligación Legal:</strong> Para cumplir con requerimientos legales</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">5. Compartir Información</h2>
              <p className="text-gray-300 mb-4">No vendemos sus datos personales. Podemos compartir información con:</p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• <strong>Proveedores de Servicios:</strong> Empresas que nos ayudan a operar nuestro servicio</li>
                <li>• <strong>Instituciones Financieras:</strong> Para conectar con sus cuentas (solo con autorización)</li>
                <li>• <strong>Autoridades Legales:</strong> Cuando sea requerido por ley</li>
                <li>• <strong>Terceros Autorizados:</strong> Solo con su consentimiento explícito</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">6. Seguridad de los Datos</h2>
              <p className="text-gray-300 mb-4">Implementamos medidas de seguridad robustas:</p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Encriptación de datos en tránsito y en reposo</li>
                <li>• Autenticación multifactor</li>
                <li>• Monitoreo continuo de seguridad</li>
                <li>• Acceso limitado a datos sensibles</li>
                <li>• Auditorías de seguridad regulares</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">7. Retención de Datos</h2>
              <p className="text-gray-300 mb-6">
                Conservamos sus datos personales durante el tiempo necesario para proporcionar nuestros servicios y cumplir con 
                obligaciones legales. Los datos financieros se conservan durante 7 años después del cierre de la cuenta, 
                según requerimientos regulatorios.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">8. Sus Derechos</h2>
              <p className="text-gray-300 mb-4">Usted tiene derecho a:</p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• <strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
                <li>• <strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li>• <strong>Eliminación:</strong> Solicitar la eliminación de sus datos ("derecho al olvido")</li>
                <li>• <strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                <li>• <strong>Limitación:</strong> Restringir el procesamiento de sus datos</li>
                <li>• <strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                <li>• <strong>Retirar Consentimiento:</strong> Retirar el consentimiento en cualquier momento</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies y Tecnologías de Seguimiento</h2>
              <p className="text-gray-300 mb-4">Utilizamos cookies para:</p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Mantener su sesión activa</li>
                <li>• Recordar sus preferencias</li>
                <li>• Analizar el uso del sitio web</li>
                <li>• Mejorar la seguridad</li>
              </ul>
              <p className="text-gray-300 mb-6">
                Puede gestionar las cookies a través de la configuración de su navegador.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">10. Transferencias Internacionales</h2>
              <p className="text-gray-300 mb-6">
                Sus datos pueden ser transferidos y procesados en países fuera de su región. Garantizamos que estas transferencias 
                cumplan con las regulaciones de protección de datos aplicables y que se mantengan medidas de seguridad adecuadas.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">11. Menores de Edad</h2>
              <p className="text-gray-300 mb-6">
                Nuestro servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal 
                de menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">12. Cambios en esta Política</h2>
              <p className="text-gray-300 mb-6">
                Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios significativos 
                por correo electrónico o a través de nuestro servicio.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">13. Contacto y Reclamaciones</h2>
              <p className="text-gray-300 mb-6">
                Para ejercer sus derechos o hacer consultas sobre privacidad:
                <br />
                <strong>Email:</strong> colombiaia.financia@gmail.com
                <br />
                <strong>Teléfono:</strong> +57 3223796302
                <br />
                <strong>Oficial de Protección de Datos:</strong> colombiaia.financia@gmail.com
                <br />
                <strong>Dirección:</strong> Bogotá, Colombia
                <br /><br />
                También puede presentar una reclamación ante la autoridad de protección de datos de su jurisdicción.
              </p>
            </div>

            {/* Back Button */}
            <div className="mt-12 text-center">
              <a 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                ← Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
