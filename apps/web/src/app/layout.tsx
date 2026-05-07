import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster }       from 'sonner'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    default:  'Atelier — AI Fashion Stylist',
    template: '%s — Atelier',
  },
  description:    'AI-powered personalized outfit recommendations based on your style, measurements, and weather.',
  keywords:       ['fashion', 'AI stylist', 'outfit', 'personal style', 'wardrobe'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type:        'website',
    siteName:    'Atelier',
    title:       'Atelier — AI Fashion Stylist',
    description: 'AI-powered personalized outfit recommendations',
  },
  robots: {
    index:  false,
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor:  '#F5F0E8',
  initialScale: 1,
  width:       'device-width',
}

import { ClientExperience } from '../components/layout/ClientExperience'
import { ApiAuthConfig }    from '../components/auth/ApiAuthConfig'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen antialiased relative">
          <ApiAuthConfig />
          <ClientExperience>
            <div className="relative z-10 min-h-screen">
              {children}
            </div>
          </ClientExperience>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'inherit',
                background:  'rgba(11, 1, 30, 0.8)',
                backdropFilter: 'blur(16px)',
                color:       '#FFFFFF',
                border:      '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
