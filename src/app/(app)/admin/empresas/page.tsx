import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmpresasAdminCliente, { type EmpresaCatalogoRow } from './EmpresasAdminCliente'

export default async function AdminEmpresasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empleado } = await supabase.from('empleados').select('rol, activo').eq('id', user.id).single()
  if (!empleado?.activo || empleado.rol !== 'super_admin') {
    redirect('/dashboard')
  }

  const { data: lista } = await supabase.from('empresas_catalogo').select('id, nombre, activa, creado_en').order('nombre')

  const filas = (lista ?? []) as EmpresaCatalogoRow[]

  return (
    <div className="mx-auto max-w-4xl p-6">
      <EmpresasAdminCliente iniciales={filas} />
    </div>
  )
}
