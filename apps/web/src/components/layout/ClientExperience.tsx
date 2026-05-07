'use client'

import dynamic from 'next/dynamic'

// Dynamic import with ssr: false because these libraries use browser APIs 
// (Three.js and Lenis) and shouldn't run during static pre-rendering.
const GlobalExperience = dynamic(
  () => import('./GlobalExperience').then((mod) => mod.GlobalExperience),
  { ssr: false }
)

const SmoothScroll = dynamic(
  () => import('../home/SmoothScroll').then((mod) => mod.SmoothScroll),
  { ssr: false }
)

export function ClientExperience({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalExperience />
      <SmoothScroll>
        {children}
      </SmoothScroll>
    </>
  )
}
