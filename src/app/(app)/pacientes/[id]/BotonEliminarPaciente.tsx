'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { eliminarPaciente } from './actions'

export default function BotonEliminarPaciente({
  pacienteId,
  nombre,
  variant = 'default',
}: {
  pacienteId: string
  nombre: string
  variant?: 'default' | 'ficha'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`¿Eliminar al paciente "${nombre}"? Se borrarán también sus tratamientos y renovaciones. Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const result = await eliminarPaciente(pacienteId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Paciente eliminado')
      router.push('/pacientes')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        variant === 'ficha'
          ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30'
          : 'rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50'
      }
    >
      {variant === 'ficha' ? <Trash2 className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {isPending ? 'Eliminando...' : variant === 'ficha' ? 'Eliminar' : 'Eliminar paciente'}
    </button>
  )
}
