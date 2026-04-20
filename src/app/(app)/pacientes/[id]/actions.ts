'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularFechaVencimiento, parseMontoFacturaInput } from '@/lib/utils'

function montoObligatorioDesdeDatos(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 0) return null
    return Math.round(v * 100) / 100
  }
  if (typeof v === 'string') return parseMontoFacturaInput(v)
  return null
}

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
  /** Inicio de toma con este despacho (obligatoria en renovaciones). */
  fecha_inicio_tratamiento: string
  unidades_caja: number
  dosis_diaria: number
  notas?: string | null
  /** Número de factura (obligatorio al registrar la renovación). */
  numero_factura: string
  /** Monto total del comprobante en CRC (obligatorio al registrar la renovación). */
  monto_total_factura: number
  medicamento_id?: string | null
  medicamento?: string
  marca?: string | null
  concentracion?: string | null
  tipo?: 'cronico' | 'temporal'
  /** Unidades extra por regalía/promo; se suman solo para calcular la nueva fecha de vencimiento. */
  hubo_regalia?: boolean
  unidades_regalia?: number | null
}

export async function registrarRenovacion(
  tratamientoId: string,
  pacienteId: string,
  datos: DatosRenovacion
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  if (datos.hubo_regalia) {
    const u = datos.unidades_regalia
    if (u == null || !Number.isFinite(u) || u < 1) {
      return { error: 'Indica cuántas unidades de regalía (número entero mayor a 0).' }
    }
  }

  const [empleadoRes, pacienteRes] = await Promise.all([
    supabase.from('empleados').select('farmacia_id').eq('id', user.id).single(),
    supabase.from('pacientes').select('farmacia_id').eq('id', pacienteId).single(),
  ])

  let farmaciaId = empleadoRes.data?.farmacia_id ?? pacienteRes.data?.farmacia_id ?? undefined
  if (!farmaciaId) return { error: 'No se pudo determinar la farmacia para la renovación' }

  const extraRegalia =
    datos.hubo_regalia && datos.unidades_regalia != null && datos.unidades_regalia > 0
      ? Math.floor(datos.unidades_regalia)
      : 0
  const unidadesParaVencimiento = datos.unidades_caja + extraRegalia

  const fechaInicioToma = datos.fecha_inicio_tratamiento.trim()
  if (!fechaInicioToma) {
    return { error: 'La fecha de inicio de tratamiento es obligatoria.' }
  }

  const numeroFactura = datos.numero_factura.trim()
  if (!numeroFactura) {
    return { error: 'El número de factura es obligatorio.' }
  }
  const montoFactura = montoObligatorioDesdeDatos(datos.monto_total_factura)
  if (montoFactura === null) {
    return { error: 'El monto total de la factura es obligatorio o no es válido.' }
  }

  const fechaVencimiento = calcularFechaVencimiento(
    fechaInicioToma,
    unidadesParaVencimiento,
    datos.dosis_diaria
  )

  const updatePayload: Record<string, unknown> = {
    fecha_surtido: datos.fecha_surtido,
    fecha_inicio_tratamiento: fechaInicioToma,
    fecha_vencimiento: fechaVencimiento,
    unidades_caja: datos.unidades_caja,
    dosis_diaria: datos.dosis_diaria,
    contactado_renovacion_en: null,
  }
  if (datos.medicamento_id !== undefined) updatePayload.medicamento_id = datos.medicamento_id || null
  if (datos.medicamento !== undefined) updatePayload.medicamento = datos.medicamento.trim()
  if (datos.marca !== undefined) updatePayload.marca = datos.marca?.trim() || null
  if (datos.concentracion !== undefined) updatePayload.concentracion = datos.concentracion?.trim() || null
  if (datos.tipo !== undefined) updatePayload.tipo = datos.tipo

  const huboRegalia = extraRegalia > 0

  const [errUpdate, errRenovacion] = await Promise.all([
    supabase.from('tratamientos').update(updatePayload).eq('id', tratamientoId).then((r: { error: { message: string } | null }) => r.error),
    supabase
      .from('renovaciones')
      .insert({
        tratamiento_id: tratamientoId,
        farmacia_id: farmaciaId,
        empleado_id: user.id,
        fecha: datos.fecha_surtido,
        fecha_inicio_tratamiento: fechaInicioToma,
        notas: datos.notas?.trim() || null,
        numero_factura: numeroFactura,
        monto_total_factura: montoFactura,
        hubo_regalia: huboRegalia,
        unidades_regalia: huboRegalia ? extraRegalia : null,
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
