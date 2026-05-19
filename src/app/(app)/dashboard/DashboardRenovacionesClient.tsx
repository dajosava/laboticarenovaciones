'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, BarChart3, Check, CheckSquare, Download, Eye, History, Repeat, Search, Square } from 'lucide-react'
import { toast } from 'sonner'
import {
  clasesColorBadgeKpiPanelRenovaciones,
  cn,
  compararFilasPanelRenovacionPorPrioridad,
  etiquetaPrioridadPanelPrincipal,
  formatMontoFacturaCrc,
  formatoMedicamento,
  formatearFechaCorta,
} from '@/lib/utils'
import { marcarContactadosMasivo, getTimelinePreview, type TimelinePreview } from './actions'
import BotonContactadoRenovacion from './BotonContactadoRenovacion'
import { PANEL_ACCION_ESTILOS, PANEL_ACCION_LABEL, PANEL_TOOLBAR_ESTILOS } from './panel-renovaciones-ui'

export type DashboardRow = {
  id: string
  paciente_id: string
  paciente_nombre: string
  telefono: string | null
  medicamento: string
  marca?: string | null
  concentracion?: string | null
  fecha_vencimiento: string
  contactado: boolean
  dias: number
  badgeClass: string
  badgeLabel: string
  farmacia_id: string | null
  farmacia_nombre: string | null
}

type SortKey = 'prioridad' | 'paciente' | 'vence' | 'estado' | 'sucursal'
type SortDir = 'asc' | 'desc'
type GrupoKey = 'critico' | 'urgente' | 'planificacion' | 'estable'

function grupoPorDias(dias: number): GrupoKey {
  if (dias <= 1) return 'critico'
  if (dias <= 5) return 'urgente'
  if (dias <= 15) return 'planificacion'
  return 'estable'
}

function borderLateral(dias: number): string {
  if (dias < 0) return 'border-l-4 border-l-red-500'
  if (dias <= 1) return 'border-l-4 border-l-orange-500'
  if (dias <= 5) return 'border-l-4 border-l-yellow-500'
  if (dias <= 15) return 'border-l-4 border-l-teal-500'
  return 'border-l-4 border-l-emerald-500'
}

function badgeEstadoDominante(dias: number): string {
  return cn(
    'inline-flex max-w-[14rem] items-center rounded-lg border px-2.5 py-1 text-xs font-bold uppercase leading-tight tracking-wide',
    clasesColorBadgeKpiPanelRenovaciones(dias),
  )
}

function claseDiasRestantes(dias: number): string {
  if (dias < 0) return 'text-red-600 dark:text-red-300'
  if (dias <= 1) return 'text-orange-600 dark:text-orange-300'
  if (dias <= 5) return 'text-yellow-600 dark:text-yellow-300'
  if (dias <= 15) return 'text-teal-600 dark:text-teal-300'
  return 'text-emerald-600 dark:text-emerald-300'
}

function exportCsv(rows: DashboardRow[]) {
  const headers = ['Paciente', 'Teléfono', 'Medicamento', 'Vence', 'Estado', 'Sucursal', 'Contactado']
  const lines = rows.map((r) =>
    [
      `"${r.paciente_nombre.replace(/"/g, '""')}"`,
      r.telefono ?? '',
      `"${formatoMedicamento(r).replace(/"/g, '""')}"`,
      r.fecha_vencimiento,
      `"${r.badgeLabel.replace(/"/g, '""')}"`,
      `"${(r.farmacia_nombre ?? '').replace(/"/g, '""')}"`,
      r.contactado ? 'Sí' : 'No',
    ].join(','),
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `renovaciones-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Exportación lista')
}

function TimelineModal({
  open,
  onClose,
  loading,
  data,
  pacienteId,
}: {
  open: boolean
  onClose: () => void
  loading: boolean
  data: TimelinePreview | null
  pacienteId: string | null
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Línea de tiempo</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{data?.pacienteNombre ?? '…'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando historial…</p>
        ) : data ? (
          <div className="space-y-6">
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tratamientos recientes</h4>
              <ul className="space-y-2 border-l-2 border-slate-200 pl-3 dark:border-slate-600">
                {data.tratamientos.map((t) => (
                  <li key={t.id} className="text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{t.medicamento}</span>
                    <span className="text-slate-500"> · {t.activo ? 'Activo' : 'Inactivo'}</span>
                    <p className="text-xs text-slate-500">
                      Vence {t.fecha_vencimiento}
                      {t.contactado_renovacion_en ? ` · Contacto ${t.contactado_renovacion_en.slice(0, 10)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Renovaciones y contactos</h4>
              {data.renovaciones.length === 0 ? (
                <p className="text-sm text-slate-500">Sin renovaciones registradas aún.</p>
              ) : (
                <ul className="space-y-2 border-l-2 border-brand-500/40 pl-3">
                  {data.renovaciones.map((r) => (
                    <li key={r.id} className="text-sm">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{r.farmacia?.nombre ?? 'Sucursal'}</p>
                      <p className="text-xs text-slate-500">
                        {r.fecha.slice(0, 10)}
                        {r.empleado?.nombre ? ` · ${r.empleado.nombre}` : ''}
                      </p>
                      {r.numero_factura?.trim() ? (
                        <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          Factura: <span className="font-mono">{r.numero_factura.trim()}</span>
                        </p>
                      ) : null}
                      {r.monto_total_factura != null && Number.isFinite(Number(r.monto_total_factura)) ? (
                        <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          Monto total: {formatMontoFacturaCrc(Number(r.monto_total_factura))}
                        </p>
                      ) : null}
                      {r.notas ? <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{r.notas}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Sin datos.</p>
        )}
        {!loading && pacienteId && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link
              href={`/pacientes/${pacienteId}`}
              className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Abrir ficha completa →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardRenovacionesClient({
  rows,
  showFarmaciaFilter,
}: {
  rows: DashboardRow[]
  showFarmaciaFilter: boolean
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('prioridad')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineData, setTimelineData] = useState<TimelinePreview | null>(null)
  const [timelinePacienteId, setTimelinePacienteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let r = rows.slice()
    const qq = q.trim().toLowerCase()
    if (qq) {
      r = r.filter(
        (x) =>
          x.paciente_nombre.toLowerCase().includes(qq) ||
          formatoMedicamento(x).toLowerCase().includes(qq) ||
          (x.telefono && x.telefono.includes(qq)),
      )
    }
    r.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'prioridad') cmp = compararFilasPanelRenovacionPorPrioridad(a, b)
      else if (sortKey === 'paciente') cmp = a.paciente_nombre.localeCompare(b.paciente_nombre, 'es')
      else if (sortKey === 'vence') cmp = a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
      else if (sortKey === 'estado') cmp = a.dias - b.dias
      else cmp = (a.farmacia_nombre ?? '').localeCompare(b.farmacia_nombre ?? '', 'es')
      return sortKey === 'prioridad' ? cmp : sortDir === 'asc' ? cmp : -cmp
    })
    return r
  }, [rows, q, sortKey, sortDir])

  const bloques = useMemo(() => {
    if (sortKey !== 'prioridad') return null
    const grupos: Record<GrupoKey, DashboardRow[]> = {
      critico: [],
      urgente: [],
      planificacion: [],
      estable: [],
    }
    for (const r of filtered) {
      grupos[grupoPorDias(r.dias)].push(r)
    }
    return (['critico', 'urgente', 'planificacion', 'estable'] as const).map((key) => ({
      key,
      rows: grupos[key],
    }))
  }, [filtered, sortKey])

  const allSelectableIds = useMemo(() => filtered.filter((x) => !x.contactado).map((x) => x.id), [filtered])
  const allSelected =
    allSelectableIds.length > 0 && allSelectableIds.every((id) => selected.has(id))

  function toggleSort(key: Exclude<SortKey, 'prioridad'>) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(allSelectableIds))
  }

  async function bulkMarcar() {
    const ids = [...selected].filter((id) => {
      const row = rows.find((r) => r.id === id)
      return row && !row.contactado
    })
    if (!ids.length) {
      toast.message('Selecciona al menos un tratamiento pendiente de contacto.')
      return
    }
    setBulkLoading(true)
    const res = await marcarContactadosMasivo(ids)
    setBulkLoading(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(`Marcados como contactados: ${res.ok ?? ids.length}`)
    setSelected(new Set())
    router.refresh()
  }

  async function openTimeline(pacienteId: string) {
    setTimelinePacienteId(pacienteId)
    setTimelineOpen(true)
    setTimelineLoading(true)
    setTimelineData(null)
    const res = await getTimelinePreview(pacienteId)
    setTimelineLoading(false)
    if (res.error) {
      toast.error(res.error)
      setTimelineOpen(false)
      return
    }
    setTimelineData(res.data ?? null)
  }

  function closeTimeline() {
    setTimelineOpen(false)
    setTimelineData(null)
    setTimelinePacienteId(null)
  }

  function renderFila(r: DashboardRow) {
    const hrefRenovar = `/pacientes/${r.paciente_id}/tratamiento/${r.id}/renovar`
    const hrefFicha = `/pacientes/${r.paciente_id}`

    return (
      <tr
        key={r.id}
        className={cn(
          'group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60',
          borderLateral(r.dias),
        )}
      >
        <td className="px-3 py-2 align-middle">
          {!r.contactado ? (
            <button
              type="button"
              onClick={() => toggleRow(r.id)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700"
              aria-label={selected.has(r.id) ? 'Quitar selección' : 'Seleccionar'}
            >
              {selected.has(r.id) ? (
                <CheckSquare className="h-4 w-4 text-brand-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="inline-block w-6" aria-hidden />
          )}
        </td>
        <td className="min-w-[200px] px-3 py-2 align-middle">
          <p className="font-semibold text-slate-900 dark:text-white">{r.paciente_nombre}</p>
          {r.telefono ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{r.telefono}</p> : null}
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{formatoMedicamento(r)}</p>
        </td>
        {showFarmaciaFilter && (
          <td className="max-w-[140px] truncate px-3 py-2 align-middle text-sm text-slate-600 dark:text-slate-300">
            {r.farmacia_nombre ?? '—'}
          </td>
        )}
        <td className="whitespace-nowrap px-3 py-2 align-middle text-slate-600 dark:text-slate-300">
          {formatearFechaCorta(r.fecha_vencimiento)}
        </td>
        <td className="whitespace-nowrap px-3 py-2 align-middle">
          <span className={cn('font-mono text-xs font-bold', claseDiasRestantes(r.dias))}>
            {r.dias < 0 ? `${r.dias}` : `${r.dias}d`}
          </span>
        </td>
        <td className="px-3 py-2 align-middle">
          <span className={badgeEstadoDominante(r.dias)} title={etiquetaPrioridadPanelPrincipal(r.dias)}>
            {r.badgeLabel}
          </span>
        </td>
        <td className="px-4 py-2 align-middle text-center">
          <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-4 sm:gap-5">
            <div className="flex w-8 flex-col items-center gap-1.5 sm:w-auto sm:min-w-[4.25rem]">
              <BotonContactadoRenovacion tratamientoId={r.id} contactado={r.contactado} variant="panel" />
              <span
                className={cn(
                  PANEL_ACCION_LABEL.base,
                  r.contactado ? PANEL_ACCION_LABEL.desmarcar : PANEL_ACCION_LABEL.contactado,
                )}
              >
                {r.contactado ? 'Desmarcar' : 'Contactado'}
              </span>
            </div>
            <div className="flex w-8 flex-col items-center gap-1.5 sm:w-auto sm:min-w-[3.25rem]">
              <Link href={hrefRenovar} className={PANEL_ACCION_ESTILOS.renovar} title="Registrar renovación">
                <Repeat className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={hrefRenovar} className={cn(PANEL_ACCION_LABEL.base, PANEL_ACCION_LABEL.renovar)}>
                Renovar
              </Link>
            </div>
            <div className="flex w-8 flex-col items-center gap-1.5 sm:w-auto sm:min-w-[3.5rem]">
              <button
                type="button"
                onClick={() => openTimeline(r.paciente_id)}
                className={PANEL_ACCION_ESTILOS.actividad}
                title="Ver actividad del paciente"
              >
                <History className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => openTimeline(r.paciente_id)}
                className={cn(PANEL_ACCION_LABEL.base, PANEL_ACCION_LABEL.actividad)}
              >
                Actividad
              </button>
            </div>
            <div className="flex w-8 flex-col items-center gap-1.5 sm:w-auto sm:min-w-[2.5rem]">
              <Link href={hrefFicha} className={PANEL_ACCION_ESTILOS.ficha} title="Ver ficha del paciente">
                <Eye className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={hrefFicha}
                className={cn(PANEL_ACCION_LABEL.base, PANEL_ACCION_LABEL.ficha)}
              >
                Ficha
              </Link>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <div className="border-b border-slate-100/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60 md:px-5">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full min-w-0 max-w-xl lg:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente, teléfono o medicamento…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-3 lg:w-auto">
            <button
              type="button"
              disabled={bulkLoading || selected.size === 0}
              onClick={() => bulkMarcar()}
              className={PANEL_TOOLBAR_ESTILOS.marcarContactados}
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              Marcar contactados ({selected.size})
            </button>
            <button type="button" onClick={() => exportCsv(filtered)} className={PANEL_TOOLBAR_ESTILOS.exportar}>
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <p className="border-b border-slate-100/80 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 md:px-5">
        Mostrando <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> de{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{rows.length}</span> renovaciones
      </p>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden />
          <p className="font-medium text-slate-600 dark:text-slate-300">Ningún resultado con la búsqueda actual</p>
          <p className="mt-1 text-sm">Prueba con otro nombre, teléfono o medicamento.</p>
        </div>
      ) : (
        <div className="max-h-[min(70vh,calc(100vh-14rem))] overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                    title={allSelected ? 'Desmarcar todos' : 'Seleccionar todos pendientes'}
                  >
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="min-w-[220px] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('paciente')}>
                    Paciente · tratamiento
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                {showFarmaciaFilter && (
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('sucursal')}>
                      Sucursal
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                )}
                <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('vence')}>
                    Vence
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('estado')}>
                    Días
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estado
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bloques
                ? bloques.map(({ key, rows: grupoRows }) => {
                    if (grupoRows.length === 0) return null
                    return <Fragment key={key}>{grupoRows.map((r) => renderFila(r))}</Fragment>
                  })
                : filtered.map((r) => renderFila(r))}
            </tbody>
          </table>
        </div>
      )}

      <TimelineModal
        open={timelineOpen}
        onClose={closeTimeline}
        loading={timelineLoading}
        data={timelineData}
        pacienteId={timelinePacienteId}
      />
    </>
  )
}
