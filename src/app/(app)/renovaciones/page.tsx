import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { differenceInDays, isThisMonth, parseISO } from 'date-fns'
import { formatoMedicamento } from '@/lib/utils'
import RenovacionesAuditCliente, {
  type RenovacionAuditItem,
  type RenovacionesMetricas,
} from './RenovacionesAuditCliente'

type Row = {
  id: string
  tratamiento_id: string
  farmacia_id: string
  fecha: string
  notas: string | null
  farmacia?: { nombre: string } | null
  empleado?: { nombre: string } | null
  tratamiento?: {
    id: string
    paciente_id: string
    medicamento: string
    marca?: string | null
    concentracion?: string | null
    fecha_vencimiento: string
    tipo: string
  } | null
}

function severidadFromTardia(esTardia: boolean, diasRetraso: number): RenovacionAuditItem['severidad'] {
  if (!esTardia) return 'normal'
  if (diasRetraso >= 3) return 'critico'
  return 'tardio'
}

export default async function RenovacionesPage() {
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

  const { data: renovaciones } = await supabase
    .from('renovaciones')
    .select(
      '*, farmacia:farmacias(nombre), empleado:empleados(nombre), tratamiento:tratamientos(id, paciente_id, medicamento, marca, concentracion, fecha_vencimiento, tipo)',
    )
    .order('fecha', { ascending: false })
    .limit(500)

  const listaRaw = renovaciones ?? []
  const lista: Row[] = (listaRaw as Row[]).filter((r) => {
    if (empleado?.rol !== 'super_admin') return r.farmacia_id === empleado?.farmacia_id
    if (filtroFarmaciaId) return r.farmacia_id === filtroFarmaciaId
    return true
  })

  const byTratamiento = new Map<string, Row[]>()
  for (const r of lista) {
    const tid = r.tratamiento_id
    if (!byTratamiento.has(tid)) byTratamiento.set(tid, [])
    byTratamiento.get(tid)!.push(r)
  }
  for (const arr of byTratamiento.values()) {
    arr.sort((a, b) => a.fecha.localeCompare(b.fecha))
  }
  const gapPorRenovacion = new Map<string, number | null>()
  for (const arr of byTratamiento.values()) {
    for (let i = 0; i < arr.length; i++) {
      gapPorRenovacion.set(
        arr[i].id,
        i === 0 ? null : differenceInDays(parseISO(arr[i].fecha), parseISO(arr[i - 1].fecha)),
      )
    }
  }

  const items: RenovacionAuditItem[] = lista.map((r) => {
    const tr = r.tratamiento
    let esTardia = false
    let diasRetraso = 0
    if (tr?.fecha_vencimiento) {
      const diff = differenceInDays(parseISO(r.fecha), parseISO(tr.fecha_vencimiento))
      if (diff > 0) {
        esTardia = true
        diasRetraso = diff
      }
    }
    return {
      id: r.id,
      tratamiento_id: r.tratamiento_id,
      fecha: r.fecha,
      notas: r.notas,
      farmaciaNombre: r.farmacia?.nombre ?? '—',
      empleadoNombre: r.empleado?.nombre ?? '—',
      pacienteId: tr?.paciente_id ?? null,
      medicamentoLabel: tr ? formatoMedicamento(tr) : 'Tratamiento no disponible',
      tratamientoTipo: tr?.tipo ?? '',
      esTardia,
      diasRetraso,
      diasDesdeRenovacionAnterior: gapPorRenovacion.get(r.id) ?? null,
      severidad: severidadFromTardia(esTardia, diasRetraso),
    }
  })

  const renovacionesEsteMes = lista.filter((r) => isThisMonth(parseISO(r.fecha))).length
  const mesRows = lista.filter((r) => isThisMonth(parseISO(r.fecha)))
  const evaluablesTardia = mesRows.filter((r) => r.tratamiento?.fecha_vencimiento).length
  const tardiasMes = mesRows.filter((r) => {
    const tr = r.tratamiento
    if (!tr?.fecha_vencimiento) return false
    return differenceInDays(parseISO(r.fecha), parseISO(tr.fecha_vencimiento)) > 0
  }).length
  const puntualesMes = evaluablesTardia - tardiasMes
  const pctPuntuales = evaluablesTardia > 0 ? Math.round((100 * puntualesMes) / evaluablesTardia) : null
  const pctTardias = evaluablesTardia > 0 ? Math.round((100 * tardiasMes) / evaluablesTardia) : null

  const gaps = items
    .map((i) => i.diasDesdeRenovacionAnterior)
    .filter((x): x is number => x !== null && x > 0)
  const promedioDiasEntre =
    gaps.length > 0 ? Math.round((10 * gaps.reduce((a, b) => a + b, 0)) / gaps.length) / 10 : null

  const metricas: RenovacionesMetricas = {
    renovacionesEsteMes,
    pctPuntuales,
    pctTardias,
    promedioDiasEntre,
    evaluablesTardia,
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Renovaciones</h1>
        {empleado?.rol === 'super_admin' && nombreFiltroSucursal ? (
          <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-400">
            Sucursal seleccionada: {nombreFiltroSucursal}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Auditoría y timeline · últimos {lista.length} registros
        </p>
      </div>

      <RenovacionesAuditCliente items={items} metricas={metricas} />
    </div>
  )
}
