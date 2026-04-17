import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empleado } = await supabase
    .from('empleados')
    .select('*, farmacia:farmacias(*)')
    .eq('id', user.id)
    .single()

  if (!empleado || !empleado.activo) redirect('/sin-acceso')

  const cookieStore = await cookies()
  const farmaciaFiltroCookie = cookieStore.get('farmarenovar-filtro-farmacia')?.value ?? null

  let farmaciasFiltro: { id: string; nombre: string }[] = []
  if (empleado.rol === 'super_admin') {
    const { data } = await supabase.from('farmacias').select('id, nombre').eq('activa', true).order('nombre')
    farmaciasFiltro = (data as { id: string; nombre: string }[]) ?? []
  }

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        empleado={empleado}
        farmaciasFiltro={farmaciasFiltro}
        farmaciaFiltroActual={empleado.rol === 'super_admin' ? farmaciaFiltroCookie : null}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {useMock && (
          <div className="bg-amber-500 text-amber-950 text-center py-1.5 px-4 text-sm font-medium">
            Modo prueba (datos mock). Para usar la base de datos real: cierra el servidor, borra la carpeta .next y ejecuta de nuevo npm run dev.
          </div>
        )}
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
