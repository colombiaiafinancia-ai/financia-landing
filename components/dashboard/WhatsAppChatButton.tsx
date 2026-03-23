'use client'

import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { OnboardingVignette, type OnboardingStep } from '@/components/dashboard/OnboardingVignette'

interface WhatsAppChatButtonProps {
  onboardingStep?: OnboardingStep | null
  onSkipOnboarding?: () => void
  /** Al hacer clic en el enlace de WhatsApp (p. ej. completar onboarding) */
  onWhatsAppOpened?: () => void
}

const WhatsAppChatButton = ({
  onboardingStep = null,
  onSkipOnboarding,
  onWhatsAppOpened,
}: WhatsAppChatButtonProps) => {
  const whatsappUrl =
    'https://wa.me/573227031301?text=👋%20Hola%20FinancIA,%20soy%20parte%20del%20combo%20💼💸%20¿Cómo%20empiezo%20para%20poner%20en%20orden%20mis%20finanzas?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        rounded-xl p-6 shadow-xl border

        /* LIGHT → gradiente invertido */
        bg-gradient-to-r from-[#128C7E] to-[#25D366]
        border-green-800/30 text-white

        /* DARK → gradiente original */
        dark:from-[#25D366] dark:to-[#128C7E]
        dark:border-white/20
      "
    >
      {onboardingStep === 'whatsapp' && (
        <div className="mb-4">
          <OnboardingVignette
            variant="onGradient"
            stepLabel="Paso 3 de 3"
            title="Usa FinanciaIA por WhatsApp"
            bullets={[
              'Pulsa «Iniciar Chat» para abrir WhatsApp con un mensaje de bienvenida.',
              'Puedes escribir cosas como «gasté 20 mil en transporte» o «ingreso 500 mil».',
              'El asistente responde sin que dependas siempre del panel: ideal desde el móvil.',
            ]}
            onSkip={onSkipOnboarding}
          />
        </div>
      )}
      <div className="flex items-center space-x-4">
        {/* Icono */}
        <div className="bg-white/20 p-3 rounded-lg">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>

        {/* Texto */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1 text-white">
            Chatea con FinancIA
          </h3>

          <p className="text-sm text-white/90 mb-3">
            Accede a tu asistente financiero personal por WhatsApp
          </p>

          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onWhatsAppOpened?.()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
              border transition-colors

              /* Botón */
              bg-white text-[#128C7E] border-white/30
              hover:bg-white/90
            "
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Iniciar Chat
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}

export default WhatsAppChatButton
