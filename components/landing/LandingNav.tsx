import { AuthNavigation } from '@/components/AuthNavigation'

const navLinks = [
  { href: '#producto', label: 'Producto' },
  { href: '#plan', label: 'Plan' },
  { href: '#inicio', label: 'Inicio' },
]

const LandingNav = () => (
  <nav
    className="sticky top-0 z-50 border-b border-white/10"
    style={{ backgroundColor: '#0d1a2e' }}
  >
    <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4 md:py-6">
      <h1 className="text-base font-bold leading-tight text-white sm:text-xl md:text-2xl">
        FinancIA
      </h1>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden items-center space-x-4 md:flex md:space-x-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition-colors hover:text-[#06B6D4] md:text-base"
            >
              {link.label}
            </a>
          ))}
        </div>
        <AuthNavigation variant="dark" />
      </div>
    </div>
  </nav>
)

export default LandingNav
