'use client'

import type { ReactNode } from 'react'
import { BookOpen, Home, PiggyBank, Truck, UtensilsCrossed } from 'lucide-react'

type CategoryTileProps = {
  bg: string
  icon: ReactNode
  name: string
  amount: string
  amountSize: number
  pct: string
  col: string
  row: string
}

const CategoryTile = ({ bg, icon, name, amount, amountSize, pct, col, row }: CategoryTileProps) => (
  <div
    className="flex cursor-default flex-col justify-between overflow-hidden rounded-[14px] p-3 transition-[filter] hover:brightness-110 sm:p-4"
    style={{
      gridColumn: col,
      gridRow: row,
      background: bg,
    }}
  >
    <div className="flex items-start justify-between">
      <span className="text-xs font-semibold text-white/90 sm:text-[13px]">{name}</span>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
        {icon}
      </div>
    </div>
    <div>
      <div className="font-sora font-extrabold text-white" style={{ fontSize: amountSize }}>
        {amount}
      </div>
      <div className="text-xs text-white/60">{pct}</div>
    </div>
  </div>
)

const StatsSection = () => {
  return (
    <section className="relative overflow-hidden px-[8%] py-14 md:py-[72px]" style={{ background: '#0d1a2e' }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 80% 50%, rgba(6,182,212,0.06) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-[1] mb-8 text-center md:mb-10">
        <h2 className="font-sora text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl md:text-[34px]">
          <span className="text-[#06B6D4]">Descubre patrones</span>, no solo números.
        </h2>
        <p className="mx-auto mt-4 max-w-[580px] text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Olvídate de las hojas de cálculo. Aquí puedes ver tus gastos por categoría, tus ingresos a lo largo
          del tiempo o el impacto de tus hábitos en gráficas que realmente te hablan.
        </p>
      </div>

      <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:gap-5">
        <div
          className="flex-1 rounded-[20px] border border-white/[0.07] p-5 sm:p-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <h3 className="font-sora mb-4 mt-0 text-xs font-bold uppercase tracking-wide text-slate-400">
            Resumen de Gastos
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-2.5">
            {[
              {
                label: 'Hoy',
                value: '$85.000',
                bg: 'rgba(6,182,212,0.15)',
                border: 'rgba(6,182,212,0.25)',
                labelColor: '#06B6D4',
              },
              {
                label: 'Esta Semana',
                value: '$420.000',
                bg: 'rgba(139,92,246,0.15)',
                border: 'rgba(139,92,246,0.25)',
                labelColor: '#8b5cf6',
              },
              {
                label: 'Este Mes',
                value: '$1.850.000',
                bg: 'rgba(168,85,247,0.15)',
                border: 'rgba(168,85,247,0.25)',
                labelColor: '#a855f7',
              },
              {
                label: 'Total',
                value: '$5.240.000',
                bg: 'rgba(100,116,139,0.15)',
                border: 'rgba(100,116,139,0.25)',
                labelColor: '#94a3b8',
              },
            ].map((tile) => (
              <div
                key={tile.label}
                className="flex flex-col gap-1 rounded-[14px] p-4"
                style={{ background: tile.bg, border: `1px solid ${tile.border}` }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: tile.labelColor }}
                >
                  {tile.label}
                </span>
                <span className="font-sora text-xl font-extrabold text-slate-100 sm:text-[22px]">
                  {tile.value}
                </span>
                <span className="text-[10px] text-slate-600">COP</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex-[1.5] rounded-[20px] border border-white/[0.07] p-5 sm:p-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <h3 className="font-sora mb-4 mt-0 text-xs font-bold uppercase tracking-wide text-slate-400">
            Mapa de Gastos por Categoría
          </h3>
          <div className="overflow-x-auto">
          <div
            className="grid min-w-[320px] gap-2"
            style={{
              gridTemplateColumns: '1.7fr 1fr 1.25fr',
              gridTemplateRows: '120px 95px',
            }}
          >
            <CategoryTile
              bg="#d94f4f"
              icon={<UtensilsCrossed size={16} stroke="#fff" strokeWidth={3} fill="none" />}
              name="Comida"
              amount="$680.000"
              amountSize={24}
              pct="36.7%"
              col="1"
              row="1"
            />
            <CategoryTile
              bg="#4f7fe0"
              icon={<Home size={16} stroke="#fff" strokeWidth={3} fill="none" />}
              name="Vivienda"
              amount="$342.000"
              amountSize={20}
              pct="18.5%"
              col="2 / 4"
              row="1"
            />
            <CategoryTile
              bg="#12a89a"
              icon={<Truck size={16} stroke="#fff" strokeWidth={3} fill="none" />}
              name="Transporte"
              amount="$280.000"
              amountSize={18}
              pct="15.1%"
              col="1"
              row="2"
            />
            <CategoryTile
              bg="#e8960a"
              icon={<BookOpen size={16} stroke="#fff" strokeWidth={3} fill="none" />}
              name="Educación"
              amount="$237.000"
              amountSize={18}
              pct="12.8%"
              col="2"
              row="2"
            />
            <CategoryTile
              bg="#7c4fd6"
              icon={<PiggyBank size={16} stroke="#fff" strokeWidth={3} fill="none" />}
              name="Ahorro"
              amount="$189.000"
              amountSize={16}
              pct="10.2%"
              col="3"
              row="2"
            />
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StatsSection
