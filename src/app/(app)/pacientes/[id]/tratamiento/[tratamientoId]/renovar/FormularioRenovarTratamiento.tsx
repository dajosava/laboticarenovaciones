'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calcularFechaVencimiento } from '@/lib/utils'
import { toast } from 'sonner'
import { registrarRenovacion } from '../../../actions'
import type { Tratamiento } from '@/types'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-brand-500'

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
    hubo_regalia: false,
    unidades_regalia: '',
  })

  const unidadesRegaliaNum = form.hubo_regalia ? Math.max(0, Math.floor(Number(form.unidades_regalia) || 0)) : 0
  const unidadesParaVencimiento = Number(form.unidades_caja) + unidadesRegaliaNum

  const fechaVencimientoPreview =
    form.dosis_diaria && form.unidades_caja && form.fecha_surtido && (!form.hubo_regalia || unidadesRegaliaNum > 0)
      ? calcularFechaVencimiento(form.fecha_surtido, unidadesParaVencimiento, Number(form.dosis_diaria))
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fechaVencimientoPreview) {
      toast.error(
        form.hubo_regalia && unidadesRegaliaNum < 1
          ? 'Indica cuántas unidades de regalía (mayor a 0).'
          : 'Revisa unidades, dosis y fecha de surtido.',
      )
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
        hubo_regalia: form.hubo_regalia,
        unidades_regalia: form.hubo_regalia ? unidadesRegaliaNum : null,
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
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <Link
          href={`/pacientes/${pacienteId}`}
          className="mb-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          ← Volver a la ficha del paciente
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Registrar renovación</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Mismo tratamiento; revisa o modifica los datos y guarda para actualizar fechas y registrar la renovación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Datos del medicamento</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Precargado con el tratamiento actual. Cambia solo lo necesario.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del medicamento *</label>
              <input
                type="text"
                required
                value={form.medicamento}
                onChange={(e) => setForm((f) => ({ ...f, medicamento: e.target.value }))}
                className={inputClass}
                placeholder="Ej: Metformina"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Marca</label>
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                className={inputClass}
                placeholder="Ej: Genérico, Roemmers"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Concentración</label>
              <input
                type="text"
                value={form.concentracion}
                onChange={(e) => setForm((f) => ({ ...f, concentracion: e.target.value }))}
                className={inputClass}
                placeholder="Ej: 500mg, 20mg"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Unidades en la caja *</label>
              <input
                type="number"
                min={1}
                required
                value={form.unidades_caja}
                onChange={(e) => setForm((f) => ({ ...f, unidades_caja: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Dosis diaria (unidades/día) *</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                required
                value={form.dosis_diaria}
                onChange={(e) => setForm((f) => ({ ...f, dosis_diaria: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de surtido (renovación) *</label>
              <input
                type="date"
                required
                value={form.fecha_surtido}
                onChange={(e) => setForm((f) => ({ ...f, fecha_surtido: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de tratamiento</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'cronico' | 'temporal' }))}
                className={inputClass}
              >
                <option value="cronico">Crónico (permanente)</option>
                <option value="temporal">Temporal (con fecha fin)</option>
              </select>
            </div>

            <div className="col-span-2 rounded-xl border border-slate-200/90 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.hubo_regalia}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hubo_regalia: e.target.checked,
                      unidades_regalia: e.target.checked ? f.unidades_regalia : '',
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-900"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    Hubo regalía por compra en esta renovación
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    Las unidades extra alargan la fecha de vencimiento respecto a solo la caja surtida.
                  </span>
                </span>
              </label>
              {form.hubo_regalia ? (
                <div className="mt-4 pl-7">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Unidades de regalía *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required={form.hubo_regalia}
                    value={form.unidades_regalia}
                    onChange={(e) => setForm((f) => ({ ...f, unidades_regalia: e.target.value }))}
                    className={`${inputClass} max-w-xs`}
                    placeholder="Ej: 30"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Se suman a las {Number(form.unidades_caja) || '—'} unidades de la caja para calcular el vencimiento (
                    {unidadesParaVencimiento || '—'} unidades en total).
                  </p>
                </div>
              ) : null}
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notas de la renovación (opcional)</label>
              <input
                type="text"
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                className={inputClass}
                placeholder="Ej: Paciente llevó 2 cajas"
              />
            </div>

            {fechaVencimientoPreview && (
              <div
                className="col-span-2 rounded-xl border border-brand-200/90 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-700/50 dark:from-slate-900 dark:to-slate-900/95 dark:ring-1 dark:ring-brand-900/30"
                role="status"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Nueva fecha de vencimiento:{' '}
                  <strong className="tabular-nums text-brand-700 dark:text-brand-400">{fechaVencimientoPreview}</strong>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {form.hubo_regalia && unidadesRegaliaNum > 0
                    ? `Incluye ${unidadesRegaliaNum} unidad${unidadesRegaliaNum !== 1 ? 'es' : ''} de regalía además de la caja. `
                    : null}
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
            className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar renovación'}
          </button>
        </div>
      </form>
    </div>
  )
}
