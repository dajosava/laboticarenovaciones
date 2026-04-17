'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calcularFechaVencimiento } from '@/lib/utils'
import { toast } from 'sonner'
import { registrarRenovacion } from '../../../actions'
import type { Tratamiento } from '@/types'

type Props = {
  pacienteId: string
  tratamiento: Tratamiento
}

export default function FormularioRenovarTratamiento({ pacienteId, tratamiento }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const hoy = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    medicamento: tratamiento.medicamento,
    marca: tratamiento.marca ?? '',
    concentracion: tratamiento.concentracion ?? '',
    dosis_diaria: String(tratamiento.dosis_diaria),
    unidades_caja: String(tratamiento.unidades_caja),
    fecha_surtido: hoy,
    tipo: tratamiento.tipo,
    notas: '',
  })

  const fechaVencimientoPreview =
    form.dosis_diaria && form.unidades_caja && form.fecha_surtido
      ? calcularFechaVencimiento(
          form.fecha_surtido,
          Number(form.unidades_caja),
          Number(form.dosis_diaria)
        )
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fechaVencimientoPreview) {
      toast.error('Revisa unidades, dosis y fecha de surtido.')
      return
    }
    setLoading(true)
    try {
      const { error } = await registrarRenovacion(tratamiento.id, pacienteId, {
        fecha_surtido: form.fecha_surtido,
        unidades_caja: Number(form.unidades_caja),
        dosis_diaria: Number(form.dosis_diaria),
        notas: form.notas.trim() || null,
        medicamento: form.medicamento.trim(),
        marca: form.marca.trim() || null,
        concentracion: form.concentracion.trim() || null,
        tipo: form.tipo,
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Renovación registrada. Fechas del tratamiento actualizadas.')
      router.push(`/pacientes/${pacienteId}`)
      router.refresh()
    } catch {
      toast.error('Error al guardar')
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
        <h1 className="text-2xl font-bold text-gray-900">Registrar renovación</h1>
        <p className="text-gray-500 text-sm mt-1">
          Mismo tratamiento; revisa o modifica los datos y guarda para actualizar fechas y registrar la renovación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">💊 Datos del medicamento</h2>
          <p className="text-sm text-gray-400 mb-4">Precargado con el tratamiento actual. Cambia solo lo necesario.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del medicamento *</label>
              <input
                type="text"
                required
                value={form.medicamento}
                onChange={e => setForm(f => ({ ...f, medicamento: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="Ej: Metformina"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="Ej: Genérico, Roemmers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentración</label>
              <input
                type="text"
                value={form.concentracion}
                onChange={e => setForm(f => ({ ...f, concentracion: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="Ej: 500mg, 20mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidades en la caja *</label>
              <input
                type="number"
                min={1}
                required
                value={form.unidades_caja}
                onChange={e => setForm(f => ({ ...f, unidades_caja: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis diaria (unidades/día) *</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                required
                value={form.dosis_diaria}
                onChange={e => setForm(f => ({ ...f, dosis_diaria: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de surtido (renovación) *</label>
              <input
                type="date"
                required
                value={form.fecha_surtido}
                onChange={e => setForm(f => ({ ...f, fecha_surtido: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tratamiento</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'cronico' | 'temporal' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="cronico">Crónico (permanente)</option>
                <option value="temporal">Temporal (con fecha fin)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas de la renovación (opcional)</label>
              <input
                type="text"
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="Ej: Paciente llevó 2 cajas"
              />
            </div>

            {fechaVencimientoPreview && (
              <div className="col-span-2 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-700 text-sm font-medium">
                  ✅ Nueva fecha de vencimiento: <strong>{fechaVencimientoPreview}</strong>
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Al guardar se actualizará el tratamiento y quedará registrada la renovación.
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
            {loading ? 'Guardando...' : 'Registrar renovación'}
          </button>
        </div>
      </form>
    </div>
  )
}
