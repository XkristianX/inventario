import { createClient } from '@/lib/supabase/client'

export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  const supabase = createClient()
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${productId}-${Date.now()}.${fileExt}`
  const filePath = `productos/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('productos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('productos')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    // Extract file path from URL
    // URL format: https://<project-id>.supabase.co/storage/v1/object/public/productos/productos/...
    const urlParts = imageUrl.split('/')
    const productosIndex = urlParts.indexOf('productos')
    
    if (productosIndex === -1) {
      console.error('Invalid image URL format')
      return false
    }
    
    // Get the path after 'productos/' (skip the bucket name, get the file path)
    const filePath = urlParts.slice(productosIndex + 1).join('/')

    const { error } = await supabase.storage
      .from('productos')
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

