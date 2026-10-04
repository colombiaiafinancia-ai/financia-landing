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

  webpack: (config, { dev, isServer }) => {
    // Desactivar caché de Webpack en desarrollo para evitar errores de ENOENT
    if (dev) {
      config.cache = false
    }

    return config
  },
}

module.exports = nextConfig