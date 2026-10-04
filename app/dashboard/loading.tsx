import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeletons'

/** Se muestra al instante mientras el servidor precarga los datos del dashboard. */
export default function DashboardLoading() {
  return <DashboardSkeleton />
}
