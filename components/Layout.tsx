import Navbar from './Navbar'
import { getProfile } from '@/lib/utils/auth'
import { requireAuth } from '@/lib/utils/auth'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth()
  const profile = await getProfile(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole={profile?.rol} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

