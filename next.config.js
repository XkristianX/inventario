/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    minimumCacheTTL: 31536000,
  },
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // Optimizaciones para desarrollo - mantener más páginas en memoria
  onDemandEntries: {
    // Aumentar tiempo de inactividad antes de descargar páginas
    maxInactiveAge: 60 * 1000, // 60 segundos (antes 15s)
    // Mantener más páginas en buffer para evitar recompilaciones
    pagesBufferLength: 5, // Aumentado de 1 a 5
  },
  experimental: {
    // Optimizar importaciones de paquetes grandes
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js', 'date-fns'],
    webpackMemoryOptimizations: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Optimizaciones solo para desarrollo
    if (dev) {
      // Reducir el tamaño de los chunks en desarrollo
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Desactivar split chunks en desarrollo para compilación más rápida
      }
    } else {
      // Configuración de producción
      if (!isServer) {
        config.optimization.splitChunks.cacheGroups = {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        }
      }
    }
    return config
  },
}

module.exports = nextConfig

