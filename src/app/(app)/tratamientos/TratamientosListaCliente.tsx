'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { calcularDiasRestantes, formatoMedicamento, formatearFechaCorta } from '@/lib/utils'
import { CheckCircle2, Eye, Pill, Search } from 'lucide-react'

export type TratamientoListaItem = {
  id: string
  paciente_id: string
  fecha_vencimiento: string
  dosis_diaria: number
  tipo: string
  medicamento: string
  marca?: string | null
  concentracion?: string | null
  paciente: { nombre: string; telefono: string | null; farmacia_id: string } | null
}

type GrupoKey = 'critico' | 'proximo' | 'estable'

function grupoPorDias(dias: number): GrupoKey {
  if (dias <= 1) return 'critico'
  if (dias <= 15) return 'proximo'
  return 'estable'
}

function etiquetaRiesgoVisual(dias: number): string {
  if (dias < 0) return '🔴 ATRASADO'
  if (dias === 0) return '🔴 Vence hoy'
  if (dias === 1) return '🔴 Vence mañana'
  if (dias <= 5) return '🟠 PRONTO'
  if (dias <= 15) return '🟡 En ventana'
  return '🟢 Al día'
}

function borderLateral(dias: number): string {
  if (dias < 0) return 'border-l-4 border-l-red-500/70'
  if (dias <= 1) return 'border-l-4 border-l-red-500/60'
  if (dias <= 5) return 'border-l-4 border-l-amber-500/60'
  if (dias <= 15) return 'border-l-4 border-l-amber-400/50'
  return 'border-l-4 border-l-emerald-500/40'
}

function badgeEstadoDominante(dias: number): string {
  if (dias < 0)
    return 'inline-flex max-w-[14rem] items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold uppercase leading-tight tracking-wide text-red-800 dark:text-red-300'
  if (dias <= 1)
    return 'inline-flex max-w-[14rem] items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold uppercase leading-tight tracking-wide text-red-800 dark:text-red-400'
  if (dias <= 5)
    return 'inline-flex max-w-[14rem] items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold uppercase leading-tight tracking-wide text-amber-900 dark:text-amber-300'
  if (dias <= 15)
    return 'inline-flex max-w-[14rem] items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold uppercase leading-tight tracking-wide text-amber-900 dark:text-amber-200'
  return 'inline-flex max-w-[14rem] items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold uppercase leading-tight tracking-wide text-emerald-900 dark:text-emerald-300'
}

const GRUPO_META: Record<
  GrupoKey,
  { titulo: string; subtitulo: string; barClass: string }
> = {
  critico: {
    titulo: 'Vencidos y críticos',
    subtitulo: 'Vencimiento hoy, mañana o ya atrasado — prioridad máxima',
    barClass: 'bg-red-500/10 text-red-900 dark:bg-red-500/20 dark:text-red-100',
  },
  proximo: {
    titulo: 'Próximos a vencer',
    subtitulo: 'Entre 2 y 15 días — seguimiento activo',
    barClass: 'bg-amber-500/10 text-amber-950 dark:bg-amber-500/15 dark:text-amber-50',
  },
  estable: {
    titulo: 'Estables',
    subtitulo: 'Más de 15 días — planificación',
    barClass: 'bg-emerald-500/10 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-50',
  },
}

type FiltroEstado = 'todos' | 'critico' | 'proximo' | 'estable'
type FiltroDias = 'todos' | 'vencido' | '0-5' | '6-15' | '16+'

export default function TratamientosListaCliente({ items }: { items: TratamientoListaItem[] }) {
  const [q, setQ] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cronico' | 'temporal'>('todos')
  const [filtroMedicamento, setFiltroMedicamento] = useState('')
  const [filtroDias, setFiltroDias] = useState<FiltroDias>('todos')

  const filtrados = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const medNeedle = filtroMedicamento.trim().toLowerCase()

    return items.filter((t) => {
      const dias = calcularDiasRestantes(t.fecha_vencimiento)
      const g = grupoPorDias(dias)
      if (filtroEstado !== 'todos' && g !== filtroEstado) return false

      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false

      if (filtroDias === 'vencido' && dias >= 0) return false
      if (filtroDias === '0-5' && (dias < 0 || dias > 5)) return false
      if (filtroDias === '6-15' && (dias < 6 || dias > 15)) return false
      if (filtroDias === '16+' && dias <= 15) return false

      const medStr = formatoMedicamento(t).toLowerCase()
      if (medNeedle && !medStr.includes(medNeedle)) return false

      if (needle) {
        const nom = (t.paciente?.nombre ?? '').toLowerCase()
        if (!nom.includes(needle) && !medStr.includes(needle)) return false
      }
      return true
    })
  }, [items, q, filtroEstado, filtroTipo, filtroMedicamento, filtroDias])

  const ordenados = useMemo(() => {
    return [...filtrados].sort(
      (a, b) =>
        calcularDiasRestantes(a.fecha_vencimiento) - calcularDiasRestantes(b.fecha_vencimiento),
    )
  }, [filtrados])

  const porGrupo = useMemo(() => {
    const critico: TratamientoListaItem[] = []
    const proximo: TratamientoListaItem[] = []
    const estable: TratamientoListaItem[] = []
    for (const t of ordenados) {
      const d = calcularDiasRestantes(t.fecha_vencimiento)
      const g = grupoPorDias(d)
      if (g === 'critico') critico.push(t)
      else if (g === 'proximo') proximo.push(t)
      else estable.push(t)
    }
    return { critico, proximo, estable }
  }, [ordenados])

  const bloques: { key: GrupoKey; rows: TratamientoListaItem[] }[] = [
    { key: 'critico', rows: porGrupo.critico },
    { key: 'proximo', rows: porGrupo.proximo },
    { key: 'estable', rows: porGrupo.estable },
  ]

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Pill className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
        <p className="font-medium text-slate-700 dark:text-slate-300">Sin tratamientos activos</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">No hay tratamientos en seguimiento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="relative min-w-[200px] flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar paciente o medicamento…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            aria-label="Buscar tratamiento o paciente"
          />
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Estado
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="todos">Todos</option>
              <option value="critico">Vencidos / críticos</option>
              <option value="proximo">Próximos</option>
              <option value="estable">Estables</option>
            </select>
          </label>
          <label className="flex min-w-[8rem] flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Medicamento
            <input
              value={filtroMedicamento}
              onChange={(e) => setFiltroMedicamento(e.target.value)}
              placeholder="Filtrar…"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tipo
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'cronico' | 'temporal')}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="todos">Todos</option>
              <option value="cronico">Crónico</option>
              <option value="temporal">Temporal</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Días rest.
            <select
              value={filtroDias}
              onChange={(e) => setFiltroDias(e.target.value as FiltroDias)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="todos">Todos</option>
              <option value="vencido">Ya vencidos</option>
              <option value="0-5">0 a 5 días</option>
              <option value="6-15">6 a 15 días</option>
              <option value="16+">16 o más</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Mostrando <span className="font-semibold text-slate-700 dark:text-slate-200">{filtrados.length}</span> de{' '}
        {items.length} tratamientos
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="max-h-[min(70vh,calc(100vh-14rem))] overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Prioridad / estado
                </th>
                <th className="min-w-[220px] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Paciente · tratamiento
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dosis
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vence
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Días
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ordenados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Ningún tratamiento coincide con los filtros.
                  </td>
                </tr>
              ) : (
                bloques.map(({ key, rows }) => {
                  if (rows.length === 0) return null
                  const meta = GRUPO_META[key]
                  return (
                    <Fragment key={key}>
                      <tr className={`${meta.barClass}`}>
                        <td colSpan={6} className="border-y border-slate-200/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] dark:border-slate-700">
                          {meta.titulo}
                          <span className="ml-2 font-mono text-[10px] font-normal normal-case tracking-normal opacity-80">
                            ({rows.length}) · {meta.subtitulo}
                          </span>
                        </td>
                      </tr>
                      {rows.map((t) => {
                        const dias = calcularDiasRestantes(t.fecha_vencimiento)
                        const hrefRenovar = `/pacientes/${t.paciente_id}/tratamiento/${t.id}/renovar`
                        const hrefPaciente = `/pacientes/${t.paciente_id}`
                        return (
                          <tr
                            key={t.id}
                            className={`group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${borderLateral(dias)}`}
                          >
                            <td className="px-3 py-2 align-middle">
                              <span className={badgeEstadoDominante(dias)} title={`${dias} días hasta vencimiento`}>
                                {etiquetaRiesgoVisual(dias)}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <p className="font-semibold text-slate-900 dark:text-white">{t.paciente?.nombre ?? '—'}</p>
                              <p className="mt-0.5 text-slate-600 dark:text-slate-300">{formatoMedicamento(t)}</p>
                              <span
                                className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  t.tipo === 'cronico'
                                    ? 'bg-sky-500/10 text-sky-800 ring-1 ring-sky-500/20 dark:text-sky-300'
                                    : 'bg-violet-500/10 text-violet-900 ring-1 ring-violet-500/20 dark:text-violet-200'
                                }`}
                              >
                                {t.tipo === 'cronico' ? 'Crónico' : 'Temporal'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle text-slate-500 dark:text-slate-400">
                              {t.dosis_diaria}/día
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle text-slate-600 dark:text-slate-300">
                              {formatearFechaCorta(t.fecha_vencimiento)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle">
                              <span
                                className={`font-mono text-xs font-bold ${
                                  dias < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : dias <= 1
                                      ? 'text-red-600 dark:text-red-400'
                                      : dias <= 5
                                        ? 'text-amber-700 dark:text-amber-400'
                                        : dias <= 15
                                          ? 'text-amber-700 dark:text-amber-300'
                                          : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {dias < 0 ? `${dias}` : `${dias}d`}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <div className="flex flex-wrap items-center justify-end gap-1.5 opacity-100 transition-opacity md:opacity-70 md:group-hover:opacity-100">
                                <Link
                                  href={hrefRenovar}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-500/35 bg-brand-500/10 text-brand-700 transition hover:bg-brand-500/20 dark:text-brand-300"
                                  title="Registrar renovación"
                                >
                                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                                </Link>
                                <Link
                                  href={hrefPaciente}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                  title="Ver paciente"
                                >
                                  <Eye className="h-4 w-4" aria-hidden />
                                </Link>
                              </div>
                              <div className="mt-1 hidden text-right text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:block">
                                <Link href={hrefRenovar} className="text-brand-600 hover:underline dark:text-brand-400">
                                  Renovar
                                </Link>
                                {' · '}
                                <Link href={hrefPaciente} className="hover:underline">
                                  Ficha
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
