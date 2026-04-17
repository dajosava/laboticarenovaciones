import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import TratamientosListaCliente, { type TratamientoListaItem } from './TratamientosListaCliente'

export default async function TratamientosPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const filtroFarmaciaId = cookieStore.get('farmarenovar-filtro-farmacia')?.value ?? null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: empleado } = await supabase.from('empleados').select('rol, farmacia_id').eq('id', user!.id).single()

  let nombreFiltroSucursal: string | null = null
  if (empleado?.rol === 'super_admin' && filtroFarmaciaId) {
    const { data: farm } = await supabase.from('farmacias').select('nombre').eq('id', filtroFarmaciaId).maybeSingle()
    nombreFiltroSucursal = farm?.nombre ?? null
  }

  const { data: tratamientos } = await supabase
    .from('tratamientos')
    .select('*, paciente:pacientes(nombre, telefono, farmacia_id)')
    .eq('activo', true)
    .order('fecha_vencimiento', { ascending: true })

  const lista = tratamientos ?? []
  const tratamientosFiltrados = lista.filter((t: { paciente?: { farmacia_id?: string | null } | null }) => {
    const fid = t.paciente?.farmacia_id ?? null
    if (empleado?.rol !== 'super_admin') return fid === empleado?.farmacia_id
    if (filtroFarmaciaId) return fid === filtroFarmaciaId
    return true
  })

  const items: TratamientoListaItem[] = tratamientosFiltrados.map((row: Record<string, unknown>) => {
    const t = row as TratamientoListaItem & {
      paciente?: { nombre: string; telefono: string | null; farmacia_id: string } | null
    }
    return {
      id: t.id,
      paciente_id: t.paciente_id,
      fecha_vencimiento: t.fecha_vencimiento,
      dosis_diaria: t.dosis_diaria,
      tipo: t.tipo,
      medicamento: t.medicamento,
      marca: t.marca,
      concentracion: t.concentracion,
      paciente: t.paciente
        ? { nombre: t.paciente.nombre, telefono: t.paciente.telefono, farmacia_id: t.paciente.farmacia_id }
        : null,
    }
  })

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tratamientos activos</h1>
        {empleado?.rol === 'super_admin' && nombreFiltroSucursal ? (
          <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-400">
            Sucursal seleccionada: {nombreFiltroSucursal}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Lista priorizada por vencimiento · acciones rápidas sin salir de la tabla
        </p>
      </div>

      <TratamientosListaCliente items={items} />
    </div>
  )
}
