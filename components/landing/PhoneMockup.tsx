const PhoneMockup = () => (
  <div
    className="mx-auto w-[260px] shrink-0 sm:w-[300px]"
    style={{
      height: 520,
      background: '#1a2540',
      borderRadius: 36,
      border: '1px solid rgba(6,182,212,0.15)',
      boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(6,182,212,0.08)',
    }}
  >
    <div
      className="flex items-center gap-2.5 px-[18px] pb-3.5 pt-4"
      style={{ background: '#1e2d45', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #06B6D4, #0ea5e9)' }}
      >
        F
      </div>
      <div>
        <div className="text-[13px] font-bold text-slate-100">FinancIA</div>
        <div className="text-[10px] text-green-500">● En línea</div>
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-2.5 p-3.5" style={{ background: '#151f30', minHeight: 420 }}>
      <div
        className="max-w-[80%] self-end rounded-2xl px-3 py-2 text-xs leading-snug text-white"
        style={{ background: '#06B6D4', borderRadius: '16px 16px 3px 16px' }}
      >
        Gasté $40,000 en el lavado del carro
        <div className="mt-0.5 text-right text-[9px] opacity-50">16:12</div>
      </div>

      <div
        className="max-w-[85%] self-start rounded-2xl border px-3 py-2 text-xs leading-snug text-slate-300"
        style={{
          background: '#1e2d45',
          borderColor: 'rgba(255,255,255,0.06)',
          borderRadius: '16px 16px 16px 3px',
        }}
      >
        <div className="mb-1 text-[10px] font-bold uppercase text-cyan-200">
          👆 Confirma tu transacción:
        </div>
        {[
          ['Monto', '$40,000 COP'],
          ['Categoría', 'Auto 🚗'],
          ['Descripción', 'Lavado carro'],
          ['Cuenta', 'Bancolombia 🏦'],
        ].map(([key, value]) => (
          <div key={key} className="flex gap-1">
            <span className="text-slate-600">{key}:</span>
            <span className="font-semibold text-slate-200">{value}</span>
          </div>
        ))}
        <div className="mt-0.5 text-right text-[9px] opacity-50">16:12</div>
      </div>

      <div
        className="max-w-[80%] self-end rounded-2xl px-3 py-2 text-xs font-bold leading-snug text-white"
        style={{ background: '#06B6D4', borderRadius: '16px 16px 3px 16px' }}
      >
        Confirmar ✅
        <div className="mt-0.5 text-right text-[9px] font-normal opacity-50">16:13</div>
      </div>

      <div
        className="max-w-[85%] self-start rounded-2xl border px-3 py-2 text-xs leading-snug text-slate-300"
        style={{
          background: '#1e2d45',
          borderColor: 'rgba(255,255,255,0.06)',
          borderRadius: '16px 16px 16px 3px',
        }}
      >
        ✓ Listo. Llevas <span className="font-bold text-[#06B6D4]">$280,000</span> en Transporte este mes.
        <div className="mt-0.5 text-right text-[9px] opacity-50">16:13</div>
      </div>
    </div>
  </div>
)

export default PhoneMockup
