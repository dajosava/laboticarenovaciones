'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type EmpresaRow = {
  id: string
  nombre: string
}

type Props = {
  value: string
  onValueChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

const inputBase =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

export default function EmpresaCombobox({ value, onValueChange, required, disabled }: Props) {
  const supabase = createClient()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([])

  useEffect(() => {
    let ok = true
    ;(async () => {
      setCargando(true)
      const { data } = await supabase.from('empresas_catalogo').select('id, nombre').eq('activa', true).order('nombre')
      if (!ok) return
      setEmpresas((data ?? []) as EmpresaRow[])
      setCargando(false)
    })()
    return () => {
      ok = false
    }
  }, [supabase])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtradas = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return empresas.slice(0, 120)
    return empresas.filter((e) => e.nombre.toLowerCase().includes(needle)).slice(0, 120)
  }, [empresas, q])

  const labelSeleccionado = value.trim()

  return (
    <div ref={wrapRef} className="relative">
      <input type="hidden" value={labelSeleccionado} required={required} />
      <input
        type="search"
        autoComplete="off"
        disabled={disabled}
        placeholder={cargando ? 'Cargando empresas…' : 'Buscar empresa…'}
        value={abierto ? q : labelSeleccionado}
        onFocus={() => {
          setAbierto(true)
          setQ('')
        }}
        onChange={(e) => {
          setQ(e.target.value)
          setAbierto(true)
        }}
        className={cn(inputBase, disabled && 'cursor-not-allowed')}
      />
      {abierto && !disabled ? (
        <ul
          className="absolute z-[220] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-900"
          role="listbox"
        >
          {cargando ? (
            <li className="px-3 py-2 text-gray-500 dark:text-slate-400">Cargando…</li>
          ) : filtradas.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 dark:text-slate-400">Sin coincidencias.</li>
          ) : (
            filtradas.map((e) => (
              <li key={e.id} role="option">
                <button
                  type="button"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => {
                    onValueChange(e.nombre)
                    setAbierto(false)
                    setQ('')
                  }}
                  className="w-full px-3 py-2 text-left text-gray-900 hover:bg-green-50 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {e.nombre}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
