import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond, JetBrains_Mono, Shippori_Mincho } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const shipporiMincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-shippori',
  display: 'swap',
})

const BASE_URL = 'https://anjinrally.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MIURA ANJIN RALLY 2026 | 三浦按針ラリー',
    template: '%s | MIURA ANJIN RALLY 2026',
  },
  description:
    '三浦半島を舞台にした、歴史と冒険のバイクラリー。2026年6月20-21日開催。FELICITY × Royal Enfieldが贈るGPSスタンプラリー。6つのチェックポイントを制覇せよ。',
  keywords: [
    '三浦按針', 'バイクラリー', '三浦半島', 'スタンプラリー', 'motorcycle rally', '2026',
    'FELICITY', 'Royal Enfield', '葉山', '逗子', 'GPSラリー', '按針記念',
  ],
  authors: [{ name: 'FELICITY × Royal Enfield' }],
  creator: 'FELICITY',
  publisher: 'FELICITY',
  category: 'event',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ANJIN RALLY',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: BASE_URL,
    siteName: 'MIURA ANJIN RALLY 2026',
    title: 'MIURA ANJIN RALLY 2026 | 三浦按針ラリー',
    description:
      '三浦半島を舞台にした、歴史と冒険のバイクラリー。2026年6月20-21日開催。FELICITY × Royal Enfieldが贈るGPSスタンプラリー。6つのチェックポイントを制覇せよ。',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'MIURA ANJIN RALLY 2026 — 三浦半島GPSスタンプラリー',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@felicity_hayama',
    title: 'MIURA ANJIN RALLY 2026 | 三浦按針ラリー',
    description:
      '三浦半島を舞台にした、歴史と冒険のバイクラリー。2026年6月20-21日開催。FELICITY × Royal Enfieldが贈るGPSスタンプラリー。',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#2a2925',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable} ${shipporiMincho.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="按針ラリー" />
      </head>
      <body className="min-h-screen bg-rally-bg text-rally-ink" style={{ fontFamily: 'Inter, "Noto Sans JP", sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
