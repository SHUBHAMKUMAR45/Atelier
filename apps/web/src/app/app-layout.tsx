import type { Metadata } from 'next'

// Shared metadata for all authenticated app pages
// Individual pages can override specific fields
export const metadata: Metadata = {
  title: {
    default:  'Atelier — AI Fashion Stylist',
    template: '%s — Atelier',
  },
  description:    'AI-powered personalized outfit recommendations based on your style, measurements, and weather.',
  keywords:       ['fashion', 'AI stylist', 'outfit recommendations', 'personal style'],
  openGraph: {
    type:        'website',
    siteName:    'Atelier',
    title:       'Atelier — AI Fashion Stylist',
    description: 'AI-powered personalized outfit recommendations',
  },
}

// This layout wraps all pages at /dashboard, /recommend, /history, /profile, /trends
// Clerk middleware already protects these routes — no auth check needed here
export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return <>{children}</>
}
