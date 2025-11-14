import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import HistorialList from '@/components/HistorialList'
import { Package } from 'lucide-react'

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: {
    producto_id?: string
    tipo?: string
    fecha_inicio?: string
    fecha_fin?: string
    responsable?: string
  }
}) {
  await requireAuth()
  const supabase = await createClient()

  let query = supabase
    .from('movimientos')
    .select('*, productos(nombre)')
    .order('fecha', { ascending: false })

  if (searchParams.producto_id) {
    query = query.eq('producto_id', searchParams.producto_id)
  }

  if (searchParams.tipo) {
    query = query.eq('tipo', searchParams.tipo)
  }

  if (searchParams.fecha_inicio) {
    query = query.gte('fecha', searchParams.fecha_inicio)
  }

  if (searchParams.fecha_fin) {
    query = query.lte('fecha', searchParams.fecha_fin)
  }

  if (searchParams.responsable) {
    query = query.eq('responsable', searchParams.responsable)
  }

  const { data: movimientos, error } = await query

  // Get productos for filter
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre')
    .order('nombre')

  // Get usuarios for filter
  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('user_id, nombre')
    .order('nombre')

  // Map movimientos with profile names
  const movimientosWithProfiles = movimientos?.map((movimiento) => {
    const perfil = perfiles?.find((p) => p.user_id === movimiento.responsable)
    return {
      ...movimiento,
      perfiles: perfil ? { nombre: perfil.nombre } : null,
    }
  }) || []

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              Historial de Movimientos
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Visualiza todos los movimientos del inventario
            </p>
          </div>
        </div>

        <HistorialList
          movimientos={movimientosWithProfiles}
          productos={productos || []}
          perfiles={perfiles || []}
          searchParams={searchParams}
        />
      </div>
    </Layout>
  )
}

