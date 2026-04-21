'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  Clock,
  HeartPulse,
  Mail,
  MapPin,
  Package,
  PencilLine,
  Phone,
  Shield,
  User,
  Wallet,
} from 'lucide-react'
import ListaDesplegableAbajo from '@/components/pacientes/ListaDesplegableAbajo'
import ModalAlertaRiesgoEntrega from '@/components/pacientes/ModalAlertaRiesgoEntrega'
import {
  PROVINCIAS_CR,
  cantonesPorProvincia,
  distritosPorProvinciaCanton,
} from '@/lib/costa-rica/direccion-cr'
import { tieneDireccionCr, textoDireccionParaFicha } from '@/lib/costa-rica/paciente-direccion'
import {
  MIN_CARACTERES_ARREGLO_ENTREGA,
  coincidenciasRiesgoEntrega,
} from '@/lib/entrega/lugares-riesgo-entrega'
import { actualizarDatosPaciente, type PayloadActualizarDatosPaciente } from './actions'

const SEGUROS_MEDICOS = [
  'INS',
  'Pan American Life Insurance',
  'ASSA',
  'BMI',
  'MAPFRE',
  'Mediprocesos',
  'Koris Insurance',
  'Best Doctors Insurance',
  'Adisa',
]

export type TarjetaDatosPacienteInicial = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  empresa: string | null
  seguro_medico: string | null
  tipo_pago: 'directo' | 'reembolso' | null
  farmacia_id: string
  farmacia_nombre: string | null
  provincia_cr: string | null
  canton_cr: string | null
  distrito_cr: string | null
  direccion_senas: string | null
  direccion: string | null
  arreglo_entrega: string | null
  usar_direccion_cr: boolean
}

type EstadoGlobalTarjeta = {
  estado: 'critico' | 'seguimiento' | 'estable' | 'sin_activos'
  label: string
  desc: string
}

type FarmaciaOpcion = { id: string; nombre: string }

type FormState = {
  nombre: string
  telefono: string
  email: string
  empresa: string
  seguro_medico: string
  tipo_pago: '' | 'directo' | 'reembolso'
  farmacia_id: string
  modoDireccion: 'cr' | 'libre'
  provinciaCr: string
  cantonCr: string
  distritoCr: string
  direccionSenas: string
  direccionLibre: string
  arregloEntrega: string
}

function fieldsFromInicial(p: TarjetaDatosPacienteInicial): FormState {
  return {
    nombre: p.nombre,
    telefono: p.telefono ?? '',
    email: p.email ?? '',
    empresa: p.empresa ?? '',
    seguro_medico: p.seguro_medico ?? '',
    tipo_pago: (p.tipo_pago ?? '') as '' | 'directo' | 'reembolso',
    farmacia_id: p.farmacia_id,
    modoDireccion: p.usar_direccion_cr ? 'cr' : 'libre',
    provinciaCr: p.provincia_cr?.trim() || PROVINCIAS_CR[0],
    cantonCr: p.canton_cr?.trim() || '',
    distritoCr: p.distrito_cr?.trim() || '',
    direccionSenas: p.direccion_senas ?? '',
    direccionLibre: p.direccion?.trim() || '',
    arregloEntrega: p.arreglo_entrega?.trim() || '',
  }
}

function serializarInicial(p: TarjetaDatosPacienteInicial): string {
  return JSON.stringify({
    nombre: p.nombre,
    telefono: p.telefono,
    email: p.email,
    empresa: p.empresa,
    seguro_medico: p.seguro_medico,
    tipo_pago: p.tipo_pago,
    farmacia_id: p.farmacia_id,
    provincia_cr: p.provincia_cr,
    canton_cr: p.canton_cr,
    distrito_cr: p.distrito_cr,
    direccion_senas: p.direccion_senas,
    direccion: p.direccion,
    arreglo_entrega: p.arreglo_entrega,
    usar_direccion_cr: p.usar_direccion_cr,
  })
}

export default function TarjetaDatosPacienteEditable({
  pacienteId,
  inicial,
  farmacias,
  estadoGlobal,
  ultimoContactoLabel,
}: {
  pacienteId: string
  inicial: TarjetaDatosPacienteInicial
  farmacias: FarmaciaOpcion[]
  estadoGlobal: EstadoGlobalTarjeta
  ultimoContactoLabel: string
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState<FormState>(() => fieldsFromInicial(inicial))
  const [guardando, setGuardando] = useState(false)
  const [modalRiesgo, setModalRiesgo] = useState(false)

  const inicialKey = useMemo(() => serializarInicial(inicial), [inicial])

  const opcionesSeguro = useMemo(() => {
    const extra = inicial.seguro_medico?.trim()
    if (extra && !SEGUROS_MEDICOS.includes(extra)) return [...SEGUROS_MEDICOS, extra]
    return SEGUROS_MEDICOS
  }, [inicial.seguro_medico])

  useEffect(() => {
    if (editando) return
    setF(fieldsFromInicial(inicial))
  }, [inicialKey, editando, inicial])

  const coincidenciasRiesgo = useMemo(
    () =>
      f.modoDireccion === 'cr'
        ? coincidenciasRiesgoEntrega({
            canton: f.cantonCr,
            distrito: f.distritoCr,
            senas: f.direccionSenas,
          })
        : coincidenciasRiesgoEntrega({ canton: '', distrito: '', senas: f.direccionLibre }),
    [f.modoDireccion, f.cantonCr, f.distritoCr, f.direccionSenas, f.direccionLibre],
  )
  const requiereArregloEntrega = coincidenciasRiesgo.length > 0

  const camposDirFicha = useMemo(
    () =>
      f.modoDireccion === 'cr'
        ? {
            provincia_cr: f.provinciaCr,
            canton_cr: f.cantonCr,
            distrito_cr: f.distritoCr,
            direccion_senas: f.direccionSenas,
            direccion: null as string | null,
          }
        : {
            provincia_cr: null as string | null,
            canton_cr: null as string | null,
            distrito_cr: null as string | null,
            direccion_senas: null as string | null,
            direccion: f.direccionLibre || null,
          },
    [f.modoDireccion, f.provinciaCr, f.cantonCr, f.distritoCr, f.direccionSenas, f.direccionLibre],
  )

  const tieneCrVista = f.modoDireccion === 'cr' && tieneDireccionCr(camposDirFicha)
  const textoDirFicha = textoDireccionParaFicha(camposDirFicha)

  const farmaciaNombreVista =
    farmacias.find((x) => x.id === f.farmacia_id)?.nombre ?? inicial.farmacia_nombre ?? '—'

  const construirPayload = useCallback((): PayloadActualizarDatosPaciente => {
    return {
      nombre: f.nombre,
      telefono: f.telefono,
      email: f.email.trim() || null,
      empresa: f.empresa.trim() || null,
      seguro_medico: f.seguro_medico.trim() || null,
      tipo_pago: f.tipo_pago === 'directo' || f.tipo_pago === 'reembolso' ? f.tipo_pago : null,
      farmacia_id: f.farmacia_id,
      modo_direccion: f.modoDireccion,
      provincia_cr: f.modoDireccion === 'cr' ? f.provinciaCr : null,
      canton_cr: f.modoDireccion === 'cr' ? f.cantonCr : null,
      distrito_cr: f.modoDireccion === 'cr' ? f.distritoCr : null,
      direccion_senas: f.modoDireccion === 'cr' ? f.direccionSenas : null,
      direccion_libre: f.modoDireccion === 'libre' ? f.direccionLibre : null,
      arreglo_entrega: f.arregloEntrega.trim() || null,
    }
  }, [f])

  async function guardar() {
    if (requiereArregloEntrega && f.arregloEntrega.trim().length < MIN_CARACTERES_ARREGLO_ENTREGA) {
      setModalRiesgo(true)
      toast.error(
        `Documente el arreglo de entrega (mínimo ${MIN_CARACTERES_ARREGLO_ENTREGA} caracteres) para esta dirección.`,
      )
      return
    }

    setGuardando(true)
    const result = await actualizarDatosPaciente(pacienteId, construirPayload())
    setGuardando(false)
    if (result.error) {
      if (result.error.includes('riesgo')) setModalRiesgo(true)
      toast.error(result.error)
      return
    }
    toast.success('Datos del paciente actualizados')
    setEditando(false)
    router.refresh()
  }

  function cancelar() {
    setF(fieldsFromInicial(inicial))
    setEditando(false)
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100'

  if (editando) {
    return (
      <>
        <ModalAlertaRiesgoEntrega open={modalRiesgo} onOpenChange={setModalRiesgo} coincidencias={coincidenciasRiesgo} />
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-md">
            {(f.nombre.trim().charAt(0) || '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
                Editar datos del paciente
              </h1>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={guardando}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={guardando}
                  className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-500">ID {inicial.id.slice(0, 8)}…</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nombre completo</label>
                <input className={inputClass} value={f.nombre} onChange={(e) => setF((s) => ({ ...s, nombre: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Teléfono / WhatsApp</label>
                <input className={inputClass} type="tel" value={f.telefono} onChange={(e) => setF((s) => ({ ...s, telefono: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email (opcional)</label>
                <input className={inputClass} type="email" value={f.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Seguro médico (opcional)</label>
                  <select
                    className={inputClass}
                    value={f.seguro_medico}
                    onChange={(e) => setF((s) => ({ ...s, seguro_medico: e.target.value }))}
                  >
                    <option value="">Seleccionar…</option>
                    {opcionesSeguro.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Empresa (opcional)</label>
                  <input className={inputClass} value={f.empresa} onChange={(e) => setF((s) => ({ ...s, empresa: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Tipo de pago</label>
                  <select
                    className={inputClass}
                    value={f.tipo_pago}
                    onChange={(e) => setF((s) => ({ ...s, tipo_pago: e.target.value as FormState['tipo_pago'] }))}
                  >
                    <option value="">Seleccionar…</option>
                    <option value="directo">Pago directo</option>
                    <option value="reembolso">Reembolso</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Farmacia asignada</label>
                <select
                  className={inputClass}
                  value={f.farmacia_id}
                  onChange={(e) => setF((s) => ({ ...s, farmacia_id: e.target.value }))}
                >
                  <option value="">Seleccionar…</option>
                  {farmacias.map((fa) => (
                    <option key={fa.id} value={fa.id}>
                      {fa.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dirección</p>
              <div className="mb-3 flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="modo-dir"
                    checked={f.modoDireccion === 'cr'}
                    onChange={() => setF((s) => ({ ...s, modoDireccion: 'cr' }))}
                  />
                  Provincia, cantón y distrito (lista)
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="modo-dir"
                    checked={f.modoDireccion === 'libre'}
                    onChange={() => setF((s) => ({ ...s, modoDireccion: 'libre' }))}
                  />
                  Texto libre
                </label>
              </div>

              {f.modoDireccion === 'cr' ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Provincia</label>
                      <ListaDesplegableAbajo
                        permitirVacio={false}
                        value={f.provinciaCr}
                        onValueChange={(v) => setF((s) => ({ ...s, provinciaCr: v, cantonCr: '', distritoCr: '' }))}
                        opciones={PROVINCIAS_CR.map((p) => ({ value: p, label: p }))}
                        placeholder={PROVINCIAS_CR[0]}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Cantón</label>
                      <ListaDesplegableAbajo
                        value={f.cantonCr}
                        onValueChange={(c) => setF((s) => ({ ...s, cantonCr: c, distritoCr: '' }))}
                        opciones={cantonesPorProvincia(f.provinciaCr).map((c) => ({ value: c, label: c }))}
                        placeholder="Seleccionar cantón…"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Distrito</label>
                      <ListaDesplegableAbajo
                        value={f.distritoCr}
                        onValueChange={(d) => setF((s) => ({ ...s, distritoCr: d }))}
                        opciones={distritosPorProvinciaCanton(f.provinciaCr, f.cantonCr).map((d) => ({
                          value: d,
                          label: d,
                        }))}
                        placeholder={f.cantonCr ? 'Seleccionar distrito…' : 'Primero elija cantón'}
                        disabled={!f.cantonCr}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Señas / detalle (opcional)</label>
                    <input
                      className={inputClass}
                      value={f.direccionSenas}
                      onChange={(e) => setF((s) => ({ ...s, direccionSenas: e.target.value }))}
                      placeholder="Referencias para llegar"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Dirección (texto libre)</label>
                  <textarea
                    className={`${inputClass} min-h-[88px]`}
                    value={f.direccionLibre}
                    onChange={(e) => setF((s) => ({ ...s, direccionLibre: e.target.value }))}
                    placeholder="Dirección completa"
                  />
                </div>
              )}

              {requiereArregloEntrega ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Zona de riesgo para entrega</p>
                  <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-100/90">Coincidencias: {coincidenciasRiesgo.join(', ')}.</p>
                  <label className="mt-3 block text-xs font-medium text-slate-800 dark:text-slate-200">
                    Arreglo de entrega <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    className={`${inputClass} mt-1 border-amber-300 dark:border-amber-800`}
                    rows={3}
                    value={f.arregloEntrega}
                    onChange={(e) => setF((s) => ({ ...s, arregloEntrega: e.target.value }))}
                    placeholder="Acuerdo con el cliente (punto de entrega, horario, etc.)"
                  />
                  <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
                    Mínimo {MIN_CARACTERES_ARREGLO_ENTREGA} caracteres.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </>
    )
  }

  const mostrarBloqueExtra =
    tieneCrVista ||
    (f.modoDireccion === 'libre' && f.direccionLibre.trim()) ||
    f.arregloEntrega.trim()

  return (
    <div className="flex min-w-0 flex-1 gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-md">
        {(f.nombre.trim().charAt(0) || '?').toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">{f.nombre}</h1>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PencilLine className="h-4 w-4" aria-hidden />
            Editar datos
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ID {inicial.id.slice(0, 8)}…
          </span>
          {f.email.trim() ? (
            <a
              href={`mailto:${f.email.trim()}`}
              className="inline-flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {f.email.trim()}
            </a>
          ) : null}
          {f.telefono.trim() ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {f.telefono.trim()}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              estadoGlobal.estado === 'critico'
                ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
                : estadoGlobal.estado === 'seguimiento'
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                  : estadoGlobal.estado === 'estable'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5" aria-hidden />
            Estado: {estadoGlobal.label}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{estadoGlobal.desc}</span>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <p className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="font-medium text-slate-500 dark:text-slate-400">Sucursal:</span>
            {farmaciaNombreVista}
          </p>
          {f.seguro_medico.trim() || f.empresa.trim() || f.tipo_pago ? (
            <div className="flex min-w-0 flex-col gap-2">
              {f.seguro_medico.trim() ? (
                <p className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-500 dark:text-slate-400">Seguro:</span>
                  {f.seguro_medico.trim()}
                </p>
              ) : null}
              {f.empresa.trim() ? (
                <p className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-500 dark:text-slate-400">Empresa:</span>
                  <span className="min-w-0 break-words">{f.empresa.trim()}</span>
                </p>
              ) : null}
              {f.tipo_pago ? (
                <p className="inline-flex items-center gap-2">
                  <Wallet className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-500 dark:text-slate-400">Tipo de pago:</span>
                  {f.tipo_pago === 'directo' ? 'Pago directo' : 'Reembolso'}
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="inline-flex items-center gap-2 sm:col-span-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="font-medium text-slate-500 dark:text-slate-400">Último contacto (renovación):</span>
            {ultimoContactoLabel}
          </p>
        </div>

        {mostrarBloqueExtra ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            {textoDirFicha ? (
              <span className="inline-flex max-w-full flex-col items-start gap-1">
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {tieneCrVista ? (
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-700 dark:text-slate-300">Provincia, cantón y distrito</span>
                      <span className="block text-slate-600 dark:text-slate-400">
                        {f.provinciaCr}, {f.cantonCr}, {f.distritoCr}
                      </span>
                      {f.direccionSenas.trim() ? (
                        <span className="mt-1 block text-slate-500 dark:text-slate-400">Señas: {f.direccionSenas.trim()}</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="min-w-0 whitespace-pre-wrap">{f.direccionLibre.trim()}</span>
                  )}
                </span>
              </span>
            ) : null}
            {f.arregloEntrega.trim() ? (
              <span className="inline-flex max-w-full flex-col gap-0.5 sm:col-span-2">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Package className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <span className="font-medium">Arreglo de entrega</span>
                </span>
                <span className="max-w-full pl-5 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {f.arregloEntrega.trim()}
                </span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
