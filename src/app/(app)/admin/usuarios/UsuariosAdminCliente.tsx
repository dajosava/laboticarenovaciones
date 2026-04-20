'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { actualizarEmpleado, crearEmpleado, resolverUuidPorCorreo } from './actions'
import type { Rol } from '@/types'
import { cn } from '@/lib/utils'

export type EmpleadoListRow = {
  id: string
  nombre: string
  email: string
  rol: Rol
  farmacia_id: string | null
  activo: boolean
  creado_en: string
  farmacia?: { nombre: string } | null
}

type FarmaciaOpt = { id: string; nombre: string }

const ROLES: { value: Rol; label: string }[] = [
  { value: 'super_admin', label: 'Super administrador' },
  { value: 'admin_sucursal', label: 'Admin sucursal' },
  { value: 'empleado', label: 'Empleado' },
]

type FormState = {
  authUserId: string
  nombre: string
  email: string
  rol: Rol
  farmaciaId: string
  activo: boolean
}

const formNuevoVacio: FormState = {
  authUserId: '',
  nombre: '',
  email: '',
  rol: 'empleado',
  farmaciaId: '',
  activo: true,
}

export default function UsuariosAdminCliente({
  iniciales,
  farmacias,
}: {
  iniciales: EmpleadoListRow[]
  farmacias: FarmaciaOpt[]
}) {
  const router = useRouter()
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalEditar, setModalEditar] = useState<EmpleadoListRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [buscandoUuid, setBuscandoUuid] = useState(false)

  const [nuevo, setNuevo] = useState<FormState>(formNuevoVacio)
  const [edit, setEdit] = useState<FormState | null>(null)

  const farmaciaNombre = useMemo(() => {
    const m = new Map(farmacias.map((f) => [f.id, f.nombre]))
    return (id: string | null) => (id ? m.get(id) ?? '—' : '—')
  }, [farmacias])

  function abrirNuevo() {
    setNuevo(formNuevoVacio)
    setModalNuevo(true)
  }

  function abrirEditar(row: EmpleadoListRow) {
    setEdit({
      authUserId: row.id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol,
      farmaciaId: row.farmacia_id ?? '',
      activo: row.activo,
    })
    setModalEditar(row)
  }

  async function onBuscarCorreoNuevo() {
    const email = nuevo.email.trim()
    if (!email) {
      toast.error('Escribe primero el correo del usuario')
      return
    }
    setBuscandoUuid(true)
    try {
      const r = await resolverUuidPorCorreo(email)
      if (r.error) {
        toast.error(r.error)
        return
      }
      setNuevo((s) => ({ ...s, authUserId: r.id ?? '', email: r.email ?? s.email }))
      toast.success('UUID encontrado en Authentication')
    } finally {
      setBuscandoUuid(false)
    }
  }

  async function onCrear() {
    setGuardando(true)
    try {
      const farmaciaId = nuevo.rol === 'super_admin' ? null : nuevo.farmaciaId || null
      const r = await crearEmpleado({
        authUserId: nuevo.authUserId,
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        farmaciaId,
      })
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success('Empleado registrado: ya puede iniciar sesión en el panel')
      setModalNuevo(false)
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  async function onGuardarEdicion() {
    if (!modalEditar || !edit) return
    setGuardando(true)
    try {
      const farmaciaId = edit.rol === 'super_admin' ? null : edit.farmaciaId || null
      const r = await actualizarEmpleado(modalEditar.id, {
        nombre: edit.nombre,
        email: edit.email,
        rol: edit.rol,
        farmaciaId,
        activo: edit.activo,
      })
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success('Cambios guardados')
      setModalEditar(null)
      setEdit(null)
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Usuarios del sistema</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Cada persona debe existir primero en <strong>Supabase → Authentication</strong>. Luego vincula su cuenta al
            perfil <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">empleados</code> con el mismo{' '}
            <strong>UUID</strong> (User UID). Solo super administrador ve esta pantalla.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          + Nuevo empleado
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50/95 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Correo</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Sucursal</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Estado</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {iniciales.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.nombre}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.email}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {row.rol === 'super_admin' ? 'Super admin' : row.rol === 'admin_sucursal' ? 'Admin sucursal' : 'Empleado'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{farmaciaNombre(row.farmacia_id)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      row.activo
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200/80 text-slate-600 dark:text-slate-400',
                    )}
                  >
                    {row.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => abrirEditar(row)}
                    className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {iniciales.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No hay empleados registrados.</p>
        ) : null}
      </div>

      {modalNuevo ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo empleado</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              UUID = User UID en Authentication. Puedes pegarlo a mano o buscarlo por correo (requiere service role en el servidor).
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Correo (Auth)</label>
                <div className="flex gap-2">
                  <input
                    value={nuevo.email}
                    onChange={(e) => setNuevo((s) => ({ ...s, email: e.target.value }))}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="nuevo@empresa.com"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    disabled={buscandoUuid}
                    onClick={() => void onBuscarCorreoNuevo()}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    {buscandoUuid ? '…' : 'Buscar UUID'}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">UUID usuario (Auth) *</label>
                <input
                  value={nuevo.authUserId}
                  onChange={(e) => setNuevo((s) => ({ ...s, authUserId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nombre en sistema *</label>
                <input
                  value={nuevo.nombre}
                  onChange={(e) => setNuevo((s) => ({ ...s, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Rol *</label>
                <select
                  value={nuevo.rol}
                  onChange={(e) => setNuevo((s) => ({ ...s, rol: e.target.value as Rol, farmaciaId: e.target.value === 'super_admin' ? '' : s.farmaciaId }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {nuevo.rol !== 'super_admin' ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Sucursal *</label>
                  <select
                    value={nuevo.farmaciaId}
                    onChange={(e) => setNuevo((s) => ({ ...s, farmaciaId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Seleccionar…</option>
                    {farmacias.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() => void onCrear()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalEditar && edit ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar empleado</h2>
            <p className="mt-1 font-mono text-xs text-slate-500">ID: {modalEditar.id}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Correo</label>
                <input
                  value={edit.email}
                  onChange={(e) => setEdit((s) => (s ? { ...s, email: e.target.value } : s))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nombre *</label>
                <input
                  value={edit.nombre}
                  onChange={(e) => setEdit((s) => (s ? { ...s, nombre: e.target.value } : s))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Rol *</label>
                <select
                  value={edit.rol}
                  onChange={(e) =>
                    setEdit((s) =>
                      s
                        ? {
                            ...s,
                            rol: e.target.value as Rol,
                            farmaciaId: e.target.value === 'super_admin' ? '' : s.farmaciaId,
                          }
                        : s,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {edit.rol !== 'super_admin' ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Sucursal *</label>
                  <select
                    value={edit.farmaciaId}
                    onChange={(e) => setEdit((s) => (s ? { ...s, farmaciaId: e.target.value } : s))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Seleccionar…</option>
                    {farmacias.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={edit.activo}
                  onChange={(e) => setEdit((s) => (s ? { ...s, activo: e.target.checked } : s))}
                  className="rounded border-slate-300"
                />
                Cuenta activa
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalEditar(null)
                  setEdit(null)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600"
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
