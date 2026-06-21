import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sora',
})

export const metadata: Metadata = {
  title: {
    default: 'FinancIA | App de finanzas personales por WhatsApp',
    template: '%s | FinancIA',
  },
  description: 'FinancIA es una app de finanzas personales que registra gastos, crea presupuestos y muestra reportes desde WhatsApp con ayuda de inteligencia artificial.',
  keywords: [
    'FinancIA',
    'financia',
    'app finanzas personales',
    'apps personales',
    'aplicacion de finanzas personales',
    'control de gastos por WhatsApp',
    'asistente financiero',
    'presupuesto personal',
    'ahorro personal',
    'finanzas personales Colombia',
  ],
  authors: [{ name: 'FinancIA' }],
  creator: 'FinancIA',
  publisher: 'FinancIA',
  applicationName: 'FinancIA',
  category: 'FinanceApplication',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://financia.app'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',    
    apple: '/favicon.ico', 
  },
  openGraph: {
    title: 'FinancIA | Finanzas personales por WhatsApp',
    description: 'Registra gastos, entiende tus habitos y controla tu presupuesto con una app de finanzas personales impulsada por IA.',
    url: 'https://financia.app',
    siteName: 'FinancIA',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FinancIA, app de finanzas personales por WhatsApp',
      },
    ],
    locale: 'es_CO',
    alternateLocale: ['es_ES', 'es_MX'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FinancIA | App de finanzas personales',
    description: 'Controla gastos, presupuestos y reportes desde WhatsApp con inteligencia artificial.',
    images: ['/opengraph-image'],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0D1D35" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.variable} ${sora.variable} ${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
