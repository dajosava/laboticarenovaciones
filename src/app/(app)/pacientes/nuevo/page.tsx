'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseBrowser } from '@/lib/supabase/use-supabase-browser'
import { calcularFechaVencimiento, normalizarNombrePersona, parseMontoFacturaInput } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import type { Farmacia } from '@/types'
import MedicamentoCombobox from '@/components/medicamentos/MedicamentoCombobox'
import { textoMedicamentoParaReceta } from '@/lib/medicamentos-import'
import { PROVINCIAS_CR, cantonesPorProvincia, distritosPorProvinciaCanton } from '@/lib/costa-rica/direccion-cr'
import ListaDesplegableAbajo from '@/components/pacientes/ListaDesplegableAbajo'
import EmpresaCombobox from '@/components/pacientes/EmpresaCombobox'
import ModalAlertaRiesgoEntrega from '@/components/pacientes/ModalAlertaRiesgoEntrega'
import { MIN_CARACTERES_ARREGLO_ENTREGA, coincidenciasRiesgoEntrega } from '@/lib/entrega/lugares-riesgo-entrega'
import {
  ZONA_RIESGO_CONTENEDOR,
  ZONA_RIESGO_DESCRIPCION,
  ZONA_RIESGO_TEXTAREA,
  ZONA_RIESGO_TITULO,
} from '@/lib/entrega/zona-riesgo-ui'

const PADRON_API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_PADRON || ''
const PADRON_API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PADRON || ''
const SEGUROS_MEDICOS = ['INS','Pan American Life Insurance','ASSA','BMI','MAPFRE','Mediprocesos','Koris Insurance','Best Doctors Insurance','Adisa']
const INPUT_CLS =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-500/80'
/** Cuadrícula de secciones del formulario: 1 col móvil, 2 en tablet, 3 en escritorio ancho. */
const FORM_SECTION_GRID = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
/** Ocupa todo el ancho de la cuadrícula en md/xl. */
const FORM_SPAN_FULL = 'md:col-span-2 xl:col-span-3'
/** Contenedor desplegable cuando el tipo de alta está activo (mismo acento verde que el radio seleccionado). */
const FORM_BLOQUE_CLASIFICACION_ACTIVA =
  'rounded-xl border-2 border-green-600 bg-green-50/90 p-4 shadow-sm ring-1 ring-green-600/15 dark:border-emerald-500 dark:bg-emerald-950/60 dark:shadow-emerald-950/40 dark:ring-1 dark:ring-emerald-500/25'
const FORM_BLOQUE_CLASIFICACION_TITULO =
  'mb-3 border-b border-green-200 pb-2 text-sm font-semibold text-gray-900 dark:border-emerald-800/60 dark:text-emerald-50'
const hoyIso = new Date().toISOString().split('T')[0]

type TratamientoAltaForm = {
  medicamentoId: string
  medicamento: string
  marca: string
  concentracion: string
  dosis_diaria: string
  unidades_caja: string
  fecha_surtido: string
  fecha_inicio: string
  tipo: string
  notas: string
  numero_factura: string
  monto_total_factura: string
  medico_receta_id: string
}

type TratamientoAltaFila = TratamientoAltaForm & { _key: string }

function createEmptyTratamientoFila(): TratamientoAltaFila {
  const base: TratamientoAltaForm = {
    medicamentoId: '',
    medicamento: '',
    marca: '',
    concentracion: '',
    dosis_diaria: '',
    unidades_caja: '',
    fecha_surtido: hoyIso,
    fecha_inicio: '',
    tipo: 'cronico',
    notas: '',
    numero_factura: '',
    monto_total_factura: '',
    medico_receta_id: '',
  }
  return {
    ...base,
    _key:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }
}

function fechaVencimientoDesdeTrat(trat: TratamientoAltaForm): string | null {
  if (!trat.dosis_diaria || !trat.unidades_caja || !trat.fecha_inicio) return null
  return calcularFechaVencimiento(trat.fecha_inicio, Number(trat.unidades_caja), Number(trat.dosis_diaria))
}

interface PersonaResponse { cedula: number; nombre_completo: string }

type ClasificacionAlta = 'padron_nacional' | 'no_listado_cr' | 'menor' | 'extranjero'

function nombreManualEnMayusculas(clasificacion: ClasificacionAlta): boolean {
  return clasificacion === 'menor' || clasificacion === 'extranjero' || clasificacion === 'no_listado_cr'
}

function edadDesdeFechaNacimiento(isoDate: string): number | null {
  if (!isoDate) return null
  const birth = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const Field = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
      {label} {required && <span className="text-red-600 dark:text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{hint}</p>}
  </div>
)

export default function NuevoPacientePage() {
  const router = useRouter()
  const supabase = useSupabaseBrowser()

  const [farmacias, setFarmacias] = useState<Farmacia[]>([])
  const [loading, setLoading] = useState(false)
  const [cedula, setCedula] = useState('')
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [modalRiesgoAbierto, setModalRiesgoAbierto] = useState(false)
  const [clasificacion, setClasificacion] = useState<ClasificacionAlta>('padron_nacional')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [pasaporteDoc, setPasaporteDoc] = useState('')
  const [dimexDoc, setDimexDoc] = useState('')
  const [encargadoNombre, setEncargadoNombre] = useState('')
  const [encargadoDocumento, setEncargadoDocumento] = useState('')
  const [encargadoTelefono, setEncargadoTelefono] = useState('')
  const [encargadoParentesco, setEncargadoParentesco] = useState('')
  const [tieneMedismart, setTieneMedismart] = useState(false)
  const [pacienteSinSeguro, setPacienteSinSeguro] = useState(false)

  const [paciente, setPaciente] = useState({
    nombre: '', telefono: '', email: '', farmacia_id: '',
    notas: '', empresa: '', seguro_medico: '',
    tipo_pago: '' as '' | 'directo' | 'reembolso',
    numero_poliza: '', numero_certificado: '',
  })

  const [dir, setDir] = useState<{
    provincia: string
    canton: string
    distrito: string
    senas: string
    arreglo: string
  }>({
    provincia: PROVINCIAS_CR[0], canton: '', distrito: '', senas: '', arreglo: '',
  })

  const [tratamientos, setTratamientos] = useState<TratamientoAltaFila[]>(() => [createEmptyTratamientoFila()])

  const setPac = (k: keyof typeof paciente, v: string) => setPaciente(p => ({ ...p, [k]: v }))
  const setDirField = (k: keyof typeof dir, v: string) => setDir(d => ({ ...d, [k]: v }))
  const setTratField = (index: number, k: keyof TratamientoAltaForm, v: string) =>
    setTratamientos((rows) => rows.map((row, i) => (i === index ? { ...row, [k]: v } : row)))

  const agregarTratamiento = () => setTratamientos((rows) => [...rows, createEmptyTratamientoFila()])
  const quitarTratamiento = (index: number) =>
    setTratamientos((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)))

  const coincidencias = useMemo(
    () => coincidenciasRiesgoEntrega({ canton: dir.canton, distrito: dir.distrito, senas: dir.senas }),
    [dir.canton, dir.distrito, dir.senas],
  )
  const zonaRiesgo = coincidencias.length > 0

  useEffect(() => {
    let activo = true
    async function cargar() {
      const { data } = await supabase.from('farmacias').select('*').eq('activa', true).order('nombre')
      if (!activo) return
      if (data) setFarmacias(data)
      const { data: { user } } = await supabase.auth.getUser()
      if (!activo || !user) return
      const { data: emp } = await supabase.from('empleados').select('farmacia_id').eq('id', user.id).single()
      if (!activo) return
      if (emp?.farmacia_id) setPac('farmacia_id', emp.farmacia_id)
    }
    cargar()
    return () => {
      activo = false
    }
  }, [supabase])

  async function buscarPorCedula() {
    if (clasificacion !== 'padron_nacional') {
      toast.error('La búsqueda en padrón nacional solo aplica con «Cédula costarricense».')
      return
    }
    const c = cedula.trim()
    if (!c) return toast.error('Ingresa el número de cédula')
    if (!PADRON_API_URL || !PADRON_API_KEY) return toast.error('Faltan variables de entorno del padrón.')
    setLoadingPersona(true)
    try {
      const res = await fetch(PADRON_API_URL, {
        method: 'POST',
        headers: { apikey: PADRON_API_KEY, Authorization: `Bearer ${PADRON_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_cedula: /^\d+$/.test(c) ? Number(c) : c }),
      })
      if (!res.ok) return toast.error('No se encontró persona con esa cédula')
      const data = await res.json()
      const nombre = ((Array.isArray(data) ? data[0] : data) as PersonaResponse)?.nombre_completo?.trim()
      if (!nombre) return toast.error('No se encontró persona con esa cédula')
      setPac('nombre', nombre)
      toast.success('Nombre cargado')
    } catch { toast.error('Error al consultar el padrón.') }
    finally { setLoadingPersona(false) }
  }

  function validar(): boolean {
    if (!paciente.empresa.trim()) { toast.error('Selecciona la empresa del paciente.'); return false }

    if (clasificacion === 'menor') {
      if (!fechaNacimiento) { toast.error('Indica la fecha de nacimiento del menor.'); return false }
      const edad = edadDesdeFechaNacimiento(fechaNacimiento)
      if (edad === null) { toast.error('La fecha de nacimiento no es válida.'); return false }
      if (edad >= 18) {
        toast.error('La fecha no corresponde a un menor de edad. Elija otro tipo de registro si aplica.')
        return false
      }
      if (!encargadoNombre.trim() || !encargadoDocumento.trim() || !encargadoTelefono.trim() || !encargadoParentesco.trim()) {
        toast.error('Complete todos los datos de la persona encargada de recibir los medicamentos.')
        return false
      }
    }
    if (clasificacion === 'extranjero') {
      if (!cedula.trim() && !pasaporteDoc.trim() && !dimexDoc.trim()) {
        toast.error('Indique al menos un documento: pasaporte, DIMEX o cédula / identificación.')
        return false
      }
    }
    if (!paciente.nombre.trim()) {
      toast.error('Ingrese el nombre completo del paciente.')
      return false
    }

    if (dir.canton && !dir.distrito) { toast.error('Si eliges cantón, selecciona también el distrito.'); return false }
    if (dir.distrito && !dir.canton) { toast.error('Selecciona el cantón que corresponde al distrito.'); return false }
    if (dir.senas.trim() && (!dir.canton || !dir.distrito)) { toast.error('Para agregar señas, completa cantón y distrito.'); return false }
    if (dir.canton && dir.distrito) {
      const permitidos = distritosPorProvinciaCanton(dir.provincia, dir.canton)
      if (!permitidos.includes(dir.distrito)) { toast.error('El distrito no corresponde al cantón seleccionado.'); return false }
    }
    if (zonaRiesgo && dir.arreglo.trim().length < MIN_CARACTERES_ARREGLO_ENTREGA) {
      setModalRiesgoAbierto(true)
      toast.error(`Zona de riesgo: documente el arreglo acordado (mínimo ${MIN_CARACTERES_ARREGLO_ENTREGA} caracteres).`)
      return false
    }
    if (tratamientos.some((trat) => trat.medicamentoId)) {
      for (let i = 0; i < tratamientos.length; i++) {
        const trat = tratamientos[i]
        if (!trat.medicamentoId) continue
        const n = i + 1
        const fv = fechaVencimientoDesdeTrat(trat)
        if (!trat.fecha_inicio.trim()) {
          toast.error(`Tratamiento ${n}: indica la fecha de inicio de tratamiento.`)
          return false
        }
        if (!fv) {
          toast.error(`Tratamiento ${n}: completa dosis, unidades en caja y fechas del medicamento.`)
          return false
        }
        if (!trat.numero_factura.trim()) {
          toast.error(`Tratamiento ${n}: el número de factura es obligatorio.`)
          return false
        }
        if (!trat.monto_total_factura.trim()) {
          toast.error(`Tratamiento ${n}: el monto total de la factura es obligatorio.`)
          return false
        }
        if (parseMontoFacturaInput(trat.monto_total_factura) === null) {
          toast.error(`Tratamiento ${n}: el monto total de la factura no es válido.`)
          return false
        }
      }
    }
    return true
  }

  /** Solo altas «No aparece en el padrón». Menores y extranjeros quedan solo en FarmaRenovar. */
  async function registrarEnPadronRemoto(pacienteId: string) {
    const regRes = await fetch('/api/padron-registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clasificacion: 'no_listado_cr',
        pacienteId,
        nombreCompleto: nombreManualEnMayusculas(clasificacion)
          ? normalizarNombrePersona(paciente.nombre)
          : paciente.nombre.trim(),
        cedula: cedula.trim() || null,
        pasaporte: pasaporteDoc.trim() || null,
        dimex: dimexDoc.trim() || null,
        fechaNacimiento: fechaNacimiento || null,
      }),
    })
    const payload = await regRes.json().catch(() => ({}))
    if (!regRes.ok) {
      throw new Error(typeof payload.error === 'string' ? payload.error : 'No se pudo registrar en la base del padrón')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const direccionCompuesta = dir.canton && dir.distrito
        ? [`Provincia: ${dir.provincia}`, `Cantón: ${dir.canton}`, `Distrito: ${dir.distrito}`, dir.senas.trim() ? `Señas: ${dir.senas.trim()}` : null].filter(Boolean).join(' · ')
        : null

      const nombrePaciente = nombreManualEnMayusculas(clasificacion)
        ? normalizarNombrePersona(paciente.nombre)
        : paciente.nombre.trim()

      const { data: nuevo, error: errPac } = await supabase.from('pacientes').insert({
        ...paciente,
        nombre: nombrePaciente,
        email: paciente.email || null,
        direccion: direccionCompuesta,
        provincia_cr: dir.canton && dir.distrito ? dir.provincia : null,
        canton_cr: dir.canton || null,
        distrito_cr: dir.distrito || null,
        direccion_senas: dir.senas.trim() || null,
        arreglo_entrega: zonaRiesgo ? dir.arreglo.trim() : null,
        notas: paciente.notas || null,
        seguro_medico: paciente.seguro_medico || null,
        numero_poliza: paciente.numero_poliza.trim() || null,
        numero_certificado: paciente.numero_certificado.trim() || null,
        tipo_pago: paciente.tipo_pago || null,
        empresa: paciente.empresa || null,
        registrado_por: user!.id,
        clasificacion_alta: clasificacion,
        cedula_identidad: cedula.trim() || null,
        pasaporte: pasaporteDoc.trim() || null,
        dimex: dimexDoc.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
        encargado_nombre:
          clasificacion === 'menor' ? normalizarNombrePersona(encargadoNombre) : null,
        encargado_documento: clasificacion === 'menor' ? encargadoDocumento.trim() : null,
        encargado_telefono: clasificacion === 'menor' ? encargadoTelefono.trim() : null,
        encargado_parentesco: clasificacion === 'menor' ? encargadoParentesco.trim() : null,
        tiene_medismart: tieneMedismart,
        paciente_sin_seguro: pacienteSinSeguro,
      }).select().single()
      if (errPac) throw errPac

      const tratamientoIdsCreados: string[] = []
      try {
        const { data: emp } = await supabase.from('empleados').select('farmacia_id').eq('id', user!.id).single()
        const farmaciaId = emp?.farmacia_id ?? nuevo.farmacia_id

        for (const trat of tratamientos) {
          if (!trat.medicamentoId) continue
          const fechaVencimiento = fechaVencimientoDesdeTrat(trat)
          if (!fechaVencimiento) continue

          const { data: nuevoTrat, error: errTrat } = await supabase.from('tratamientos').insert({
            paciente_id: nuevo.id,
            medicamento_id: trat.medicamentoId,
            medicamento: trat.medicamento,
            marca: trat.marca || null,
            concentracion: trat.concentracion || null,
            dosis_diaria: Number(trat.dosis_diaria),
            unidades_caja: Number(trat.unidades_caja),
            fecha_surtido: trat.fecha_surtido,
            fecha_inicio_tratamiento: trat.fecha_inicio,
            fecha_vencimiento: fechaVencimiento,
            tipo: trat.tipo,
            notas: trat.notas || null,
            medico_receta_id: trat.medico_receta_id.trim() || null,
            registrado_por: user!.id,
          }).select('id').single()
          if (errTrat) throw errTrat

          const tid = nuevoTrat.id
          tratamientoIdsCreados.push(tid)

          const monto = parseMontoFacturaInput(trat.monto_total_factura)
          if (!monto || !farmaciaId) {
            throw new Error(!monto ? 'Monto inválido' : 'No se pudo determinar la farmacia')
          }
          const { error: errRen } = await supabase.from('renovaciones').insert({
            tratamiento_id: tid,
            farmacia_id: farmaciaId,
            empleado_id: user!.id,
            fecha: trat.fecha_surtido,
            fecha_inicio_tratamiento: trat.fecha_inicio,
            notas: null,
            numero_factura: trat.numero_factura.trim(),
            monto_total_factura: monto,
            hubo_regalia: false,
            unidades_regalia: null,
          })
          if (errRen) throw errRen
        }

        if (clasificacion === 'no_listado_cr') {
          await registrarEnPadronRemoto(nuevo.id)
        }
      } catch (inner: unknown) {
        for (const tid of [...tratamientoIdsCreados].reverse()) {
          await supabase.from('renovaciones').delete().eq('tratamiento_id', tid)
          await supabase.from('tratamientos').delete().eq('id', tid)
        }
        await supabase.from('pacientes').delete().eq('id', nuevo.id)
        throw inner
      }

      toast.success('Paciente registrado exitosamente')
      router.push(`/pacientes/${nuevo.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Error al registrar: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo paciente</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Registra los datos del paciente y, si aplica, uno o varios tratamientos en la misma alta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <section
          className={`${FORM_SECTION_GRID} rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none`}
        >
          <h2 className={`font-semibold text-gray-800 dark:text-slate-100 ${FORM_SPAN_FULL}`}>👤 Datos del paciente</h2>

          <div
            className={`rounded-xl border border-gray-200 bg-gray-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/80 ${FORM_SPAN_FULL}`}
          >
            <p className="mb-2 text-sm font-medium text-gray-800 dark:text-slate-200">Tipo de registro</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {([
                { value: 'padron_nacional' as const, label: 'Cédula costarricense' },
                { value: 'no_listado_cr' as const, label: 'No aparece en el padrón (alta manual)' },
                { value: 'menor' as const, label: 'Menor de edad' },
                { value: 'extranjero' as const, label: 'Persona extranjera' },
              ]).map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm leading-snug transition-colors ${
                    clasificacion === o.value
                      ? 'border-green-600 bg-green-50 text-gray-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-50'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="clasificacion_alta"
                    className="mt-0.5 text-green-600 dark:text-emerald-500"
                    checked={clasificacion === o.value}
                    onChange={() => setClasificacion(o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
              Las altas que no son solo consulta al padrón nacional se replican en la base de datos del padrón (proyecto aparte), usando la service role en el servidor.
            </p>
          </div>

          <div className={`flex flex-wrap items-end gap-2 ${FORM_SPAN_FULL}`}>
            <div className="min-w-0 flex-1">
              <Field
                label={
                  clasificacion === 'padron_nacional'
                    ? 'Cédula'
                    : clasificacion === 'no_listado_cr'
                      ? 'Cédula (si la conoce)'
                      : clasificacion === 'menor'
                        ? 'Cédula o identificación del menor'
                        : 'Cédula / identificación (si aplica)'
                }
                required={clasificacion === 'padron_nacional'}
              >
                <input
                  className={INPUT_CLS}
                  value={cedula}
                  placeholder={clasificacion === 'extranjero' ? 'Opcional si tiene otro documento' : 'Ej: 208750176'}
                  onChange={(e) => setCedula(e.target.value)}
                  onKeyDown={(e) =>
                    clasificacion === 'padron_nacional' && e.key === 'Enter' && (e.preventDefault(), buscarPorCedula())
                  }
                />
              </Field>
            </div>
            {clasificacion === 'padron_nacional' ? (
              <button
                type="button"
                onClick={buscarPorCedula}
                disabled={loadingPersona}
                className="whitespace-nowrap rounded-xl bg-gray-800 px-4 py-2.5 font-medium text-white transition-colors hover:bg-gray-700 disabled:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 dark:disabled:bg-slate-600"
              >
                {loadingPersona ? 'Buscando...' : 'Buscar nombre'}
              </button>
            ) : null}
          </div>

          {clasificacion === 'extranjero' ? (
            <div className={`${FORM_BLOQUE_CLASIFICACION_ACTIVA} ${FORM_SPAN_FULL}`}>
              <p className={FORM_BLOQUE_CLASIFICACION_TITULO}>
                Documentos (indique al menos uno)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Pasaporte">
                  <input className={INPUT_CLS} value={pasaporteDoc} placeholder="Número de pasaporte"
                    onChange={(e) => setPasaporteDoc(e.target.value)} />
                </Field>
                <Field label="DIMEX u otro documento de residencia">
                  <input className={INPUT_CLS} value={dimexDoc} placeholder="Número DIMEX"
                    onChange={(e) => setDimexDoc(e.target.value)} />
                </Field>
              </div>
            </div>
          ) : null}

          {clasificacion === 'menor' ? (
            <div className={`${FORM_BLOQUE_CLASIFICACION_ACTIVA} ${FORM_SPAN_FULL}`}>
              <p className={FORM_BLOQUE_CLASIFICACION_TITULO}>
                Menor de edad y persona que recibe los medicamentos
              </p>
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:gap-x-4 xl:gap-y-4">
                <div className="sm:col-span-2 xl:col-span-2">
                  <Field label="Nacimiento del menor" required hint="Debe corresponder a menor de 18 años.">
                    <input className={INPUT_CLS} type="date" value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)} />
                  </Field>
                </div>
                <div className="xl:col-span-5">
                  <Field label="Nombre completo del encargado" required>
                    <input className={INPUT_CLS} value={encargadoNombre} placeholder="Nombre y apellidos"
                      onChange={(e) => setEncargadoNombre(normalizarNombrePersona(e.target.value))} />
                  </Field>
                </div>
                <div className="xl:col-span-2">
                  <Field label="Documento de identidad" required>
                    <input className={INPUT_CLS} value={encargadoDocumento} placeholder="Cédula u otro ID"
                      onChange={(e) => setEncargadoDocumento(e.target.value)} />
                  </Field>
                </div>
                <div className="xl:col-span-3">
                  <Field label="Teléfono / WhatsApp" required>
                    <input className={INPUT_CLS} type="tel" value={encargadoTelefono} placeholder="88881234"
                      onChange={(e) => setEncargadoTelefono(e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2 xl:col-span-12">
                  <Field label="Parentesco o relación con el menor" required>
                    <input className={INPUT_CLS} value={encargadoParentesco} placeholder="Ej: madre, padre, tutor legal"
                      onChange={(e) => setEncargadoParentesco(e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          <div className={FORM_SPAN_FULL}>
            <Field label="Nombre completo" required>
              <input className={INPUT_CLS} required value={paciente.nombre}
                placeholder={
                  clasificacion === 'padron_nacional'
                    ? 'Buscar por cédula o escribir manualmente'
                    : 'Nombre y apellidos del paciente'
                }
                onChange={(e) =>
                  setPac(
                    'nombre',
                    nombreManualEnMayusculas(clasificacion)
                      ? normalizarNombrePersona(e.target.value)
                      : e.target.value,
                  )
                } />
            </Field>
          </div>

          <Field label="Teléfono / WhatsApp" required>
            <input className={INPUT_CLS} type="tel" required value={paciente.telefono} placeholder="88881234"
              onChange={e => setPac('telefono', e.target.value)} />
          </Field>

          <Field label="Email">
            <input className={INPUT_CLS} type="email" value={paciente.email} placeholder="correo@ejemplo.com"
              onChange={e => setPac('email', e.target.value)} />
          </Field>

          <div className={`border-t border-gray-100 pt-4 dark:border-slate-800 ${FORM_SPAN_FULL}`}>
            <p className="mb-3 text-sm font-medium text-gray-800 dark:text-slate-200">Dirección en Costa Rica</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Provincia</label>
                <ListaDesplegableAbajo permitirVacio={false} value={dir.provincia}
                  onValueChange={v => setDir(d => ({ ...d, provincia: v, canton: '', distrito: '' }))}
                  opciones={PROVINCIAS_CR.map(p => ({ value: p, label: p }))} placeholder={PROVINCIAS_CR[0]} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Cantón</label>
                <ListaDesplegableAbajo value={dir.canton}
                  onValueChange={c => setDir(d => ({ ...d, canton: c, distrito: '' }))}
                  opciones={cantonesPorProvincia(dir.provincia).map(c => ({ value: c, label: c }))}
                  placeholder="Seleccionar cantón…" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Distrito</label>
                <ListaDesplegableAbajo value={dir.distrito} onValueChange={v => setDirField('distrito', v)}
                  opciones={distritosPorProvinciaCanton(dir.provincia, dir.canton).map(d => ({ value: d, label: d }))}
                  placeholder={dir.canton ? 'Seleccionar distrito…' : 'Primero elija cantón'} disabled={!dir.canton} />
              </div>
            </div>
            <div className="mt-4">
              <Field label="Señas / detalle (opcional)">
                <input className={INPUT_CLS} value={dir.senas} placeholder="Ej: 200 m norte del parque, casa azul"
                  onChange={e => setDirField('senas', e.target.value)} />
              </Field>
            </div>

            {zonaRiesgo && (
              <div className={ZONA_RIESGO_CONTENEDOR}>
                <p className={ZONA_RIESGO_TITULO}>Zona de riesgo para entrega</p>
                <p className={ZONA_RIESGO_DESCRIPCION}>
                  Coincidencias: {coincidencias.join(', ')}. Coordine un punto seguro y regístrelo aquí.
                </p>
                <Field label="Arreglo de entrega" required hint={`Mínimo ${MIN_CARACTERES_ARREGLO_ENTREGA} caracteres.`}>
                  <textarea id="arreglo-entrega-paciente" rows={3} required value={dir.arreglo}
                    onChange={e => setDirField('arreglo', e.target.value)}
                    className={ZONA_RIESGO_TEXTAREA}
                    placeholder="Ej: entrega en oficinas del Hospital México, recepción, lunes a viernes 9–17 h" />
                </Field>
              </div>
            )}
          </div>

          <div>
            <Field label="Empresa" required>
              <EmpresaCombobox required value={paciente.empresa}
                onValueChange={v => setPac('empresa', v)} />
            </Field>
          </div>

          <Field label="Seguro médico">
            <select className={INPUT_CLS} value={paciente.seguro_medico}
              onChange={e => setPac('seguro_medico', e.target.value)}>
              <option value="">Seleccionar...</option>
              {SEGUROS_MEDICOS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Número de póliza">
            <input className={INPUT_CLS} value={paciente.numero_poliza} placeholder="Según póliza del seguro"
              onChange={e => setPac('numero_poliza', e.target.value)} autoComplete="off" />
          </Field>

          <Field label="Número de certificado">
            <input className={INPUT_CLS} value={paciente.numero_certificado} placeholder="Según certificado"
              onChange={e => setPac('numero_certificado', e.target.value)} autoComplete="off" />
          </Field>

          <Field label="Tipo de pago">
            <select className={INPUT_CLS} value={paciente.tipo_pago}
              onChange={e => setPac('tipo_pago', e.target.value as typeof paciente.tipo_pago)}>
              <option value="">Seleccionar...</option>
              <option value="directo">Directo</option>
              <option value="reembolso">Reembolso</option>
            </select>
          </Field>

          <div className={`flex flex-wrap gap-6 rounded-xl border border-gray-200 bg-gray-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60 ${FORM_SPAN_FULL}`}>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={tieneMedismart}
                onChange={(e) => setTieneMedismart(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-slate-500 dark:text-emerald-500 dark:focus:ring-emerald-600"
              />
              Tiene MediSmart
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={pacienteSinSeguro}
                onChange={(e) => setPacienteSinSeguro(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-slate-500 dark:text-emerald-500 dark:focus:ring-emerald-600"
              />
              Paciente sin seguro
            </label>
          </div>

          <div className="md:col-span-2 xl:col-span-2">
            <Field label="Farmacia asignada" required>
              <select required className={INPUT_CLS} value={paciente.farmacia_id}
                onChange={e => setPac('farmacia_id', e.target.value)}>
                <option value="">Seleccionar farmacia...</option>
                {farmacias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </Field>
          </div>

          <div className="md:col-span-2 xl:col-span-1">
            <Field label="Notas / preferencias (opcional)">
              <input className={INPUT_CLS} value={paciente.notas}
                placeholder="Ej: prefiere contacto por WhatsApp"
                onChange={e => setPac('notas', e.target.value)} />
            </Field>
          </div>
        </section>

        <section
          className={`${FORM_SECTION_GRID} rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none`}
        >
          <div className={FORM_SPAN_FULL}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-slate-100">Tratamientos</h2>
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  Opcional. Puede registrar uno o varios medicamentos en este alta para seguimiento en el dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={agregarTratamiento}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-100 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Agregar tratamiento
              </button>
            </div>
          </div>

          {tratamientos.map((trat, idx) => {
            const fv = fechaVencimientoDesdeTrat(trat)
            return (
              <div
                key={trat._key}
                className={`${FORM_SPAN_FULL} space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/50`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Medicamento {idx + 1}</h3>
                  {tratamientos.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => quitarTratamiento(idx)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Quitar
                    </button>
                  ) : null}
                </div>

                <div className={`${FORM_SECTION_GRID}`}>
                  <div className={FORM_SPAN_FULL}>
                    <MedicamentoCombobox
                      medicamentoId={trat.medicamentoId}
                      onMedicamentoChange={(row) =>
                        setTratamientos((rows) =>
                          rows.map((t, j) => {
                            if (j !== idx) return t
                            if (!row) return { ...t, medicamentoId: '', medicamento: '', marca: '', concentracion: '', medico_receta_id: '' }
                            return {
                              ...t,
                              medicamentoId: row.id,
                              medicamento: textoMedicamentoParaReceta(row),
                              marca: row.marca ?? '',
                              concentracion: row.concentracion ?? '',
                            }
                          }),
                        )
                      }
                    />
                  </div>

                  <Field label="Marca">
                    <input
                      className={INPUT_CLS}
                      value={trat.marca}
                      placeholder="Ej: Genérico"
                      onChange={(e) => setTratField(idx, 'marca', e.target.value)}
                    />
                  </Field>

                  <Field label="Concentración">
                    <input
                      className={INPUT_CLS}
                      value={trat.concentracion}
                      placeholder="Ej: 500mg"
                      onChange={(e) => setTratField(idx, 'concentracion', e.target.value)}
                    />
                  </Field>

                  <Field label="ID del medico">
                    <input
                      className={INPUT_CLS}
                      value={trat.medico_receta_id}
                      autoComplete="off"
                      placeholder="Ej: código profesional o ID interno"
                      onChange={(e) => setTratField(idx, 'medico_receta_id', e.target.value)}
                    />
                  </Field>

                  <Field label="Unidades en la caja">
                    <input
                      className={INPUT_CLS}
                      type="number"
                      min="1"
                      value={trat.unidades_caja}
                      placeholder="30"
                      onChange={(e) => setTratField(idx, 'unidades_caja', e.target.value)}
                    />
                  </Field>

                  <Field label="Dosis diaria (unidades/día)">
                    <input
                      className={INPUT_CLS}
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={trat.dosis_diaria}
                      placeholder="1"
                      onChange={(e) => setTratField(idx, 'dosis_diaria', e.target.value)}
                    />
                  </Field>

                  <Field label="Fecha de despacho" hint="Fecha en que se despacha en la farmacia.">
                    <input
                      className={INPUT_CLS}
                      type="date"
                      value={trat.fecha_surtido}
                      onChange={(e) => setTratField(idx, 'fecha_surtido', e.target.value)}
                    />
                  </Field>

                  <Field label="Inicio de tratamiento" required hint="Obligatoria si registra un medicamento en esta fila.">
                    <input
                      className={INPUT_CLS}
                      type="date"
                      value={trat.fecha_inicio}
                      onChange={(e) => setTratField(idx, 'fecha_inicio', e.target.value)}
                    />
                  </Field>

                  <Field label="Tipo de tratamiento">
                    <select className={INPUT_CLS} value={trat.tipo} onChange={(e) => setTratField(idx, 'tipo', e.target.value)}>
                      <option value="cronico">Crónico (permanente)</option>
                      <option value="temporal">Temporal (con fecha fin)</option>
                    </select>
                  </Field>

                  <Field label="Número de factura" required>
                    <input
                      className={INPUT_CLS}
                      value={trat.numero_factura}
                      autoComplete="off"
                      placeholder="Según inventario / POS"
                      onChange={(e) => setTratField(idx, 'numero_factura', e.target.value)}
                    />
                  </Field>

                  <Field label="Monto total factura (CRC)" required>
                    <input
                      className={INPUT_CLS}
                      inputMode="decimal"
                      value={trat.monto_total_factura}
                      autoComplete="off"
                      placeholder="Ej: 12500 o 12500,50"
                      onChange={(e) => setTratField(idx, 'monto_total_factura', e.target.value)}
                    />
                  </Field>
                </div>

                {fv ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                    <p className="text-sm font-medium text-green-700 dark:text-emerald-200">
                      ✅ Fecha de vencimiento calculada: <strong>{fv}</strong>
                    </p>
                    <p className="mt-1 text-xs text-green-600 dark:text-emerald-300/90">
                      Calculada desde la fecha de inicio de tratamiento.
                    </p>
                  </div>
                ) : null}
              </div>
            )
          })}

          <p className={`text-xs text-gray-500 dark:text-slate-400 ${FORM_SPAN_FULL}`}>
            Los campos marcados con * son obligatorios en cada fila donde elija un medicamento.
          </p>
        </section>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Guardando...' : 'Registrar paciente'}
          </button>
        </div>
      </form>

      <ModalAlertaRiesgoEntrega open={modalRiesgoAbierto}
        onOpenChange={open => {
          setModalRiesgoAbierto(open)
          if (!open) requestAnimationFrame(() => document.getElementById('arreglo-entrega-paciente')?.focus())
        }}
        coincidencias={coincidencias} />
    </div>
  )
}
