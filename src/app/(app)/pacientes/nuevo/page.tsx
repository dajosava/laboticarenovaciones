'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularFechaVencimiento, parseMontoFacturaInput } from '@/lib/utils'
import { toast } from 'sonner'
import type { Farmacia } from '@/types'
import MedicamentoCombobox from '@/components/medicamentos/MedicamentoCombobox'
import { textoMedicamentoParaReceta } from '@/lib/medicamentos-import'

const PERSONA_API_URL = process.env.NEXT_PUBLIC_PERSONA_API_URL || 'http://127.0.0.1:8000'

interface PersonaResponse {
  cedula: number
  nombre_completo: string
  nombre: string
  primer_apellido: string
  segundo_apellido: string
}

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

export default function NuevoPacientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [farmacias, setFarmacias] = useState<Farmacia[]>([])
  const [loading, setLoading] = useState(false)
  const [cedula, setCedula] = useState('')
  const [loadingPersona, setLoadingPersona] = useState(false)

  // Form state
  const [paciente, setPaciente] = useState({
    nombre: '', telefono: '', email: '', farmacia_id: '', notas: '',
    direccion: '', empresa: '', seguro_medico: '', tipo_pago: '' as '' | 'directo' | 'reembolso',
  })
  const hoyIso = new Date().toISOString().split('T')[0]
  const [tratamiento, setTratamiento] = useState({
    medicamentoId: '',
    medicamento: '',
    marca: '',
    concentracion: '',
    dosis_diaria: '',
    unidades_caja: '',
    fecha_surtido: hoyIso,
    fecha_inicio_tratamiento: '',
    tipo: 'cronico',
    notas: '',
    numero_factura: '',
    monto_total_factura: '',
  })

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('farmacias').select('*').eq('activa', true).order('nombre')
      if (data) setFarmacias(data)

      // Pre-seleccionar farmacia del empleado
      const { data: { user } } = await supabase.auth.getUser()
      const { data: emp } = await supabase.from('empleados').select('farmacia_id, rol').eq('id', user!.id).single()
      if (emp?.farmacia_id) setPaciente(p => ({ ...p, farmacia_id: emp.farmacia_id! }))
    }
    cargar()
  }, [])

  async function buscarPorCedula() {
    const cedulaTrim = cedula.trim()
    if (!cedulaTrim) {
      toast.error('Ingresa el número de cédula')
      return
    }
    setLoadingPersona(true)
    try {
      const base = PERSONA_API_URL.replace(/\/$/, '')
      const res = await fetch(`${base}/persona/${encodeURIComponent(cedulaTrim)}`)
      if (!res.ok) {
        toast.error('No se encontró persona con esa cédula')
        return
      }
      const data: PersonaResponse = await res.json()
      setPaciente(p => ({ ...p, nombre: data.nombre_completo || '' }))
      if (data.nombre_completo) toast.success('Nombre cargado')
    } catch {
      toast.error('Error al consultar la API de persona. Revisa que el servicio esté en marcha.')
    } finally {
      setLoadingPersona(false)
    }
  }

  const fechaVencimientoPreview =
    tratamiento.dosis_diaria && tratamiento.unidades_caja && tratamiento.fecha_inicio_tratamiento
      ? calcularFechaVencimiento(
          tratamiento.fecha_inicio_tratamiento,
          Number(tratamiento.unidades_caja),
          Number(tratamiento.dosis_diaria),
        )
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const conMedicamento = !!tratamiento.medicamentoId.trim()
      if (conMedicamento) {
        if (!tratamiento.fecha_inicio_tratamiento.trim()) {
          toast.error('Indica la fecha de inicio de tratamiento (obligatoria).')
          return
        }
        if (!fechaVencimientoPreview) {
          toast.error(
            'Para registrar el medicamento, completa dosis diarias, unidades en la caja, fecha de despacho e inicio de tratamiento.',
          )
          return
        }
        if (!tratamiento.numero_factura?.trim()) {
          toast.error('El número de factura es obligatorio.')
          return
        }
        if (!tratamiento.monto_total_factura.trim()) {
          toast.error('El monto total de la factura es obligatorio.')
          return
        }
        if (parseMontoFacturaInput(tratamiento.monto_total_factura) === null) {
          toast.error('El monto total de la factura no es válido.')
          return
        }
      }

      // 1. Crear paciente
      const payload = {
        nombre: paciente.nombre,
        telefono: paciente.telefono,
        email: paciente.email || null,
        direccion: paciente.direccion || null,
        empresa: paciente.empresa || null,
        seguro_medico: paciente.seguro_medico || null,
        tipo_pago: paciente.tipo_pago || null,
        farmacia_id: paciente.farmacia_id,
        notas: paciente.notas || null,
        registrado_por: user!.id,
      }
      const { data: nuevoPaciente, error: errPaciente } = await supabase
        .from('pacientes')
        .insert(payload)
        .select()
        .single()

      if (errPaciente) throw errPaciente

      // 2. Crear primer tratamiento si se llenó
      if (tratamiento.medicamentoId && fechaVencimientoPreview) {
        const { data: nuevoTrat, error: errTrat } = await supabase
          .from('tratamientos')
          .insert({
            paciente_id: nuevoPaciente.id,
            medicamento_id: tratamiento.medicamentoId,
            medicamento: tratamiento.medicamento,
            marca: tratamiento.marca || null,
            concentracion: tratamiento.concentracion || null,
            dosis_diaria: Number(tratamiento.dosis_diaria),
            unidades_caja: Number(tratamiento.unidades_caja),
            fecha_surtido: tratamiento.fecha_surtido,
            fecha_inicio_tratamiento: tratamiento.fecha_inicio_tratamiento,
            fecha_vencimiento: fechaVencimientoPreview,
            tipo: tratamiento.tipo,
            notas: tratamiento.notas || null,
            registrado_por: user!.id,
          })
          .select('id')
          .single()

        if (errTrat) throw errTrat

        const factura = tratamiento.numero_factura.trim()
        const montoIns = parseMontoFacturaInput(tratamiento.monto_total_factura)
        if (montoIns === null) {
          await supabase.from('tratamientos').delete().eq('id', nuevoTrat.id)
          await supabase.from('pacientes').delete().eq('id', nuevoPaciente.id)
          throw new Error('Monto de factura inválido')
        }
        const { data: emp } = await supabase.from('empleados').select('farmacia_id').eq('id', user!.id).single()
        const farmaciaId = emp?.farmacia_id ?? nuevoPaciente.farmacia_id
        if (!farmaciaId) {
          await supabase.from('tratamientos').delete().eq('id', nuevoTrat.id)
          await supabase.from('pacientes').delete().eq('id', nuevoPaciente.id)
          throw new Error('No se pudo determinar la farmacia para guardar datos de factura')
        }
        const { error: errRen } = await supabase.from('renovaciones').insert({
          tratamiento_id: nuevoTrat.id,
          farmacia_id: farmaciaId,
          empleado_id: user!.id,
          fecha: tratamiento.fecha_surtido,
          fecha_inicio_tratamiento: tratamiento.fecha_inicio_tratamiento,
          notas: null,
          numero_factura: factura,
          monto_total_factura: montoIns,
          hubo_regalia: false,
          unidades_regalia: null,
        })
        if (errRen) {
          await supabase.from('tratamientos').delete().eq('id', nuevoTrat.id)
          await supabase.from('pacientes').delete().eq('id', nuevoPaciente.id)
          throw errRen
        }
      }

      toast.success('Paciente registrado exitosamente')
      router.push(`/pacientes/${nuevoPaciente.id}`)
    } catch (err: any) {
      toast.error('Error al registrar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo paciente</h1>
        <p className="text-gray-500 text-sm mt-1">Registra los datos del paciente y su primer tratamiento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del Paciente */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">👤 Datos del paciente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input type="text" value={cedula} onChange={e => setCedula(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarPorCedula())}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 208750176" />
              </div>
              <button type="button" onClick={buscarPorCedula} disabled={loadingPersona}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors whitespace-nowrap">
                {loadingPersona ? 'Buscando...' : 'Buscar nombre'}
              </button>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input type="text" required value={paciente.nombre} onChange={e => setPaciente(p => ({ ...p, nombre: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nombre Apellido o buscar por cédula" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
              <input type="tel" required value={paciente.telefono} onChange={e => setPaciente(p => ({ ...p, telefono: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="5512345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
              <input type="email" value={paciente.email} onChange={e => setPaciente(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="correo@ejemplo.com" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (opcional)</label>
              <input type="text" value={paciente.direccion} onChange={e => setPaciente(p => ({ ...p, direccion: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Calle, número, colonia, CP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (opcional)</label>
              <input type="text" value={paciente.empresa} onChange={e => setPaciente(p => ({ ...p, empresa: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Razón social o empresa" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seguro médico (opcional)</label>
              <select value={paciente.seguro_medico} onChange={e => setPaciente(p => ({ ...p, seguro_medico: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">Seleccionar...</option>
                {SEGUROS_MEDICOS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
              <select value={paciente.tipo_pago} onChange={e => setPaciente(p => ({ ...p, tipo_pago: e.target.value as '' | 'directo' | 'reembolso' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">Seleccionar...</option>
                <option value="directo">Directo</option>
                <option value="reembolso">Reembolso</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmacia asignada *</label>
              <select required value={paciente.farmacia_id} onChange={e => setPaciente(p => ({ ...p, farmacia_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">Seleccionar farmacia...</option>
                {farmacias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas / preferencias (opcional)</label>
              <input
                type="text"
                value={paciente.notas}
                onChange={e => setPaciente(p => ({ ...p, notas: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: El cliente prefiere que lo llamen por teléfono; prefiere contacto por WhatsApp"
              />
            </div>
          </div>
        </div>

        {/* Primer Tratamiento */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">💊 Primer tratamiento</h2>
          <p className="text-sm text-gray-400 mb-4">Opcional. Registra medicamento, dosis y fechas para el seguimiento en el dashboard.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <MedicamentoCombobox
                medicamentoId={tratamiento.medicamentoId}
                onMedicamentoChange={(row) => {
                  if (!row) {
                    setTratamiento((t) => ({
                      ...t,
                      medicamentoId: '',
                      medicamento: '',
                      marca: '',
                      concentracion: '',
                    }))
                    return
                  }
                  setTratamiento((t) => ({
                    ...t,
                    medicamentoId: row.id,
                    medicamento: textoMedicamentoParaReceta(row),
                    marca: row.marca ?? '',
                    concentracion: row.concentracion ?? '',
                  }))
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input type="text" value={tratamiento.marca} onChange={e => setTratamiento(t => ({ ...t, marca: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Genérico, Roemmers" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentración</label>
              <input type="text" value={tratamiento.concentracion} onChange={e => setTratamiento(t => ({ ...t, concentracion: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 500mg, 20mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidades en la caja</label>
              <input type="number" min="1" value={tratamiento.unidades_caja} onChange={e => setTratamiento(t => ({ ...t, unidades_caja: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis diaria (unidades/día)</label>
              <input type="number" min="0.5" step="0.5" value={tratamiento.dosis_diaria} onChange={e => setTratamiento(t => ({ ...t, dosis_diaria: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de despacho (farmacia)</label>
              <input
                type="date"
                value={tratamiento.fecha_surtido}
                onChange={(e) => setTratamiento((t) => ({ ...t, fecha_surtido: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">Fecha en que se despacha el medicamento en la farmacia.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de tratamiento (toma) *</label>
              <input
                type="date"
                value={tratamiento.fecha_inicio_tratamiento}
                onChange={(e) => setTratamiento((t) => ({ ...t, fecha_inicio_tratamiento: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Obligatoria si registras un medicamento: debe ser indicada por el personal; no se precarga.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tratamiento</label>
              <select value={tratamiento.tipo} onChange={e => setTratamiento(t => ({ ...t, tipo: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="cronico">Crónico (permanente)</option>
                <option value="temporal">Temporal (con fecha fin)</option>
              </select>
            </div>
            <div className="col-span-2 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de factura <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={tratamiento.numero_factura}
                  onChange={(e) => setTratamiento((t) => ({ ...t, numero_factura: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Según inventario / POS de la farmacia"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto total factura (CRC) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tratamiento.monto_total_factura}
                  onChange={(e) => setTratamiento((t) => ({ ...t, monto_total_factura: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: 12500 o 12500,50"
                  autoComplete="off"
                />
              </div>
              <p className="col-span-2 text-xs text-gray-500">
                Obligatorios si registras un medicamento: se guarda el despacho en historial.
              </p>
            </div>

            {/* Preview fecha de vencimiento */}
            {fechaVencimientoPreview && (
              <div className="col-span-2 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 text-sm font-medium">
                  ✅ Fecha de vencimiento calculada: <strong>{fechaVencimientoPreview}</strong>
                </p>
                <p className="text-green-600 text-xs mt-1">
                  El vencimiento cuenta desde la fecha de inicio de tratamiento. El dashboard usará esta fecha para el seguimiento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
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
    </div>
  )
}
