import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FormularioRenovarTratamiento from './FormularioRenovarTratamiento'

export default async function RenovarTratamientoPage({
  params,
}: {
  params: Promise<{ id: string; tratamientoId: string }>
}) {
  const { id: pacienteId, tratamientoId } = await params
  const supabase = await createClient()

  const { data: tratamiento } = await supabase
    .from('tratamientos')
    .select('*')
    .eq('id', tratamientoId)
    .eq('paciente_id', pacienteId)
    .single()

  if (!tratamiento) notFound()

  return (
    <FormularioRenovarTratamiento
      pacienteId={pacienteId}
      tratamiento={tratamiento}
    />
  )
}
