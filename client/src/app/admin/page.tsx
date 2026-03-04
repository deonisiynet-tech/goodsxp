import { getDashboardStats } from '@/actions/dashboard'
import DashboardView from './DashboardView'

export default async function AdminPage() {
  const stats = await getDashboardStats()

  return <DashboardView stats={stats} />
}
