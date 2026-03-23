'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface OnboardingWelcomeModalProps {
  open: boolean
  onNext: () => void
  onSkip: () => void
}

export function OnboardingWelcomeModal({
  open,
  onNext,
  onSkip,
}: OnboardingWelcomeModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl">
            Bienvenido a FinanciaIA
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-2 text-left text-sm text-muted-foreground">
              <p>
                FinanciaIA es tu asistente para organizar gastos, seguir presupuestos por
                categoría y registrar transacciones desde aquí o por WhatsApp.
              </p>
              <p>
                Te guiaremos en un recorrido corto de{' '}
                <strong className="text-foreground">3 pasos</strong>: crear tu primer
                presupuesto, registrar una transacción y conectar con el chat por
                WhatsApp. En cada paso verás instrucciones claras de qué hacer.
              </p>
              <p className="text-foreground/90">
                Cuando estés listo, pulsa <strong>Siguiente</strong> y te llevaremos al
                primer paso.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Omitir recorrido
          </button>
          <Button onClick={onNext} className="w-full sm:w-auto">
            Siguiente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
