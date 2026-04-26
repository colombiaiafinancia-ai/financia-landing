/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
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