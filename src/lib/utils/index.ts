import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, parseISO, addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Tailwind class merger ────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Cálculo de fecha de vencimiento ─────────
export function calcularFechaVencimiento(
  fechaSurtido: string,
  unidadesCaja: number,
  dosisDiaria: number
): string {
  const inicio = parseISO(fechaSurtido)
  const diasDuracion = Math.floor(unidadesCaja / dosisDiaria)
  const fechaVencimiento = addDays(inicio, diasDuracion)
  return format(fechaVencimiento, 'yyyy-MM-dd')
}

// ─── Días restantes hasta vencimiento ────────
export function calcularDiasRestantes(fechaVencimiento: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = parseISO(fechaVencimiento)
  return differenceInDays(vence, hoy)
}

/** Días hasta vencimiento respecto a una fecha de referencia (p. ej. comparar vs ayer). */
export function calcularDiasRestantesEnReferencia(fechaVencimiento: string, referencia: Date): number {
  const ref = new Date(referencia)
  ref.setHours(0, 0, 0, 0)
  const vence = parseISO(fechaVencimiento)
  return differenceInDays(vence, ref)
}

/** Banda del panel principal (KPIs): 0 vencidos, 1 crítico, 2 urgente, 3 planificación. */
export function bandaOrdenPanelRenovaciones(diasRestantes: number): number {
  if (diasRestantes < 0) return 0
  if (diasRestantes <= 1) return 1
  if (diasRestantes <= 5) return 2
  return 3
}

/** Orden por defecto del panel: vencidos → crítico → urgente → planificación; misma banda por fecha de vencimiento ascendente. */
export function ordenarTratamientosPorPrioridadPanel<T extends { fecha_vencimiento: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const da = calcularDiasRestantes(a.fecha_vencimiento)
    const db = calcularDiasRestantes(b.fecha_vencimiento)
    const ba = bandaOrdenPanelRenovaciones(da)
    const bb = bandaOrdenPanelRenovaciones(db)
    if (ba !== bb) return ba - bb
    return a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
  })
}

/** Comparación para filas del cliente (ya traen `dias` calculados). */
export function compararFilasPanelRenovacionPorPrioridad(
  a: { dias: number; fecha_vencimiento: string },
  b: { dias: number; fecha_vencimiento: string },
): number {
  const ba = bandaOrdenPanelRenovaciones(a.dias)
  const bb = bandaOrdenPanelRenovaciones(b.dias)
  if (ba !== bb) return ba - bb
  return a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
}

// ─── Semáforo de urgencia ─────────────────────
export type NivelUrgencia = 'critico' | 'urgente' | 'temprano' | 'ok'

export function getNivelUrgencia(diasRestantes: number): NivelUrgencia {
  if (diasRestantes <= 1) return 'critico'
  if (diasRestantes <= 5) return 'urgente'
  if (diasRestantes <= 15) return 'temprano'
  return 'ok'
}

export const coloresUrgencia: Record<NivelUrgencia, string> = {
  critico: 'bg-red-100 text-red-700 border-red-200',
  urgente: 'bg-orange-100 text-orange-700 border-orange-200',
  temprano: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ok: 'bg-green-100 text-green-700 border-green-200',
}

export const etiquetasUrgencia: Record<NivelUrgencia, string> = {
  critico: '🔴 Vence mañana',
  urgente: '🟠 5 días',
  temprano: '🟡 15 días',
  ok: '🟢 Al día',
}

// ─── Formateo de fechas en español ───────────
export function formatearFecha(fecha: string): string {
  return format(parseISO(fecha), "d 'de' MMMM yyyy", { locale: es })
}

export function formatearFechaCorta(fecha: string): string {
  return format(parseISO(fecha), 'dd/MM/yyyy')
}

// ─── Medicamento con marca y concentración ───
export function formatoMedicamento(t: { medicamento: string; marca?: string | null; concentracion?: string | null }): string {
  let main = t.medicamento
  if (t.concentracion?.trim()) main += ` (${t.concentracion.trim()})`
  if (t.marca?.trim()) main += ` · ${t.marca.trim()}`
  return main
}
