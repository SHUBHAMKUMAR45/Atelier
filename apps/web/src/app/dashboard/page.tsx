import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '../../components/layout/AppLayout'
import { DashboardClient } from './page.client'

export const metadata = {
  title: 'Studio — Atelier',
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <AppLayout>
      <DashboardClient />
    </AppLayout>
  )
}
