import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/utils/auth'

export default async function TestSupabasePage() {
  const { user } = await requireAuth()
  const supabase = await createClient()
  
  const results: Array<{ test: string; time: string; data?: any; error?: string }> = []
  
  // Test 1: Verificar autenticación (más rápido)
  const start1 = Date.now()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  const time1 = Date.now() - start1
  results.push({ 
    test: 'Auth: getUser()', 
    time: `${time1}ms`, 
    data: authUser ? 'Usuario autenticado' : 'No autenticado',
    error: authError?.message 
  })
  
  // Test 2: Contar productos (muy rápido)
  const start2 = Date.now()
  const { count, error: countError } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })
  const time2 = Date.now() - start2
  results.push({ 
    test: 'DB: Count productos', 
    time: `${time2}ms`, 
    data: `${count} productos`,
    error: countError?.message 
  })
  
  // Test 3: Obtener 10 productos
  const start3 = Date.now()
  const { data: productos, error: productosError } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .limit(10)
  const time3 = Date.now() - start3
  results.push({ 
    test: 'DB: Get 10 productos', 
    time: `${time3}ms`, 
    data: `${productos?.length || 0} productos obtenidos`,
    error: productosError?.message 
  })
  
  // Test 4: Obtener movimientos con JOIN
  const start4 = Date.now()
  const { data: movimientos, error: movimientosError } = await supabase
    .from('movimientos')
    .select('*, productos(nombre)')
    .limit(10)
  const time4 = Date.now() - start4
  results.push({ 
    test: 'DB: Get 10 movimientos (con JOIN)', 
    time: `${time4}ms`, 
    data: `${movimientos?.length || 0} movimientos obtenidos`,
    error: movimientosError?.message 
  })
  
  // Test 5: Obtener perfil
  const start5 = Date.now()
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  const time5 = Date.now() - start5
  results.push({ 
    test: 'DB: Get perfil', 
    time: `${time5}ms`, 
    data: perfil ? `Perfil: ${perfil.nombre} (${perfil.rol})` : 'Sin perfil',
    error: perfilError?.message 
  })
  
  // Calcular tiempo total
  const totalTime = time1 + time2 + time3 + time4 + time5
  
  // Determinar estado
  const getStatus = (time: number) => {
    if (time < 100) return { color: 'text-green-600', icon: '✅' }
    if (time < 500) return { color: 'text-yellow-600', icon: '⚠️' }
    return { color: 'text-red-600', icon: '❌' }
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
        Test de Rendimiento Supabase
      </h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Usuario:</strong> {user.email}
        </p>
        <p className="text-sm text-blue-800 mt-1">
          <strong>Tiempo total de todas las consultas:</strong> {totalTime}ms
        </p>
      </div>
      
      <div className="space-y-4 mb-8">
        {results.map((result, i) => {
          const status = getStatus(parseInt(result.time.replace('ms', '')))
          return (
            <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{result.test}</h3>
                <span className={`text-lg font-bold ${status.color}`}>
                  {status.icon} {result.time}
                </span>
              </div>
              {result.data && (
                <p className="text-sm text-gray-600 mb-1">{result.data}</p>
              )}
              {result.error && (
                <p className="text-sm text-red-600">Error: {result.error}</p>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Interpretación de Resultados</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✅</span>
            <span><strong>&lt; 100ms:</strong> Excelente - Supabase responde muy rápido</span>
          </li>
          <li className="flex items-start">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <span><strong>100-500ms:</strong> Aceptable - Puede haber latencia de red</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-600 mr-2">❌</span>
            <span><strong>&gt; 500ms:</strong> Lento - Posible problema de conexión o consulta pesada</span>
          </li>
        </ul>
        
        <div className="mt-4 p-4 bg-white rounded border border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-900">Diagnóstico:</h3>
          {totalTime < 500 ? (
            <p className="text-green-700">
              ✅ <strong>Supabase está funcionando bien.</strong> Si la aplicación es lenta, 
              el problema probablemente está en la compilación de Next.js, no en Supabase.
            </p>
          ) : totalTime < 2000 ? (
            <p className="text-yellow-700">
              ⚠️ <strong>Supabase tiene cierta latencia.</strong> Puede ser por conexión de red 
              o la región de tu proyecto de Supabase está lejos.
            </p>
          ) : (
            <p className="text-red-700">
              ❌ <strong>Supabase está muy lento.</strong> Revisa tu conexión a internet o considera 
              cambiar la región de tu proyecto de Supabase.
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <a 
          href="/dashboard" 
          className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Volver al Dashboard
        </a>
      </div>
    </div>
  )
}

