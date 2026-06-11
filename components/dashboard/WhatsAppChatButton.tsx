'use client'

import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  OnboardingVignette,
  OnboardingSpotlightArrow,
  getOnboardingWhatsAppButtonSpotlightStyle,
  type OnboardingStep,
} from '@/components/dashboard/OnboardingVignette'
import { cn } from '@/lib/utils'

interface WhatsAppChatButtonProps {
  onboardingStep?: OnboardingStep | null
  onSkipOnboarding?: () => void
  onWhatsAppOpened?: () => void
}

const WhatsAppChatButton = ({
  onboardingStep = null,
  onSkipOnboarding,
  onWhatsAppOpened,
}: WhatsAppChatButtonProps) => {
  const whatsappUrl =
    'https://wa.me/573227031301?text=👋%20Hola%20FinancIA,%20soy%20parte%20del%20combo%20💼💸%20¿Cómo%20empiezo%20para%20poner%20en%20orden%20mis%20finanzas?'

  const isTourStep = onboardingStep === 'whatsapp'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'rounded-xl border p-6 shadow-xl',
        isTourStep
          ? 'border-[#25D366]/30 bg-[#14532d] text-white'
          : 'border-green-800/30 bg-gradient-to-r from-[#128C7E] to-[#25D366] text-white dark:border-white/20 dark:from-[#25D366] dark:to-[#128C7E]'
      )}
    >
      {isTourStep && (
        <div className="mb-3">
          <OnboardingVignette
            variant="onGradient"
            stepNumber={4}
            title="Gestiona tus finanzas por WhatsApp"
            icon={MessageCircle}
            action='Envía un gasto, ingreso o presupuesto. Revisa el resumen y confírmalo con un «sí» o «no».'
            onSkip={onSkipOnboarding}
          />
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div
          className={cn(
            'rounded-lg p-3',
            isTourStep ? 'bg-[#25D366]/20' : 'bg-white/20'
          )}
        >
          <MessageCircle className={cn('h-6 w-6', isTourStep ? 'text-[#25D366]' : 'text-white')} />
        </div>

        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-white">Chatea con FinancIA</h3>
          <p className="mb-3 text-sm text-white/80">
            Accede a tu asistente financiero personal por WhatsApp
          </p>

          {isTourStep ? (
            <div className="flex w-full flex-col items-center">
              <OnboardingSpotlightArrow align="center" highContrast />
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-onboarding-target="whatsapp-chat"
                onClick={() => onWhatsAppOpened?.()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 inline-flex items-center rounded-lg border border-[#25D366]/40 bg-white px-4 py-2 text-sm font-medium text-[#14532d] transition-colors hover:bg-white/95"
                style={getOnboardingWhatsAppButtonSpotlightStyle()}
              >
                <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
                Iniciar Chat
              </motion.a>
            </div>
          ) : (
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onWhatsAppOpened?.()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center rounded-lg border border-white/30 bg-white px-4 py-2 text-sm font-medium text-[#128C7E] transition-colors hover:bg-white/90"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Iniciar Chat
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default WhatsAppChatButton
