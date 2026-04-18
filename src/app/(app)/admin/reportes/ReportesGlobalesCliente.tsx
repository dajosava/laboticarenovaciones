'use client'

import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
  subDays,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Lightbulb,
  Pill,
  RefreshCw,
  Shield,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

export type FarmaciaRow = { id: string; nombre: string; creada_en: string; activa: boolean }
export type PacienteRow = {
  id: string
  nombre: string
  farmacia_id: string
  seguro_medico: string | null
  creado_en: string
  activo: boolean
}
export type TratamientoRow = {
  id: string
  paciente_id: string
  farmacia_id: string
  fecha_vencimiento: string
  activo: boolean
  creado_en: string
}
export type RenovacionRow = {
  id: string
  fecha: string
  farmacia_id: string
  tratamiento_id: string
  fecha_vencimiento_trat: string | null
}

export type ReportesPayload = {
  farmacias: FarmaciaRow[]
  pacientes: PacienteRow[]
  tratamientos: TratamientoRow[]
  renovaciones: RenovacionRow[]
}

function inRange(isoDate: string, from: Date, to: Date): boolean {
  const d = parseISO(isoDate)
  return d >= from && d <= to
}

function normSeguro(s: string | null | undefined): string {
  return (s ?? '').trim() || 'Sin seguro'
}

type KpiTrend = { current: number; previous: number; pct: number | null }

function trendKpi(current: number, previous: number): KpiTrend {
  if (previous === 0 && current === 0) return { current, previous, pct: 0 }
  if (previous === 0) return { current, previous, pct: current > 0 ? 100 : null }
  return { current, previous, pct: Math.round(((current - previous) / previous) * 100) }
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  pie,
}: {
  label: string
  value: number
  trend: KpiTrend
  icon: ComponentType<{ className?: string }>
  pie?: string
}) {
  const up = trend.pct !== null && trend.pct > 0
  const down = trend.pct !== null && trend.pct < 0
  const flat = trend.pct === 0 || (trend.pct === null && trend.current === trend.previous)
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden />
        </div>
        {!flat && trend.pct !== null ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              up
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : down
                  ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-600'
            }`}
          >
            {up ? <TrendingUp className="h-3 w-3" aria-hidden /> : down ? <TrendingDown className="h-3 w-3" aria-hidden /> : null}
            {trend.pct !== null ? `${trend.pct > 0 ? '+' : ''}${trend.pct}%` : '—'}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">vs periodo ant.</span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{pie ?? `Periodo anterior: ${trend.previous}`}</p>
    </div>
  )
}

export default function ReportesGlobalesCliente({ payload }: { payload: ReportesPayload }) {
  const { farmacias, pacientes, tratamientos, renovaciones } = payload
  const [desde, setDesde] = useState(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [hasta, setHasta] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [farmaciaId, setFarmaciaId] = useState('')
  const [aseguradora, setAseguradora] = useState('')
  const [verTodasSucursales, setVerTodasSucursales] = useState(false)
  const [detalleAseguradoraAbierto, setDetalleAseguradoraAbierto] = useState(false)

  const desdeDate = parseISO(`${desde}T00:00:00`)
  const hastaDate = parseISO(`${hasta}T23:59:59.999`)
  const diasPeriodo = Math.max(1, differenceInCalendarDays(hastaDate, desdeDate) + 1)
  const prevHasta = subDays(desdeDate, 1)
  const prevDesde = subDays(prevHasta, diasPeriodo - 1)

  const opcionesAseguradora = useMemo(() => {
    const s = new Set<string>()
    pacientes.filter((p) => p.activo).forEach((p) => s.add(normSeguro(p.seguro_medico)))
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [pacientes])

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      if (!p.activo) return false
      if (farmaciaId && p.farmacia_id !== farmaciaId) return false
      if (aseguradora && normSeguro(p.seguro_medico) !== aseguradora) return false
      return true
    })
  }, [pacientes, farmaciaId, aseguradora])

  const idsPaciente = useMemo(() => new Set(pacientesFiltrados.map((p) => p.id)), [pacientesFiltrados])

  const tratamientosFiltrados = useMemo(() => {
    return tratamientos.filter((t) => {
      if (!t.activo) return false
      if (!idsPaciente.has(t.paciente_id)) return false
      if (farmaciaId && t.farmacia_id !== farmaciaId) return false
      return true
    })
  }, [tratamientos, idsPaciente, farmaciaId])

  const tratamientoIds = useMemo(() => new Set(tratamientosFiltrados.map((t) => t.id)), [tratamientosFiltrados])

  const renovacionesFiltradas = useMemo(() => {
    return renovaciones.filter((r) => {
      if (!inRange(r.fecha, desdeDate, hastaDate)) return false
      if (farmaciaId && r.farmacia_id !== farmaciaId) return false
      if (!tratamientoIds.has(r.tratamiento_id)) return false
      return true
    })
  }, [renovaciones, desdeDate, hastaDate, farmaciaId, tratamientoIds])

  const renovacionesPeriodoAnterior = useMemo(() => {
    return renovaciones.filter((r) => {
      if (!inRange(r.fecha, prevDesde, prevHasta)) return false
      if (farmaciaId && r.farmacia_id !== farmaciaId) return false
      if (!tratamientoIds.has(r.tratamiento_id)) return false
      return true
    })
  }, [renovaciones, prevDesde, prevHasta, farmaciaId, tratamientoIds])

  const farmaciasVisibles = useMemo(() => {
    if (farmaciaId) return farmacias.filter((f) => f.id === farmaciaId && f.activa)
    return farmacias.filter((f) => f.activa)
  }, [farmacias, farmaciaId])

  const sucursalesNuevas = farmacias.filter((f) => f.activa && inRange(f.creada_en, desdeDate, hastaDate)).length
  const sucursalesNuevasAnt = farmacias.filter((f) => f.activa && inRange(f.creada_en, prevDesde, prevHasta)).length

  const pacientesAltas = pacientesFiltrados.filter((p) => inRange(p.creado_en, desdeDate, hastaDate)).length
  const pacientesAltasAnt = pacientes
    .filter((p) => {
      if (!p.activo) return false
      if (farmaciaId && p.farmacia_id !== farmaciaId) return false
      if (aseguradora && normSeguro(p.seguro_medico) !== aseguradora) return false
      return inRange(p.creado_en, prevDesde, prevHasta)
    })
    .length

  const tratamientosAltas = tratamientosFiltrados.filter((t) => inRange(t.creado_en, desdeDate, hastaDate)).length
  const tratamientosAltasAnt = tratamientos
    .filter((t) => {
      if (!t.activo) return false
      if (!idsPaciente.has(t.paciente_id)) return false
      if (farmaciaId && t.farmacia_id !== farmaciaId) return false
      return inRange(t.creado_en, prevDesde, prevHasta)
    })
    .length

  const trendRenov = trendKpi(renovacionesFiltradas.length, renovacionesPeriodoAnterior.length)
  const trendSucNuevas = trendKpi(sucursalesNuevas, sucursalesNuevasAnt)
  const trendPacAltas = trendKpi(pacientesAltas, pacientesAltasAnt)
  const trendTratAltas = trendKpi(tratamientosAltas, tratamientosAltasAnt)

  const serieRenovacionesDiarias = useMemo(() => {
    const days = eachDayOfInterval({ start: desdeDate, end: hastaDate })
    const counts = new Map<string, number>()
    days.forEach((d) => {
      counts.set(format(d, 'yyyy-MM-dd'), 0)
    })
    renovacionesFiltradas.forEach((r) => {
      const k = r.fecha.slice(0, 10)
      if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1)
    })
    return days.map((d) => ({
      iso: format(d, 'yyyy-MM-dd'),
      dia: format(d, 'd MMM', { locale: es }),
      count: counts.get(format(d, 'yyyy-MM-dd')) ?? 0,
    }))
  }, [desdeDate, hastaDate, renovacionesFiltradas])

  const totalPacientes = pacientesFiltrados.length
  const pacientesPorAseguradora = useMemo(() => {
    const acc: Record<string, number> = {}
    pacientesFiltrados.forEach((p) => {
      const k = normSeguro(p.seguro_medico)
      acc[k] = (acc[k] || 0) + 1
    })
    return Object.entries(acc)
      .map(([aseguradora, total]) => ({ aseguradora, total }))
      .sort((a, b) => b.total - a.total)
  }, [pacientesFiltrados])

  const pacientesPorFarmacia = useMemo(() => {
    const acc: Record<string, { nombre: string; total: number }> = {}
    pacientesFiltrados.forEach((p) => {
      const f = farmacias.find((x) => x.id === p.farmacia_id)
      const nombre = f?.nombre ?? 'Sin sucursal'
      if (!acc[nombre]) acc[nombre] = { nombre, total: 0 }
      acc[nombre].total += 1
    })
    return Object.values(acc).sort((a, b) => b.total - a.total)
  }, [pacientesFiltrados, farmacias])

  const topSucursales = verTodasSucursales ? pacientesPorFarmacia : pacientesPorFarmacia.slice(0, 5)
  const maxSuc = Math.max(1, ...pacientesPorFarmacia.map((x) => x.total))

  const listaPorAseguradora = useMemo(() => {
    const acc: Record<string, string[]> = {}
    pacientesFiltrados.forEach((p) => {
      const k = normSeguro(p.seguro_medico)
      if (!acc[k]) acc[k] = []
      acc[k].push(p.nombre)
    })
    return Object.entries(acc)
      .map(([aseguradora, nombres]) => ({
        aseguradora,
        nombres: nombres.slice().sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => b.nombres.length - a.nombres.length)
  }, [pacientesFiltrados])

  const promedioDiasRenov = useMemo(() => {
    const m = new Map<string, RenovacionRow[]>()
    renovacionesFiltradas.forEach((r) => {
      if (!m.has(r.tratamiento_id)) m.set(r.tratamiento_id, [])
      m.get(r.tratamiento_id)!.push(r)
    })
    const gapsDias: number[] = []
    m.forEach((arr) => {
      arr.sort((a, b) => a.fecha.localeCompare(b.fecha))
      for (let i = 1; i < arr.length; i++) {
        gapsDias.push(differenceInCalendarDays(parseISO(arr[i].fecha), parseISO(arr[i - 1].fecha)))
      }
    })
    return gapsDias.length > 0 ? Math.round((10 * gapsDias.reduce((a, b) => a + b, 0)) / gapsDias.length) / 10 : null
  }, [renovacionesFiltradas])

  const { pctRetrasos, pctPuntuales, sucursalMasRetrasos } = useMemo(() => {
    let tardias = 0
    let evaluables = 0
    const retrasosPorFarmacia: Record<string, number> = {}
    renovacionesFiltradas.forEach((r) => {
      if (!r.fecha_vencimiento_trat) return
      evaluables++
      const d = differenceInCalendarDays(parseISO(r.fecha), parseISO(r.fecha_vencimiento_trat))
      if (d > 0) {
        tardias++
        const nom = farmacias.find((f) => f.id === r.farmacia_id)?.nombre ?? r.farmacia_id
        retrasosPorFarmacia[nom] = (retrasosPorFarmacia[nom] || 0) + 1
      }
    })
    const pctR = evaluables > 0 ? Math.round((100 * tardias) / evaluables) : null
    const pctP = evaluables > 0 ? 100 - (pctR ?? 0) : null
    const entries = Object.entries(retrasosPorFarmacia)
    entries.sort((a, b) => b[1] - a[1])
    const top = entries.length ? entries[0] : null
    return { pctRetrasos: pctR, pctPuntuales: pctP, sucursalMasRetrasos: top }
  }, [renovacionesFiltradas, farmacias])

  const pacientesConRenov = useMemo(() => {
    const set = new Set<string>()
    renovacionesFiltradas.forEach((r) => {
      const t = tratamientosFiltrados.find((x) => x.id === r.tratamiento_id)
      if (t) set.add(t.paciente_id)
    })
    return set.size
  }, [renovacionesFiltradas, tratamientosFiltrados])

  const pctPacientesRenovados =
    totalPacientes > 0 ? Math.round((100 * pacientesConRenov) / totalPacientes) : null

  const insights: string[] = []
  if (trendRenov.pct !== null && trendRenov.pct >= 15) {
    insights.push(`Las renovaciones en el rango subieron aprox. ${trendRenov.pct}% respecto al periodo anterior.`)
  }
  if (trendRenov.pct !== null && trendRenov.pct <= -15) {
    insights.push(`Las renovaciones bajaron aprox. ${Math.abs(trendRenov.pct)}% vs el periodo anterior.`)
  }
  if (sucursalMasRetrasos && sucursalMasRetrasos[1] >= 2) {
    insights.push(`La sucursal con más renovaciones tardías en el rango es «${sucursalMasRetrasos[0]}» (${sucursalMasRetrasos[1]}).`)
  }
  if (pctRetrasos !== null && pctRetrasos >= 30) {
    insights.push(`El ${pctRetrasos}% de las renovaciones evaluables fueron posteriores al vencimiento del tratamiento (dato aproximado).`)
  }
  if (insights.length === 0) {
    insights.push('Ajusta el rango de fechas o los filtros para comparar periodos y detectar tendencias.')
  }

  return (
    <>
      <div className="sticky top-0 z-30 mb-4 space-y-3 border-b border-slate-200/90 bg-slate-50/95 pb-3 pt-1 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/70">
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Sucursal
            <select
              value={farmaciaId}
              onChange={(e) => setFarmaciaId(e.target.value)}
              className="min-w-[10rem] rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Todas</option>
              {farmacias
                .filter((f) => f.activa)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Aseguradora
            <select
              value={aseguradora}
              onChange={(e) => setAseguradora(e.target.value)}
              className="min-w-[10rem] rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Todas</option>
              {opcionesAseguradora.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Comparación automática con un periodo anterior de la misma duración ({diasPeriodo} días).
          {farmaciaId ? (
            <>
              {' '}
              <span className="font-medium text-emerald-800 dark:text-emerald-300">
                · Sucursal: {farmacias.find((f) => f.id === farmaciaId)?.nombre}
              </span>
            </>
          ) : null}
          {aseguradora ? ` · Aseguradora: ${aseguradora}` : ''}
        </p>
      </div>

      <div id="reporte-global-pdf" className="space-y-6 overflow-visible rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 md:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reportes globales — FarmaRenovar</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generado el {new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}
          </p>
        </div>

        <section aria-label="Indicadores principales">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Sucursales activas"
              value={farmaciasVisibles.length}
              trend={trendSucNuevas}
              icon={Store}
              pie={`Nuevas en rango: ${sucursalesNuevas} · periodo ant.: ${sucursalesNuevasAnt}`}
            />
            <KpiCard
              label="Pacientes activos"
              value={pacientesFiltrados.length}
              trend={trendPacAltas}
              icon={Users}
              pie={`Altas en rango: ${pacientesAltas} · periodo ant.: ${pacientesAltasAnt}`}
            />
            <KpiCard
              label="Tratamientos activos"
              value={tratamientosFiltrados.length}
              trend={trendTratAltas}
              icon={Pill}
              pie={`Altas en rango: ${tratamientosAltas} · periodo ant.: ${tratamientosAltasAnt}`}
            />
            <KpiCard
              label="Renovaciones (rango)"
              value={renovacionesFiltradas.length}
              trend={trendRenov}
              icon={RefreshCw}
              pie={`Periodo anterior: ${renovacionesPeriodoAnterior.length}`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Renovaciones en el tiempo</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Según rango y filtros seleccionados</p>
          <div className="mt-3 h-[220px] w-full min-h-[200px]">
            {serieRenovacionesDiarias.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">Sin datos en el periodo</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieRenovacionesDiarias} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillReno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis width={36} tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [v, 'Renovaciones']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#fillReno)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Shield className="h-4 w-4 text-slate-500" aria-hidden />
              Pacientes por aseguradora
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">Orden descendente · % del total filtrado</p>
            <div className="mt-3 space-y-2.5">
              {pacientesPorAseguradora.length === 0 ? (
                <p className="text-sm text-slate-500">Sin datos</p>
              ) : (
                pacientesPorAseguradora.map(({ aseguradora, total }) => {
                  const pct = totalPacientes > 0 ? Math.round((100 * total) / totalPacientes) : 0
                  return (
                    <div key={aseguradora}>
                      <div className="mb-0.5 flex justify-between gap-2 text-xs">
                        <span className="truncate font-medium text-slate-700 dark:text-slate-200">{aseguradora}</span>
                        <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                          {total} <span className="text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500/70 dark:bg-indigo-400/60"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Building2 className="h-4 w-4 text-slate-500" aria-hidden />
              Top sucursales (pacientes)
            </h3>
            <div className="mt-3 space-y-2">
              {topSucursales.length === 0 ? (
                <p className="text-sm text-slate-500">Sin datos</p>
              ) : (
                topSucursales.map((item) => (
                  <div key={item.nombre}>
                    <div className="mb-0.5 flex justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.nombre}</span>
                      <span className="shrink-0 font-mono text-slate-600 dark:text-slate-300">{item.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500/60 dark:bg-emerald-400/50"
                        style={{ width: `${(item.total / maxSuc) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            {pacientesPorFarmacia.length > 5 ? (
              <button
                type="button"
                onClick={() => setVerTodasSucursales((v) => !v)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {verTodasSucursales ? (
                  <>
                    Ver solo top 5 <ChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden />
                  </>
                ) : (
                  <>
                    Ver todas ({pacientesPorFarmacia.length}) <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </>
                )}
              </button>
            ) : null}
          </section>
        </div>

        <section className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Indicadores de performance</h3>
          <p className="text-xs text-slate-500">Derivados del rango y filtros (tardía ≈ fecha renovación vs vencimiento actual del tratamiento)</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              <dt className="text-[10px] font-semibold uppercase text-slate-500">Pacientes renovados</dt>
              <dd className="text-lg font-bold text-slate-900 dark:text-white">{pctPacientesRenovados ?? '—'}%</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              <dt className="text-[10px] font-semibold uppercase text-slate-500">Renov. puntuales</dt>
              <dd className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{pctPuntuales ?? '—'}%</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              <dt className="text-[10px] font-semibold uppercase text-slate-500">Retrasos detectados</dt>
              <dd className="text-lg font-bold text-amber-800 dark:text-amber-300">{pctRetrasos ?? '—'}%</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
              <dt className="text-[10px] font-semibold uppercase text-slate-500">Promedio entre renov.</dt>
              <dd className="text-lg font-bold text-slate-900 dark:text-white">{promedioDiasRenov !== null ? `${promedioDiasRenov} d` : '—'}</dd>
            </div>
          </dl>
          {sucursalMasRetrasos ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              Sucursal con más retrasos en el rango: <strong>{sucursalMasRetrasos[0]}</strong> ({sucursalMasRetrasos[1]} casos)
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden />
            Insights automáticos
          </h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {insights.map((t, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-slate-50/90 px-3 py-2 dark:bg-slate-950/40">
                <span className="text-slate-400">📊</span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-950/30">
          <button
            type="button"
            onClick={() => setDetalleAseguradoraAbierto((o) => !o)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <span>Listado de pacientes por aseguradora (detalle)</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${detalleAseguradoraAbierto ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {detalleAseguradoraAbierto ? (
            <div className="mt-3 max-h-[min(50vh,24rem)] space-y-4 overflow-y-auto border-t border-slate-200/80 pt-3 dark:border-slate-700">
              {listaPorAseguradora.length === 0 ? (
                <p className="text-sm text-slate-500">Sin pacientes en el filtro actual.</p>
              ) : (
                listaPorAseguradora.map(({ aseguradora, nombres }) => (
                  <div key={aseguradora}>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {aseguradora}{' '}
                      <span className="font-normal text-slate-500">
                        ({nombres.length} {nombres.length === 1 ? 'paciente' : 'pacientes'})
                      </span>
                    </h4>
                    <ul className="mt-1 columns-2 gap-x-4 text-[11px] leading-snug text-slate-600 dark:text-slate-400 sm:columns-3">
                      {nombres.map((nombre, i) => (
                        <li key={`${aseguradora}-${i}`} className="break-inside-avoid py-0.5">
                          {nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}
