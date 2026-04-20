'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { actualizarNotasPaciente } from './actions'

export default function NotasPacienteEditable({
  pacienteId,
  notasIniciales,
}: {
  pacienteId: string
  notasIniciales: string | null
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [notas, setNotas] = useState(notasIniciales ?? '')
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    const result = await actualizarNotasPaciente(pacienteId, notas)
    setGuardando(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Notas actualizadas')
    setEditando(false)
    router.refresh()
  }

  function cancelar() {
    setNotas(notasIniciales ?? '')
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
        <label className="block text-xs font-semibold text-amber-800 mb-1">📝 Notas / preferencias</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          placeholder="Ej: El cliente prefiere que lo llamen; prefiere WhatsApp"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="text-sm font-medium px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={guardando}
            className="text-sm font-medium px-3 py-1.5 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (!notasIniciales && !notas.trim()) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-gray-400">Sin notas.</span>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Añadir notas
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-start gap-2">
      <p className="flex-1 text-sm text-emerald-700 dark:text-emerald-300">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">📝 </span>
        {notasIniciales}
      </p>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-sm font-medium text-green-600 hover:text-green-700 whitespace-nowrap"
      >
        Editar
      </button>
    </div>
  )
}
