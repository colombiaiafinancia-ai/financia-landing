import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Términos y condiciones de uso de FinancIA, plataforma de finanzas personales con inteligencia artificial.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-gray-300 text-lg">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/20">
            <div className="prose prose-invert max-w-none">
              
              <h2 className="text-2xl font-semibold text-white mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-300 mb-6">
                Al acceder y utilizar FinancIA ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones ("Términos"). 
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-300 mb-6">
                FinancIA es una plataforma de gestión financiera personal que utiliza inteligencia artificial para ayudar a los usuarios 
                a administrar sus finanzas, crear presupuestos y obtener insights sobre sus hábitos de gasto.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">3. Registro y Cuenta de Usuario</h2>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Debe proporcionar información precisa y completa durante el registro</li>
                <li>• Es responsable de mantener la confidencialidad de su cuenta</li>
                <li>• Debe notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                <li>• Debe ser mayor de 18 años para utilizar el servicio</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">4. Uso Aceptable</h2>
              <p className="text-gray-300 mb-4">Usted se compromete a:</p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Utilizar el servicio solo para fines legales y apropiados</li>
                <li>• No interferir con el funcionamiento del servicio</li>
                <li>• No intentar acceder a cuentas de otros usuarios</li>
                <li>• No utilizar el servicio para actividades fraudulentas</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">5. Privacidad y Datos</h2>
              <p className="text-gray-300 mb-6">
                Su privacidad es importante para nosotros. El manejo de sus datos personales se rige por nuestra 
                <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline"> Política de Privacidad</a>, 
                que forma parte integral de estos términos.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">6. Propiedad Intelectual</h2>
              <p className="text-gray-300 mb-6">
                Todo el contenido, características y funcionalidad del servicio son propiedad exclusiva de FinancIA y están 
                protegidos por leyes de propiedad intelectual. No puede copiar, modificar o distribuir nuestro contenido sin autorización.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitación de Responsabilidad</h2>
              <p className="text-gray-300 mb-6">
                FinancIA se proporciona "tal como está" sin garantías de ningún tipo. No somos responsables de:
              </p>
              <ul className="text-gray-300 mb-6 space-y-2">
                <li>• Decisiones financieras tomadas basándose en nuestro servicio</li>
                <li>• Pérdidas financieras o daños indirectos</li>
                <li>• Interrupciones del servicio o errores técnicos</li>
                <li>• Contenido de terceros o enlaces externos</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">8. Modificaciones del Servicio</h2>
              <p className="text-gray-300 mb-6">
                Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, 
                con o sin previo aviso. No seremos responsables ante usted o terceros por cualquier modificación del servicio.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">9. Terminación</h2>
              <p className="text-gray-300 mb-6">
                Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso, por cualquier motivo, 
                incluyendo el incumplimiento de estos Términos.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">10. Ley Aplicable</h2>
              <p className="text-gray-300 mb-6">
                Estos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta en los tribunales competentes de Colombia.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">11. Cambios en los Términos</h2>
              <p className="text-gray-300 mb-6">
                Nos reservamos el derecho de actualizar estos términos en cualquier momento. Los cambios entrarán en vigor 
                inmediatamente después de su publicación en esta página.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">12. Contacto</h2>
              <p className="text-gray-300 mb-6">
                Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
                <br />
                Email: colombiaia.financia@gmail.com
                <br />
                Teléfono: +57 3223796302
                <br />
                Dirección: Bogotá, Colombia
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
