import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import PerfilForm from '@/components/PerfilForm'
import { User } from 'lucide-react'

export default async function PerfilPage() {
  const { user } = await requireAuth()
  const supabase = await createClient()

  // Get user profile
  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              Mi Perfil
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestiona tu información personal
            </p>
          </div>
        </div>

        <PerfilForm user={user} perfil={perfil} />
      </div>
    </Layout>
  )
}

