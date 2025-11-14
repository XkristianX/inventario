import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { user, supabase }
}

export async function getProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function checkRole(userId: string, allowedRoles: string[]) {
  const profile = await getProfile(userId)
  if (!profile) {
    return false
  }
  return allowedRoles.includes(profile.rol)
}

export async function requireRole(allowedRoles: string[]) {
  const { user } = await requireAuth()
  const hasRole = await checkRole(user.id, allowedRoles)
  
  if (!hasRole) {
    redirect('/dashboard')
  }

  return { user }
}

