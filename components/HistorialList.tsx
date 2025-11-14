'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, ArrowUp, ArrowDown } from 'lucide-react'
import type { Movimiento } from '@/lib/types/database'

interface HistorialListProps {
  movimientos: any[]
  productos: { id: string; nombre: string }[]
  perfiles: { user_id: string; nombre: string }[]
  searchParams: {
    producto_id?: string
    tipo?: string
    fecha_inicio?: string
    fecha_fin?: string
    responsable?: string
  }
}

export default function HistorialList({
  movimientos,
  productos,
  perfiles,
  searchParams,
}: HistorialListProps) {
  const router = useRouter()
  const [filters, setFilters] = useState({
    producto_id: searchParams.producto_id || '',
    tipo: searchParams.tipo || '',
    fecha_inicio: searchParams.fecha_inicio || '',
    fecha_fin: searchParams.fecha_fin || '',
    responsable: searchParams.responsable || '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })
    router.push(`/historial?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setFilters({
      producto_id: '',
      tipo: '',
      fecha_inicio: '',
      fecha_fin: '',
      responsable: '',
    })
    router.push('/historial')
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label
                htmlFor="producto_id"
                className="block text-sm font-medium text-gray-700"
              >
                Producto
              </label>
              <select
                name="producto_id"
                id="producto_id"
                value={filters.producto_id}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Todos</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tipo"
                className="block text-sm font-medium text-gray-700"
              >
                Tipo
              </label>
              <select
                name="tipo"
                id="tipo"
                value={filters.tipo}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fecha_inicio"
                className="block text-sm font-medium text-gray-700"
              >
                Fecha Inicio
              </label>
              <input
                type="date"
                name="fecha_inicio"
                id="fecha_inicio"
                value={filters.fecha_inicio}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="fecha_fin"
                className="block text-sm font-medium text-gray-700"
              >
                Fecha Fin
              </label>
              <input
                type="date"
                name="fecha_fin"
                id="fecha_fin"
                value={filters.fecha_fin}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="responsable"
                className="block text-sm font-medium text-gray-700"
              >
                Responsable
              </label>
              <select
                name="responsable"
                id="responsable"
                value={filters.responsable}
                onChange={handleFilterChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Todos</option>
                {perfiles.map((perfil) => (
                  <option key={perfil.user_id} value={perfil.user_id}>
                    {perfil.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5 flex justify-end space-x-3">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Limpiar
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Movements List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {movimientos.length === 0 ? (
            <li className="px-4 py-5 sm:px-6">
              <p className="text-sm text-gray-500">No se encontraron movimientos</p>
            </li>
          ) : (
            movimientos.map((movimiento: any) => (
              <li key={movimiento.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        movimiento.tipo === 'entrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {movimiento.tipo === 'entrada' ? (
                        <ArrowUp className="h-5 w-5" />
                      ) : (
                        <ArrowDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {movimiento.productos?.nombre || 'Producto no encontrado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {movimiento.motivo} • {movimiento.perfiles?.nombre || 'Usuario desconocido'} •{' '}
                        {new Date(movimiento.fecha).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`text-sm font-medium ${
                        movimiento.tipo === 'entrada'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {movimiento.tipo === 'entrada' ? '+' : '-'}
                      {movimiento.cantidad}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

