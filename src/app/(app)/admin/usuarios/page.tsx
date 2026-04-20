import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsuariosAdminCliente, { type EmpleadoListRow } from './UsuariosAdminCliente'

export default async function UsuariosAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empleado } = await supabase.from('empleados').select('rol, activo').eq('id', user.id).single()
  if (!empleado?.activo || empleado.rol !== 'super_admin') {
    redirect('/dashboard')
  }

  const [{ data: lista }, { data: farmacias }] = await Promise.all([
    supabase
      .from('empleados')
      .select('id, nombre, email, rol, farmacia_id, activo, creado_en, farmacia:farmacias(nombre)')
      .order('creado_en', { ascending: false }),
    supabase.from('farmacias').select('id, nombre').eq('activa', true).order('nombre'),
  ])

  const filas = (lista ?? []) as EmpleadoListRow[]
  const opts = (farmacias ?? []) as { id: string; nombre: string }[]

  return (
    <div className="mx-auto max-w-7xl p-6">
      <UsuariosAdminCliente iniciales={filas} farmacias={opts} />
    </div>
  )
}
