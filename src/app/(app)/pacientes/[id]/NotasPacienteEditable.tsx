'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PencilLine, StickyNote } from 'lucide-react'
import { PieSeccionFicha } from '@/components/pacientes/ficha-seccion'
import { actualizarNotasPaciente } from './actions'
import { LIMITES_CAMPOS } from '@/lib/limites-campos'

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

  const sinNotas = !notasIniciales?.trim() && !notas.trim()

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
      <div className="mt-3 space-y-2">
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Notas / preferencias
        </label>
        <textarea
          value={notas}
          maxLength={LIMITES_CAMPOS.notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          placeholder="Ej: El cliente prefiere que lo llamen; prefiere WhatsApp"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={guardando}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (sinNotas) {
    return (
      <PieSeccionFicha className="mt-3 flex flex-wrap items-center justify-between gap-2 border-amber-100 bg-amber-50/80 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
        <span className="font-medium text-amber-700 dark:text-amber-300">Sin notas.</span>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden />
          Añadir notas
        </button>
      </PieSeccionFicha>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="flex items-start gap-2">
        <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {notasIniciales}
        </p>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden />
          Editar
        </button>
      </div>
    </div>
  )
}
