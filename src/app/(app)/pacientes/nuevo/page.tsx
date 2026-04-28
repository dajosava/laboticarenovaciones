'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularFechaVencimiento, parseMontoFacturaInput } from '@/lib/utils'
import { toast } from 'sonner'
import type { Farmacia } from '@/types'
import MedicamentoCombobox from '@/components/medicamentos/MedicamentoCombobox'
import { textoMedicamentoParaReceta } from '@/lib/medicamentos-import'
import { PROVINCIAS_CR, cantonesPorProvincia, distritosPorProvinciaCanton } from '@/lib/costa-rica/direccion-cr'
import ListaDesplegableAbajo from '@/components/pacientes/ListaDesplegableAbajo'
import EmpresaCombobox from '@/components/pacientes/EmpresaCombobox'
import ModalAlertaRiesgoEntrega from '@/components/pacientes/ModalAlertaRiesgoEntrega'
import { MIN_CARACTERES_ARREGLO_ENTREGA, coincidenciasRiesgoEntrega } from '@/lib/entrega/lugares-riesgo-entrega'

// ─── Constants ───────────────────────────────────────────────────────────────
const PADRON_API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_PADRON || ''
const PADRON_API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PADRON || ''
const SEGUROS_MEDICOS = ['INS','Pan American Life Insurance','ASSA','BMI','MAPFRE','Mediprocesos','Koris Insurance','Best Doctors Insurance','Adisa']
const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500'
const hoyIso = new Date().toISOString().split('T')[0]

// ─── Types ────────────────────────────────────────────────────────────────────
interface PersonaResponse { cedula: number; nombre_completo: string }

// ─── Reusable Field ───────────────────────────────────────────────────────────
const Field = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
)

// ─── Component ────────────────────────────────────────────────────────────────
export default function NuevoPacientePage() {
  const router = useRouter()
  const supabase = createClient()

  const [farmacias, setFarmacias] = useState<Farmacia[]>([])
  const [loading, setLoading] = useState(false)
  const [cedula, setCedula] = useState('')
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [modalRiesgoAbierto, setModalRiesgoAbierto] = useState(false)

  const [paciente, setPaciente] = useState({
    nombre: '', telefono: '', email: '', farmacia_id: '',
    notas: '', empresa: '', seguro_medico: '',
    tipo_pago: '' as '' | 'directo' | 'reembolso',
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

  const [trat, setTrat] = useState({
    medicamentoId: '', medicamento: '', marca: '', concentracion: '',
    dosis_diaria: '', unidades_caja: '', fecha_surtido: hoyIso,
    fecha_inicio: '', tipo: 'cronico', notas: '',
    numero_factura: '', monto_total_factura: '',
  })

  // ── Helpers ──
  const setPac = (k: keyof typeof paciente, v: string) => setPaciente(p => ({ ...p, [k]: v }))
  const setDirField = (k: keyof typeof dir, v: string) => setDir(d => ({ ...d, [k]: v }))
  const setTratField = (k: keyof typeof trat, v: string) => setTrat(t => ({ ...t, [k]: v }))

  const coincidencias = useMemo(
    () => coincidenciasRiesgoEntrega({ canton: dir.canton, distrito: dir.distrito, senas: dir.senas }),
    [dir.canton, dir.distrito, dir.senas],
  )
  const zonaRiesgo = coincidencias.length > 0

  const fechaVencimiento = trat.dosis_diaria && trat.unidades_caja && trat.fecha_inicio
    ? calcularFechaVencimiento(trat.fecha_inicio, Number(trat.unidades_caja), Number(trat.dosis_diaria))
    : null

  // ── Effects ──
  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('farmacias').select('*').eq('activa', true).order('nombre')
      if (data) setFarmacias(data)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: emp } = await supabase.from('empleados').select('farmacia_id').eq('id', user!.id).single()
      if (emp?.farmacia_id) setPac('farmacia_id', emp.farmacia_id)
    }
    cargar()
  }, [])

  // ── Buscar cédula ──
  async function buscarPorCedula() {
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

  // ── Validar ──
  function validar(): boolean {
    if (!paciente.empresa.trim()) { toast.error('Selecciona la empresa del paciente.'); return false }
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
    if (trat.medicamentoId) {
      if (!trat.fecha_inicio.trim()) { toast.error('Indica la fecha de inicio de tratamiento.'); return false }
      if (!fechaVencimiento) { toast.error('Completa dosis, unidades y fechas del medicamento.'); return false }
      if (!trat.numero_factura.trim()) { toast.error('El número de factura es obligatorio.'); return false }
      if (!trat.monto_total_factura.trim()) { toast.error('El monto total de la factura es obligatorio.'); return false }
      if (parseMontoFacturaInput(trat.monto_total_factura) === null) { toast.error('El monto total de la factura no es válido.'); return false }
    }
    return true
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const direccionCompuesta = dir.canton && dir.distrito
        ? [`Provincia: ${dir.provincia}`, `Cantón: ${dir.canton}`, `Distrito: ${dir.distrito}`, dir.senas.trim() ? `Señas: ${dir.senas.trim()}` : null].filter(Boolean).join(' · ')
        : null

      const { data: nuevo, error: errPac } = await supabase.from('pacientes').insert({
        ...paciente,
        email: paciente.email || null,
        direccion: direccionCompuesta,
        provincia_cr: dir.canton && dir.distrito ? dir.provincia : null,
        canton_cr: dir.canton || null,
        distrito_cr: dir.distrito || null,
        direccion_senas: dir.senas.trim() || null,
        arreglo_entrega: zonaRiesgo ? dir.arreglo.trim() : null,
        notas: paciente.notas || null,
        seguro_medico: paciente.seguro_medico || null,
        tipo_pago: paciente.tipo_pago || null,
        empresa: paciente.empresa || null,
        registrado_por: user!.id,
      }).select().single()
      if (errPac) throw errPac

      if (trat.medicamentoId && fechaVencimiento) {
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
          registrado_por: user!.id,
        }).select('id').single()
        if (errTrat) throw errTrat

        const monto = parseMontoFacturaInput(trat.monto_total_factura)
        const { data: emp } = await supabase.from('empleados').select('farmacia_id').eq('id', user!.id).single()
        const farmaciaId = emp?.farmacia_id ?? nuevo.farmacia_id
        if (!monto || !farmaciaId) {
          await supabase.from('tratamientos').delete().eq('id', nuevoTrat.id)
          await supabase.from('pacientes').delete().eq('id', nuevo.id)
          throw new Error(!monto ? 'Monto inválido' : 'No se pudo determinar la farmacia')
        }
        const { error: errRen } = await supabase.from('renovaciones').insert({
          tratamiento_id: nuevoTrat.id, farmacia_id: farmaciaId, empleado_id: user!.id,
          fecha: trat.fecha_surtido, fecha_inicio_tratamiento: trat.fecha_inicio,
          notas: null, numero_factura: trat.numero_factura.trim(),
          monto_total_factura: monto, hubo_regalia: false, unidades_regalia: null,
        })
        if (errRen) {
          await supabase.from('tratamientos').delete().eq('id', nuevoTrat.id)
          await supabase.from('pacientes').delete().eq('id', nuevo.id)
          throw errRen
        }
      }

      toast.success('Paciente registrado exitosamente')
      router.push(`/pacientes/${nuevo.id}`)
    } catch (err: any) {
      toast.error('Error al registrar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo paciente</h1>
        <p className="text-gray-500 text-sm mt-1">Registra los datos del paciente y su primer tratamiento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Datos del paciente ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-semibold text-gray-800">👤 Datos del paciente</h2>

          {/* Cédula */}
          <div className="col-span-2 flex gap-2 items-end">
            <Field label="Cédula" required>
              <input className={INPUT_CLS} value={cedula} placeholder="Ej: 208750176"
                onChange={e => setCedula(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarPorCedula())} />
            </Field>
            <button type="button" onClick={buscarPorCedula} disabled={loadingPersona}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors whitespace-nowrap">
              {loadingPersona ? 'Buscando...' : 'Buscar nombre'}
            </button>
          </div>

          <div className="col-span-2">
            <Field label="Nombre completo" required>
              <input className={INPUT_CLS} required value={paciente.nombre} placeholder="Nombre o buscar por cédula"
                onChange={e => setPac('nombre', e.target.value)} />
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

          {/* Dirección */}
          <div className="col-span-2 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-800 mb-3">Dirección en Costa Rica</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <ListaDesplegableAbajo permitirVacio={false} value={dir.provincia}
                  onValueChange={v => setDir(d => ({ ...d, provincia: v, canton: '', distrito: '' }))}
                  opciones={PROVINCIAS_CR.map(p => ({ value: p, label: p }))} placeholder={PROVINCIAS_CR[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantón</label>
                <ListaDesplegableAbajo value={dir.canton}
                  onValueChange={c => setDir(d => ({ ...d, canton: c, distrito: '' }))}
                  opciones={cantonesPorProvincia(dir.provincia).map(c => ({ value: c, label: c }))}
                  placeholder="Seleccionar cantón…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
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
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
                <p className="text-sm font-semibold text-amber-900">Zona de riesgo para entrega</p>
                <p className="mt-1 text-xs text-amber-900/90">
                  Coincidencias: {coincidencias.join(', ')}. Coordine un punto seguro y regístrelo aquí.
                </p>
                <Field label="Arreglo de entrega" required hint={`Mínimo ${MIN_CARACTERES_ARREGLO_ENTREGA} caracteres.`}>
                  <textarea id="arreglo-entrega-paciente" rows={3} required value={dir.arreglo}
                    onChange={e => setDirField('arreglo', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej: entrega en oficinas del Hospital México, recepción, lunes a viernes 9–17 h" />
                </Field>
              </div>
            )}
          </div>

          {/* Empresa / seguro / pago */}
          <div>
            <Field label="Empresa" required>
              <EmpresaCombobox required value={paciente.empresa}
                onValueChange={v => setPac('empresa', v)} />
            </Field>
          </div>

          <Field label="Seguro médico">
            <select className={`${INPUT_CLS} bg-white`} value={paciente.seguro_medico}
              onChange={e => setPac('seguro_medico', e.target.value)}>
              <option value="">Seleccionar...</option>
              {SEGUROS_MEDICOS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Tipo de pago">
            <select className={`${INPUT_CLS} bg-white`} value={paciente.tipo_pago}
              onChange={e => setPac('tipo_pago', e.target.value as typeof paciente.tipo_pago)}>
              <option value="">Seleccionar...</option>
              <option value="directo">Directo</option>
              <option value="reembolso">Reembolso</option>
            </select>
          </Field>

          <div className="col-span-2">
            <Field label="Farmacia asignada" required>
              <select required className={`${INPUT_CLS} bg-white`} value={paciente.farmacia_id}
                onChange={e => setPac('farmacia_id', e.target.value)}>
                <option value="">Seleccionar farmacia...</option>
                {farmacias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </Field>
          </div>

          <div className="col-span-2">
            <Field label="Notas / preferencias (opcional)">
              <input className={INPUT_CLS} value={paciente.notas}
                placeholder="Ej: prefiere contacto por WhatsApp"
                onChange={e => setPac('notas', e.target.value)} />
            </Field>
          </div>
        </section>

        {/* ── Primer tratamiento ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h2 className="font-semibold text-gray-800">Primer tratamiento</h2>
            <p className="text-sm text-gray-400">Opcional. Para seguimiento en el dashboard.</p>
          </div>

          <div className="col-span-2">
            <MedicamentoCombobox medicamentoId={trat.medicamentoId}
              onMedicamentoChange={row => setTrat(t => !row
                ? { ...t, medicamentoId: '', medicamento: '', marca: '', concentracion: '' }
                : { ...t, medicamentoId: row.id, medicamento: textoMedicamentoParaReceta(row), marca: row.marca ?? '', concentracion: row.concentracion ?? '' }
              )} />
          </div>

          <Field label="Marca">
            <input className={INPUT_CLS} value={trat.marca} placeholder="Ej: Genérico"
              onChange={e => setTratField('marca', e.target.value)} />
          </Field>

          <Field label="Concentración">
            <input className={INPUT_CLS} value={trat.concentracion} placeholder="Ej: 500mg"
              onChange={e => setTratField('concentracion', e.target.value)} />
          </Field>

          <Field label="Unidades en la caja">
            <input className={INPUT_CLS} type="number" min="1" value={trat.unidades_caja} placeholder="30"
              onChange={e => setTratField('unidades_caja', e.target.value)} />
          </Field>

          <Field label="Dosis diaria (unidades/día)">
            <input className={INPUT_CLS} type="number" min="0.5" step="0.5" value={trat.dosis_diaria} placeholder="1"
              onChange={e => setTratField('dosis_diaria', e.target.value)} />
          </Field>

          <Field label="Fecha de despacho" hint="Fecha en que se despacha en la farmacia.">
            <input className={INPUT_CLS} type="date" value={trat.fecha_surtido}
              onChange={e => setTratField('fecha_surtido', e.target.value)} />
          </Field>

          <Field label="Inicio de tratamiento" required hint="Obligatoria si registras un medicamento.">
            <input className={INPUT_CLS} type="date" value={trat.fecha_inicio}
              onChange={e => setTratField('fecha_inicio', e.target.value)} />
          </Field>

          <Field label="Tipo de tratamiento">
            <select className={`${INPUT_CLS} bg-white`} value={trat.tipo}
              onChange={e => setTratField('tipo', e.target.value)}>
              <option value="cronico">Crónico (permanente)</option>
              <option value="temporal">Temporal (con fecha fin)</option>
            </select>
          </Field>

          <Field label="Número de factura" required>
            <input className={INPUT_CLS} value={trat.numero_factura} autoComplete="off"
              placeholder="Según inventario / POS" onChange={e => setTratField('numero_factura', e.target.value)} />
          </Field>

          <Field label="Monto total factura (CRC)" required>
            <input className={INPUT_CLS} inputMode="decimal" value={trat.monto_total_factura} autoComplete="off"
              placeholder="Ej: 12500 o 12500,50" onChange={e => setTratField('monto_total_factura', e.target.value)} />
          </Field>

          <p className="col-span-2 text-xs text-gray-500">Obligatorios si registras un medicamento.</p>

          {fechaVencimiento && (
            <div className="col-span-2 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">
                ✅ Fecha de vencimiento calculada: <strong>{fechaVencimiento}</strong>
              </p>
              <p className="text-green-600 text-xs mt-1">Calculada desde la fecha de inicio de tratamiento.</p>
            </div>
          )}
        </section>

        {/* ── Botones ── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition">
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