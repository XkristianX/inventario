'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, Edit, Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { Producto } from '@/lib/types/database'

export default function ProductosList({
  productos,
  categorias,
  searchParams,
}: {
  productos: Producto[]
  categorias: string[]
  searchParams: { search?: string; categoria?: string }
}) {
  const router = useRouter()
  const [search, setSearch] = useState(searchParams.search || '')
  const [categoria, setCategoria] = useState(searchParams.categoria || '')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria) params.set('categoria', categoria)
    router.push(`/productos?${params.toString()}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return
    }

    setLoading(id)
    const supabase = createClient()

    try {
      const { error } = await supabase.from('productos').delete().eq('id', id)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      alert('Error al eliminar producto: ' + error.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Products Grid */}
      {productos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="relative h-48 bg-gray-200">
                {producto.imagen_url ? (
                  <Image
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {producto.stock < producto.stock_minimo && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Stock Bajo
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {producto.nombre}
                </h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium">Categoría:</span> {producto.categoria}
                  </p>
                  <p>
                    <span className="font-medium">Stock:</span> {producto.stock} unidades
                  </p>
                  <p>
                    <span className="font-medium">Precio entrada:</span> ${producto.precio_entrada}
                  </p>
                  <p>
                    <span className="font-medium">Precio salida:</span> ${producto.precio_salida}
                  </p>
                  <p>
                    <span className="font-medium">Proveedor:</span> {producto.proveedor}
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Link
                    href={`/productos/${producto.id}/editar`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(producto.id)}
                    disabled={loading === producto.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

