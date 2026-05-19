'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings,
  Shield,
  StickyNote,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { cn, edadDesdeFechaNacimiento, formatearFechaCorta, normalizarNombrePersona } from '@/lib/utils'
import type { ClasificacionAltaPaciente } from '@/types'
import AseguradoraSelect from '@/components/pacientes/AseguradoraSelect'
import ListaDesplegableAbajo from '@/components/pacientes/ListaDesplegableAbajo'
import ModalAlertaRiesgoEntrega from '@/components/pacientes/ModalAlertaRiesgoEntrega'
import {
  PROVINCIAS_CR,
  cantonesPorProvincia,
  distritosPorProvinciaCanton,
} from '@/lib/costa-rica/direccion-cr'
import { tieneDireccionCr } from '@/lib/costa-rica/paciente-direccion'
import {
  MIN_CARACTERES_ARREGLO_ENTREGA,
  coincidenciasRiesgoEntrega,
} from '@/lib/entrega/lugares-riesgo-entrega'
import {
  ZONA_RIESGO_CONTENEDOR,
  ZONA_RIESGO_DESCRIPCION,
  ZONA_RIESGO_ETIQUETA_CAMPO,
  ZONA_RIESGO_META,
  ZONA_RIESGO_TEXTAREA,
  ZONA_RIESGO_TITULO,
} from '@/lib/entrega/zona-riesgo-ui'
import { actualizarDatosPaciente, type PayloadActualizarDatosPaciente } from './actions'
import { LIMITES_CAMPOS } from '@/lib/limites-campos'

export type AccionesVistaFicha = {
  contactado?: React.ReactNode
  secundarias?: React.ReactNode
}

function inicialesPersona(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function AvatarPersona({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-bold tracking-tight text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
        className,
      )}
      aria-hidden
    >
      {inicialesPersona(nombre)}
    </div>
  )
}

function CeldaInfoGrid({
  icon: Icon,
  label,
  children,
  className,
  mono,
  destacarWarning,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
  className?: string
  mono?: boolean
  destacarWarning?: boolean
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <Icon className="h-3 w-3 shrink-0" aria-hidden />
        {label}
      </p>
      <p
        className={cn(
          'text-sm font-medium leading-snug text-slate-900 dark:text-slate-100',
          mono && 'font-mono text-[13px]',
          destacarWarning && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {children}
      </p>
    </div>
  )
}

function FilaDato({
  icon: Icon,
  label,
  children,
  className,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
  className?: string
  mono?: boolean
}) {
  return (
    <div className={cn('flex min-w-0 items-start gap-1.5 text-xs leading-snug sm:text-sm', className)}>
      {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden /> : null}
      <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={cn(
          'min-w-0 break-words text-slate-800 dark:text-slate-200',
          mono && 'font-mono text-[11px] sm:text-xs',
        )}
      >
        {children}
      </span>
    </div>
  )
}

export type TarjetaDatosPacienteInicial = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  empresa: string | null
  seguro_medico: string | null
  numero_poliza: string | null
  numero_certificado: string | null
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
  clasificacion_alta?: ClasificacionAltaPaciente | null
  fecha_nacimiento?: string | null
  encargado_nombre?: string | null
  encargado_documento?: string | null
  encargado_telefono?: string | null
  encargado_parentesco?: string | null
}

function BloqueEncargadoMenor({
  fechaNacimiento,
  encargadoNombre,
  encargadoDocumento,
  encargadoTelefono,
  encargadoParentesco,
}: {
  fechaNacimiento: string | null
  encargadoNombre: string | null
  encargadoDocumento: string | null
  encargadoTelefono: string | null
  encargadoParentesco: string | null
}) {
  const nacimientoLabel = fechaNacimiento?.trim()
    ? formatearFechaCorta(fechaNacimiento.trim())
    : '—'

  const nombreEnc = encargadoNombre?.trim() || '—'
  const parentesco = encargadoParentesco?.trim()

  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/35">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        Persona encargada
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <AvatarPersona nombre={nombreEnc} className="h-10 w-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{nombreEnc}</p>
            {parentesco ? (
              <span className="mt-0.5 inline-flex rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                {parentesco}
              </span>
            ) : null}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {nacimientoLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <CreditCard className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span className="font-mono text-[13px]">{encargadoDocumento?.trim() || '—'}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {encargadoTelefono?.trim() || '—'}
        </span>
      </div>
    </div>
  )
}

function FormularioEncargadoMenor({
  f,
  setF,
  inputClass,
}: {
  f: Pick<
    FormState,
    | 'fechaNacimiento'
    | 'encargadoNombre'
    | 'encargadoDocumento'
    | 'encargadoTelefono'
    | 'encargadoParentesco'
  >
  setF: React.Dispatch<React.SetStateAction<FormState>>
  inputClass: string
}) {
  return (
    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/75 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/40">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Menor de edad y persona encargada
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Nacimiento del menor <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            type="date"
            value={f.fechaNacimiento}
            onChange={(e) => setF((s) => ({ ...s, fechaNacimiento: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Nombre completo del encargado <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            value={f.encargadoNombre}
            maxLength={LIMITES_CAMPOS.nombreEncargado}
            onChange={(e) => setF((s) => ({ ...s, encargadoNombre: e.target.value }))}
            placeholder="Nombre y apellidos"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Documento de identidad <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            value={f.encargadoDocumento}
            maxLength={LIMITES_CAMPOS.documento}
            onChange={(e) => setF((s) => ({ ...s, encargadoDocumento: e.target.value }))}
            placeholder="Cédula u otro ID"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Teléfono / WhatsApp encargado <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            type="tel"
            value={f.encargadoTelefono}
            maxLength={LIMITES_CAMPOS.telefono}
            onChange={(e) => setF((s) => ({ ...s, encargadoTelefono: e.target.value }))}
            placeholder="88881234"
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Parentesco o relación con el menor <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            className={inputClass}
            value={f.encargadoParentesco}
            maxLength={LIMITES_CAMPOS.parentesco}
            onChange={(e) => setF((s) => ({ ...s, encargadoParentesco: e.target.value }))}
            placeholder="Ej: madre, padre, tutor legal"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  )
}

type EstadoGlobalTarjeta = {
  estado: 'critico' | 'seguimiento' | 'estable' | 'sin_activos'
  label: string
  desc: string
}

function EtiquetaMenorDeEdad() {
  return (
    <span
      role="status"
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
      Menor de edad
    </span>
  )
}

function BadgeEstadoPaciente({ estado, label }: { estado: EstadoGlobalTarjeta['estado']; label: string }) {
  const estilos =
    estado === 'critico'
      ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200'
      : estado === 'seguimiento'
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200'
        : estado === 'estable'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'

  const Icon =
    estado === 'critico'
      ? AlertTriangle
      : estado === 'seguimiento'
        ? Clock
        : estado === 'estable'
          ? CheckCircle2
          : HeartPulse

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        estilos,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  )
}

type FarmaciaOpcion = { id: string; nombre: string }

type FormState = {
  nombre: string
  telefono: string
  email: string
  empresa: string
  seguro_medico: string
  numero_poliza: string
  numero_certificado: string
  tipo_pago: '' | 'directo' | 'reembolso'
  farmacia_id: string
  modoDireccion: 'cr' | 'libre'
  provinciaCr: string
  cantonCr: string
  distritoCr: string
  direccionSenas: string
  direccionLibre: string
  arregloEntrega: string
  fechaNacimiento: string
  encargadoNombre: string
  encargadoDocumento: string
  encargadoTelefono: string
  encargadoParentesco: string
}

function nombreManualEnMayusculas(clasificacion?: ClasificacionAltaPaciente | null): boolean {
  return clasificacion === 'menor' || clasificacion === 'extranjero' || clasificacion === 'no_listado_cr'
}

function fieldsFromInicial(p: TarjetaDatosPacienteInicial): FormState {
  const nombre = p.nombre
  return {
    nombre: nombreManualEnMayusculas(p.clasificacion_alta) ? normalizarNombrePersona(nombre) : nombre,
    telefono: p.telefono ?? '',
    email: p.email ?? '',
    empresa: p.empresa ?? '',
    seguro_medico: p.seguro_medico ?? '',
    numero_poliza: p.numero_poliza ?? '',
    numero_certificado: p.numero_certificado ?? '',
    tipo_pago: (p.tipo_pago ?? '') as '' | 'directo' | 'reembolso',
    farmacia_id: p.farmacia_id,
    modoDireccion: p.usar_direccion_cr ? 'cr' : 'libre',
    provinciaCr: p.provincia_cr?.trim() || PROVINCIAS_CR[0],
    cantonCr: p.canton_cr?.trim() || '',
    distritoCr: p.distrito_cr?.trim() || '',
    direccionSenas: p.direccion_senas ?? '',
    direccionLibre: p.direccion?.trim() || '',
    arregloEntrega: p.arreglo_entrega?.trim() || '',
    fechaNacimiento: p.fecha_nacimiento?.trim().slice(0, 10) ?? '',
    encargadoNombre: p.encargado_nombre ? normalizarNombrePersona(p.encargado_nombre) : '',
    encargadoDocumento: p.encargado_documento ?? '',
    encargadoTelefono: p.encargado_telefono ?? '',
    encargadoParentesco: p.encargado_parentesco ?? '',
  }
}

function serializarInicial(p: TarjetaDatosPacienteInicial): string {
  return JSON.stringify({
    nombre: p.nombre,
    telefono: p.telefono,
    email: p.email,
    empresa: p.empresa,
    seguro_medico: p.seguro_medico,
    numero_poliza: p.numero_poliza,
    numero_certificado: p.numero_certificado,
    tipo_pago: p.tipo_pago,
    farmacia_id: p.farmacia_id,
    provincia_cr: p.provincia_cr,
    canton_cr: p.canton_cr,
    distrito_cr: p.distrito_cr,
    direccion_senas: p.direccion_senas,
    direccion: p.direccion,
    arreglo_entrega: p.arreglo_entrega,
    usar_direccion_cr: p.usar_direccion_cr,
    clasificacion_alta: p.clasificacion_alta,
    fecha_nacimiento: p.fecha_nacimiento,
    encargado_nombre: p.encargado_nombre,
    encargado_documento: p.encargado_documento,
    encargado_telefono: p.encargado_telefono,
    encargado_parentesco: p.encargado_parentesco,
  })
}

export default function TarjetaDatosPacienteEditable({
  pacienteId,
  inicial,
  farmacias,
  estadoGlobal,
  ultimoContactoLabel,
  accionesVista,
}: {
  pacienteId: string
  inicial: TarjetaDatosPacienteInicial
  farmacias: FarmaciaOpcion[]
  estadoGlobal: EstadoGlobalTarjeta
  ultimoContactoLabel: string
  accionesVista?: AccionesVistaFicha
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState<FormState>(() => fieldsFromInicial(inicial))
  const esMenorDeEdad = inicial.clasificacion_alta === 'menor'
  const nombreEnMayusculas = nombreManualEnMayusculas(inicial.clasificacion_alta)
  const [guardando, setGuardando] = useState(false)
  const [modalRiesgo, setModalRiesgo] = useState(false)

  const inicialRef = useRef(inicial)
  inicialRef.current = inicial
  const inicialKey = serializarInicial(inicial)

  useEffect(() => {
    if (editando) return
    setF(fieldsFromInicial(inicialRef.current))
  }, [inicialKey, editando])

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

  const farmaciaNombreVista =
    farmacias.find((x) => x.id === f.farmacia_id)?.nombre ?? inicial.farmacia_nombre ?? '—'

  const construirPayload = useCallback((): PayloadActualizarDatosPaciente => {
    return {
      nombre: nombreEnMayusculas ? normalizarNombrePersona(f.nombre) : f.nombre.trim(),
      telefono: f.telefono,
      email: f.email.trim() || null,
      empresa: f.empresa.trim() || null,
      seguro_medico: f.seguro_medico.trim() || null,
      numero_poliza: f.numero_poliza.trim() || null,
      numero_certificado: f.numero_certificado.trim() || null,
      tipo_pago: f.tipo_pago === 'directo' || f.tipo_pago === 'reembolso' ? f.tipo_pago : null,
      farmacia_id: f.farmacia_id,
      modo_direccion: f.modoDireccion,
      provincia_cr: f.modoDireccion === 'cr' ? f.provinciaCr : null,
      canton_cr: f.modoDireccion === 'cr' ? f.cantonCr : null,
      distrito_cr: f.modoDireccion === 'cr' ? f.distritoCr : null,
      direccion_senas: f.modoDireccion === 'cr' ? f.direccionSenas : null,
      direccion_libre: f.modoDireccion === 'libre' ? f.direccionLibre : null,
      arreglo_entrega: f.arregloEntrega.trim() || null,
      datos_menor: esMenorDeEdad
        ? {
            fecha_nacimiento: f.fechaNacimiento.trim(),
            encargado_nombre: normalizarNombrePersona(f.encargadoNombre),
            encargado_documento: f.encargadoDocumento.trim(),
            encargado_telefono: f.encargadoTelefono.trim(),
            encargado_parentesco: f.encargadoParentesco.trim(),
          }
        : null,
    }
  }, [f, esMenorDeEdad, nombreEnMayusculas])

  function validarMenor(): boolean {
    if (!esMenorDeEdad) return true
    if (!f.fechaNacimiento.trim()) {
      toast.error('Indica la fecha de nacimiento del menor.')
      return false
    }
    const edad = edadDesdeFechaNacimiento(f.fechaNacimiento)
    if (edad === null) {
      toast.error('La fecha de nacimiento no es válida.')
      return false
    }
    if (edad >= 18) {
      toast.error('La fecha no corresponde a un menor de edad.')
      return false
    }
    if (
      !f.encargadoNombre.trim() ||
      !f.encargadoDocumento.trim() ||
      !f.encargadoTelefono.trim() ||
      !f.encargadoParentesco.trim()
    ) {
      toast.error('Complete todos los datos de la persona encargada.')
      return false
    }
    return true
  }

  async function guardar() {
    if (!validarMenor()) return
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
          <AvatarPersona
            nombre={nombreEnMayusculas ? normalizarNombrePersona(f.nombre) : f.nombre}
            className="h-16 w-16 text-xl"
          />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
                Editar datos del paciente
              </h1>
              {esMenorDeEdad ? <EtiquetaMenorDeEdad /> : null}
              </div>
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

            {esMenorDeEdad ? (
              <FormularioEncargadoMenor f={f} setF={setF} inputClass={inputClass} />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nombre completo</label>
                <input
                  className={inputClass}
                  value={f.nombre}
                  maxLength={LIMITES_CAMPOS.nombrePersona}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      nombre: nombreEnMayusculas
                        ? normalizarNombrePersona(e.target.value)
                        : e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Teléfono / WhatsApp</label>
                <input className={inputClass} type="tel" value={f.telefono} maxLength={LIMITES_CAMPOS.telefono} onChange={(e) => setF((s) => ({ ...s, telefono: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email (opcional)</label>
                <input className={inputClass} type="email" value={f.email} maxLength={LIMITES_CAMPOS.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Seguro médico (opcional)</label>
                  <AseguradoraSelect
                    className={inputClass}
                    value={f.seguro_medico}
                    valorLegacy={inicial.seguro_medico}
                    onValueChange={(v) => setF((s) => ({ ...s, seguro_medico: v }))}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Número de póliza
                    </label>
                    <input
                      className={inputClass}
                      value={f.numero_poliza}
                      maxLength={LIMITES_CAMPOS.documento}
                      onChange={(e) => setF((s) => ({ ...s, numero_poliza: e.target.value }))}
                      placeholder="Según póliza del seguro"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Número de certificado
                    </label>
                    <input
                      className={inputClass}
                      value={f.numero_certificado}
                      maxLength={LIMITES_CAMPOS.documento}
                      onChange={(e) => setF((s) => ({ ...s, numero_certificado: e.target.value }))}
                      placeholder="Según certificado"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Empresa (opcional)</label>
                  <input className={inputClass} value={f.empresa} maxLength={LIMITES_CAMPOS.empresa} onChange={(e) => setF((s) => ({ ...s, empresa: e.target.value }))} />
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
                      maxLength={LIMITES_CAMPOS.direccion}
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
                    maxLength={LIMITES_CAMPOS.direccion}
                    onChange={(e) => setF((s) => ({ ...s, direccionLibre: e.target.value }))}
                    placeholder="Dirección completa"
                  />
                </div>
              )}

              {requiereArregloEntrega ? (
                <div className={ZONA_RIESGO_CONTENEDOR}>
                  <p className={ZONA_RIESGO_TITULO}>Zona de riesgo para entrega</p>
                  <p className={ZONA_RIESGO_DESCRIPCION}>Coincidencias: {coincidenciasRiesgo.join(', ')}.</p>
                  <label className={ZONA_RIESGO_ETIQUETA_CAMPO}>
                    Arreglo de entrega <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <textarea
                    className={ZONA_RIESGO_TEXTAREA}
                    rows={3}
                    value={f.arregloEntrega}
                    maxLength={LIMITES_CAMPOS.arregloEntrega}
                    onChange={(e) => setF((s) => ({ ...s, arregloEntrega: e.target.value }))}
                    placeholder="Acuerdo con el cliente (punto de entrega, horario, etc.)"
                  />
                  <p className={ZONA_RIESGO_META}>
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

  const lineaDireccion = tieneCrVista
    ? [f.provinciaCr, f.cantonCr, f.distritoCr].filter(Boolean).join(', ')
    : f.direccionLibre.trim()
  const senasLinea = f.modoDireccion === 'cr' ? f.direccionSenas.trim() : ''
  const nombreVista = nombreEnMayusculas ? normalizarNombrePersona(f.nombre) : f.nombre
  const sinRegistroContacto = ultimoContactoLabel.toLowerCase().includes('sin registro')
  const notasPie = [senasLinea, f.arregloEntrega.trim()].filter(Boolean).join(' · ')

  const btnEditar = (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Settings className="h-4 w-4 shrink-0" aria-hidden />
      Editar
    </button>
  )

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <AvatarPersona nombre={nombreVista} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
                {nombreVista}
              </h1>
              {esMenorDeEdad ? <EtiquetaMenorDeEdad /> : null}
              <BadgeEstadoPaciente estado={estadoGlobal.estado} label={estadoGlobal.label} />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
              {f.email.trim() ? (
                <a
                  href={`mailto:${f.email.trim()}`}
                  className="inline-flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  {f.email.trim()}
                </a>
              ) : null}
              {f.telefono.trim() ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  {f.telefono.trim()}
                </span>
              ) : null}
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {estadoGlobal.desc}
            </p>
          </div>
        </div>

        {accionesVista ? (
          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-auto">
            <div className="flex flex-wrap gap-2">
              {btnEditar}
              {accionesVista.contactado}
            </div>
            {accionesVista.secundarias ? (
              <div className="flex flex-wrap gap-2">{accionesVista.secundarias}</div>
            ) : null}
          </div>
        ) : (
          <div className="shrink-0">{btnEditar}</div>
        )}
      </div>

      {esMenorDeEdad ? (
        <BloqueEncargadoMenor
          fechaNacimiento={f.fechaNacimiento || null}
          encargadoNombre={f.encargadoNombre || null}
          encargadoDocumento={f.encargadoDocumento || null}
          encargadoTelefono={f.encargadoTelefono || null}
          encargadoParentesco={f.encargadoParentesco || null}
        />
      ) : null}

      <p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Información clínica y administrativa
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
        <CeldaInfoGrid icon={Building2} label="Sucursal">
          {farmaciaNombreVista}
        </CeldaInfoGrid>
        {f.empresa.trim() ? (
          <CeldaInfoGrid icon={Briefcase} label="Empresa">
            {f.empresa.trim()}
          </CeldaInfoGrid>
        ) : null}
        {f.seguro_medico.trim() ? (
          <CeldaInfoGrid icon={Shield} label="Seguro">
            {f.seguro_medico.trim()}
          </CeldaInfoGrid>
        ) : null}
        {f.numero_certificado.trim() ? (
          <CeldaInfoGrid icon={BadgeCheck} label="Certificado" mono>
            {f.numero_certificado.trim()}
          </CeldaInfoGrid>
        ) : null}
        {f.numero_poliza.trim() ? (
          <CeldaInfoGrid icon={FileText} label="Póliza" mono>
            {f.numero_poliza.trim()}
          </CeldaInfoGrid>
        ) : null}
        {lineaDireccion ? (
          <CeldaInfoGrid icon={MapPin} label="Dirección">
            {lineaDireccion}
          </CeldaInfoGrid>
        ) : null}
        {f.tipo_pago ? (
          <CeldaInfoGrid icon={Wallet} label="Pago">
            {f.tipo_pago === 'directo' ? 'Directo' : 'Reembolso'}
          </CeldaInfoGrid>
        ) : null}
        <CeldaInfoGrid icon={Clock} label="Últ. contacto" destacarWarning={sinRegistroContacto}>
          {ultimoContactoLabel}
        </CeldaInfoGrid>
      </div>

      {notasPie ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-500 dark:text-slate-400">Nota: </span>
            <span className="whitespace-pre-wrap">{notasPie}</span>
          </p>
        </div>
      ) : null}
    </div>
  )
}
