export interface Producto {
  id: string
  nombre: string
  categoria: string
  stock: number
  stock_minimo: number
  precio_entrada: number
  precio_salida: number
  proveedor: string
  fecha_registro: string
  imagen_url: string | null
  created_at?: string
  updated_at?: string
}

export interface Movimiento {
  id: string
  producto_id: string
  tipo: 'entrada' | 'salida'
  cantidad: number
  motivo: string
  responsable: string
  fecha: string
  created_at?: string
  productos?: Producto
  perfiles?: Perfil
}

export interface Perfil {
  id: string
  user_id: string
  nombre: string
  rol: 'admin' | 'empleado' | 'auditor'
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  perfiles?: Perfil
}

