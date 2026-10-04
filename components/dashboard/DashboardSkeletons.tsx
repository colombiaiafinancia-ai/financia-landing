import { cn } from '@/lib/utils'

const blockClass =
  'animate-pulse rounded-lg border border-border bg-card dark:border-white/10 dark:bg-white/5'

export function ChartSkeleton({ className }: { className?: string }) {
  return <div className={cn(blockClass, 'h-full min-h-[420px] w-full', className)} aria-hidden />
}

export function SectionSkeleton({ className }: { className?: string }) {
  return <div className={cn(blockClass, 'h-64 w-full', className)} aria-hidden />
}

/** Estructura del dashboard mientras llegan los datos (sin spinner a pantalla completa). */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground" aria-busy="true" aria-label="Cargando tu dashboard">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted dark:bg-white/10" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted dark:bg-white/10" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(blockClass, 'h-28')} />
          ))}
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 lg:gap-8 xl:grid-cols-2">
          <ChartSkeleton className="lg:h-[464px]" />
          <ChartSkeleton className="lg:h-[464px]" />
        </div>
        <SectionSkeleton className="mb-6 sm:mb-8" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <SectionSkeleton className="h-96" />
          <SectionSkeleton className="h-96" />
        </div>
      </main>
    </div>
  )
}
