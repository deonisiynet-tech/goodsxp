import { getDashboardStats } from '@/actions/dashboard'
import DashboardView from './DashboardView'

// Принудительно динамический рендеринг - не генерировать статически во время build
// Это нужно чтобы Prisma не пытался подключиться к БД во время Docker build
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const stats = await getDashboardStats()

  return <DashboardView stats={stats} />
}
