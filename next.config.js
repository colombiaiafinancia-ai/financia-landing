/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
    // Router Cache del cliente: al volver al dashboard desde otra ruta en <30s
    // se reutiliza la página ya cargada (los hooks revalidan en segundo plano).
    staleTimes: {
      dynamic: 30,
    },
    // Importa solo los íconos/módulos usados en vez del paquete completo
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  // Headers de seguridad para todas las rutas (antes los ponía el proxy en cada petición)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },

  webpack: (config, { dev, isServer }) => {
    // Desactivar caché de Webpack en desarrollo para evitar errores de ENOENT
    if (dev) {
      config.cache = false
    }

    return config
  },
}

module.exports = nextConfig