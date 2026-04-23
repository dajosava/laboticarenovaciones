'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  actualizarEmpresaCatalogo,
  crearEmpresaCatalogo,
  eliminarEmpresaCatalogo,
  establecerEmpresaActiva,
} from './actions'

export type EmpresaCatalogoRow = {
  id: string
  nombre: string
  activa: boolean
  creado_en: string
}

export default function EmpresasAdminCliente({ iniciales }: { iniciales: EmpresaCatalogoRow[] }) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalEditar, setModalEditar] = useState<EmpresaCatalogoRow | null>(null)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [nombreEdit, setNombreEdit] = useState('')

  async function onCrear() {
    setGuardando(true)
    const r = await crearEmpresaCatalogo(nombreNuevo)
    setGuardando(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success('Empresa creada')
    setModalNuevo(false)
    setNombreNuevo('')
    router.refresh()
  }

  async function onGuardarEdicion() {
    if (!modalEditar) return
    setGuardando(true)
    const r = await actualizarEmpresaCatalogo(modalEditar.id, nombreEdit)
    setGuardando(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success('Empresa actualizada')
    setModalEditar(null)
    router.refresh()
  }

  async function onEliminar(row: EmpresaCatalogoRow) {
    const msg =
      `¿Eliminar permanentemente «${row.nombre}» del catálogo?\n\n` +
      'Esto no borra el texto en fichas de pacientes que ya tengan esa empresa guardada; solo quita la opción del listado al dar de alta nuevos pacientes.'
    if (!window.confirm(msg)) return
    setGuardando(true)
    const r = await eliminarEmpresaCatalogo(row.id)
    setGuardando(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success('Empresa eliminada del catálogo')
    if (modalEditar?.id === row.id) setModalEditar(null)
    router.refresh()
  }

  async function toggleActiva(row: EmpresaCatalogoRow) {
    const siguiente = !row.activa
    const ok = siguiente
      ? true
      : window.confirm(`¿Desactivar «${row.nombre}»? Dejará de aparecer al registrar pacientes.`)
    if (!ok) return
    setGuardando(true)
    const r = await establecerEmpresaActiva(row.id, siguiente)
    setGuardando(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success(siguiente ? 'Empresa reactivada' : 'Empresa desactivada')
    router.refresh()
  }

  function abrirEditar(row: EmpresaCatalogoRow) {
    setNombreEdit(row.nombre)
    setModalEditar(row)
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Empresas</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Catálogo usado al registrar pacientes. Solo super administrador puede modificarlo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cuenta/configuracion"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Configuración
          </Link>
          <button
            type="button"
            onClick={() => {
              setNombreNuevo('')
              setModalNuevo(true)
            }}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700"
          >
            + Nueva empresa
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50/95 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Estado</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {iniciales.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.nombre}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      row.activa
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
                    )}
                  >
                    {row.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => abrirEditar(row)}
                    className="mr-3 font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => void toggleActiva(row)}
                    className="mr-3 font-medium text-slate-600 hover:underline disabled:opacity-50 dark:text-slate-400"
                  >
                    {row.activa ? 'Desactivar' : 'Reactivar'}
                  </button>
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => void onEliminar(row)}
                    title="Eliminar del catálogo"
                    aria-label={`Eliminar empresa «${row.nombre}» del catálogo`}
                    className="inline-flex rounded-lg p-1.5 text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/15"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {iniciales.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No hay empresas en el catálogo.</p>
        ) : null}
      </div>

      {modalNuevo ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nueva empresa</h2>
            <label className="mt-4 block text-xs font-semibold uppercase text-slate-500">Nombre *</label>
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Nombre legal o comercial"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => void onCrear()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalEditar ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar empresa</h2>
            <p className="mt-1 font-mono text-xs text-slate-500">{modalEditar.id}</p>
            <label className="mt-4 block text-xs font-semibold uppercase text-slate-500">Nombre *</label>
            <input
              value={nombreEdit}
              onChange={(e) => setNombreEdit(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalEditar(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => void onGuardarEdicion()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
