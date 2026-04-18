import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  calcularDiasRestantes,
  clasesColorBadgeKpiPanelRenovaciones,
  cn,
  formatearFechaCorta,
  formatoMedicamento,
} from '@/lib/utils'
import type { Renovacion, Tratamiento } from '@/types'
import Link from 'next/link'
import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react'
import BotonContactadoRenovacion from '@/app/(app)/dashboard/BotonContactadoRenovacion'
import BotonEliminarPaciente from './BotonEliminarPaciente'
import NotasPacienteEditable from './NotasPacienteEditable'

type EstadoPaciente = 'critico' | 'seguimiento' | 'estable' | 'sin_activos'

function estadoPacienteGlobal(diasWorst: number | null): { estado: EstadoPaciente; label: string; desc: string; barClass: string } {
  if (diasWorst === null) {
    return {
      estado: 'sin_activos',
      label: 'Sin tratamientos activos',
      desc: 'Registra un tratamiento para seguimiento de renovaciones.',
      barClass: 'bg-slate-400',
    }
  }
  if (diasWorst <= 1) {
    return {
      estado: 'critico',
      label: 'Crítico',
      desc: diasWorst < 0 ? 'Hay vencimientos atrasados o vencen hoy.' : 'Vence en 1 día o menos.',
      barClass: 'bg-red-500',
    }
  }
  if (diasWorst <= 5) {
    return {
      estado: 'seguimiento',
      label: 'Seguimiento',
      desc: 'Renovación en ventana de 2 a 5 días.',
      barClass: 'bg-amber-400',
    }
  }
  return {
    estado: 'estable',
    label: 'Estable',
    desc: 'Próximos vencimientos fuera de ventana urgente.',
    barClass: 'bg-emerald-500',
  }
}

function textoVencimiento(dias: number): string {
  if (dias < 0) return `${-dias} día(s) vencido(s)`
  if (dias === 0) return 'HOY'
  if (dias === 1) return 'MAÑANA'
  return `En ${dias} días`
}

function riesgoTratamiento(dias: number): { label: string; className: string } {
  if (dias < 0) return { label: 'CRÍTICO (vencido)', className: 'text-red-700 dark:text-red-300' }
  if (dias <= 1) return { label: 'ALTO', className: 'text-red-600 dark:text-red-400' }
  if (dias <= 5) return { label: 'MEDIO', className: 'text-amber-700 dark:text-amber-300' }
  return { label: 'BAJO', className: 'text-emerald-700 dark:text-emerald-300' }
}

export default async function FichaPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*, farmacia:farmacias(*)')
    .eq('id', id)
    .single()

  if (!paciente) notFound()

  const { data: tratamientos } = await supabase
    .from('tratamientos')
    .select('*')
    .eq('paciente_id', id)
    .order('creado_en', { ascending: false })

  const tratamientosLista = (tratamientos ?? []) as Tratamiento[]
  const tratamientoIds = tratamientosLista.map((t) => t.id)
  let renovaciones: Renovacion[] = []
  if (tratamientoIds.length > 0) {
    const { data } = await supabase
      .from('renovaciones')
      .select('*, farmacia:farmacias(nombre), empleado:empleados(nombre)')
      .in('tratamiento_id', tratamientoIds)
      .order('fecha', { ascending: false })
      .limit(40)
    renovaciones = data ?? []
  }

  const tratamientosActivos = tratamientosLista.filter((t) => t.activo)
  const tratById = new Map(tratamientosLista.map((t) => [t.id, t]))

  const diasLista = tratamientosActivos.map((t) => calcularDiasRestantes(t.fecha_vencimiento))
  const diasWorst = diasLista.length ? Math.min(...diasLista) : null
  const global = estadoPacienteGlobal(diasWorst)

  const contactos = tratamientosActivos
    .map((t) => t.contactado_renovacion_en)
    .filter((x): x is string => !!x)
    .sort()
  const ultimoContactoIso = contactos.length ? contactos[contactos.length - 1] : null
  const ultimoContactoLabel = ultimoContactoIso
    ? formatDistanceToNow(parseISO(ultimoContactoIso), { addSuffix: true, locale: es })
    : 'Sin registro de contacto'

  const ordenRenovacion = [...renovaciones].sort((a, b) => a.fecha.localeCompare(b.fecha))
  let promedioEntreRenovaciones: string | null = null
  if (ordenRenovacion.length >= 2) {
    const gaps: number[] = []
    for (let i = 1; i < ordenRenovacion.length; i++) {
      gaps.push(differenceInDays(parseISO(ordenRenovacion[i].fecha), parseISO(ordenRenovacion[i - 1].fecha)))
    }
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
    promedioEntreRenovaciones = avg.toFixed(1)
  }

  let renovacionesTardias = 0
  for (const r of renovaciones) {
    const t = tratById.get(r.tratamiento_id)
    if (!t) continue
    if (differenceInDays(parseISO(r.fecha), parseISO(t.fecha_vencimiento)) > 0) renovacionesTardias++
  }

  const totalRenov = renovaciones.length
  const puntualidadPct =
    totalRenov > 0 ? Math.round(((totalRenov - renovacionesTardias) / totalRenov) * 100) : null

  const tratOrdenUrgencia = [...tratamientosActivos].sort(
    (a, b) => calcularDiasRestantes(a.fecha_vencimiento) - calcularDiasRestantes(b.fecha_vencimiento),
  )
  const peorTratamiento = tratOrdenUrgencia[0]
  const hrefRenovarUrgente = peorTratamiento ? `/pacientes/${id}/tratamiento/${peorTratamiento.id}/renovar` : null

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6 lg:px-8">
      {/* HEADER — control center */}
      <header className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-md">
              {paciente.nombre.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">{paciente.nombre}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                  <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ID {paciente.id.slice(0, 8)}…
                </span>
                {paciente.email ? (
                  <a href={`mailto:${paciente.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {paciente.email}
                  </a>
                ) : null}
                {paciente.telefono ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {paciente.telefono}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    global.estado === 'critico'
                      ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
                      : global.estado === 'seguimiento'
                        ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                        : global.estado === 'estable'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <HeartPulse className="h-3.5 w-3.5" aria-hidden />
                  Estado: {global.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{global.desc}</span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <p className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-500 dark:text-slate-400">Sucursal:</span>
                  {paciente.farmacia?.nombre ?? '—'}
                </p>
                {paciente.seguro_medico ? (
                  <p className="inline-flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="font-medium text-slate-500 dark:text-slate-400">Seguro:</span>
                    {paciente.seguro_medico}
                  </p>
                ) : null}
                <p className="inline-flex items-center gap-2 sm:col-span-2">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-500 dark:text-slate-400">Último contacto (renovación):</span>
                  {ultimoContactoLabel}
                </p>
              </div>

              {(paciente.direccion || paciente.empresa || paciente.tipo_pago) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  {paciente.direccion ? (
                    <span className="inline-flex max-w-full items-start gap-1.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      {paciente.direccion}
                    </span>
                  ) : null}
                  {paciente.empresa ? <span>Empresa: {paciente.empresa}</span> : null}
                  {paciente.tipo_pago ? (
                    <span>{paciente.tipo_pago === 'directo' ? 'Pago directo' : 'Reembolso'}</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-col">
            {hrefRenovarUrgente ? (
              <Link
                href={hrefRenovarUrgente}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500"
              >
                Renovar
              </Link>
            ) : null}
            {peorTratamiento ? (
              <div className="flex w-full justify-center sm:w-auto sm:justify-start">
                <BotonContactadoRenovacion
                  tratamientoId={peorTratamiento.id}
                  contactado={!!peorTratamiento.contactado_renovacion_en}
                />
              </div>
            ) : null}
            <Link
              href={`/pacientes/${id}/tratamiento/nuevo`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              + Tratamiento
            </Link>
            <div className="flex justify-end sm:ml-auto lg:ml-0">
              <BotonEliminarPaciente pacienteId={id} nombre={paciente.nombre} />
            </div>
          </div>
        </div>
      </header>

      {/* STATUS BAR */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Estado actual del tratamiento en relación a su renovación
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{global.desc}</p>
        </div>
        <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-800">
          <div
            className={`h-full transition-all ${global.barClass}`}
            style={{
              width:
                global.estado === 'sin_activos'
                  ? '8%'
                  : global.estado === 'critico'
                    ? '100%'
                    : global.estado === 'seguimiento'
                      ? '66%'
                      : '33%',
            }}
          />
        </div>
        <div className="flex justify-between px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:px-5">
          <span className={global.estado === 'estable' ? 'text-emerald-700 dark:text-emerald-400' : ''}>Estable</span>
          <span className={global.estado === 'seguimiento' ? 'text-amber-700 dark:text-amber-400' : ''}>Seguimiento</span>
          <span className={global.estado === 'critico' ? 'text-red-600 dark:text-red-400' : ''}>Crítico</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* IZQUIERDA: tratamientos + historial */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <section id="tratamientos-activos" className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tratamientos activos</h2>
            </div>
            {tratamientosActivos.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay tratamientos activos registrados.</p>
            ) : (
              <div className="space-y-4">
                {tratamientosActivos.map((t: Tratamiento) => {
                  const dias = calcularDiasRestantes(t.fecha_vencimiento)
                  const riesgo = riesgoTratamiento(dias)
                  const porcentaje = Math.max(0, Math.min(100, (dias / 30) * 100))
                  return (
                    <article
                      key={t.id}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/40 md:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{formatoMedicamento(t)}</h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {t.dosis_diaria} / día · {t.tipo === 'cronico' ? 'Crónico' : 'Temporal'}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'self-start rounded-full border px-2.5 py-1 text-xs font-semibold',
                            clasesColorBadgeKpiPanelRenovaciones(dias),
                          )}
                        >
                          {dias < 0 ? 'Vencido' : dias <= 1 ? 'Crítico' : dias <= 5 ? 'Urgente' : dias <= 15 ? 'Planificación' : 'Al día'}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-500 dark:text-slate-400">Último surtido:</span>{' '}
                          {formatearFechaCorta(t.fecha_surtido)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-500 dark:text-slate-400">Vence:</span>{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{textoVencimiento(dias)}</span>
                          <span className="text-slate-400"> ({formatearFechaCorta(t.fecha_vencimiento)})</span>
                        </p>
                      </div>

                      <p className="mt-2 text-sm">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Necesidad de renovación:</span>{' '}
                        <span className={`font-bold ${riesgo.className}`}>{riesgo.label}</span>
                        {dias < 0 ? <span className="text-slate-500"> — sin renovación registrada tras vencimiento</span> : null}
                      </p>

                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            dias <= 1 ? 'bg-red-500' : dias <= 5 ? 'bg-amber-500' : dias <= 15 ? 'bg-yellow-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/pacientes/${id}/tratamiento/${t.id}/renovar`}
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Registrar renovación
                        </Link>
                        <a
                          href="#historial-renovaciones"
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Ver historial
                        </a>
                        <BotonContactadoRenovacion tratamientoId={t.id} contactado={!!t.contactado_renovacion_en} />
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section id="historial-renovaciones" className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Clock className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial de renovaciones</h2>
            </div>
            {renovaciones.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sin renovaciones registradas aún.</p>
            ) : (
              <ol className="relative ms-2 border-l border-slate-200 ps-6 dark:border-slate-700">
                {renovaciones.map((r: Renovacion) => {
                  const t = tratById.get(r.tratamiento_id)
                  const diasDiff = t ? differenceInDays(parseISO(r.fecha), parseISO(t.fecha_vencimiento)) : 0
                  const tardia = diasDiff > 0
                  return (
                    <li key={r.id} className="mb-8 ms-2 last:mb-2">
                      <span
                        className={`absolute -start-1.5 mt-1.5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow dark:border-slate-900 ${
                          tardia ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {tardia ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                      </span>
                      <time className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{formatearFechaCorta(r.fecha)}</time>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {tardia ? 'Renovación tardía' : 'Renovación realizada'}
                        {tardia && diasDiff > 0 ? (
                          <span className="ml-1 text-amber-700 dark:text-amber-300">(+{diasDiff} día{diasDiff !== 1 ? 's' : ''} vs vencimiento vigente del tratamiento)</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {r.farmacia?.nombre ?? 'Sucursal'} · {r.empleado?.nombre ?? '—'}
                        {t ? ` · ${formatoMedicamento(t)}` : ''}
                      </p>
                      {r.hubo_regalia && r.unidades_regalia ? (
                        <p className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                          Regalía: +{r.unidades_regalia} unidad{r.unidades_regalia !== 1 ? 'es' : ''}
                        </p>
                      ) : null}
                      {r.notas ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{r.notas}</p> : null}
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        {/* DERECHA: datos, notas, métricas */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <section id="bloque-notas" className="scroll-mt-24 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notas clínicas</h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Preferencias de contacto, alertas o contexto para el equipo.</p>
            <NotasPacienteEditable pacienteId={id} notasIniciales={paciente.notas} />
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4" aria-hidden />
              Comportamiento (datos registrados)
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Renovaciones en historial</span>
                <span className="font-semibold">{totalRenov}</span>
              </li>
              {puntualidadPct !== null ? (
                <li className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">A tiempo (vs vencimiento actual del tratamiento)</span>
                  <span className="font-semibold">{puntualidadPct}%</span>
                </li>
              ) : null}
              <li className="flex justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Posibles retrasos detectados</span>
                <span className="font-semibold">{renovacionesTardias}</span>
              </li>
              {promedioEntreRenovaciones ? (
                <li className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Tiempo medio entre renovaciones</span>
                  <span className="font-semibold">{promedioEntreRenovaciones} días</span>
                </li>
              ) : null}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              La puntualidad se aproxima comparando cada renovación con la fecha de vencimiento actual del tratamiento vinculado; si hubo
              ajustes de ciclo, revisa el detalle en el timeline.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
