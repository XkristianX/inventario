import Layout from '@/components/Layout'
import { requireRole } from '@/lib/utils/auth'
import ProductoForm from '@/components/ProductoForm'
import { Package } from 'lucide-react'

export default async function NuevoProductoPage() {
  await requireRole(['admin', 'empleado'])

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              Nuevo Producto
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Crea un nuevo producto en el inventario
            </p>
          </div>
        </div>

        <ProductoForm />
      </div>
    </Layout>
  )
}

