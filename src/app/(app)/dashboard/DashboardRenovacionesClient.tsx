'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, BarChart3, CheckSquare, Download, History, RefreshCw, Search, Square } from 'lucide-react'
import { toast } from 'sonner'
import {
  compararFilasPanelRenovacionPorPrioridad,
  formatMontoFacturaCrc,
  formatoMedicamento,
} from '@/lib/utils'
import { marcarContactadosMasivo, getTimelinePreview, type TimelinePreview } from './actions'
import BotonContactadoRenovacion from './BotonContactadoRenovacion'

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

  return (
    <>
      <div className="border-b border-slate-100/80 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40 md:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative min-w-0 flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente, teléfono o medicamento…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkLoading || selected.size === 0}
              onClick={() => bulkMarcar()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Marcar contactados ({selected.size})
            </button>
            <button
              type="button"
              onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" aria-hidden />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden />
          <p className="font-medium text-slate-600 dark:text-slate-300">Ningún resultado con la búsqueda actual</p>
          <p className="mt-1 text-sm">Prueba con otro nombre, teléfono o medicamento.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <th className="w-10 px-3 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                    title={allSelected ? 'Desmarcar todos' : 'Seleccionar todos pendientes'}
                  >
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('paciente')}>
                    Paciente
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                {showFarmaciaFilter && (
                  <th className="px-3 py-3">
                    <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('sucursal')}>
                      Sucursal
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  </th>
                )}
                <th className="px-3 py-3">Medicamento</th>
                <th className="px-3 py-3">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('vence')}>
                    Vence
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white" onClick={() => toggleSort('estado')}>
                    Estado
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => {
                return (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-3 align-middle">
                      {!r.contactado ? (
                        <button
                          type="button"
                          onClick={() => toggleRow(r.id)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                          aria-label={selected.has(r.id) ? 'Quitar selección' : 'Seleccionar'}
                        >
                          {selected.has(r.id) ? <CheckSquare className="h-4 w-4 text-brand-600" /> : <Square className="h-4 w-4" />}
                        </button>
                      ) : (
                        <span className="inline-block w-6" />
                      )}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{r.paciente_nombre}</p>
                      {r.telefono ? <p className="text-xs text-slate-500">{r.telefono}</p> : null}
                    </td>
                    {showFarmaciaFilter && (
                      <td className="max-w-[140px] truncate px-3 py-3 text-slate-600 dark:text-slate-300">{r.farmacia_nombre ?? '—'}</td>
                    )}
                    <td className="max-w-[200px] px-3 py-3 text-slate-600 dark:text-slate-300">
                      <span className="line-clamp-2">{formatoMedicamento(r)}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">{r.fecha_vencimiento}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${r.badgeClass}`}>{r.badgeLabel}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <BotonContactadoRenovacion tratamientoId={r.id} contactado={r.contactado} />
                        <Link
                          href={`/pacientes/${r.paciente_id}/tratamiento/${r.id}/renovar`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-emerald-700/25 transition hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:ring-emerald-300/25 dark:hover:bg-emerald-500"
                          title="Abrir formulario de renovación de este tratamiento"
                        >
                          <RefreshCw className="h-3.5 w-3.5 shrink-0 text-white" aria-hidden />
                          Renovar
                        </Link>
                        <button
                          type="button"
                          onClick={() => openTimeline(r.paciente_id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <History className="h-3.5 w-3.5" aria-hidden />
                          Actividad
                        </button>
                        <Link
                          href={`/pacientes/${r.paciente_id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-brand-500"
                        >
                          Ficha
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
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
