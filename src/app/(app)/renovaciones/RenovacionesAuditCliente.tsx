'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  differenceInDays,
  format,
  isThisMonth,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardList, Eye, Filter, Search, User } from 'lucide-react'

export type SeveridadEvento = 'normal' | 'tardio' | 'critico'

export type RenovacionAuditItem = {
  id: string
  tratamiento_id: string
  fecha: string
  notas: string | null
  numero_factura: string | null
  farmaciaNombre: string
  empleadoNombre: string
  pacienteId: string | null
  medicamentoLabel: string
  tratamientoTipo: string
  esTardia: boolean
  diasRetraso: number
  diasDesdeRenovacionAnterior: number | null
  severidad: SeveridadEvento
}

export type RenovacionesMetricas = {
  renovacionesEsteMes: number
  pctPuntuales: number | null
  pctTardias: number | null
  promedioDiasEntre: number | null
  evaluablesTardia: number
}

type FiltroFecha = 'todos' | 'hoy' | '7d' | '30d' | 'mes'

function etiquetaDiaGrupo(fechaIso: string): string {
  const d = parseISO(fechaIso)
  if (isToday(d)) return 'HOY'
  if (isYesterday(d)) return 'AYER'
  return format(d, 'd MMMM yyyy', { locale: es }).toUpperCase()
}

function pasaFiltroFecha(fechaIso: string, filtro: FiltroFecha): boolean {
  if (filtro === 'todos') return true
  const d = parseISO(fechaIso)
  const d0 = startOfDay(d)
  const h0 = startOfDay(new Date())
  const diasAtras = differenceInDays(h0, d0)
  if (filtro === 'hoy') return isToday(d)
  if (filtro === 'mes') return isThisMonth(d)
  if (filtro === '7d') return diasAtras >= 0 && diasAtras <= 6
  if (filtro === '30d') return diasAtras >= 0 && diasAtras <= 29
  return true
}

function estilosSeveridad(s: SeveridadEvento): { bar: string; card: string; titulo: string; icono: string } {
  if (s === 'critico') {
    return {
      bar: 'border-l-red-500',
      card: 'border-slate-200/80 bg-red-500/[0.06] dark:border-slate-700 dark:bg-red-950/25',
      titulo: 'text-red-700 dark:text-red-300',
      icono: '❗',
    }
  }
  if (s === 'tardio') {
    return {
      bar: 'border-l-amber-500',
      card: 'border-slate-200/80 bg-amber-500/[0.07] dark:border-slate-700 dark:bg-amber-950/20',
      titulo: 'text-amber-800 dark:text-amber-200',
      icono: '⚠️',
    }
  }
  return {
    bar: 'border-l-emerald-500',
    card: 'border-slate-200/80 bg-emerald-500/[0.06] dark:border-slate-700 dark:bg-emerald-950/20',
    titulo: 'text-emerald-800 dark:text-emerald-300',
    icono: '✔',
  }
}

function tituloEvento(item: RenovacionAuditItem): string {
  if (item.severidad === 'critico') return `Renovación tardía crítica (+${item.diasRetraso} días)`
  if (item.severidad === 'tardio') return `Renovación tardía (+${item.diasRetraso} día${item.diasRetraso !== 1 ? 's' : ''})`
  return 'Renovación registrada'
}

function tipoRenovacionLabel(tipo: string): string {
  if (tipo === 'cronico') return 'Crónico'
  if (tipo === 'temporal') return 'Temporal'
  return tipo || '—'
}

export default function RenovacionesAuditCliente({
  items,
  metricas,
}: {
  items: RenovacionAuditItem[]
  metricas: RenovacionesMetricas
}) {
  const [q, setQ] = useState('')
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos')
  const [farmacia, setFarmacia] = useState('')
  const [empleado, setEmpleado] = useState('')
  const [tipoTrat, setTipoTrat] = useState<'todos' | 'cronico' | 'temporal'>('todos')

  const farmaciasOpts = useMemo(() => {
    const s = new Set<string>()
    items.forEach((i) => {
      if (i.farmaciaNombre) s.add(i.farmaciaNombre)
    })
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [items])

  const empleadosOpts = useMemo(() => {
    const s = new Set<string>()
    items.forEach((i) => {
      if (i.empleadoNombre) s.add(i.empleadoNombre)
    })
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [items])

  const filtrados = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter((i) => {
      if (!pasaFiltroFecha(i.fecha, filtroFecha)) return false
      if (farmacia && i.farmaciaNombre !== farmacia) return false
      if (empleado && i.empleadoNombre !== empleado) return false
      if (tipoTrat !== 'todos' && i.tratamientoTipo !== tipoTrat) return false
      if (needle) {
        const blob = `${i.farmaciaNombre} ${i.empleadoNombre} ${i.medicamentoLabel} ${i.notas ?? ''}`.toLowerCase()
        if (!blob.includes(needle)) return false
      }
      return true
    })
  }, [items, q, filtroFecha, farmacia, empleado, tipoTrat])

  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id))
  }, [filtrados])

  const gruposDia = useMemo(() => {
    const out: { clave: string; etiqueta: string; filas: RenovacionAuditItem[] }[] = []
    for (const r of ordenados) {
      const clave = r.fecha.slice(0, 10)
      const etiqueta = etiquetaDiaGrupo(r.fecha)
      const prev = out[out.length - 1]
      if (prev && prev.clave === clave) prev.filas.push(r)
      else out.push({ clave, etiqueta, filas: [r] })
    }
    return out
  }, [ordenados])

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="font-medium text-slate-700 dark:text-slate-300">Sin renovaciones</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No se han registrado renovaciones aún.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-30 -mx-px space-y-3 border-b border-slate-200/90 bg-slate-50/95 px-1 pb-3 pt-1 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/80 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Este mes</p>
            <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{metricas.renovacionesEsteMes}</p>
            <p className="text-slate-500 dark:text-slate-400">renovaciones</p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Puntuales</p>
            <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {metricas.pctPuntuales !== null ? `${metricas.pctPuntuales}%` : '—'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">vs vencimiento tratamiento</p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Tardías</p>
            <p className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {metricas.pctTardias !== null ? `${metricas.pctTardias}%` : '—'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">mismo criterio</p>
          </div>
          <div>
            <p className="font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Promedio</p>
            <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {metricas.promedioDiasEntre !== null ? `${metricas.promedioDiasEntre} d` : '—'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">entre renovaciones mismo trat.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:flex-wrap md:items-end">
          <div className="relative min-w-[200px] flex-1 md:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sucursal, usuario, medicamento o nota…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              aria-label="Buscar renovaciones"
            />
          </div>
          <label className="flex flex-col gap-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Filter className="h-3 w-3" aria-hidden />
              Fecha
            </span>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value as FiltroFecha)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="todos">Todas</option>
              <option value="hoy">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="mes">Este mes</option>
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Sucursal
            <select
              value={farmacia}
              onChange={(e) => setFarmacia(e.target.value)}
              className="max-w-[11rem] rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">Todas</option>
              {farmaciasOpts.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Usuario
            <select
              value={empleado}
              onChange={(e) => setEmpleado(e.target.value)}
              className="max-w-[11rem] rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="">Todos</option>
              {empleadosOpts.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
            Tipo trat.
            <select
              value={tipoTrat}
              onChange={(e) => setTipoTrat(e.target.value as 'todos' | 'cronico' | 'temporal')}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="todos">Todos</option>
              <option value="cronico">Crónico</option>
              <option value="temporal">Temporal</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Mostrando <span className="font-semibold text-slate-700 dark:text-slate-200">{filtrados.length}</span> de {items.length} eventos
        {metricas.evaluablesTardia > 0 ? (
          <span className="ml-2">
            · Tardía = renovación posterior a la fecha de vencimiento actual del tratamiento (aprox. histórico).
          </span>
        ) : null}
      </p>

      <div className="max-h-[min(68vh,calc(100vh-13rem))] overflow-y-auto scroll-smooth pr-1">
        {ordenados.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Ningún evento coincide con los filtros.</p>
        ) : (
          <div className="space-y-8 pb-6">
            {gruposDia.map((grupo) => (
              <section key={grupo.clave} aria-labelledby={`dia-${grupo.clave}`}>
                <h2 id={`dia-${grupo.clave}`} className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {grupo.etiqueta}
                </h2>
                <div className="space-y-2.5 border-l border-slate-200 pl-3 dark:border-slate-700 md:pl-4">
                  {grupo.filas.map((item) => {
                    const st = estilosSeveridad(item.severidad)
                    const hrefPaciente = item.pacienteId ? `/pacientes/${item.pacienteId}` : null
                    const hrefTratamiento = item.pacienteId
                      ? `/pacientes/${item.pacienteId}#tratamientos-activos`
                      : null
                    const nota = item.notas?.trim()
                    const notaCorta = nota && nota.length > 90 ? `${nota.slice(0, 87)}…` : nota
                    return (
                      <article
                        key={item.id}
                        className={`rounded-lg border ${st.bar} border-l-4 py-2 pl-3 pr-2 shadow-sm ${st.card} md:py-2.5 md:pl-3.5`}
                      >
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold ${st.titulo}`}>
                              <span className="mr-1.5" aria-hidden>
                                {st.icono}
                              </span>
                              {tituloEvento(item)}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.farmaciaNombre}</span>
                              {' · '}
                              <span className="inline-flex items-center gap-0.5">
                                <User className="inline h-3 w-3 opacity-70" aria-hidden />
                                {item.empleadoNombre}
                              </span>
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                              <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {tipoRenovacionLabel(item.tratamientoTipo)}
                              </span>
                              <span className="mx-1.5 text-slate-400">·</span>
                              <span className="text-slate-700 dark:text-slate-300">{item.medicamentoLabel}</span>
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-500">
                              {item.diasDesdeRenovacionAnterior !== null ? (
                                <>
                                  ⏱ Tiempo desde renovación anterior en este tratamiento:{' '}
                                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                    {item.diasDesdeRenovacionAnterior} días
                                  </span>
                                </>
                              ) : (
                                <>⏱ Primera renovación registrada en este tratamiento</>
                              )}
                            </p>
                            {item.numero_factura?.trim() ? (
                              <p className="mt-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                Factura:{' '}
                                <span className="font-mono font-normal text-slate-800 dark:text-slate-200">
                                  {item.numero_factura.trim()}
                                </span>
                              </p>
                            ) : null}
                            <div className="mt-1.5 text-[11px]">
                              {nota ? (
                                <p className="text-slate-600 dark:text-slate-400" title={nota.length > 90 ? nota : undefined}>
                                  <span className="font-medium text-slate-500 dark:text-slate-500">Nota: </span>
                                  <span className="whitespace-pre-wrap">{notaCorta}</span>
                                </p>
                              ) : (
                                <p className="italic text-slate-400 dark:text-slate-500">Sin notas</p>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-1.5 sm:flex-col sm:items-end">
                            {hrefPaciente ? (
                              <Link
                                href={hrefPaciente}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <Eye className="h-3 w-3" aria-hidden />
                                Ver detalle
                              </Link>
                            ) : null}
                            {hrefTratamiento ? (
                              <Link
                                href={hrefTratamiento}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                <ClipboardList className="h-3 w-3" aria-hidden />
                                Ver tratamiento
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
