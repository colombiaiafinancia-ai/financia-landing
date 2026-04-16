import { CategoriesProvider } from '@/contexts/CategoriesContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <CategoriesProvider>{children}</CategoriesProvider>
}
