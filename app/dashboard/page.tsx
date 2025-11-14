import Layout from '@/components/Layout'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const { user, supabase } = await requireAuth()

  // Get statistics - optimized queries
  const [productsCountResult, productsDataResult, movementsResult] = await Promise.all([
    // Solo contar productos (más rápido)
    supabase.from('productos').select('id', { count: 'exact', head: true }),
    // Solo datos necesarios para cálculos (limitado a 1000 para evitar timeouts)
    supabase
      .from('productos')
      .select('stock, stock_minimo, precio_entrada')
      .limit(1000),
    // Movimientos con JOIN para evitar consulta adicional
    supabase
      .from('movimientos')
      .select('*, productos(id, nombre)')
      .order('fecha', { ascending: false })
      .limit(5),
  ])

  const totalProducts = productsCountResult.count || 0
  const productos = productsDataResult.data || []
  const lowStockProducts = productos.filter((p) => p.stock < p.stock_minimo).length
  const lastMovements = movementsResult.data || []
  const inventoryValue =
    productos.reduce((acc, product) => {
      return acc + product.stock * product.precio_entrada
    }, 0) || 0

  // Mapear productos desde el JOIN
  const productMap = new Map(
    lastMovements
      .map((m) => {
        const producto = m.productos as { id: string; nombre: string } | null
        return producto ? [m.producto_id, producto.nombre] : null
      })
      .filter((item): item is [string, string] => item !== null)
  )

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <p className="ml-[60px] text-gray-600">
            Bienvenido, aquí está el resumen de tu inventario
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Productos
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {totalProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Stock Bajo
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {lowStockProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Valor Inventario
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      ${inventoryValue.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Últimos Movimientos
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {lastMovements.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts > 0 && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Tienes <strong className="font-bold">{lowStockProducts}</strong> productos con stock bajo.
                  <Link href="/productos" className="ml-2 text-yellow-700 hover:text-yellow-900 underline font-semibold transition-colors duration-200">
                    Ver productos
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Movements */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl leading-6 font-bold text-gray-900">
              Últimos Movimientos
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {lastMovements.length === 0 ? (
              <li className="px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">No hay movimientos recientes</p>
              </li>
            ) : (
              lastMovements.map((movement) => (
                <li key={movement.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          movement.tipo === 'entrada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {movement.tipo === 'entrada' ? '+' : '-'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {productMap.get(movement.producto_id) || 
                           (movement.productos as { nombre: string } | null)?.nombre || 
                           'Producto no encontrado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {movement.motivo} • {new Date(movement.fecha).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-sm font-medium ${
                          movement.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {movement.tipo === 'entrada' ? '+' : '-'}
                        {movement.cantidad}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-t border-gray-200">
            <Link
              href="/historial"
              className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200 group"
            >
              Ver todo el historial
              <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

