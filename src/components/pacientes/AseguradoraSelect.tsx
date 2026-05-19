'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSupabaseBrowser } from '@/lib/supabase/use-supabase-browser'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onValueChange: (value: string) => void
  className?: string
  /** Valor guardado en paciente que ya no está en catálogo activo */
  valorLegacy?: string | null
  disabled?: boolean
}

export default function AseguradoraSelect({ value, onValueChange, className, valorLegacy, disabled }: Props) {
  const supabase = useSupabaseBrowser()
  const [cargando, setCargando] = useState(true)
  const [nombres, setNombres] = useState<string[]>([])

  useEffect(() => {
    let activo = true
    ;(async () => {
      setCargando(true)
      const { data } = await supabase
        .from('aseguradoras_catalogo')
        .select('nombre')
        .eq('activa', true)
        .order('nombre')
      if (!activo) return
      setNombres((data ?? []).map((r) => String(r.nombre)))
      setCargando(false)
    })()
    return () => {
      activo = false
    }
  }, [supabase])

  const opciones = useMemo(() => {
    const extra = (valorLegacy ?? value).trim()
    if (extra && !nombres.some((n) => n.toLowerCase() === extra.toLowerCase())) {
      return [...nombres, extra]
    }
    return nombres
  }, [nombres, valorLegacy, value])

  return (
    <select
      className={cn(className)}
      value={value}
      disabled={disabled || cargando}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">{cargando ? 'Cargando aseguradoras…' : 'Seleccionar…'}</option>
      {opciones.map((nombre) => (
        <option key={nombre} value={nombre}>
          {nombre}
        </option>
      ))}
    </select>
  )
}
