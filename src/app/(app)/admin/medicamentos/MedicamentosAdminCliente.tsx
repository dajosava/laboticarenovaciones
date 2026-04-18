'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarMedicamento, crearMedicamento, importarMedicamentosDesdeTexto } from './actions'

/**
 * Carga masiva desde Excel (pegar como TSV). Por defecto está oculta en la UI.
 * Para volver a mostrar el panel: cambia a `true`, guarda y recarga `/admin/medicamentos`.
 */
const MOSTRAR_SECCION_IMPORT_MASIVO = false

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
  const inputBusquedaRef = useRef<HTMLInputElement>(null)
  const busquedaRef = useRef(busquedaLocal)
  busquedaRef.current = busquedaLocal

  const [altaCodigo, setAltaCodigo] = useState('')
  const [altaDescripcion, setAltaDescripcion] = useState('')
  const [altaPanelAbierto, setAltaPanelAbierto] = useState(true)
  const [textoImportMasivo, setTextoImportMasivo] = useState('')
  const [importandoMasivo, setImportandoMasivo] = useState(false)

  const [modalEditar, setModalEditar] = useState(false)
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

  function abrirEditar(m: MedicamentoRow) {
    setForm({
      codigo: m.codigo ?? '',
      descripcion: (m.descripcion ?? m.nombre).trim(),
    })
    setEditId(m.id)
    setModalEditar(true)
  }

  async function registrarAlta(e: React.FormEvent) {
    e.preventDefault()
    if (!altaDescripcion.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }
    setGuardando(true)
    try {
      const r = await crearMedicamento({
        codigo: altaCodigo.trim() || null,
        descripcion: altaDescripcion,
      })
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success('Medicamento registrado')
      setAltaCodigo('')
      setAltaDescripcion('')
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  async function guardarEdicion() {
    if (!editId) return
    setGuardando(true)
    try {
      const r = await actualizarMedicamento(editId, {
        codigo: form.codigo.trim() || null,
        descripcion: form.descripcion,
      })
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success('Cambios guardados')
      setModalEditar(false)
      setEditId(null)
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

  async function ejecutarImportMasivo() {
    if (!textoImportMasivo.trim()) {
      toast.error('Pega primero las filas copiadas desde Excel')
      return
    }
    setImportandoMasivo(true)
    try {
      const r = await importarMedicamentosDesdeTexto(textoImportMasivo)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success(
        `Importación listada: ${r.insertados ?? 0} nuevos · ${r.omitidos ?? 0} omitidos (duplicados por código o descripción)`,
      )
      setTextoImportMasivo('')
      router.refresh()
    } finally {
      setImportandoMasivo(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:p-6">
        <button
          type="button"
          id="toggle-alta-medicamento"
          onClick={() => setAltaPanelAbierto((v) => !v)}
          aria-expanded={altaPanelAbierto}
          aria-controls="panel-alta-medicamento"
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all duration-200 ease-out hover:border-slate-200 hover:bg-slate-100/90 hover:shadow-md active:scale-[0.995] dark:hover:border-slate-600 dark:hover:bg-slate-800/80 dark:hover:shadow-lg dark:hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 transition-colors duration-200 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-100">
            Agregar medicamento
          </h2>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-slate-400 transition-all duration-200 ease-out group-hover:text-brand-600 dark:text-slate-500 dark:group-hover:text-brand-400 ${altaPanelAbierto ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        <div
          id="panel-alta-medicamento"
          role="region"
          aria-labelledby="toggle-alta-medicamento"
          hidden={!altaPanelAbierto}
          className={altaPanelAbierto ? 'mt-3' : ''}
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Mismo formato que inventario: <strong>Número de artículo</strong> (opcional, ej. MED-00004) y{' '}
            <strong>Descripción del artículo</strong> (obligatoria).
          </p>
          <form onSubmit={(e) => void registrarAlta(e)} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="alta-codigo" className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Número de artículo
              </label>
              <input
                id="alta-codigo"
                type="text"
                value={altaCodigo}
                onChange={(e) => setAltaCodigo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Ej: MED-00004"
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="alta-descripcion" className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Descripción del artículo *
              </label>
              <textarea
                id="alta-descripcion"
                value={altaDescripcion}
                onChange={(e) => setAltaDescripcion(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Texto completo como en inventario / receta"
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={guardando || !altaDescripcion.trim()}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Registrar medicamento'}
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  setAltaCodigo('')
                  setAltaDescripcion('')
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Limpiar campos
              </button>
            </div>
          </form>
        </div>
      </section>

      {MOSTRAR_SECCION_IMPORT_MASIVO ? (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Importación masiva (Excel)
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Copia desde Excel filas con <strong className="text-slate-800 dark:text-slate-100">número de artículo (MED-…)</strong> y{' '}
            <strong className="text-slate-800 dark:text-slate-100">descripción</strong> separados por <strong>tabulador</strong> (una fila por
            medicamento). Se omiten líneas duplicadas respecto al catálogo actual.
          </p>
          <textarea
            value={textoImportMasivo}
            onChange={(e) => setTextoImportMasivo(e.target.value)}
            rows={10}
            placeholder={'MED-00001\tDescripción del artículo…\nMED-00002\tOtro medicamento…'}
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            spellCheck={false}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={importandoMasivo || !textoImportMasivo.trim()}
              onClick={() => void ejecutarImportMasivo()}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importandoMasivo ? 'Importando…' : 'Importar al catálogo'}
            </button>
            <button
              type="button"
              disabled={importandoMasivo}
              onClick={() => setTextoImportMasivo('')}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Limpiar pegado
            </button>
          </div>
        </section>
      ) : null}

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

      {modalEditar ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar medicamento</h3>
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
                onClick={() => {
                  setModalEditar(false)
                  setEditId(null)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando || !form.descripcion.trim()}
                onClick={() => void guardarEdicion()}
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
