'use client'

const cards = [
  {
    emoji: '💬',
    label: 'Chatea y registra gastos',
    desc: 'Escribe como le escribirías a un amigo. FinancIA entiende y categoriza automáticamente.',
    borderColor: '#06B6D4',
  },
  {
    emoji: '🎤',
    label: 'Notas de voz',
    desc: 'Habla y FinancIA transcribe y categoriza tu gasto al instante.',
    borderColor: '#ef4444',
  },
  {
    emoji: '📸',
    label: 'Captura recibos',
    desc: 'Fotografía tu factura y extrae el monto automáticamente.',
    borderColor: '#f59e0b',
  },
  {
    emoji: '📊',
    label: 'Visualiza tus finanzas',
    desc: 'Gráficas claras de tus patrones de gasto por semana o mes.',
    borderColor: '#6366f1',
  },
  {
    emoji: '✨',
    label: 'Consejos personalizados',
    desc: 'Recomendaciones basadas en tus hábitos reales de gasto.',
    borderColor: '#ec4899',
  },
  {
    emoji: '📱',
    label: 'Todo desde WhatsApp',
    desc: 'Sin apps nuevas, sin logins. Solo abre WhatsApp y empieza.',
    borderColor: '#25D366',
  },
]

const FeaturesGrid = () => {
  return (
    <section className="w-full px-[8%] py-16 md:py-20" style={{ backgroundColor: '#0d1a2e' }}>
      <div className="mb-10 text-center md:mb-12">
        <div
          className="mb-4 inline-block rounded-full px-4 py-1.5"
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.25)',
          }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-200">
            Funcionalidades
          </span>
        </div>
        <h2 className="font-sora m-0 text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl md:text-4xl">
          <span className="text-[#06B6D4]">Simple</span>, rápido y efectivo
        </h2>
        <p className="mx-auto mt-3 max-w-[440px] text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Todo lo que necesitas para tomar el control de tu dinero, sin cambiar tus hábitos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex min-h-[160px] cursor-default flex-col gap-3 rounded-[18px] border-[1.5px] p-6 transition hover:-translate-y-0.5 hover:bg-white/[0.03] sm:min-h-[180px] sm:gap-3.5 sm:p-7"
            style={{ borderColor: card.borderColor }}
          >
            <div className="mb-1 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white/5 text-[26px]">
              {card.emoji}
            </div>
            <div className="font-sora text-base font-bold leading-snug text-slate-100">{card.label}</div>
            <div className="text-sm font-semibold leading-relaxed text-slate-400">{card.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturesGrid
