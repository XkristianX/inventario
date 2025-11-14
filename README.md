# Sistema de Inventario

Sistema completo de gestión de inventario desarrollado con Next.js, TypeScript, TailwindCSS y Supabase.

## Características

- ✅ Autenticación completa con Supabase Auth
- ✅ Gestión de productos (CRUD)
- ✅ Registro de entradas y salidas de inventario
- ✅ Historial de movimientos con filtros
- ✅ Sistema de roles (admin, empleado, auditor)
- ✅ Subida de imágenes a Supabase Storage
- ✅ Dashboard con estadísticas
- ✅ Alertas de stock bajo
- ✅ Interfaz responsive con TailwindCSS

## Tecnologías

- **Frontend**: Next.js 14, React, TypeScript
- **Estilos**: TailwindCSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Base de datos**: PostgreSQL (Supabase)

## Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd inventario
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Puedes encontrar estas variables en tu proyecto de Supabase:
- Dashboard de Supabase > Settings > API
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima pública

### 4. Configurar la base de datos

1. Ve al SQL Editor en tu proyecto de Supabase
2. Ejecuta el archivo `database/schema.sql` para crear las tablas, funciones, triggers y políticas RLS

### 5. Configurar Storage

1. Ve a Storage en tu proyecto de Supabase
2. Crea un nuevo bucket llamado `productos`
3. Marca el bucket como público
4. Configura las políticas de seguridad (ver comentarios en `database/schema.sql`)

### 6. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Usuarios de Prueba

### Crear usuarios de prueba

1. **Admin**:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Rol: `admin`

2. **Empleado**:
   - Email: `empleado@example.com`
   - Password: `empleado123`
   - Rol: `empleado`

3. **Auditor**:
   - Email: `auditor@example.com`
   - Password: `auditor123`
   - Rol: `auditor`

### Pasos para crear usuarios de prueba

1. Registra los usuarios en la aplicación (página de registro)
2. En Supabase Dashboard, ve a Authentication > Users
3. Para cada usuario, ve a Database > Table Editor > perfiles
4. Actualiza el rol del usuario a `admin`, `empleado` o `auditor` según corresponda

**Alternativamente**, puedes ejecutar este SQL en Supabase SQL Editor después de registrar los usuarios:

```sql
-- Actualizar rol de usuario (reemplaza el email y user_id)
UPDATE perfiles
SET rol = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);

UPDATE perfiles
SET rol = 'empleado'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'empleado@example.com'
);

UPDATE perfiles
SET rol = 'auditor'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'auditor@example.com'
);
```

## Estructura del Proyecto

```
inventario/
├── app/                    # Páginas de Next.js
│   ├── dashboard/         # Dashboard principal
│   ├── productos/         # Gestión de productos
│   ├── entradas/          # Registro de entradas
│   ├── salidas/           # Registro de salidas
│   ├── historial/         # Historial de movimientos
│   ├── perfil/            # Perfil de usuario
│   ├── login/             # Página de login
│   └── register/          # Página de registro
├── components/            # Componentes React
│   ├── Navbar.tsx        # Barra de navegación
│   ├── Layout.tsx        # Layout principal
│   ├── ProductoForm.tsx  # Formulario de producto
│   ├── EntradaForm.tsx   # Formulario de entrada
│   ├── SalidaForm.tsx    # Formulario de salida
│   └── ...
├── lib/                   # Utilidades y configuración
│   ├── supabase/         # Cliente de Supabase
│   ├── utils/            # Funciones utilitarias
│   └── types/            # Tipos TypeScript
├── database/             # Scripts SQL
│   └── schema.sql        # Schema de la base de datos
└── README.md            # Este archivo
```

## Funcionalidades

### Autenticación
- Login con email y contraseña
- Registro de usuarios
- Validación de usuario activo
- Redirección automática según estado de autenticación
- Cerrar sesión desde cualquier parte

### Gestión de Productos
- Crear producto
- Editar producto
- Eliminar producto
- Listado con búsqueda y filtros
- Subida de imagen del producto
- Alertas de stock bajo

### Gestión de Inventario
- **Entradas**: Registrar entradas de productos (compra, devolución, ajuste, etc.)
- **Salidas**: Registrar salidas de productos (venta, daño, ajuste, etc.)
- Actualización automática de stock
- Prevención de stock negativo

### Historial de Movimientos
- Visualización de todas las entradas y salidas
- Filtros por producto, tipo, fecha y responsable
- Información detallada de cada movimiento

### Dashboard
- Total de productos
- Productos con stock bajo
- Últimos movimientos
- Valor total del inventario

### Roles
- **Admin**: Todos los permisos (crear, editar, eliminar productos, registrar movimientos)
- **Empleado**: Registrar entradas/salidas, crear/editar productos
- **Auditor**: Solo lectura (ver productos y movimientos)

## Base de Datos

### Tablas

#### productos
- `id`: UUID (Primary Key)
- `nombre`: TEXT
- `categoria`: TEXT
- `stock`: INTEGER
- `stock_minimo`: INTEGER
- `precio_entrada`: DECIMAL
- `precio_salida`: DECIMAL
- `proveedor`: TEXT
- `fecha_registro`: TIMESTAMP
- `imagen_url`: TEXT

#### movimientos
- `id`: UUID (Primary Key)
- `producto_id`: UUID (Foreign Key)
- `tipo`: TEXT ('entrada' o 'salida')
- `cantidad`: INTEGER
- `motivo`: TEXT
- `responsable`: UUID (Foreign Key a auth.users)
- `fecha`: DATE

#### perfiles
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key a auth.users)
- `nombre`: TEXT
- `rol`: TEXT ('admin', 'empleado', 'auditor')

### Triggers y Funciones

- **actualizar_stock()**: Actualiza automáticamente el stock cuando se crea un movimiento
- **trigger_actualizar_stock**: Trigger que ejecuta la función de actualización de stock
- Validación de stock negativo antes de permitir una salida

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de seguridad basadas en roles
- Validación de permisos en el frontend y backend
- Autenticación requerida para todas las rutas protegidas

## Desarrollo

### Comandos disponibles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Linting
npm run lint
```

## Solución de Problemas

### Error: "Failed to fetch"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el proyecto de Supabase esté activo

### Error: "Row Level Security policy violation"
- Verifica que las políticas RLS estén correctamente configuradas
- Asegúrate de que el usuario tenga el rol correcto en la tabla `perfiles`

### Error: "Storage bucket not found"
- Verifica que el bucket `productos` exista en Supabase Storage
- Asegúrate de que el bucket esté marcado como público
- Verifica las políticas de seguridad del bucket

### Error: "Stock insuficiente"
- Verifica que el producto tenga suficiente stock antes de registrar una salida
- El sistema previene automáticamente las salidas que resultarían en stock negativo

## Licencia

Este proyecto está bajo la Licencia MIT.

## Autor

Desarrollado para gestión de inventario con Supabase y Next.js.

