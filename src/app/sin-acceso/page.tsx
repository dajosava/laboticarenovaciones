'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SinAccesoPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleCerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Sin acceso al panel</h1>
        <p className="text-gray-600 text-sm mb-6">
          Tu cuenta de Supabase está correcta, pero no tienes un perfil de empleado en el sistema.
          Un <strong>super administrador</strong> debe darte de alta en <strong>Usuarios del sistema</strong> (desde el menú de
          tu usuario, abajo a la izquierda: <strong>Configuración</strong>). El{' '}
          <code className="bg-gray-100 px-1 rounded dark:bg-slate-800">id</code> del empleado debe coincidir con tu usuario en Authentication.
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Si administras el proyecto: crea primero la sucursal si aplica, el usuario en Auth, y luego el perfil en Usuarios del sistema con el mismo UUID.
        </p>
        <button
          type="button"
          onClick={handleCerrarSesion}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-xl transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
