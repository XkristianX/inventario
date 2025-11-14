# Guía de Configuración - Sistema de Inventario

Esta guía te ayudará a configurar el proyecto de Supabase y la aplicación paso a paso.

## 1. Configuración de Supabase

### 1.1 Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración (puede tardar unos minutos)

### 1.2 Configurar la base de datos

1. Ve al SQL Editor en tu proyecto de Supabase
2. Abre el archivo `database/schema.sql`
3. Copia y pega todo el contenido en el SQL Editor
4. Ejecuta el script SQL
5. Verifica que las tablas se hayan creado correctamente:
   - `productos`
   - `movimientos`
   - `perfiles`

### 1.3 Configurar Storage

1. Ve a Storage en tu proyecto de Supabase
2. Crea un nuevo bucket llamado `productos`
3. Marca el bucket como público (Public bucket)
4. Configura las políticas de seguridad del bucket:

   Ve al SQL Editor y ejecuta este SQL para configurar las políticas de Storage:

   ```sql
   -- Política para leer imágenes
   CREATE POLICY "Usuarios autenticados pueden leer imágenes de productos"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'productos');

   -- Política para subir imágenes
   CREATE POLICY "Admin y empleado pueden subir imágenes de productos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'productos'
     AND EXISTS (
       SELECT 1 FROM perfiles
       WHERE perfiles.user_id = auth.uid()
       AND perfiles.rol IN ('admin', 'empleado')
     )
   );

   -- Política para actualizar imágenes
   CREATE POLICY "Admin y empleado pueden actualizar imágenes de productos"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'productos'
     AND EXISTS (
       SELECT 1 FROM perfiles
       WHERE perfiles.user_id = auth.uid()
       AND perfiles.rol IN ('admin', 'empleado')
     )
   );

   -- Política para eliminar imágenes
   CREATE POLICY "Admin y empleado pueden eliminar imágenes de productos"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'productos'
     AND EXISTS (
       SELECT 1 FROM perfiles
       WHERE perfiles.user_id = auth.uid()
       AND perfiles.rol IN ('admin', 'empleado')
     )
   );
   ```

### 1.4 Obtener las credenciales de API

1. Ve a Settings > API en tu proyecto de Supabase
2. Copia los siguientes valores:
   - **Project URL**: Esta es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configuración de la Aplicación

### 2.1 Instalar dependencias

```bash
npm install
```

### 2.2 Configurar variables de entorno

1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

### 2.3 Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 3. Crear Usuarios de Prueba

### 3.1 Registrar usuarios

1. Ve a `http://localhost:3000/register`
2. Registra los siguientes usuarios:

   **Admin:**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Nombre: `Administrador`

   **Empleado:**
   - Email: `empleado@example.com`
   - Password: `empleado123`
   - Nombre: `Empleado`

   **Auditor:**
   - Email: `auditor@example.com`
   - Password: `auditor123`
   - Nombre: `Auditor`

### 3.2 Asignar roles

Después de registrar los usuarios, necesitas asignarles los roles correctos:

1. Ve al SQL Editor en Supabase
2. Ejecuta el siguiente SQL (reemplaza los emails con los que usaste):

```sql
  -- Asignar rol de admin
  UPDATE perfiles
  SET rol = 'admin'
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'admin@example.com'
  );

  -- Asignar rol de empleado
  UPDATE perfiles
  SET rol = 'empleado'
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'empleado@example.com'
  );

  -- Asignar rol de auditor
  UPDATE perfiles
  SET rol = 'auditor'
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'auditor@example.com'
  );
```

**Alternativamente**, puedes asignar roles manualmente:

1. Ve a Database > Table Editor > perfiles
2. Busca cada usuario por su email
3. Actualiza el campo `rol` con el valor correspondiente (`admin`, `empleado`, o `auditor`)

## 4. Verificar la Configuración

### 4.1 Verificar tablas

1. Ve a Database > Table Editor en Supabase
2. Verifica que las siguientes tablas existan:
   - `productos`
   - `movimientos`
   - `perfiles`

### 4.2 Verificar Storage

1. Ve a Storage en Supabase
2. Verifica que el bucket `productos` exista
3. Verifica que el bucket esté marcado como público

### 4.3 Verificar políticas RLS

1. Ve a Database > Tables en Supabase
2. Para cada tabla (`productos`, `movimientos`, `perfiles`), verifica que:
   - Row Level Security (RLS) esté habilitado
   - Las políticas estén configuradas correctamente

## 5. Probar la Aplicación

### 5.1 Login

1. Ve a `http://localhost:3000/login`
2. Inicia sesión con uno de los usuarios de prueba
3. Deberías ser redirigido al dashboard

### 5.2 Crear un producto

1. Ve a Productos > Nuevo Producto
2. Completa el formulario
3. Sube una imagen (opcional)
4. Guarda el producto

### 5.3 Registrar una entrada

1. Ve a Entradas
2. Selecciona un producto
3. Ingresa la cantidad y motivo
4. Guarda la entrada
5. Verifica que el stock se haya actualizado automáticamente

### 5.4 Registrar una salida

1. Ve a Salidas
2. Selecciona un producto
3. Ingresa la cantidad y motivo
4. Guarda la salida
5. Verifica que el stock se haya actualizado automáticamente
6. Intenta registrar una salida con cantidad mayor al stock disponible (debería mostrar un error)

### 5.5 Ver historial

1. Ve a Historial
2. Verifica que los movimientos se muestren correctamente
3. Prueba los filtros (producto, tipo, fecha, responsable)

## 6. Solución de Problemas

### Error: "Failed to fetch"

- Verifica que las variables de entorno estén correctamente configuradas
- Verifica que el proyecto de Supabase esté activo
- Verifica la conexión a internet

### Error: "Row Level Security policy violation"

- Verifica que las políticas RLS estén correctamente configuradas
- Verifica que el usuario tenga un perfil en la tabla `perfiles`
- Verifica que el usuario tenga el rol correcto

### Error: "Storage bucket not found"

- Verifica que el bucket `productos` exista en Supabase Storage
- Verifica que el bucket esté marcado como público
- Verifica las políticas de seguridad del bucket

### Error: "Stock insuficiente"

- Verifica que el producto tenga suficiente stock antes de registrar una salida
- El sistema previene automáticamente las salidas que resultarían en stock negativo

### Las imágenes no se cargan

- Verifica que el bucket `productos` esté marcado como público
- Verifica las políticas de Storage
- Verifica que la URL de la imagen sea correcta
- Verifica la consola del navegador para ver errores específicos

## 7. Próximos Pasos

1. Personaliza los estilos según tus necesidades
2. Agrega más funcionalidades según tus requerimientos
3. Configura el dominio personalizado
4. Despliega la aplicación en producción (Vercel, Netlify, etc.)
5. Configura el correo de autenticación en Supabase
6. Configura backups de la base de datos

## 8. Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de TailwindCSS](https://tailwindcss.com/docs)
- [Documentación de React Hook Form](https://react-hook-form.com/)

## Soporte

Si encuentras algún problema o tienes preguntas, revisa la documentación o crea un issue en el repositorio.

