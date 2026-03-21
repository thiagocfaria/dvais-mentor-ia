import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import FixedLogo from '@/componentes/FixedLogo'
import CometsLayer from '@/componentes/CometsLayer'
import AssistenteWidget from '@/componentes/Assistente/AssistenteWidget'
// Configuração do FontAwesome (deve ser importado antes de qualquer uso)
import '@/biblioteca/fontawesome/config'
// CSS do FontAwesome (global)
import '@fortawesome/fontawesome-svg-core/styles.css'
import WebVitals from './components/WebVitals'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://example.com')

export const metadata: Metadata = {
  title: {
    default: 'DVAi$ - Mentor IA | Assistente Contextual para Orientação em Investimentos',
    template: '%s | DVAi$ - Mentor IA',
  },
  description:
    'Protótipo técnico em Next.js com assistente contextual por voz e clique, focado em orientação guiada, resiliência de integração e fluxos validados.',
  keywords: [
    'Next.js',
    'TypeScript',
    'assistente contextual',
    'voz',
    'investimentos',
    'UX guiada',
    'portfólio técnico',
  ],
  authors: [{ name: 'DVAi$ - Mentor IA' }],
  creator: 'DVAi$ - Mentor IA',
  publisher: 'DVAi$ - Mentor IA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    title: 'DVAi$ - Mentor IA | Assistente Contextual para Orientação em Investimentos',
    description:
      'Protótipo técnico com assistente contextual por voz e clique, validação de ações e camada de resiliência para integrações.',
    siteName: 'DVAi$ - Mentor IA',
    images: [
      {
        url: '/ai-head.png',
        width: 512,
        height: 512,
        alt: 'DVAi$ - Mentor IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DVAi$ - Mentor IA | Assistente Contextual para Orientação em Investimentos',
    description:
      'Protótipo técnico com assistente contextual, validação de ações, cache, rate limit e circuit breaker.',
    images: ['/ai-head.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* CSS Crítico Inline - Above the Fold (melhora FCP) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            *{margin:0;padding:0;box-sizing:border-box}
            html{width:100%;height:100%;scroll-behavior:smooth}
            body{margin:0;padding:0;width:100%;min-width:320px;min-height:100vh;overflow-x:hidden;overflow-y:auto;font-family:var(--font-inter),sans-serif;color:#fff;background:#000514}
            header{position:fixed;top:0;left:0;right:0;z-index:50}
            main{margin:0;padding:0}
          `,
          }}
        />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DVAi$ - Mentor IA" />
        {/* Font Awesome agora é self-hosted (otimizado) */}
      </head>
      <body className="chameleon-bg">
        {/* Sentinel para IntersectionObserver (substitui scroll listener) */}
        <div
          id="top-sentinel"
          aria-hidden="true"
          style={{ position: 'absolute', top: 0, height: 1, width: 1 }}
        />

        {/* Aurora background */}
        <div className="aurora-bg"></div>

        {/* Light beams */}
        <div className="light-beam-1"></div>
        <div className="light-beam-2"></div>
        <div className="light-beam-3"></div>
        <div className="light-beam-4"></div>
        <div className="light-beam-5"></div>

        {/* Comets (highlight + background) */}
        <CometsLayer />

        {/* Logo fixo - não se move durante scroll */}
        <FixedLogo />

        <div className="content-wrapper">{children}</div>

        {/* Widget flutuante do assistente (paginas publicas) */}
        <AssistenteWidget />

        {/* Web Vitals Tracking */}
        <WebVitals />
      </body>
    </html>
  )
}
