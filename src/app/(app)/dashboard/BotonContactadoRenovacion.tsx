'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { marcarContactadoRenovacion, desmarcarContactadoRenovacion } from './actions'
import { toast } from 'sonner'

type Props = {
  tratamientoId: string
  contactado: boolean
  variant?: 'default' | 'ficha'
}

export default function BotonContactadoRenovacion({ tratamientoId, contactado, variant = 'default' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarcar() {
    setLoading(true)
    const { error } = await marcarContactadoRenovacion(tratamientoId)
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Marcado como contactado')
    router.refresh()
  }

  async function handleDesmarcar() {
    setLoading(true)
    const { error } = await desmarcarContactadoRenovacion(tratamientoId)
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Desmarcado; volverá a aparecer en pendientes')
    router.refresh()
  }

  if (contactado) {
    return (
      <button
        type="button"
        onClick={handleDesmarcar}
        disabled={loading}
        className={
          variant === 'ficha'
            ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            : 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-700 disabled:opacity-50'
        }
      >
        {loading ? '…' : 'Desmarcar'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleMarcar}
      disabled={loading}
      className={
        variant === 'ficha'
          ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50'
          : 'rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition hover:bg-green-700 disabled:opacity-50'
      }
    >
      {variant === 'ficha' ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {loading ? '…' : 'Marcar contactado'}
    </button>
  )
}
