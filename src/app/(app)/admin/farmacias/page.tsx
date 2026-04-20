import { createClient } from '@/lib/supabase/server'
import FarmaciasAdminCliente, { type FarmaciaRow } from './FarmaciasAdminCliente'

export default async function FarmaciasAdminPage() {
  const supabase = await createClient()

  const { data: farmacias } = await supabase.from('farmacias').select('*').order('nombre', { ascending: true })

  return (
    <div className="mx-auto max-w-7xl p-6">
      <FarmaciasAdminCliente iniciales={(farmacias as FarmaciaRow[]) ?? []} />
    </div>
  )
}
