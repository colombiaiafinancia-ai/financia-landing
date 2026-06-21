'use client'

import { MessageCircle } from 'lucide-react'
import PhoneMockup from '@/components/landing/PhoneMockup'
const AVATARS = [
  { initial: 'M', gradient: 'from-purple-400 to-pink-400' },
  { initial: 'C', gradient: 'from-blue-400 to-cyan-400' },
  { initial: 'A', gradient: 'from-[#06B6D4] to-sky-400' },
  { initial: 'L', gradient: 'from-orange-400 to-red-400' },
]

const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="relative mx-[5%] mt-6 flex items-center overflow-hidden rounded-[28px] border border-[#06B6D4]/40 px-[6%] py-12 md:mt-8 md:py-[60px]"
      style={{
        background: '#0d1a2e',
        boxShadow: '0 8px 48px rgba(13,26,46,0.2)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 15% 0%, rgba(6,182,212,0.10) 0%, transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.09) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-[60px]">
        <div className="w-full max-w-[580px] flex-1 text-center lg:text-left">
          <div
            className="mb-6 inline-block rounded-full px-4 py-1.5"
            style={{
              background: 'rgba(6,182,212,0.10)',
              border: '1px solid rgba(6,182,212,0.25)',
            }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cyan-200 sm:text-[13px]">
              Tan simple como chatear con un amigo
            </span>
          </div>

          <h1 className="font-sora text-3xl font-extrabold leading-[1.08] text-slate-100 sm:text-4xl lg:text-[48px]">
            FinancIA, tu app de finanzas personales
            <span className="block text-[#06B6D4]">por WhatsApp.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-relaxed text-slate-400 sm:text-[17px] lg:mx-0">
            Registra gastos con un mensaje, recibe consejos personalizados y visualiza tus finanzas — sin
            salir de WhatsApp.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] px-8 py-4 text-base font-bold text-[#0d1a2e] transition hover:brightness-110"
              style={{
                background: '#06B6D4',
                boxShadow: '0 4px 18px rgba(6,182,212,0.35)',
              }}
            >
              <MessageCircle size={20} />
              Prueba gratis 7 dias
            </a>
            <a
              href="#producto"
              className="inline-flex items-center justify-center rounded-[10px] border-[1.5px] px-7 py-4 text-base text-slate-400 transition hover:border-white/25 hover:text-slate-200"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Ver cómo funciona
            </a>
          </div>

          <div className="mt-7 flex items-center justify-center lg:justify-start">
            <div className="flex">
              {AVATARS.map((avatar, index) => (
                <div
                  key={avatar.initial}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d1a2e] bg-gradient-to-br text-[10px] font-bold text-white ${avatar.gradient}`}
                  style={{ marginLeft: index === 0 ? 0 : -7, zIndex: 10 - index }}
                >
                  {avatar.initial}
                </div>
              ))}
            </div>
            <span className="ml-2.5 text-xs text-slate-500">ya cambiaron sus finanzas</span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-8 border-t border-white/[0.07] pt-6 lg:justify-start lg:gap-9">
            {[
              ['$0', 'para empezar'],
              ['3s', 'por registro'],
              ['7 dias', 'de prueba gratis'],
            ].map(([num, label]) => (
              <div key={label}>
                <div className="font-sora text-2xl font-extrabold text-[#06B6D4]">{num}</div>
                <div className="text-xs text-slate-600">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
