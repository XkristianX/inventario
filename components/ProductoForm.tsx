'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadProductImage, deleteProductImage } from '@/lib/utils/storage'
import type { Producto } from '@/lib/types/database'
import Image from 'next/image'
import { ImageIcon, X } from 'lucide-react'

export default function ProductoForm({ producto }: { producto?: Producto }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(
    producto?.imagen_url || null
  )
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    nombre: producto?.nombre || '',
    categoria: producto?.categoria || '',
    stock: producto?.stock || 0,
    stock_minimo: producto?.stock_minimo || 0,
    precio_entrada: producto?.precio_entrada || 0,
    precio_salida: producto?.precio_salida || 0,
    proveedor: producto?.proveedor || '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'stock' || name === 'stock_minimo' || name === 'precio_entrada' || name === 'precio_salida'
        ? parseFloat(value) || 0
        : value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (producto) {
        // Update product
        let imagenUrl = producto.imagen_url || null

        // Upload new image if selected
        if (imageFile) {
          // Delete old image if exists
          if (producto.imagen_url) {
            await deleteProductImage(producto.imagen_url)
          }

          // Upload new image
          const uploadedUrl = await uploadProductImage(
            imageFile,
            producto.id
          )
          if (uploadedUrl) {
            imagenUrl = uploadedUrl
          }
        }

        const { error: updateError } = await supabase
          .from('productos')
          .update({
            ...formData,
            imagen_url: imagenUrl,
          })
          .eq('id', producto.id)

        if (updateError) throw updateError
      } else {
        // Create product first to get ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuario no autenticado')

        // Create product without image first
        const { data: newProduct, error: insertError } = await supabase
          .from('productos')
          .insert({
            ...formData,
            imagen_url: null,
            fecha_registro: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Upload image if selected (now we have the actual product ID)
        let imagenUrl = null
        if (imageFile && newProduct) {
          const uploadedUrl = await uploadProductImage(
            imageFile,
            newProduct.id
          )
          if (uploadedUrl) {
            imagenUrl = uploadedUrl

            // Update product with image URL
            const { error: updateError } = await supabase
              .from('productos')
              .update({ imagen_url: imagenUrl })
              .eq('id', newProduct.id)

            if (updateError) {
              console.error('Error updating product with image URL:', updateError)
              // Continue anyway, the product was created successfully
            }
          }
        }
      }

      router.push('/productos')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Error al guardar producto')
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
              className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="categoria"
              className="block text-sm font-medium text-gray-700"
            >
              Categoría *
            </label>
            <input
              type="text"
              name="categoria"
              id="categoria"
              required
              value={formData.categoria}
              onChange={handleInputChange}
              className="mt-1 block w-full border text-gray-900 bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock *
            </label>
            <input
              type="number"
              name="stock"
              id="stock"
              required
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="stock_minimo"
              className="block text-sm font-medium text-gray-700"
            >
              Stock Mínimo *
            </label>
            <input
              type="number"
              name="stock_minimo"
              id="stock_minimo"
              required
              min="0"
              value={formData.stock_minimo}
              onChange={handleInputChange}
              className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="precio_entrada"
              className="block text-sm font-medium text-gray-700"
            >
              Precio Entrada *
            </label>
            <input
              type="number"
              name="precio_entrada"
              id="precio_entrada"
              required
              min="0"
              step="0.01"
              value={formData.precio_entrada}
              onChange={handleInputChange}
              className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="precio_salida"
              className="block text-sm font-medium text-gray-700"
            >
              Precio Salida *
            </label>
            <input
              type="number"
              name="precio_salida"
              id="precio_salida"
              required
              min="0"
              step="0.01"
              value={formData.precio_salida}
              onChange={handleInputChange}
              className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="proveedor"
              className="block text-sm font-medium text-gray-700"
            >
              Proveedor *
            </label>
            <input
              type="text"
              name="proveedor"
              id="proveedor"
              required
              value={formData.proveedor}
              onChange={handleInputChange}
              className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="imagen"
              className="block text-sm font-medium text-gray-700"
            >
              Imagen del Producto
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative h-32 w-32">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-32 w-32 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <input
                type="file"
                name="imagen"
                id="imagen"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
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
            {loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  )
}

