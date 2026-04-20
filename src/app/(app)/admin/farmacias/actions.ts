'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type FarmaciaInput = {
  nombre: string
  ciudad?: string | null
  direccion: string
  telefono?: string | null
  activa: boolean
}

function limpiar(v?: string | null): string | null {
  const t = v?.trim()
  return t ? t : null
}

export async function crearFarmacia(input: FarmaciaInput): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const nombre = input.nombre.trim()
  const direccion = input.direccion.trim()
  if (!nombre) return { error: 'El nombre es obligatorio' }
  if (!direccion) return { error: 'La dirección es obligatoria' }

  const { data, error } = await supabase
    .from('farmacias')
    .insert({
      nombre,
      ciudad: limpiar(input.ciudad),
      direccion,
      telefono: limpiar(input.telefono),
      activa: input.activa,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/farmacias')
  return { id: data?.id as string }
}

export async function actualizarFarmacia(id: string, input: FarmaciaInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const nombre = input.nombre.trim()
  const direccion = input.direccion.trim()
  if (!nombre) return { error: 'El nombre es obligatorio' }
  if (!direccion) return { error: 'La dirección es obligatoria' }

  const { error } = await supabase
    .from('farmacias')
    .update({
      nombre,
      ciudad: limpiar(input.ciudad),
      direccion,
      telefono: limpiar(input.telefono),
      activa: input.activa,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/farmacias')
  return {}
}

export async function eliminarFarmacia(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('farmacias').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/farmacias')
  return {}
}
