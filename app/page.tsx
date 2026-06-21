import ChatCarousel from '@/components/ChatCarousel'
import StatsSection from '@/components/StatsSection'
import FeaturesGrid from '@/components/FeaturesGrid'
import PricingSection from '@/components/PricingSection'
import HeroSection from '@/components/landing/HeroSection'
import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FinancIA | App de finanzas personales con IA por WhatsApp',
  description:
    'FinancIA ayuda a controlar gastos, presupuestos y reportes financieros desde WhatsApp. Una app de finanzas personales simple para organizar tu dinero.',
  alternates: {
    canonical: '/',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://financia.app/#organization',
      name: 'FinancIA',
      url: 'https://financia.app',
      logo: 'https://financia.app/favicon.ico',
      sameAs: ['https://www.linkedin.com/in/jhon-rivera-529022302/'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://financia.app/#website',
      url: 'https://financia.app',
      name: 'FinancIA',
      inLanguage: 'es-CO',
      publisher: {
        '@id': 'https://financia.app/#organization',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://financia.app/#app',
      name: 'FinancIA',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, WhatsApp',
      url: 'https://financia.app',
      description:
        'App de finanzas personales con inteligencia artificial para registrar gastos, crear presupuestos y consultar reportes desde WhatsApp.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      publisher: {
        '@id': 'https://financia.app/#organization',
      },
    },
  ],
}

export default function Home() {
  return (
    <main className="relative z-[1] min-h-screen" style={{ backgroundColor: '#0d1a2e' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingNav />
      <HeroSection />
      <ChatCarousel />
      <StatsSection />
      <section id="producto">
        <FeaturesGrid />
      </section>
      <PricingSection />
      <LandingFooter />
    </main>
  )
}
