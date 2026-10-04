import { redirect } from 'next/navigation'
import { CategoriesProvider } from '@/contexts/CategoriesContext'
import { getDashboardSession, loadDashboardInitialData } from '@/lib/dashboard/server-data'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  // Misma llamada que el layout (deduplicada con React `cache`)
  const { user } = await getDashboardSession()
  if (!user) redirect('/login')

  const initialData = await loadDashboardInitialData(user.id)

  return (
    <CategoriesProvider
      userId={user.id}
      initialData={initialData.categories}
      initialFetchedAt={initialData.fetchedAt}
    >
      <DashboardClient initialData={initialData} />
    </CategoriesProvider>
  )
}
