'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { eliminarPaciente } from './actions'

export default function BotonEliminarPaciente({ pacienteId, nombre }: { pacienteId: string; nombre: string }) {
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
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
    >
      {isPending ? 'Eliminando...' : 'Eliminar paciente'}
    </button>
  )
}
