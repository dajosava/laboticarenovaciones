'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularFechaVencimiento } from '@/lib/utils'

export async function eliminarPaciente(pacienteId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', pacienteId)

  if (error) return { error: error.message }

  revalidatePath('/pacientes')
  revalidatePath(`/pacientes/${pacienteId}`)
  return {}
}

export async function actualizarNotasPaciente(pacienteId: string, notas: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('pacientes')
    .update({ notas: notas.trim() || null })
    .eq('id', pacienteId)

  if (error) return { error: error.message }

  revalidatePath(`/pacientes/${pacienteId}`)
  return {}
}

export type DatosRenovacion = {
  fecha_surtido: string
  unidades_caja: number
  dosis_diaria: number
  notas?: string | null
  medicamento?: string
  marca?: string | null
  concentracion?: string | null
  tipo?: 'cronico' | 'temporal'
}

export async function registrarRenovacion(
  tratamientoId: string,
  pacienteId: string,
  datos: DatosRenovacion
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const [empleadoRes, pacienteRes] = await Promise.all([
    supabase.from('empleados').select('farmacia_id').eq('id', user.id).single(),
    supabase.from('pacientes').select('farmacia_id').eq('id', pacienteId).single(),
  ])

  let farmaciaId = empleadoRes.data?.farmacia_id ?? pacienteRes.data?.farmacia_id ?? undefined
  if (!farmaciaId) return { error: 'No se pudo determinar la farmacia para la renovación' }

  const fechaVencimiento = calcularFechaVencimiento(
    datos.fecha_surtido,
    datos.unidades_caja,
    datos.dosis_diaria
  )

  const updatePayload: Record<string, unknown> = {
    fecha_surtido: datos.fecha_surtido,
    fecha_vencimiento: fechaVencimiento,
    unidades_caja: datos.unidades_caja,
    dosis_diaria: datos.dosis_diaria,
    contactado_renovacion_en: null,
  }
  if (datos.medicamento !== undefined) updatePayload.medicamento = datos.medicamento.trim()
  if (datos.marca !== undefined) updatePayload.marca = datos.marca?.trim() || null
  if (datos.concentracion !== undefined) updatePayload.concentracion = datos.concentracion?.trim() || null
  if (datos.tipo !== undefined) updatePayload.tipo = datos.tipo

  const [errUpdate, errRenovacion] = await Promise.all([
    supabase.from('tratamientos').update(updatePayload).eq('id', tratamientoId).then((r: { error: { message: string } | null }) => r.error),
    supabase
      .from('renovaciones')
      .insert({
        tratamiento_id: tratamientoId,
        farmacia_id: farmaciaId,
        empleado_id: user.id,
        fecha: datos.fecha_surtido,
        notas: datos.notas?.trim() || null,
      })
      .then((r: { error: { message: string } | null }) => r.error),
  ])

  if (errUpdate) return { error: errUpdate.message }
  if (errRenovacion) return { error: errRenovacion.message }

  revalidatePath(`/pacientes/${pacienteId}`)
  revalidatePath('/dashboard')
  revalidatePath('/renovaciones')
  return {}
}
