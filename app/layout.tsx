import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finanzas Consulting - FinancIA',
  description: 'Organiza tus finanzas con un simple mensaje en WhatsApp. Controla gastos, ahorra dinero y alcanza tus metas financieras con Paz, tu asistente personal.',
  keywords: 'finanzas personales, WhatsApp, asistente financiero, control de gastos, ahorro, presupuesto',
  authors: [{ name: 'FinancIA Team' }],
  creator: 'FinancIA',
  publisher: 'FinancIA',
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
    title: 'Finanzas Consulting - FinancIA',
    description: 'Organiza tus finanzas con un simple mensaje en WhatsApp. Controla gastos, ahorra dinero y alcanza tus metas financieras.',
    url: 'https://financia.app',
    siteName: 'FinancIA',
    images: [
      {
        url: '/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Finanzas Consulting - FinancIA',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finanzas Consulting - FinancIA',
    description: 'Organiza tus finanzas con un simple mensaje en WhatsApp. Controla gastos, ahorra dinero y alcanza tus metas financieras.',
    images: ['/favicon.ico'],
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
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0D1D35" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className} antialiased`}>
          <Providers>{children}</Providers>
      </body>
    </html>
  )
}