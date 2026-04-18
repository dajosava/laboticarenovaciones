'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarContactadosMasivo(tratamientoIds: string[]): Promise<{ error?: string; ok?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  if (!tratamientoIds.length) return { ok: 0 }

  const { data: empleado } = await supabase.from('empleados').select('rol, farmacia_id').eq('id', user.id).single()
  if (!empleado) return { error: 'Empleado no encontrado' }

  const { data: rows } = await supabase
    .from('tratamientos')
    .select('id, paciente:pacientes(farmacia_id)')
    .in('id', tratamientoIds)

  const allowed =
    rows?.filter((r: { id: string; paciente: { farmacia_id: string } | null }) =>
      empleado.rol === 'super_admin' ? true : r.paciente?.farmacia_id === empleado.farmacia_id,
    ).map((r: { id: string }) => r.id) ?? []

  if (!allowed.length) return { error: 'No hay ítems permitidos para tu sucursal' }

  const { error } = await supabase
    .from('tratamientos')
    .update({ contactado_renovacion_en: new Date().toISOString() })
    .in('id', allowed)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { ok: allowed.length }
}

export type TimelinePreview = {
  pacienteNombre: string
  tratamientos: { id: string; medicamento: string; activo: boolean; fecha_vencimiento: string; contactado_renovacion_en: string | null }[]
  renovaciones: {
    id: string
    fecha: string
    notas: string | null
    numero_factura?: string | null
    farmacia?: { nombre: string } | null
    empleado?: { nombre: string } | null
  }[]
}

export async function getTimelinePreview(pacienteId: string): Promise<{ data?: TimelinePreview; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: empleado } = await supabase.from('empleados').select('rol, farmacia_id').eq('id', user.id).single()
  if (!empleado) return { error: 'Sin acceso' }

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nombre, farmacia_id')
    .eq('id', pacienteId)
    .single()

  if (!paciente) return { error: 'Paciente no encontrado' }
  if (empleado.rol !== 'super_admin' && paciente.farmacia_id !== empleado.farmacia_id) {
    return { error: 'Sin permiso para este paciente' }
  }

  const { data: tratamientos } = await supabase
    .from('tratamientos')
    .select('id, medicamento, activo, fecha_vencimiento, contactado_renovacion_en')
    .eq('paciente_id', pacienteId)
    .order('creado_en', { ascending: false })
    .limit(12)

  const tids = tratamientos?.map((t: { id: string }) => t.id) ?? []
  const { data: renovaciones } =
    tids.length > 0
      ? await supabase
          .from('renovaciones')
          .select('id, fecha, notas, numero_factura, farmacia:farmacias(nombre), empleado:empleados(nombre)')
          .in('tratamiento_id', tids)
          .order('fecha', { ascending: false })
          .limit(15)
      : { data: [] as TimelinePreview['renovaciones'] }

  return {
    data: {
      pacienteNombre: paciente.nombre,
      tratamientos: tratamientos ?? [],
      renovaciones: renovaciones ?? [],
    },
  }
}

export async function marcarContactadoRenovacion(tratamientoId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: row, error } = await supabase
    .from('tratamientos')
    .update({ contactado_renovacion_en: new Date().toISOString() })
    .eq('id', tratamientoId)
    .select('paciente_id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  if (row?.paciente_id) revalidatePath(`/pacientes/${row.paciente_id}`)
  return {}
}

export async function desmarcarContactadoRenovacion(tratamientoId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: row, error } = await supabase
    .from('tratamientos')
    .update({ contactado_renovacion_en: null })
    .eq('id', tratamientoId)
    .select('paciente_id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  if (row?.paciente_id) revalidatePath(`/pacientes/${row.paciente_id}`)
  return {}
}
