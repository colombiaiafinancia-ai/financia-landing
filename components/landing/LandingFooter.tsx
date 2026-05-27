const LandingFooter = () => (
  <footer
    className="relative overflow-hidden py-12 md:py-16"
    style={{ backgroundColor: '#e8e4de', borderTop: '1px solid #d4cfc8' }}
  >
    <div className="container relative mx-auto px-4">
      <div className="grid gap-8 md:grid-cols-3 md:gap-12">
        <div className="space-y-3 md:space-y-4">
          <h3 className="bg-gradient-to-r from-[#06B6D4] to-sky-400 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
            FinancIA
          </h3>
          <p className="text-sm leading-relaxed text-slate-600 md:text-base">
            Transformando la manera en que manejas tu dinero, un mensaje a la vez.
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <h4 className="text-base font-semibold text-[#06B6D4] md:text-lg">Enlaces</h4>
          <div className="space-y-2">
            <a href="#inicio" className="block text-sm text-slate-600 transition-colors hover:text-[#06B6D4] md:text-base">
              Inicio
            </a>
            <a href="#producto" className="block text-sm text-slate-600 transition-colors hover:text-[#06B6D4] md:text-base">
              Producto
            </a>
            <a href="#plan" className="block text-sm text-slate-600 transition-colors hover:text-[#06B6D4] md:text-base">
              Plan
            </a>
            <a href="/terms" className="block text-sm text-slate-600 transition-colors hover:text-[#06B6D4] md:text-base">
              Términos y Condiciones
            </a>
            <a href="/privacy" className="block text-sm text-slate-600 transition-colors hover:text-[#06B6D4] md:text-base">
              Política de Privacidad
            </a>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <h4 className="text-base font-semibold text-[#06B6D4] md:text-lg">Contacto</h4>
          <a
            href="https://www.linkedin.com/in/jhon-rivera-529022302/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center space-x-2 text-sm text-slate-600 transition-colors hover:text-[#06B6D4] md:text-base"
          >
            <svg
              className="h-4 w-4 fill-current transition-transform group-hover:scale-110 md:h-5 md:w-5"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span>LinkedIn</span>
          </a>
        </div>
      </div>

      <div className="mt-8 border-t border-[#d4cfc8] pt-6 text-center md:pt-8">
        <p className="text-sm text-slate-600 md:text-base">© 2026 FinancIA. Todos los derechos reservados.</p>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Hecho con <span className="text-[#06B6D4]">❤️</span> en Colombia <span className="ml-1">🇨🇴</span>
        </p>
      </div>
    </div>
  </footer>
)

export default LandingFooter
