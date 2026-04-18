import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import {
  calcularDiasRestantes,
  calcularDiasRestantesEnReferencia,
  clasesColorBadgeKpiPanelRenovaciones,
  etiquetaPrioridadPanelPrincipal,
  ordenarTratamientosPorPrioridadPanel,
} from '@/lib/utils'
import type { Tratamiento } from '@/types'
import Link from 'next/link'
import { CalendarDays, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { differenceInDays, format, parseISO, startOfWeek, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import DashboardRenovacionesClient, { type DashboardRow } from './DashboardRenovacionesClient'

type FiltroVer = 'pendientes' | 'contactados' | 'todos'
type FiltroNivel = 'vencidos' | 'critico' | 'urgente' | 'planificacion'

const NIVELES: FiltroNivel[] = ['vencidos', 'critico', 'urgente', 'planificacion']

function parseFiltrosNivel(f: string | string[] | undefined): Set<FiltroNivel> {
  if (!f) return new Set()
  const arr = Array.isArray(f) ? f : [f]
  return new Set(arr.filter((x): x is FiltroNivel => NIVELES.includes(x as FiltroNivel)))
}

function buildUrlFiltros(ver: FiltroVer, filtros: Set<FiltroNivel>, toggle?: FiltroNivel): string {
  let next = new Set(filtros)
  if (toggle) {
    if (next.has(toggle)) next.delete(toggle)
    else next.add(toggle)
  }
  const verQ = ver !== 'pendientes' ? `ver=${ver}` : ''
  const fQ = [...next].length ? [...next].map((n) => `f=${n}`).join('&') : ''
  const q = [verQ, fQ].filter(Boolean).join('&')
  return `/dashboard${q ? `?${q}` : ''}`
}

function getBadgeUrgencia(dias: number): { className: string; label: string } {
  return {
    className: clasesColorBadgeKpiPanelRenovaciones(dias),
    label: etiquetaPrioridadPanelPrincipal(dias),
  }
}

function MiniSparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 52
  const h = 20
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - 2 - ((v - min) / range) * (h - 4)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className={cn('shrink-0 text-current opacity-70', className)} aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

function sparkFromVencidos(vencidos: Tratamiento[], hoy: Date): number[] {
  return [6, 5, 4, 3, 2, 1, 0].map((i) => {
    const cutoff = format(subDays(hoy, i), 'yyyy-MM-dd')
    return vencidos.filter((t) => t.fecha_vencimiento < cutoff).length
  })
}

function topSucursalFromVencidos(vencidos: Tratamiento[]): { nombre: string; count: number } | null {
  const map = new Map<string, number>()
  for (const t of vencidos) {
    const name = (t.paciente as { farmacia?: { nombre?: string | null } | null } | undefined)?.farmacia?.nombre ?? 'Sin sucursal'
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  let best: { nombre: string; count: number } | null = null
  for (const [nombre, count] of map) {
    if (!best || count > best.count) best = { nombre, count }
  }
  return best
}

function mapToDashboardRows(list: Tratamiento[]): DashboardRow[] {
  return list.map((t) => {
    const dias = calcularDiasRestantes(t.fecha_vencimiento)
    const badge = getBadgeUrgencia(dias)
    const paciente = t.paciente as
      | { nombre?: string; telefono?: string; farmacia_id?: string; farmacia?: { nombre?: string | null } | null }
      | undefined
    return {
      id: t.id,
      paciente_id: t.paciente_id,
      paciente_nombre: paciente?.nombre ?? '—',
      telefono: paciente?.telefono ?? null,
      medicamento: t.medicamento,
      marca: t.marca,
      concentracion: t.concentracion,
      fecha_vencimiento: t.fecha_vencimiento,
      contactado: !!t.contactado_renovacion_en,
      dias,
      badgeClass: badge.className,
      badgeLabel: badge.label,
      farmacia_id: paciente?.farmacia_id ?? null,
      farmacia_nombre: paciente?.farmacia?.nombre ?? null,
    }
  })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; f?: string | string[] }>
}) {
  const { ver: verParam, f: fParam } = await searchParams
  const ver: FiltroVer = verParam === 'contactados' || verParam === 'todos' ? verParam : 'pendientes'
  const activeFiltrosNivel = parseFiltrosNivel(fParam)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: empleado } = await supabase
    .from('empleados')
    .select('*, farmacia:farmacias(*)')
    .eq('id', user!.id)
    .single()

  const cookieStore = await cookies()
  const filtroFarmaciaId = cookieStore.get('farmarenovar-filtro-farmacia')?.value ?? null

  let nombreFiltroSucursal: string | null = null
  if (empleado?.rol === 'super_admin' && filtroFarmaciaId) {
    const { data: farm } = await supabase.from('farmacias').select('nombre').eq('id', filtroFarmaciaId).maybeSingle()
    nombreFiltroSucursal = farm?.nombre ?? null
  }

  const hoy = new Date()
  const ayer = subDays(hoy, 1)
  const hoyStr = format(hoy, 'yyyy-MM-dd')
  const ayerStr = format(ayer, 'yyyy-MM-dd')
  const en15Dias = subDays(hoy, -15)
  const en15DiasStr = format(en15Dias, 'yyyy-MM-dd')
  const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 })
  const inicioSemanaStr = format(inicioSemana, 'yyyy-MM-dd')
  const hace30 = format(subDays(hoy, 30), 'yyyy-MM-dd')

  const selectTrat = '*, paciente:pacientes(nombre, telefono, farmacia_id, farmacia:farmacias(nombre))'

  const queryVencidos = () =>
    supabase.from('tratamientos').select(selectTrat).eq('activo', true).lt('fecha_vencimiento', hoyStr).order('fecha_vencimiento', { ascending: true })

  const baseTratamientosQuery = () =>
    supabase
      .from('tratamientos')
      .select(selectTrat)
      .eq('activo', true)
      .lte('fecha_vencimiento', en15DiasStr)
      .gte('fecha_vencimiento', hoyStr)
      .order('fecha_vencimiento', { ascending: true })

  let tratamientosPendientes: Tratamiento[] | null = null
  let tratamientosParaLista: Tratamiento[] | null = null
  let tratamientosVencidos: Tratamiento[] | null = null

  if (ver === 'pendientes') {
    const [resVencidos, resPendientes] = await Promise.all([queryVencidos(), baseTratamientosQuery().is('contactado_renovacion_en', null)])
    tratamientosPendientes = resPendientes.data ?? null
    tratamientosParaLista = tratamientosPendientes
    tratamientosVencidos = resVencidos.data ?? null
  } else if (ver === 'contactados') {
    const [resVencidos, resPendientes, resContactados] = await Promise.all([
      queryVencidos(),
      baseTratamientosQuery().is('contactado_renovacion_en', null),
      baseTratamientosQuery().not('contactado_renovacion_en', 'is', null),
    ])
    tratamientosPendientes = resPendientes.data ?? null
    tratamientosParaLista = resContactados.data ?? null
    tratamientosVencidos = resVencidos.data ?? null
  } else {
    const [resVencidos, resFuturos] = await Promise.all([queryVencidos(), baseTratamientosQuery()])
    const data = resFuturos.data ?? null
    tratamientosPendientes = data?.filter((t: Tratamiento) => !t.contactado_renovacion_en) ?? null
    tratamientosParaLista = data ?? null
    tratamientosVencidos = resVencidos.data ?? null
  }

  const scope = (list: Tratamiento[]) => {
    if (empleado?.rol !== 'super_admin') {
      return list.filter(
        (t: Tratamiento) => (t.paciente as { farmacia_id?: string })?.farmacia_id === empleado?.farmacia_id,
      )
    }
    if (filtroFarmaciaId) {
      return list.filter((t: Tratamiento) => (t.paciente as { farmacia_id?: string })?.farmacia_id === filtroFarmaciaId)
    }
    return list
  }

  const tratamientosFiltrados = scope(tratamientosParaLista ?? [])
  const pendientes = scope(tratamientosPendientes ?? [])
  const vencidos = scope(tratamientosVencidos ?? [])

  /** Vencidos que entran en la tabla según la pestaña: pendientes sin contacto, contactados con contacto, todos todos. */
  const vencidosParaLista: Tratamiento[] =
    ver === 'pendientes'
      ? vencidos.filter((t) => !t.contactado_renovacion_en)
      : ver === 'contactados'
        ? vencidos.filter((t) => !!t.contactado_renovacion_en)
        : vencidos

  const maxDiasVencido =
    vencidos.length > 0 ? Math.max(...vencidos.map((t: Tratamiento) => -calcularDiasRestantes(t.fecha_vencimiento))) : 0

  const criticos = pendientes.filter((t: Tratamiento) => calcularDiasRestantes(t.fecha_vencimiento) <= 1)
  const urgentes = pendientes.filter((t: Tratamiento) => {
    const d = calcularDiasRestantes(t.fecha_vencimiento)
    return d >= 2 && d <= 5
  })
  const proximos = pendientes.filter((t: Tratamiento) => {
    const d = calcularDiasRestantes(t.fecha_vencimiento)
    return d >= 6 && d <= 15
  })

  const criticosAyer = pendientes.filter((t) => calcularDiasRestantesEnReferencia(t.fecha_vencimiento, ayer) <= 1)
  const urgentesAyer = pendientes.filter((t) => {
    const d = calcularDiasRestantesEnReferencia(t.fecha_vencimiento, ayer)
    return d >= 2 && d <= 5
  })
  const proximosAyer = pendientes.filter((t) => {
    const d = calcularDiasRestantesEnReferencia(t.fecha_vencimiento, ayer)
    return d >= 6 && d <= 15
  })
  const vencidosAyerCount = vencidos.filter((t) => t.fecha_vencimiento < ayerStr).length

  const delta = (today: number, yest: number) => today - yest

  const listaCompletaParaFiltro: Tratamiento[] =
    activeFiltrosNivel.size > 0 ? [...vencidosParaLista, ...tratamientosFiltrados] : tratamientosFiltrados
  /** Pendientes: vencidos sin contactar + ventana sin contactar; contactados: vencidos contactados + ventana contactada; todos: todo. */
  const listaBaseTabla: Tratamiento[] = [...vencidosParaLista, ...tratamientosFiltrados]

  const listToShowRaw: Tratamiento[] =
    activeFiltrosNivel.size === 0
      ? listaBaseTabla
      : listaCompletaParaFiltro.filter((t: Tratamiento) => {
          const d = calcularDiasRestantes(t.fecha_vencimiento)
          if (d < 0 && activeFiltrosNivel.has('vencidos')) return true
          if (d >= 0 && d <= 1 && activeFiltrosNivel.has('critico')) return true
          if (d >= 2 && d <= 5 && activeFiltrosNivel.has('urgente')) return true
          if (d >= 6 && d <= 15 && activeFiltrosNivel.has('planificacion')) return true
          return false
        })

  const listToShow = ordenarTratamientosPorPrioridadPanel(listToShowRaw)

  const avgDiasVencido =
    vencidos.length > 0
      ? Math.round(vencidos.reduce((s, t) => s + Math.max(0, -calcularDiasRestantes(t.fecha_vencimiento)), 0) / vencidos.length)
      : 0

  const topSuc = topSucursalFromVencidos(vencidos)
  const sparkVenc = sparkFromVencidos(vencidos, hoy)

  let qPacientes = supabase.from('pacientes').select('id', { count: 'exact', head: true }).eq('activo', true)
  if (empleado?.rol !== 'super_admin') {
    qPacientes = qPacientes.eq('farmacia_id', empleado!.farmacia_id)
  } else if (filtroFarmaciaId) {
    qPacientes = qPacientes.eq('farmacia_id', filtroFarmaciaId)
  }
  let qRenovSem = supabase.from('renovaciones').select('id', { count: 'exact', head: true }).gte('fecha', inicioSemanaStr)
  if (empleado?.rol !== 'super_admin') {
    qRenovSem = qRenovSem.eq('farmacia_id', empleado!.farmacia_id)
  } else if (filtroFarmaciaId) {
    qRenovSem = qRenovSem.eq('farmacia_id', filtroFarmaciaId)
  }

  const ventanaResumen = scope((await baseTratamientosQuery()).data ?? [])
  const pctContactadosVentana = ventanaResumen.length
    ? Math.round((100 * ventanaResumen.filter((t) => !!t.contactado_renovacion_en).length) / ventanaResumen.length)
    : 0

  let qContactadosRecientes = supabase
    .from('tratamientos')
    .select('fecha_vencimiento, contactado_renovacion_en, paciente:pacientes(farmacia_id)')
    .not('contactado_renovacion_en', 'is', null)
    .gte('contactado_renovacion_en', `${hace30}T00:00:00`)
  const { data: rowsContacto } = await qContactadosRecientes
  const rowsContactoScoped = scope((rowsContacto as Tratamiento[]) ?? [])
  const tiemposContacto = rowsContactoScoped
    .map((t) => {
      if (!t.contactado_renovacion_en) return null
      return differenceInDays(parseISO(t.contactado_renovacion_en), parseISO(t.fecha_vencimiento))
    })
    .filter((n): n is number => n !== null)
  const avgDiasRenovacionContacto =
    tiemposContacto.length > 0 ? (tiemposContacto.reduce((a, b) => a + b, 0) / tiemposContacto.length).toFixed(1) : '—'

  const [{ count: totalPacientes }, { count: renovSemana }] = await Promise.all([qPacientes, qRenovSem])

  const rowsClient = mapToDashboardRows(listToShow)

  function KpiCard({
    href,
    active,
    title,
    value,
    delta,
    sub,
    hint,
    tone,
    spark,
    extra,
  }: {
    href: string
    active: boolean
    title: string
    value: number
    delta: number
    sub: string
    hint: string
    tone: 'red' | 'orange' | 'yellow' | 'teal'
    spark: number[]
    extra?: string | null
  }) {
    const toneMap = {
      red: {
        bar: 'border-b-red-500',
        focus: 'focus:ring-red-400',
        active:
          'bg-red-100 dark:bg-red-900/50 border-2 border-red-400 dark:border-red-600 ring-2 ring-red-300 dark:ring-red-700',
        idle: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40',
        label: 'text-red-600 dark:text-red-300',
        value: 'text-red-600 dark:text-red-300',
        sub: 'text-red-700 dark:text-red-300',
        hint: 'text-red-500 dark:text-red-400',
        trend: 'text-red-700 dark:text-red-300',
        spark: 'text-red-500 dark:text-red-400',
        extra: 'text-red-700 dark:text-red-300',
      },
      orange: {
        bar: 'border-b-orange-500',
        focus: 'focus:ring-orange-400',
        active:
          'bg-orange-100 dark:bg-orange-900/50 border-2 border-orange-400 dark:border-orange-600 ring-2 ring-orange-300 dark:ring-orange-700',
        idle: 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40',
        label: 'text-orange-600 dark:text-orange-300',
        value: 'text-orange-600 dark:text-orange-300',
        sub: 'text-orange-700 dark:text-orange-300',
        hint: 'text-orange-500 dark:text-orange-400',
        trend: 'text-orange-700 dark:text-orange-300',
        spark: 'text-orange-500 dark:text-orange-400',
        extra: 'text-orange-700 dark:text-orange-300',
      },
      yellow: {
        bar: 'border-b-yellow-500',
        focus: 'focus:ring-yellow-400',
        active:
          'bg-yellow-100 dark:bg-yellow-900/50 border-2 border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-300 dark:ring-yellow-700',
        idle: 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
        label: 'text-yellow-600 dark:text-yellow-300',
        value: 'text-yellow-600 dark:text-yellow-300',
        sub: 'text-yellow-700 dark:text-yellow-300',
        hint: 'text-yellow-500 dark:text-yellow-400',
        trend: 'text-yellow-700 dark:text-yellow-300',
        spark: 'text-yellow-500 dark:text-yellow-400',
        extra: 'text-yellow-700 dark:text-yellow-300',
      },
      teal: {
        bar: 'border-b-teal-500',
        focus: 'focus:ring-teal-400',
        active:
          'bg-teal-100 dark:bg-teal-900/50 border-2 border-teal-400 dark:border-teal-600 ring-2 ring-teal-300 dark:ring-teal-700',
        idle: 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40',
        label: 'text-teal-600 dark:text-teal-300',
        value: 'text-teal-600 dark:text-teal-300',
        sub: 'text-teal-700 dark:text-teal-300',
        hint: 'text-teal-500 dark:text-teal-400',
        trend: 'text-teal-700 dark:text-teal-300',
        spark: 'text-teal-500 dark:text-teal-400',
        extra: 'text-teal-700 dark:text-teal-300',
      },
    }
    const T = toneMap[tone]
    const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : null
    const trendLabel =
      delta === 0 ? 'sin cambio vs ayer' : `${delta > 0 ? '+' : ''}${delta} vs ayer`

    return (
      <Link
        href={href}
        className={cn(
          'group relative block overflow-hidden rounded-2xl border-b-4 p-5 shadow-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2',
          T.bar,
          T.focus,
          active ? T.active : T.idle,
        )}
      >
        <div className="relative flex items-start justify-between gap-2">
          <div>
            <p className={cn('text-sm font-medium uppercase tracking-wide', T.label)}>{title}</p>
            <p className={cn('mt-1 text-5xl font-bold tabular-nums tracking-tight', T.value)}>{value}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className={cn('inline-flex items-center gap-0.5 font-medium', T.trend)}>
                {TrendIcon ? <TrendIcon className="h-4 w-4" aria-hidden /> : null}
                {trendLabel}
              </span>
            </div>
            <p className={cn('mt-1 text-sm font-medium', T.sub)}>{sub}</p>
            <p className={cn('mt-0.5 text-sm', T.hint)}>{hint}</p>
            {extra ? <p className={cn('mt-1 text-sm font-medium', T.extra)}>{extra}</p> : null}
          </div>
          <MiniSparkline values={spark} className={T.spark} />
        </div>
      </Link>
    )
  }

  const sparkCrit = [6, 5, 4, 3, 2, 1, 0].map((i) => {
    const ref = subDays(hoy, i)
    return pendientes.filter((t) => calcularDiasRestantesEnReferencia(t.fecha_vencimiento, ref) <= 1).length
  })
  const sparkUrg = [6, 5, 4, 3, 2, 1, 0].map((i) => {
    const ref = subDays(hoy, i)
    return pendientes.filter((t) => {
      const d = calcularDiasRestantesEnReferencia(t.fecha_vencimiento, ref)
      return d >= 2 && d <= 5
    }).length
  })
  const sparkProx = [6, 5, 4, 3, 2, 1, 0].map((i) => {
    const ref = subDays(hoy, i)
    return pendientes.filter((t) => {
      const d = calcularDiasRestantesEnReferencia(t.fecha_vencimiento, ref)
      return d >= 6 && d <= 15
    }).length
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {/* Resumen del sistema */}
      <section className="mb-6 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-white p-5 shadow-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">Resumen del sistema (hoy)</h2>
        </div>
        {nombreFiltroSucursal ? (
          <p className="mb-4 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Vista filtrada por sucursal: {nombreFiltroSucursal} (KPIs, resumen y tabla de renovaciones).
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pacientes activos</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{totalPacientes ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Renovaciones esta semana</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{renovSemana ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">% contactados (ventana 15 días)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-700 dark:text-brand-400">{pctContactadosVentana}%</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tiempo medio contacto vs vencimiento</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {avgDiasRenovacionContacto === '—' ? '—' : `${avgDiasRenovacionContacto} días`}
            </p>
          </div>
        </div>
      </section>

      {/* KPIs compactos */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          href={buildUrlFiltros(ver, activeFiltrosNivel, 'vencidos')}
          active={activeFiltrosNivel.has('vencidos')}
          title="Vencidos"
          value={vencidos.length}
          delta={delta(vencidos.length, vencidosAyerCount)}
          sub={vencidos.length === 0 ? 'Sin vencidos en cartera' : maxDiasVencido <= 1 ? '1 día máx. vencido' : `Hasta ${maxDiasVencido} días vencidos`}
          hint={avgDiasVencido ? `${avgDiasVencido} días promedio vencido` : 'Sin promedio'}
          tone="red"
          spark={sparkVenc}
          extra={topSuc ? `Sucursal: ${topSuc.nombre} (${topSuc.count})` : null}
        />
        <KpiCard
          href={buildUrlFiltros(ver, activeFiltrosNivel, 'critico')}
          active={activeFiltrosNivel.has('critico')}
          title="Crítico"
          value={criticos.length}
          delta={delta(criticos.length, criticosAyer.length)}
          sub="Vencen hoy / mañana"
          hint="Atención inmediata"
          tone="orange"
          spark={sparkCrit}
        />
        <KpiCard
          href={buildUrlFiltros(ver, activeFiltrosNivel, 'urgente')}
          active={activeFiltrosNivel.has('urgente')}
          title="Urgente"
          value={urgentes.length}
          delta={delta(urgentes.length, urgentesAyer.length)}
          sub="Próximos 5 días"
          hint="Seguimiento semanal"
          tone="yellow"
          spark={sparkUrg}
        />
        <KpiCard
          href={buildUrlFiltros(ver, activeFiltrosNivel, 'planificacion')}
          active={activeFiltrosNivel.has('planificacion')}
          title="Planificación"
          value={proximos.length}
          delta={delta(proximos.length, proximosAyer.length)}
          sub="Día 6–15"
          hint="Agenda y preventivo"
          tone="teal"
          spark={sparkProx}
        />
      </div>

      {/* Tabla operativa */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80 md:px-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Renovaciones</h2>
          <div className="flex flex-wrap items-center gap-2">
            {activeFiltrosNivel.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500">KPI:</span>
                {(['vencidos', 'critico', 'urgente', 'planificacion'] as const).map((nivel) =>
                  activeFiltrosNivel.has(nivel) ? (
                    <Link
                      key={nivel}
                      href={buildUrlFiltros(ver, activeFiltrosNivel, nivel)}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    >
                      {nivel === 'vencidos' && 'Vencidos'}
                      {nivel === 'critico' && 'Crítico'}
                      {nivel === 'urgente' && 'Urgente'}
                      {nivel === 'planificacion' && 'Planificación'}
                      <span aria-hidden>×</span>
                    </Link>
                  ) : null,
                )}
              </div>
            )}
            <span className="text-xs text-slate-500">Vista:</span>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
              <Link
                href={buildUrlFiltros('pendientes', activeFiltrosNivel)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                  ver === 'pendientes' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900',
                )}
              >
                No contactados
              </Link>
              <Link
                href={buildUrlFiltros('contactados', activeFiltrosNivel)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                  ver === 'contactados' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900',
                )}
              >
                Contactados
              </Link>
              <Link
                href={buildUrlFiltros('todos', activeFiltrosNivel)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                  ver === 'todos' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900',
                )}
              >
                Todos
              </Link>
            </div>
            <Link href="/pacientes" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400 sm:text-sm">
              Pacientes →
            </Link>
          </div>
        </div>

        {listToShow.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-40" aria-hidden />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              {activeFiltrosNivel.size > 0
                ? 'Ningún tratamiento coincide con los filtros'
                : ver === 'pendientes'
                  ? 'Todo al día'
                  : ver === 'contactados'
                    ? 'Ningún contactado'
                    : 'Sin tratamientos en ventana'}
            </p>
            <p className="mt-1 text-sm">
              {activeFiltrosNivel.size > 0
                ? 'Ajusta los filtros KPI o la vista.'
                : ver === 'pendientes' && 'No hay renovaciones pendientes en los próximos 15 días.'}
            </p>
          </div>
        ) : (
          <DashboardRenovacionesClient
            rows={rowsClient}
            showFarmaciaFilter={empleado?.rol === 'super_admin' && !filtroFarmaciaId}
          />
        )}
      </section>
    </div>
  )
}
