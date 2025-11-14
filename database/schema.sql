-- ============================================
-- SISTEMA DE INVENTARIO - SCHEMA SQL
-- ============================================

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  precio_entrada DECIMAL(10, 2) NOT NULL,
  precio_salida DECIMAL(10, 2) NOT NULL,
  proveedor TEXT NOT NULL,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: movimientos
CREATE TABLE IF NOT EXISTS movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT NOT NULL,
  responsable UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: perfiles
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'empleado', 'auditor')) DEFAULT 'empleado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id ON movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_responsable ON movimientos(responsable);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
-- Índices adicionales para optimizar búsquedas y consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_nombre_ilike ON productos USING gin(nombre gin_trgm_ops); -- Requiere extensión pg_trgm
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha_desc ON movimientos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_perfiles_user_id ON perfiles(user_id); -- Ya existe por UNIQUE, pero explícito

-- ============================================
-- FUNCIÓN: Actualizar stock automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_stock()
RETURNS TRIGGER AS $$
DECLARE
  stock_actual INTEGER;
BEGIN
  -- Obtener stock actual del producto
  SELECT stock INTO stock_actual
  FROM productos
  WHERE id = NEW.producto_id;

  -- Verificar si es entrada o salida
  IF NEW.tipo = 'entrada' THEN
    -- Sumar al stock
    UPDATE productos
    SET stock = stock + NEW.cantidad,
        updated_at = NOW()
    WHERE id = NEW.producto_id;
  ELSIF NEW.tipo = 'salida' THEN
    -- Verificar que el stock sea suficiente
    IF stock_actual < NEW.cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente. Stock actual: %, cantidad solicitada: %', stock_actual, NEW.cantidad;
    END IF;
    
    -- Restar del stock
    UPDATE productos
    SET stock = stock - NEW.cantidad,
        updated_at = NOW()
    WHERE id = NEW.producto_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Ejecutar función de actualización de stock
-- ============================================

DROP TRIGGER IF EXISTS trigger_actualizar_stock ON movimientos;
CREATE TRIGGER trigger_actualizar_stock
  AFTER INSERT ON movimientos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock();

-- ============================================
-- FUNCIÓN: Validar actualización de perfil
-- ============================================

CREATE OR REPLACE FUNCTION validar_actualizacion_perfil()
RETURNS TRIGGER AS $$
DECLARE
  usuario_es_admin BOOLEAN;
BEGIN
  -- Si el rol está cambiando, verificar permisos
  IF OLD.rol != NEW.rol THEN
    -- Verificar si el usuario que hace el cambio es admin
    SELECT EXISTS (
      SELECT 1 FROM perfiles
      WHERE user_id = auth.uid()
      AND rol = 'admin'
    ) INTO usuario_es_admin;
    
    -- Solo los admins pueden cambiar roles
    IF NOT usuario_es_admin THEN
      RAISE EXCEPTION 'No tienes permisos para cambiar el rol. Solo los administradores pueden cambiar roles.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Validar actualización de perfil
-- ============================================

DROP TRIGGER IF EXISTS trigger_validar_perfil ON perfiles;
CREATE TRIGGER trigger_validar_perfil
  BEFORE UPDATE ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION validar_actualizacion_perfil();

-- ============================================
-- FUNCIÓN: Crear perfil automáticamente cuando se crea un usuario
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (user_id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'empleado'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Crear perfil al crear usuario
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Políticas para productos
-- Todos los usuarios autenticados pueden leer productos
CREATE POLICY "Usuarios autenticados pueden leer productos"
  ON productos FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin y empleado pueden insertar productos
CREATE POLICY "Admin y empleado pueden crear productos"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol IN ('admin', 'empleado')
    )
  );

-- Solo admin y empleado pueden actualizar productos
CREATE POLICY "Admin y empleado pueden actualizar productos"
  ON productos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol IN ('admin', 'empleado')
    )
  );

-- Solo admin puede eliminar productos
CREATE POLICY "Solo admin puede eliminar productos"
  ON productos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Políticas para movimientos
-- Todos los usuarios autenticados pueden leer movimientos
CREATE POLICY "Usuarios autenticados pueden leer movimientos"
  ON movimientos FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin y empleado pueden insertar movimientos
CREATE POLICY "Admin y empleado pueden crear movimientos"
  ON movimientos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol IN ('admin', 'empleado')
    )
    AND responsable = auth.uid()
  );

-- Políticas para perfiles
-- Los usuarios pueden leer su propio perfil
CREATE POLICY "Usuarios pueden leer su propio perfil"
  ON perfiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Los usuarios pueden actualizar su propio perfil
-- Nota: Para prevenir cambios de rol, usamos un trigger de validación
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "Admins pueden actualizar cualquier perfil"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Los usuarios pueden crear su propio perfil al registrarse
CREATE POLICY "Usuarios pueden crear su propio perfil"
  ON perfiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Los admins pueden crear perfiles para otros usuarios
CREATE POLICY "Admins pueden crear perfiles"
  ON perfiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.user_id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- ============================================
-- STORAGE BUCKET: productos
-- ============================================

-- Nota: Ejecutar esto en Supabase Dashboard > Storage
-- O usar la API de Supabase para crear el bucket

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('productos', 'productos', true);

-- Política de storage para productos
-- CREATE POLICY "Usuarios autenticados pueden leer imágenes de productos"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'productos');

-- CREATE POLICY "Admin y empleado pueden subir imágenes de productos"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'productos'
--   AND EXISTS (
--     SELECT 1 FROM perfiles
--     WHERE perfiles.user_id = auth.uid()
--     AND perfiles.rol IN ('admin', 'empleado')
--   )
-- );

-- CREATE POLICY "Admin y empleado pueden actualizar imágenes de productos"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'productos'
--   AND EXISTS (
--     SELECT 1 FROM perfiles
--     WHERE perfiles.user_id = auth.uid()
--     AND perfiles.rol IN ('admin', 'empleado')
--   )
-- );

-- CREATE POLICY "Admin y empleado pueden eliminar imágenes de productos"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'productos'
--   AND EXISTS (
--     SELECT 1 FROM perfiles
--     WHERE perfiles.user_id = auth.uid()
--     AND perfiles.rol IN ('admin', 'empleado')
--   )
-- );

