import ChatCarousel from '@/components/ChatCarousel'
import StatsSection from '@/components/StatsSection'
import FeaturesGrid from '@/components/FeaturesGrid'
import PricingSection from '@/components/PricingSection'
import { AuthNavigation } from '@/components/AuthNavigation'
import { FloatingUserMessages } from '@/components/FloatingUserMessages'
import { CommunityStats } from '@/components/CommunityStats'
import { WhatsAppCTAButton } from '@/components/WhatsAppCTAButton'


export default function Home() {
  return (
    <main className='min-h-screen'>
      
      <nav className='sticky top-0 z-50 bg-[#0D1D35]/95 backdrop-blur-sm border-b border-white/10 container mx-auto px-4 py-4 md:py-6 flex justify-between items-center'>
        <h1 className='text-xl md:text-2xl font-bold text-white'>Finanzas Consulting - FinancIA</h1>
        <div className='flex items-center space-x-4 md:space-x-6'>
          <a href='#producto' className='text-white hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>Producto</a>
          <a href='#plan' className='text-white hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>Plan</a>
          <a href='#inicio' className='text-white hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>Inicio</a>
          <AuthNavigation />
        </div>
      </nav>

      {/* Hero Section with seamless transition */}
      <section id='inicio' className='relative min-h-screen bg-gradient-to-b from-[#0D1D35] via-[#1a2e4a] to-[#0D1D35]'>
        <div className='min-h-screen flex items-center justify-center px-4 py-8'>
          <div className='text-center max-w-6xl mx-auto space-y-12'>
            {/* Main Title - Centered and Large */}
            <div className='space-y-6'>
              <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight'>
                Tu coach financiero en WhatsApp,
              </h1>
              <p className='text-2xl md:text-3xl lg:text-4xl text-[#5ce1e6] font-medium leading-relaxed'>
                tan simple como chatear con un amigo
              </p>
            </div>

            {/* Floating User Messages */}
            <div className='flex justify-center py-8'>
              <FloatingUserMessages />
            </div>

            {/* Community Stats */}
            <div className='py-6'>
              <CommunityStats />
            </div>

            {/* CTA Button */}
            <div className='pt-6'>
              <a
                href="https://wa.me/573227031301?text=👋%20Hola%20FinancIA,%20soy%20parte%20del%20combo%20💼💸%20¿Cómo%20empiezo%20para%20poner%20en%20orden%20mis%20finanzas?"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#5ce1e6] to-[#4dd0e1] text-[#0D1D35] font-bold text-lg rounded-2xl hover:from-[#4dd0e1] hover:to-[#5ce1e6] transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-[#5ce1e6]/30 border-2 border-white/30 hover:border-white/50"
              >
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.214-.361a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Probar Gratis Ahora
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* Chat Examples Section - seamlessly connected */}
      <div className='bg-gradient-to-b from-[#0D1D35] via-[#1a2e4a] to-[#0D1D35]'>
      <ChatCarousel />
      </div>

      {/* Stats Section */}
      <div className='bg-gradient-to-b from-[#0D1D35] via-[#1a2e4a] to-[#0D1D35]'>
      <StatsSection />
      </div>

      {/* Features Section */}
      <section id='producto' className='bg-gradient-to-b from-[#0D1D35] via-[#1a2e4a] to-[#0D1D35]'>
        <FeaturesGrid />
      </section>

      {/* Pricing Section */}
      <div className='bg-gradient-to-b from-[#0D1D35] via-[#1a2e4a] to-[#0D1D35]'>
        <PricingSection />
        </div>

      {/* Footer */}
      <footer className='relative py-12 md:py-16 overflow-hidden bg-gradient-to-b from-[#0D1D35] via-[#1a2e4a] to-[#0D1D35]'>
        <div className='absolute inset-0 bg-[url("/grid.svg")] opacity-5'></div>
        <div className='container mx-auto px-4 relative'>
          <div className='grid md:grid-cols-3 gap-8 md:gap-12'>
            <div className='space-y-3 md:space-y-4'>
              <h3 className='text-xl md:text-2xl font-bold bg-gradient-to-r from-[#5ce1e6] to-[#4dd0e1] text-transparent bg-clip-text'>FinancIA</h3>
              <p className='text-white/70 text-sm md:text-base leading-relaxed'>Transformando la manera en que manejas tu dinero, un mensaje a la vez.</p>
            </div>
            <div className='space-y-3 md:space-y-4'>
              <h4 className='text-base md:text-lg font-semibold text-[#5ce1e6]'>Enlaces</h4>
              <div className='space-y-2'>
                <a href='#inicio' className='block text-white/70 hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>Inicio</a>
                <a href='#producto' className='block text-white/70 hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>Producto</a>
                <a href='#plan' className='block text-white/70 hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>Plan</a>
                <div className='pt-2 space-y-2'>
                  <a href='/terms' className='block text-white/70 hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>
                    Términos y Condiciones
                  </a>
                  <a href='/privacy' className='block text-white/70 hover:text-[#5ce1e6] transition-colors text-sm md:text-base'>
                    Política de Privacidad
                  </a>
                </div>
              </div>
            </div>
            <div className='space-y-3 md:space-y-4'>
              <h4 className='text-base md:text-lg font-semibold text-[#5ce1e6]'>Contacto</h4>
              <div className='space-y-2'>
                <a
                  href='https://www.linkedin.com/in/jhon-rivera-529022302/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center space-x-2 text-white/70 hover:text-[#5ce1e6] transition-colors group text-sm md:text-base'
                >
                  <svg
                    className='w-4 h-4 md:w-5 md:h-5 fill-current group-hover:scale-110 transition-transform'
                    viewBox='0 0 24 24'
                  >
                    <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
          <div className='border-t border-white/10 pt-6 md:pt-8 text-center'>
            <p className='text-white/70 text-sm md:text-base'>© 2025 FinancIA. Todos los derechos reservados.</p>
            <p className='text-white/70 mt-2 text-sm md:text-base'>Hecho con <span className='text-[#5ce1e6]'>❤️</span> en Colombia <span className='ml-1'>🇨🇴</span></p>
          </div>
        </div>
      </footer>
    </main>
  )
}
