const PhoneMockup = () => (
  <div className="mx-auto w-[250px] shrink-0 sm:w-[292px]">
    <div className="relative overflow-hidden rounded-[34px] border-2 border-[#06B6D4]/55 bg-[#111b21] shadow-[0_36px_90px_rgba(0,0,0,0.55),0_0_34px_rgba(6,182,212,0.16)]">
      <div className="absolute left-1/2 top-2 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-[#0b141a]" />

      <div className="flex h-[500px] flex-col overflow-hidden sm:h-[520px]">
        <div className="flex items-center gap-3 bg-[#202c33] px-4 pb-3 pt-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06B6D4] text-sm font-black text-white">
            F
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-slate-50">FinancIA</div>
            <div className="text-[10px] font-medium text-[#25D366]">en linea</div>
          </div>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          </div>
        </div>

        <div
          className="flex flex-1 flex-col gap-2.5 overflow-hidden p-3.5"
          style={{
            backgroundColor: '#0b141a',
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04) 0 1px, transparent 1px), radial-gradient(circle at 80% 40%, rgba(255,255,255,0.035) 0 1px, transparent 1px)',
            backgroundSize: '22px 22px, 28px 28px',
          }}
        >
          <div className="mx-auto mb-1 rounded-full bg-[#182229] px-3 py-1 text-[10px] text-slate-400">
            Hoy
          </div>

          <div className="max-w-[82%] self-end rounded-2xl bg-[#005c4b] px-3 py-2 text-[11px] leading-snug text-white shadow-sm">
            Gaste $40.000 en el lavado del carro
            <div className="mt-1 text-right text-[9px] text-white/55">16:12 ✓✓</div>
          </div>

          <div className="max-w-[88%] self-start rounded-2xl bg-[#202c33] px-3 py-2 text-[11px] leading-snug text-slate-200 shadow-sm">
            <div className="mb-1 text-[10px] font-bold uppercase text-[#25D366]">
              Confirma tu transaccion
            </div>
            <div className="space-y-0.5">
              {[
                ['Monto', '$40.000 COP'],
                ['Categoria', 'Auto'],
                ['Descripcion', 'Lavado carro'],
                ['Cuenta', 'Bancolombia'],
              ].map(([key, value]) => (
                <div key={key} className="flex gap-1">
                  <span className="text-slate-500">{key}:</span>
                  <span className="font-semibold text-slate-100">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 text-right text-[9px] text-slate-500">16:12</div>
          </div>

          <div className="max-w-[70%] self-end rounded-2xl bg-[#005c4b] px-3 py-2 text-[11px] font-bold leading-snug text-white shadow-sm">
            Confirmar
            <div className="mt-1 text-right text-[9px] font-normal text-white/55">16:13 ✓✓</div>
          </div>

          <div className="max-w-[88%] self-start rounded-2xl bg-[#202c33] px-3 py-2 text-[11px] leading-snug text-slate-200 shadow-sm">
            Listo. Llevas <span className="font-bold text-[#25D366]">$280.000</span> en Transporte este mes.
            <div className="mt-1 text-right text-[9px] text-slate-500">16:13</div>
          </div>

          <div className="mt-auto flex items-center gap-2 rounded-full bg-[#202c33] px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            <div className="h-2 flex-1 rounded-full bg-slate-600/70" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-[#0b141a]">
              ↗
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default PhoneMockup
