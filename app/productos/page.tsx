import Layout from '@/components/Layout'
import { requireAuth } from '@/lib/utils/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from 'lucide-react'
import ProductosList from '@/components/ProductosList'

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: { search?: string; categoria?: string }
}) {
  await requireAuth()
  const supabase = await createClient()

  let query = supabase.from('productos').select('*').order('nombre')

  if (searchParams.search) {
    query = query.ilike('nombre', `%${searchParams.search}%`)
  }

  if (searchParams.categoria) {
    query = query.eq('categoria', searchParams.categoria)
  }

  // Obtener productos y categorías en paralelo
  const [productosResult, categoriasResult] = await Promise.all([
    query,
    // Usar DISTINCT en la base de datos en lugar de procesar en JavaScript
    supabase.from('productos').select('categoria').order('categoria'),
  ])

  const { data: productos, error } = productosResult

  // Obtener categorías únicas desde la consulta
  const categorias = Array.from(
    new Set(categoriasResult.data?.map((p) => p.categoria).filter(Boolean) || [])
  )

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Productos
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gestiona los productos de tu inventario
              </p>
            </div>
          </div>
          <Link
            href="/productos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Link>
        </div>

        <ProductosList
          productos={productos || []}
          categorias={categorias}
          searchParams={searchParams}
        />
      </div>
    </Layout>
  )
}

