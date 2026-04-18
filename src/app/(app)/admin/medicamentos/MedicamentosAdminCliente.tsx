'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { parseMedicamentosPegado } from '@/lib/medicamentos-import'
import { actualizarMedicamento, crearMedicamento, importarMedicamentosDesdeTexto } from './actions'

export type MedicamentoRow = {
  id: string
  codigo: string | null
  descripcion: string | null
  nombre: string
  marca: string | null
  concentracion: string | null
  activo: boolean
  creado_en: string
}

type Props = {
  iniciales: MedicamentoRow[]
}

export default function MedicamentosAdminCliente({ iniciales }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qEnUrl = searchParams.get('q') ?? ''
  const soloActivosEnUrl = searchParams.get('solo') !== '0'

  const [soloActivosLocal, setSoloActivosLocal] = useState(soloActivosEnUrl)
  const [busquedaLocal, setBusquedaLocal] = useState(qEnUrl)
  const [pegado, setPegado] = useState('')
  const inputBusquedaRef = useRef<HTMLInputElement>(null)
  const busquedaRef = useRef(busquedaLocal)
  busquedaRef.current = busquedaLocal
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ codigo: '', descripcion: '' })
  const [guardando, setGuardando] = useState(false)

  const filas = iniciales

  useEffect(() => {
    const enBusqueda = document.activeElement === inputBusquedaRef.current
    setSoloActivosLocal(soloActivosEnUrl)
    if (enBusqueda) {
      if (busquedaRef.current.trim() !== qEnUrl.trim()) return
      setBusquedaLocal(qEnUrl)
      return
    }
    setBusquedaLocal(qEnUrl)
  }, [qEnUrl, soloActivosEnUrl])

  useEffect(() => {
    const curQ = (searchParams.get('q') ?? '').trim()
    const curSolo = searchParams.get('solo') !== '0'
    if (busquedaLocal.trim() === curQ && soloActivosLocal === curSolo) return

    const t = window.setTimeout(() => {
      const p = new URLSearchParams()
      if (busquedaLocal.trim()) p.set('q', busquedaLocal.trim())
      if (!soloActivosLocal) p.set('solo', '0')
      const qs = p.toString()
      router.replace(qs ? `/admin/medicamentos?${qs}` : '/admin/medicamentos')
    }, 380)
    return () => window.clearTimeout(t)
  }, [busquedaLocal, soloActivosLocal, router, searchParams.toString()])

  const previewCount = pegado.trim() ? parseMedicamentosPegado(pegado).length : 0

  function abrirNuevo() {
    setForm({ codigo: '', descripcion: '' })
    setEditId(null)
    setModal('nuevo')
  }

  function abrirEditar(m: MedicamentoRow) {
    setForm({
      codigo: m.codigo ?? '',
      descripcion: (m.descripcion ?? m.nombre).trim(),
    })
    setEditId(m.id)
    setModal('editar')
  }

  async function guardarModal() {
    setGuardando(true)
    try {
      if (modal === 'nuevo') {
        const r = await crearMedicamento({
          codigo: form.codigo.trim() || null,
          descripcion: form.descripcion,
        })
        if (r.error) {
          toast.error(r.error)
          return
        }
        toast.success('Medicamento creado')
      } else if (modal === 'editar' && editId) {
        const r = await actualizarMedicamento(editId, {
          codigo: form.codigo.trim() || null,
          descripcion: form.descripcion,
        })
        if (r.error) {
          toast.error(r.error)
          return
        }
        toast.success('Cambios guardados')
      }
      setModal(null)
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(m: MedicamentoRow) {
    const desc = (m.descripcion ?? m.nombre).trim()
    const r = await actualizarMedicamento(m.id, {
      descripcion: desc,
      activo: !m.activo,
    })
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success(m.activo ? 'Medicamento desactivado' : 'Medicamento reactivado')
    router.refresh()
  }

  async function importar() {
    setGuardando(true)
    try {
      const r = await importarMedicamentosDesdeTexto(pegado)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success(`Importación: ${r.insertados ?? 0} nuevos, ${r.omitidos ?? 0} duplicados omitidos`)
      setPegado('')
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Importar desde Excel
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Copia las columnas <strong>Número de artículo</strong> y <strong>Descripción del artículo</strong> desde Excel
          (deben quedar separadas por <strong>tabulador</strong>, una fila por medicamento). Si la primera celda empieza
          por <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">MED-</code>, se interpreta como código +
          descripción.
        </p>
        <textarea
          value={pegado}
          onChange={(e) => setPegado(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 font-mono text-xs text-slate-800 shadow-inner outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          placeholder={'Ejemplo (TSV):\nMED-00004\tAbrilar Jarabe X 100mL\nMED-00009\tAceite Castor Lacofa 60mL'}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={guardando || previewCount === 0}
            onClick={() => void importar()}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importar {previewCount > 0 ? `(${previewCount} filas)` : ''}
          </button>
          {previewCount > 0 ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">Vista previa: {previewCount} filas detectadas</span>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputBusquedaRef}
            type="search"
            value={busquedaLocal}
            onChange={(e) => setBusquedaLocal(e.target.value)}
            placeholder="Buscar en todo el catálogo (código, descripción, nombre…)"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 sm:max-w-md"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={soloActivosLocal}
              onChange={(e) => setSoloActivosLocal(e.target.checked)}
              className="rounded border-slate-300"
            />
            Solo activos
          </label>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          Nuevo medicamento
        </button>
      </div>

      <div className="max-h-[min(75vh,calc(3.25rem+15*3rem))] overflow-y-auto overflow-x-auto scroll-smooth rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="sticky top-0 z-10 bg-slate-50/95 shadow-sm backdrop-blur-sm dark:bg-slate-800/95">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Nº artículo</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Descripción</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Estado</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filas.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-200">
                  {m.codigo?.trim() ? m.codigo : '—'}
                </td>
                <td className="max-w-xl px-4 py-3 text-slate-900 dark:text-slate-100">{m.descripcion ?? m.nombre}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.activo
                        ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300'
                        : 'rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400'
                    }
                  >
                    {m.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => abrirEditar(m)}
                    className="mr-2 font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActivo(m)}
                    className="font-medium text-slate-600 hover:underline dark:text-slate-300"
                  >
                    {m.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filas.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No hay medicamentos que coincidan.</p>
        ) : null}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {modal === 'nuevo' ? 'Nuevo medicamento' : 'Editar medicamento'}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Número de artículo</label>
                <input
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Ej: MED-00004"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Descripción del artículo *</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Texto completo como en inventario / receta"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando || !form.descripcion.trim()}
                onClick={() => void guardarModal()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
