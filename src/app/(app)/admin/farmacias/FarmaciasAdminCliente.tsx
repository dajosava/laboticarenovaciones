'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { actualizarFarmacia, crearFarmacia, eliminarFarmacia } from './actions'

const SEP_HORARIO = ' · Horario: '

export type FarmaciaRow = {
  id: string
  nombre: string
  direccion: string
  telefono: string | null
  ciudad: string | null
  activa: boolean
}

type FormState = {
  nombre: string
  ciudad: string
  direccion: string
  horario: string
  telefono: string
  activa: boolean
}

function splitDireccionHorario(direccion: string): { lugar: string; horario: string } {
  const i = direccion.indexOf(SEP_HORARIO)
  if (i === -1) return { lugar: direccion, horario: '' }
  return {
    lugar: direccion.slice(0, i).trim(),
    horario: direccion.slice(i + SEP_HORARIO.length).trim(),
  }
}

function unirDireccionHorario(direccion: string, horario: string): string {
  const lugar = direccion.trim()
  const horas = horario.trim()
  if (!horas) return lugar
  return `${lugar}${SEP_HORARIO}${horas}`
}

const formVacio: FormState = {
  nombre: '',
  ciudad: '',
  direccion: '',
  horario: '',
  telefono: '',
  activa: true,
}

export default function FarmaciasAdminCliente({ iniciales }: { iniciales: FarmaciaRow[] }) {
  const [lista, setLista] = useState(iniciales)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(formVacio)

  const total = lista.length
  const activas = lista.filter((f) => f.activa).length

  function abrirNuevo() {
    setEditId(null)
    setForm(formVacio)
    setModalAbierto(true)
  }

  function abrirEditar(f: FarmaciaRow) {
    const { lugar, horario } = splitDireccionHorario(f.direccion)
    setEditId(f.id)
    setForm({
      nombre: f.nombre ?? '',
      ciudad: f.ciudad ?? '',
      direccion: lugar,
      horario,
      telefono: f.telefono ?? '',
      activa: f.activa,
    })
    setModalAbierto(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!form.direccion.trim()) {
      toast.error('La dirección es obligatoria')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre,
        ciudad: form.ciudad || null,
        direccion: unirDireccionHorario(form.direccion, form.horario),
        telefono: form.telefono || null,
        activa: form.activa,
      }

      if (editId) {
        const r = await actualizarFarmacia(editId, payload)
        if (r.error) {
          toast.error(r.error)
          return
        }
        setLista((prev) =>
          prev.map((f) =>
            f.id === editId
              ? {
                  ...f,
                  ...payload,
                }
              : f,
          ),
        )
        toast.success('Sucursal actualizada')
      } else {
        const r = await crearFarmacia(payload)
        if (r.error || !r.id) {
          toast.error(r.error ?? 'No se pudo crear la sucursal')
          return
        }
        setLista((prev) => [
          ...prev,
          {
            id: r.id,
            ...payload,
          },
        ])
        toast.success('Sucursal creada')
      }

      setModalAbierto(false)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    const ok = window.confirm('¿Seguro que quieres eliminar esta sucursal? Esta acción no se puede deshacer.')
    if (!ok) return

    setEliminandoId(id)
    try {
      const r = await eliminarFarmacia(id)
      if (r.error) {
        toast.error(r.error)
        return
      }
      setLista((prev) => prev.filter((f) => f.id !== id))
      toast.success('Sucursal eliminada')
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sucursales</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {total} sede{total === 1 ? '' : 's'} · {activas} activa{activas === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          + Nueva sucursal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lista.map((f) => {
          const { lugar, horario } = splitDireccionHorario(f.direccion)
          return (
            <article
              key={f.id}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold leading-snug text-slate-900 dark:text-white">{f.nombre}</h2>
                  {f.ciudad ? <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{f.ciudad}</p> : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    f.activa ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 text-red-800 dark:text-red-300'
                  }`}
                >
                  {f.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-medium text-slate-500 dark:text-slate-400">Ubicación: </span>
                  {lugar}
                </p>
                {horario ? (
                  <p>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Horario: </span>
                    {horario}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium text-slate-500 dark:text-slate-400">Teléfono: </span>
                  {f.telefono?.trim() ? f.telefono : <span className="italic text-slate-400">No registrado</span>}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEditar(f)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void eliminar(f.id)}
                  disabled={eliminandoId === f.id}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  {eliminandoId === f.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {lista.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-600 dark:text-slate-300">Sin farmacias registradas</p>
        </div>
      ) : null}

      {modalAbierto ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editId ? 'Editar sucursal' : 'Nueva sucursal'}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Ciudad</label>
                <input
                  value={form.ciudad}
                  onChange={(e) => setForm((v) => ({ ...v, ciudad: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm((v) => ({ ...v, telefono: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Dirección *</label>
                <input
                  value={form.direccion}
                  onChange={(e) => setForm((v) => ({ ...v, direccion: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Horario (opcional)</label>
                <input
                  value={form.horario}
                  onChange={(e) => setForm((v) => ({ ...v, horario: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => setForm((v) => ({ ...v, activa: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                Sucursal activa
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => void guardar()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear sucursal'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
