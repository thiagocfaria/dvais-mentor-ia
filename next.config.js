/**
 * Next.js Configuration
 * 
 * Configuração completa do Next.js com otimizações de performance
 * - WebAssembly support
 * - Bundle optimization (tree-shaking, code splitting)
 * - Security headers
 * - PWA (apenas produção)
 * - Image optimization
 */

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true', // Ativar com ANALYZE=true npm run build
})

// Security headers (CSP, HSTS, X-Frame-Options, etc.)
const securityHeaders = require('./security-headers.config')

// PWA apenas em produção (não precisa em desenvolvimento)
const isProduction = process.env.NODE_ENV === 'production'
let nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false, // Remove header X-Powered-By (segurança)
  
  /**
   * Webpack Configuration
   * 
   * Otimizações de bundle para performance máxima
   * - Tree-shaking do TensorFlow.js
   * - Code splitting inteligente
   * - Suporte a WebAssembly
   * - Chunks separados para melhor cache
   */
  webpack: (config, { isServer }) => {
    // Aplicar otimizações apenas no cliente (não no servidor)
    if (!isServer) {
      // Tree-shaking para TensorFlow.js
      // Alias '@tensorflow/tfjs' para '@tensorflow/tfjs-core' (mais leve)
      // Remove código não usado automaticamente
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tensorflow/tfjs$': '@tensorflow/tfjs-core', // Tree-shaking: usa apenas core
      }
      
      // Adicionar suporte a arquivos WASM
      // Permite importar arquivos .wasm diretamente
      // Type: 'webassembly/async' = carregamento assíncrono (não bloqueia)
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async', // Carregamento assíncrono (melhor performance)
      })
      
      // Otimizar chunks (code splitting)
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic', // IDs determinísticos (melhor cache)
        runtimeChunk: 'single', // Runtime em chunk separado (melhor cache)
        splitChunks: {
          chunks: 'all', // Aplicar a todos os chunks
          cacheGroups: {
            // TensorFlow.js em chunk separado
            // Por quê: Biblioteca grande, pode ser carregada sob demanda
            // Benefício: Melhor cache, carregamento paralelo
            tensorflow: {
              test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
              name: 'tensorflow',
              priority: 10, // Alta prioridade (separar primeiro)
              enforce: true, // Forçar separação mesmo se pequeno
            },
            // Vendors comuns em chunk separado
            // Por quê: Bibliotecas de terceiros mudam menos frequentemente
            // Benefício: Cache melhor, atualizações menos frequentes
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 5, // Prioridade média
            },
          },
        },
      }
    }
    
    // Habilitar WebAssembly no Webpack
    // Necessário para suportar arquivos .wasm
    // asyncWebAssembly: carregamento assíncrono (não bloqueia)
    // layers: suporte a camadas (melhor organização)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true, // Suporte a WebAssembly assíncrono
      layers: true, // Suporte a camadas (organização)
    }
    
    return config
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Headers específicos para arquivos WASM
      // Por quê: Arquivos WASM são imutáveis (não mudam)
      // Benefício: Cache agressivo (1 ano) = carregamento instantâneo após primeira vez
      {
        source: '/tfjs-wasm/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Cache de 1 ano (arquivos imutáveis)
          },
          {
            key: 'Content-Type',
            value: 'application/wasm', // MIME type correto para WASM
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/aprendizado',
        destination: '/aprendizado-continuo',
        permanent: true,
      },
      {
        source: '/protecao-inteligente',
        destination: '/seguranca',
        permanent: true,
      },
    ]
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

// Aplicar PWA apenas em produção
if (isProduction) {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    buildExcludes: [/app-build-manifest\.json$/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  })
  nextConfig = withPWA(nextConfig)
}

module.exports = withBundleAnalyzer(nextConfig)

