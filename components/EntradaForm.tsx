'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Producto } from '@/lib/types/database'

export default function EntradaForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 0,
    motivo: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre')

    if (error) {
      console.error('Error loading productos:', error)
      return
    }

    setProductos(data || [])
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'cantidad' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      if (formData.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      // Create movimiento
      const { error: movimientoError } = await supabase
        .from('movimientos')
        .insert({
          producto_id: formData.producto_id,
          tipo: 'entrada',
          cantidad: formData.cantidad,
          motivo: formData.motivo,
          responsable: user.id,
          fecha: formData.fecha,
        })

      if (movimientoError) throw movimientoError

      router.push('/historial')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Error al registrar entrada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="producto_id"
              className="block text-sm font-medium text-gray-700"
            >
              Producto *
            </label>
            <select
              name="producto_id"
              id="producto_id"
              required
              value={formData.producto_id}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} (Stock: {producto.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cantidad"
              className="block text-sm font-medium text-gray-700"
            >
              Cantidad *
            </label>
            <input
              type="number"
              name="cantidad"
              id="cantidad"
              required
              min="1"
              step="1"
              value={formData.cantidad}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="fecha"
              className="block text-sm font-medium text-gray-700"
            >
              Fecha *
            </label>
            <input
              type="date"
              name="fecha"
              id="fecha"
              required
              value={formData.fecha}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="motivo"
              className="block text-sm font-medium text-gray-700"
            >
              Motivo *
            </label>
            <input
              type="text"
              name="motivo"
              id="motivo"
              required
              value={formData.motivo}
              onChange={handleInputChange}
              placeholder="Ej: Compra, Devolución, Ajuste, etc."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Entrada'}
          </button>
        </div>
      </form>
    </div>
  )
}

