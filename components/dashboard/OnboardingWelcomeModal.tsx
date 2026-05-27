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
            Bienvenido a FinancIA
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-2 text-left text-sm text-muted-foreground">
              <p>
                FinancIA es tu asistente para organizar gastos, seguir presupuestos por
                categoria y registrar transacciones desde aqui o por WhatsApp.
              </p>
              <p>
                Te guiaremos en un recorrido corto de{' '}
                <strong className="text-foreground">4 pasos</strong>: crear tu primer
                presupuesto, registrar una transaccion, conectar con el chat por WhatsApp
                y activar tus recordatorios diarios.
              </p>
              <p className="text-foreground/90">
                Cuando estes listo, pulsa <strong>Siguiente</strong> y te llevaremos al
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
