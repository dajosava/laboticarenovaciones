'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { marcarContactadoRenovacion, desmarcarContactadoRenovacion } from './actions'
import { toast } from 'sonner'

type Props = {
  tratamientoId: string
  contactado: boolean
}

export default function BotonContactadoRenovacion({ tratamientoId, contactado }: Props) {
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
        className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
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
      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
    >
      {loading ? '…' : 'Marcar contactado'}
    </button>
  )
}
