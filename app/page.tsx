import ChatCarousel from '@/components/ChatCarousel'
import StatsSection from '@/components/StatsSection'
import FeaturesGrid from '@/components/FeaturesGrid'
import PricingSection from '@/components/PricingSection'
import HeroSection from '@/components/landing/HeroSection'
import LandingNav from '@/components/landing/LandingNav'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <main className="relative z-[1] min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
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
