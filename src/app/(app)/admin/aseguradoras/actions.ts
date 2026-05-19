'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireSuperAdmin(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>> } | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: empleado } = await supabase.from('empleados').select('rol, activo').eq('id', user.id).single()
  if (!empleado?.activo || empleado.rol !== 'super_admin') {
    return { error: 'Solo el super administrador puede gestionar el catálogo de aseguradoras.' }
  }

  return { supabase }
}

export async function crearAseguradoraCatalogo(nombre: string): Promise<{ error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const n = nombre.trim()
  if (!n) return { error: 'El nombre de la aseguradora es obligatorio.' }
  if (n.length > 200) return { error: 'El nombre no puede superar 200 caracteres.' }

  const { error } = await gate.supabase.from('aseguradoras_catalogo').insert({ nombre: n, activa: true })
  if (error) {
    if (error.code === '23505') return { error: 'Ya existe una aseguradora con ese nombre (ignorando mayúsculas).' }
    return { error: error.message }
  }

  revalidatePath('/admin/aseguradoras')
  revalidatePath('/pacientes/nuevo')
  return {}
}

export async function actualizarAseguradoraCatalogo(id: string, nombre: string): Promise<{ error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const n = nombre.trim()
  if (!n) return { error: 'El nombre de la aseguradora es obligatorio.' }
  if (n.length > 200) return { error: 'El nombre no puede superar 200 caracteres.' }

  const { error } = await gate.supabase.from('aseguradoras_catalogo').update({ nombre: n }).eq('id', id)
  if (error) {
    if (error.code === '23505') return { error: 'Ya existe una aseguradora con ese nombre (ignorando mayúsculas).' }
    return { error: error.message }
  }

  revalidatePath('/admin/aseguradoras')
  revalidatePath('/pacientes/nuevo')
  return {}
}

export async function establecerAseguradoraActiva(id: string, activa: boolean): Promise<{ error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const { error } = await gate.supabase.from('aseguradoras_catalogo').update({ activa }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/aseguradoras')
  revalidatePath('/pacientes/nuevo')
  return {}
}

export async function eliminarAseguradoraCatalogo(id: string): Promise<{ error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const { error } = await gate.supabase.from('aseguradoras_catalogo').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/aseguradoras')
  revalidatePath('/pacientes/nuevo')
  return {}
}
