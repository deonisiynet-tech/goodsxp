import dynamic from 'next/dynamic'

// Динамічний іморт DashboardView без SSR
const DashboardView = dynamic(() => import('./DashboardView'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

export const revalidate = 0

export default function AdminPage() {
  return <DashboardView />
}
