'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calcularFechaVencimiento, parseMontoFacturaInput } from '@/lib/utils'
import { toast } from 'sonner'
import MedicamentoCombobox from '@/components/medicamentos/MedicamentoCombobox'
import { textoMedicamentoParaReceta } from '@/lib/medicamentos-import'

export default function NuevoTratamientoPage() {
  const router = useRouter()
  const params = useParams()
  const pacienteId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

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
    tipo: 'cronico' as 'cronico' | 'temporal',
    notas: '',
    numero_factura: '',
    monto_total_factura: '',
  })

  const fechaVencimientoPreview =
    tratamiento.dosis_diaria &&
    tratamiento.unidades_caja &&
    tratamiento.fecha_inicio_tratamiento
      ? calcularFechaVencimiento(
          tratamiento.fecha_inicio_tratamiento,
          Number(tratamiento.unidades_caja),
          Number(tratamiento.dosis_diaria),
        )
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tratamiento.medicamentoId.trim()) {
      toast.error('Selecciona un medicamento del catálogo')
      return
    }
    if (!tratamiento.fecha_inicio_tratamiento.trim()) {
      toast.error('Indica la fecha de inicio de tratamiento (obligatoria).')
      return
    }
    if (!fechaVencimientoPreview) {
      toast.error('Completa unidades en la caja, dosis diaria, fecha de despacho e inicio de tratamiento para calcular el vencimiento.')
      return
    }
    if (!tratamiento.numero_factura.trim()) {
      toast.error('El número de factura es obligatorio.')
      return
    }
    if (!tratamiento.monto_total_factura.trim()) {
      toast.error('El monto total de la factura es obligatorio.')
      return
    }
    const montoIns = parseMontoFacturaInput(tratamiento.monto_total_factura)
    if (montoIns === null) {
      toast.error('El monto total de la factura no es válido.')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Sesión expirada')
        router.push('/login')
        return
      }

      const { data: nuevoTrat, error: errTrat } = await supabase
        .from('tratamientos')
        .insert({
          paciente_id: pacienteId,
          medicamento_id: tratamiento.medicamentoId.trim(),
          medicamento: tratamiento.medicamento.trim(),
          marca: tratamiento.marca.trim() || null,
          concentracion: tratamiento.concentracion.trim() || null,
          dosis_diaria: Number(tratamiento.dosis_diaria),
          unidades_caja: Number(tratamiento.unidades_caja),
          fecha_surtido: tratamiento.fecha_surtido,
          fecha_inicio_tratamiento: tratamiento.fecha_inicio_tratamiento,
          fecha_vencimiento: fechaVencimientoPreview,
          tipo: tratamiento.tipo,
          notas: tratamiento.notas.trim() || null,
          registrado_por: user.id,
        })
        .select('id')
        .single()

      if (errTrat) throw errTrat

      const factura = tratamiento.numero_factura.trim()
      const [empleadoRes, pacienteRes] = await Promise.all([
        supabase.from('empleados').select('farmacia_id').eq('id', user.id).single(),
        supabase.from('pacientes').select('farmacia_id').eq('id', pacienteId).single(),
      ])
      const farmaciaId = empleadoRes.data?.farmacia_id ?? pacienteRes.data?.farmacia_id
      if (!farmaciaId) {
        await supabase.from('tratamientos').delete().eq('id', nuevoTrat.id)
        throw new Error('No se pudo determinar la farmacia para guardar datos de factura')
      }
      const { error: errRen } = await supabase.from('renovaciones').insert({
        tratamiento_id: nuevoTrat.id,
        farmacia_id: farmaciaId,
        empleado_id: user.id,
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
        throw errRen
      }
      toast.success('Tratamiento registrado')
      router.push(`/pacientes/${pacienteId}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/pacientes/${pacienteId}`}
          className="text-green-600 hover:text-green-800 text-sm font-medium mb-2 inline-block"
        >
          ← Volver a la ficha del paciente
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Agregar tratamiento</h1>
        <p className="text-gray-500 text-sm mt-1">Registra un nuevo medicamento para el paciente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">💊 Datos del medicamento</h2>
          <p className="text-sm text-gray-400 mb-4">Completa los datos para el seguimiento en el dashboard.</p>
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
              <input
                type="text"
                value={tratamiento.marca}
                onChange={e => setTratamiento(t => ({ ...t, marca: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Genérico, Roemmers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentración</label>
              <input
                type="text"
                value={tratamiento.concentracion}
                onChange={e => setTratamiento(t => ({ ...t, concentracion: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: 500mg, 20mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidades en la caja *</label>
              <input
                type="number"
                min={1}
                required
                value={tratamiento.unidades_caja}
                onChange={e => setTratamiento(t => ({ ...t, unidades_caja: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis diaria (unidades/día) *</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                required
                value={tratamiento.dosis_diaria}
                onChange={e => setTratamiento(t => ({ ...t, dosis_diaria: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de despacho (farmacia) *</label>
              <input
                type="date"
                required
                value={tratamiento.fecha_surtido}
                onChange={(e) => setTratamiento((t) => ({ ...t, fecha_surtido: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">Despacho en farmacia / facturación.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de tratamiento (toma) *</label>
              <input
                type="date"
                required
                value={tratamiento.fecha_inicio_tratamiento}
                onChange={(e) => setTratamiento((t) => ({ ...t, fecha_inicio_tratamiento: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Obligatoria: indícala según cuándo el paciente iniciará la toma con este despacho. No se precarga.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tratamiento</label>
              <select
                value={tratamiento.tipo}
                onChange={e => setTratamiento(t => ({ ...t, tipo: e.target.value as 'cronico' | 'temporal' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
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
                  required
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
                  required
                  inputMode="decimal"
                  value={tratamiento.monto_total_factura}
                  onChange={(e) => setTratamiento((t) => ({ ...t, monto_total_factura: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: 12500 o 12500,50"
                  autoComplete="off"
                />
              </div>
              <p className="col-span-2 text-xs text-gray-500">
                Obligatorios: se registra el despacho en historial junto con el tratamiento.
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={tratamiento.notas}
                onChange={e => setTratamiento(t => ({ ...t, notas: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Observaciones del tratamiento"
              />
            </div>

            {fechaVencimientoPreview && (
              <div className="col-span-2 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 text-sm font-medium">
                  ✅ Fecha de vencimiento calculada: <strong>{fechaVencimientoPreview}</strong>
                </p>
                <p className="text-green-600 text-xs mt-1">
                  El vencimiento cuenta desde la fecha de inicio de tratamiento.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/pacientes/${pacienteId}`)}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Guardando...' : 'Registrar tratamiento'}
          </button>
        </div>
      </form>
    </div>
  )
}
