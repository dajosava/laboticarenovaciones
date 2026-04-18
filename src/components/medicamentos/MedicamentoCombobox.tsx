'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { etiquetaMedicamentoCatalogo } from '@/lib/medicamentos-import'
import { cn } from '@/lib/utils'
import type { Rol } from '@/types'

export type MedicamentoCatalogoRow = {
  id: string
  codigo: string | null
  descripcion: string | null
  nombre: string
  marca: string | null
  concentracion: string | null
}

type Props = {
  /** id del medicamento en catálogo o vacío si no hay selección */
  medicamentoId: string
  onMedicamentoChange: (row: MedicamentoCatalogoRow | null) => void
  disabled?: boolean
  /** Si no se pasa, se intenta leer el rol del usuario en cliente */
  rolEmpleado?: Rol
  className?: string
}

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100'

export default function MedicamentoCombobox({
  medicamentoId,
  onMedicamentoChange,
  disabled,
  rolEmpleado,
  className,
}: Props) {
  const supabase = createClient()
  const [lista, setLista] = useState<MedicamentoCatalogoRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [rolDetectado, setRolDetectado] = useState<Rol | null>(rolEmpleado ?? null)
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (rolEmpleado) setRolDetectado(rolEmpleado)
  }, [rolEmpleado])

  useEffect(() => {
    if (rolEmpleado) return
    let ok = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!ok || !user) return
      const { data } = await supabase.from('empleados').select('rol').eq('id', user.id).maybeSingle()
      if (!ok) return
      if (data?.rol) setRolDetectado(data.rol as Rol)
    })()
    return () => {
      ok = false
    }
  }, [supabase, rolEmpleado])

  useEffect(() => {
    let ok = true
    ;(async () => {
      setCargando(true)
      const { data, error } = await supabase
        .from('medicamentos')
        .select('id, codigo, descripcion, nombre, marca, concentracion')
        .eq('activo', true)
        .order('codigo', { ascending: true })
        .order('descripcion', { ascending: true })
      if (!ok) return
      if (error) {
        setLista([])
      } else {
        setLista((data as MedicamentoCatalogoRow[]) ?? [])
      }
      setCargando(false)
    })()
    return () => {
      ok = false
    }
  }, [supabase])

  const seleccionado = useMemo(
    () => lista.find((m) => m.id === medicamentoId) ?? null,
    [lista, medicamentoId],
  )

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtrados = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return lista.slice(0, 80)
    return lista
      .filter((m) => {
        const blob = etiquetaMedicamentoCatalogo(m).toLowerCase()
        return blob.includes(n)
      })
      .slice(0, 80)
  }, [lista, q])

  const etiquetaSeleccion = seleccionado ? etiquetaMedicamentoCatalogo(seleccionado) : ''

  const elegir = useCallback(
    (row: MedicamentoCatalogoRow | null) => {
      onMedicamentoChange(row)
      setQ('')
      setAbierto(false)
    },
    [onMedicamentoChange],
  )

  const puedeGestionar = rolDetectado === 'super_admin' || rolDetectado === 'admin_sucursal'

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Medicamento del catálogo *
      </label>
      {seleccionado && !abierto ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setAbierto(true)}
            className={cn(inputBase, 'text-left', disabled && 'cursor-not-allowed opacity-60')}
          >
            {etiquetaSeleccion}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && elegir(null)}
            className="shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            autoComplete="off"
            disabled={disabled || cargando}
            placeholder={cargando ? 'Cargando catálogo…' : 'Buscar por código (MED-…) o descripción…'}
            value={abierto ? q : seleccionado ? etiquetaSeleccion : q}
            onChange={(e) => {
              setQ(e.target.value)
              setAbierto(true)
            }}
            onFocus={() => setAbierto(true)}
            className={cn(inputBase, disabled && 'cursor-not-allowed opacity-60')}
          />
          {abierto && !cargando ? (
            <ul
              className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-900"
              role="listbox"
            >
              {filtrados.length === 0 ? (
                <li className="px-3 py-2 text-slate-500 dark:text-slate-400">Sin coincidencias.</li>
              ) : (
                filtrados.map((m) => (
                  <li key={m.id} role="option">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => elegir(m)}
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {m.codigo?.trim() ? (
                          <>
                            <span className="font-mono text-xs text-brand-700 dark:text-brand-400">{m.codigo}</span>
                            <span className="mx-1.5 text-slate-400">·</span>
                          </>
                        ) : null}
                        <span>{m.descripcion ?? m.nombre}</span>
                      </span>
                      {!m.codigo?.trim() && (m.marca || m.concentracion) ? (
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {[m.marca, m.concentracion].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </>
      )}
      {puedeGestionar ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          ¿Falta alguno?{' '}
          <Link href="/admin/medicamentos" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Gestionar medicamentos
          </Link>
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Si no aparece en la lista, pide a un administrador que lo agregue en Medicamentos.
        </p>
      )}
    </div>
  )
}
