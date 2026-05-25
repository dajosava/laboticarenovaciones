import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  calcularDiasRestantes,
  cn,
  formatearFechaCorta,
  formatMontoFacturaCrc,
  formatoMedicamento,
} from '@/lib/utils'
import type { Renovacion, Tratamiento } from '@/types'
import Link from 'next/link'
import { differenceInDays, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, AlertTriangle, Calendar, CheckCircle2, Clock, Package, Stethoscope } from 'lucide-react'
import {
  BadgePrioridadTratamiento,
  BarraProgresoTratamiento,
  CeldaMetrica,
  clasesArticuloInternoFicha,
  clasesSeccionFicha,
  clasesSubtituloSeccionFicha,
  clasesTituloSeccionFicha,
  EncabezadoSeccionColapsable,
  FilaMetrica,
  PieSeccionFicha,
} from '@/components/pacientes/ficha-seccion'
import BotonContactadoRenovacion from '@/app/(app)/dashboard/BotonContactadoRenovacion'
import BotonEliminarPaciente from './BotonEliminarPaciente'
import NotasPacienteEditable from './NotasPacienteEditable'
import TarjetaDatosPacienteEditable from './TarjetaDatosPacienteEditable'
import { tieneDireccionCr } from '@/lib/costa-rica/paciente-direccion'

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

  const { data: farmaciasActivas } = await supabase
    .from('farmacias')
    .select('id, nombre')
    .eq('activa', true)
    .order('nombre')

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

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6 lg:px-8">
      {/* HEADER — control center */}
      <header className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md dark:border-slate-800 dark:bg-slate-900 md:p-5">
          <TarjetaDatosPacienteEditable
            pacienteId={id}
            inicial={{
              id: paciente.id,
              nombre: paciente.nombre,
              telefono: paciente.telefono,
              email: paciente.email,
              empresa: paciente.empresa,
              seguro_medico: paciente.seguro_medico,
              seguro_medico_secundario: paciente.seguro_medico_secundario ?? null,
              numero_poliza: paciente.numero_poliza ?? null,
              numero_certificado: paciente.numero_certificado ?? null,
              tipo_pago: paciente.tipo_pago,
              farmacia_id: paciente.farmacia_id,
              farmacia_nombre: paciente.farmacia?.nombre ?? null,
              provincia_cr: paciente.provincia_cr,
              canton_cr: paciente.canton_cr,
              distrito_cr: paciente.distrito_cr,
              direccion_senas: paciente.direccion_senas,
              direccion: paciente.direccion,
              arreglo_entrega: paciente.arreglo_entrega,
              usar_direccion_cr: tieneDireccionCr(paciente),
              clasificacion_alta: paciente.clasificacion_alta ?? null,
              fecha_nacimiento: paciente.fecha_nacimiento ?? null,
              encargado_nombre: paciente.encargado_nombre ?? null,
              encargado_documento: paciente.encargado_documento ?? null,
              encargado_telefono: paciente.encargado_telefono ?? null,
              encargado_parentesco: paciente.encargado_parentesco ?? null,
            }}
            farmacias={farmaciasActivas ?? []}
            estadoGlobal={{
              estado: global.estado,
              label: global.label,
              desc: global.desc,
            }}
            ultimoContactoLabel={ultimoContactoLabel}
            accionesVista={{
              contactado: peorTratamiento ? (
                <BotonContactadoRenovacion
                  tratamientoId={peorTratamiento.id}
                  contactado={!!peorTratamiento.contactado_renovacion_en}
                  variant="ficha"
                />
              ) : undefined,
              secundarias: (
                <>
                  <Link
                    href={`/pacientes/${id}/tratamiento/nuevo`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    + Tratamiento
                  </Link>
                  <BotonEliminarPaciente pacienteId={id} nombre={paciente.nombre} variant="ficha" />
                </>
              ),
            }}
          />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* IZQUIERDA: tratamientos + historial */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <section id="tratamientos-activos" className={clasesSeccionFicha}>
            <details className="group" open>
              <EncabezadoSeccionColapsable icon={Calendar} titulo="Tratamientos activos" />
              <div className="mt-4">
                {tratamientosActivos.length === 0 ? (
                  <PieSeccionFicha className="mt-0 border-amber-100 bg-amber-50/80 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    No hay tratamientos activos registrados.
                  </PieSeccionFicha>
                ) : (
                  <div className="space-y-4">
                    {tratamientosActivos.map((t: Tratamiento) => {
                      const dias = calcularDiasRestantes(t.fecha_vencimiento)
                      const riesgo = riesgoTratamiento(dias)
                      return (
                        <article key={t.id} className={clasesArticuloInternoFicha}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{formatoMedicamento(t)}</h3>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {t.dosis_diaria} / día · {t.tipo === 'cronico' ? 'Crónico' : 'Temporal'}
                              </p>
                            </div>
                            <BadgePrioridadTratamiento dias={dias} />
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            <CeldaMetrica icon={Package} label="Último despacho">
                              {formatearFechaCorta(t.fecha_surtido)}
                            </CeldaMetrica>
                            <CeldaMetrica icon={Calendar} label="Inicio de toma">
                              {formatearFechaCorta(t.fecha_inicio_tratamiento ?? t.fecha_surtido)}
                            </CeldaMetrica>
                            <CeldaMetrica icon={Clock} label="Vence" className="sm:col-span-2 md:col-span-1">
                              <span className="font-semibold">{textoVencimiento(dias)}</span>
                              <span className="font-normal text-slate-500 dark:text-slate-400">
                                {' '}
                                ({formatearFechaCorta(t.fecha_vencimiento)})
                              </span>
                            </CeldaMetrica>
                            <CeldaMetrica icon={Stethoscope} label="ID del médico" mono className="sm:col-span-2 md:col-span-3">
                              {t.medico_receta_id?.trim() || 'No registrado'}
                            </CeldaMetrica>
                          </div>

                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-slate-500 dark:text-slate-400">Necesidad de renovación:</span>{' '}
                            <span className={`font-bold ${riesgo.className}`}>{riesgo.label}</span>
                            {dias < 0 ? (
                              <span className="text-slate-500 dark:text-slate-400"> — sin renovación registrada tras vencimiento</span>
                            ) : null}
                          </p>

                          <BarraProgresoTratamiento dias={dias} />

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Link
                              href={`/pacientes/${id}/tratamiento/${t.id}/renovar`}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden />
                              Registrar renovación
                            </Link>
                            <BotonContactadoRenovacion
                              tratamientoId={t.id}
                              contactado={!!t.contactado_renovacion_en}
                              variant="ficha"
                            />
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </details>
          </section>

          <section id="historial-renovaciones" className={clasesSeccionFicha}>
            <details className="group">
              <EncabezadoSeccionColapsable
                icon={Clock}
                titulo="Ver historial de renovaciones"
                tituloClassName="text-black dark:text-white"
              />
              <div className="mt-4">
                {renovaciones.length === 0 ? (
                  <PieSeccionFicha className="mt-0 border-amber-100 bg-amber-50/80 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                    Sin renovaciones registradas aún.
                  </PieSeccionFicha>
                ) : (
                  <ol className="relative ms-2 border-l border-slate-200 ps-6 dark:border-slate-700">
                    {renovaciones.map((r: Renovacion) => {
                      const t = tratById.get(r.tratamiento_id)
                      const medicoRecetaId = t?.medico_receta_id?.trim()
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
                          <time className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {formatearFechaCorta(r.fecha)}
                            {(r.fecha_inicio_tratamiento ?? r.fecha) !== r.fecha ? (
                              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                                Inicio de toma: {formatearFechaCorta(r.fecha_inicio_tratamiento ?? r.fecha)}
                              </span>
                            ) : null}
                          </time>
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
                          <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            ID del médico:{' '}
                            <span className="font-mono">{medicoRecetaId || 'No registrado'}</span>
                          </p>
                          {r.hubo_regalia && r.unidades_regalia ? (
                            <p className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                              Regalía: +{r.unidades_regalia} unidad{r.unidades_regalia !== 1 ? 'es' : ''}
                            </p>
                          ) : null}
                          {r.numero_factura?.trim() ? (
                            <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                              Factura: <span className="font-mono">{r.numero_factura.trim()}</span>
                            </p>
                          ) : null}
                          {r.monto_total_factura != null && Number.isFinite(Number(r.monto_total_factura)) ? (
                            <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                              Monto total: {formatMontoFacturaCrc(Number(r.monto_total_factura))}
                            </p>
                          ) : null}
                          {r.notas ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{r.notas}</p> : null}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </details>
          </section>
        </div>

        {/* DERECHA: datos, notas, métricas */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <section id="bloque-notas" className={cn('scroll-mt-24', clasesSeccionFicha)}>
            <h2 className={clasesTituloSeccionFicha}>Notas clínicas</h2>
            <p className={cn('mt-2', clasesSubtituloSeccionFicha)}>
              Preferencias de contacto, alertas o contexto para el equipo.
            </p>
            <NotasPacienteEditable pacienteId={id} notasIniciales={paciente.notas} />
          </section>

          <section className={clasesSeccionFicha}>
            <h2 className={cn('flex items-center gap-2', clasesTituloSeccionFicha)}>
              <Activity className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
              Comportamiento (datos registrados)
            </h2>
            <ul className="mt-4 space-y-1">
              <FilaMetrica label="Renovaciones en historial" value={totalRenov} destacarWarning={totalRenov === 0} />
              {puntualidadPct !== null ? (
                <FilaMetrica
                  label="A tiempo (vs vencimiento actual del tratamiento)"
                  value={`${puntualidadPct}%`}
                />
              ) : null}
              <FilaMetrica
                label="Posibles retrasos detectados"
                value={renovacionesTardias}
                destacarWarning={renovacionesTardias > 0}
              />
              {promedioEntreRenovaciones ? (
                <FilaMetrica label="Tiempo medio entre renovaciones" value={`${promedioEntreRenovaciones} días`} />
              ) : null}
            </ul>
            <PieSeccionFicha>
              La puntualidad se aproxima comparando cada renovación con la fecha de vencimiento actual del tratamiento vinculado; si
              hubo ajustes de ciclo, revisa el detalle en el timeline.
            </PieSeccionFicha>
          </section>
        </div>
      </div>
    </div>
  )
}
