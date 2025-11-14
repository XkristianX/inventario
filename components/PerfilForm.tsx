'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Perfil } from '@/lib/types/database'

export default function PerfilForm({
  user,
  perfil,
}: {
  user: User
  perfil: Perfil | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    nombre: perfil?.nombre || '',
    email: user.email || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (perfil) {
        // Update profile
        const { error: updateError } = await supabase
          .from('perfiles')
          .update({
            nombre: formData.nombre,
          })
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        // Create profile
        const { error: insertError } = await supabase
          .from('perfiles')
          .insert({
            user_id: user.id,
            nombre: formData.nombre,
            rol: 'empleado',
          })

        if (insertError) throw insertError
      }

      setSuccess('Perfil actualizado correctamente')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Error al actualizar perfil')
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

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              required
              value={formData.nombre}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              disabled
              value={formData.email}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              El email no se puede modificar
            </p>
          </div>

          {perfil && (
            <div>
              <label
                htmlFor="rol"
                className="block text-sm font-medium text-gray-700"
              >
                Rol
              </label>
              <input
                type="text"
                name="rol"
                id="rol"
                disabled
                value={perfil.rol}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                El rol solo puede ser modificado por un administrador
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

