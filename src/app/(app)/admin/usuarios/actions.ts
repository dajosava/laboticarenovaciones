'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buscarAuthUserIdPorEmail } from '@/lib/supabase/auth-admin'
import type { Rol } from '@/types'

function dbAdminOError(): ReturnType<typeof createServiceClient> | { error: string } {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      error:
        'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor. Sin ella no se pueden registrar empleados (la fila debe crearse con privilegios de servicio). Añádela en .env.local y reinicia el servidor.',
    }
  }
  return createServiceClient()
}

async function requireSuperAdmin(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: empleado } = await supabase.from('empleados').select('rol, activo').eq('id', user.id).single()
  if (!empleado?.activo || empleado.rol !== 'super_admin') {
    return { error: 'Solo el super administrador puede gestionar usuarios del sistema.' }
  }

  return { supabase, userId: user.id }
}

export async function resolverUuidPorCorreo(email: string): Promise<{ id?: string; email?: string; error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }
  return buscarAuthUserIdPorEmail(email)
}

export async function crearEmpleado(input: {
  authUserId: string
  nombre: string
  email: string
  rol: Rol
  farmaciaId: string | null
}): Promise<{ error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }

  const adminDb = dbAdminOError()
  if ('error' in adminDb) return { error: adminDb.error }

  const authUserId = input.authUserId.trim()
  const nombre = input.nombre.trim()
  const email = input.email.trim().toLowerCase()
  const farmaciaId = input.farmaciaId?.trim() || null

  if (!authUserId) return { error: 'El UUID del usuario (Auth) es obligatorio' }
  if (!nombre) return { error: 'El nombre es obligatorio' }
  if (!email) return { error: 'El correo es obligatorio' }

  if (input.rol !== 'super_admin' && !farmaciaId) {
    return { error: 'Debes asignar una sucursal para admin de sucursal o empleado' }
  }
  if (input.rol === 'super_admin' && farmaciaId) {
    return { error: 'El super administrador no lleva sucursal asignada' }
  }

  const { data: existe } = await adminDb.from('empleados').select('id').eq('id', authUserId).maybeSingle()
  if (existe) return { error: 'Ese usuario ya tiene perfil de empleado' }

  const { error } = await adminDb.from('empleados').insert({
    id: authUserId,
    nombre,
    email,
    rol: input.rol,
    farmacia_id: farmaciaId,
    activo: true,
  })

  if (error) {
    if (error.message.includes('foreign key') || error.code === '23503') {
      return {
        error:
          'El UUID no existe en Authentication o no coincide. Crea el usuario en Supabase → Authentication y copia su UUID (User UID).',
      }
    }
    if (error.message.includes('unique') || error.code === '23505') {
      return { error: 'Ya existe un empleado con ese correo o id.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/usuarios')
  revalidatePath('/', 'layout')
  return {}
}

export async function actualizarEmpleado(
  id: string,
  input: {
    nombre: string
    email: string
    rol: Rol
    farmaciaId: string | null
    activo: boolean
  },
): Promise<{ error?: string }> {
  const gate = await requireSuperAdmin()
  if ('error' in gate) return { error: gate.error }
  const { userId } = gate

  const adminDb = dbAdminOError()
  if ('error' in adminDb) return { error: adminDb.error }

  const nombre = input.nombre.trim()
  const email = input.email.trim().toLowerCase()
  const farmaciaId = input.farmaciaId?.trim() || null

  if (!nombre) return { error: 'El nombre es obligatorio' }
  if (!email) return { error: 'El correo es obligatorio' }

  if (input.rol !== 'super_admin' && !farmaciaId) {
    return { error: 'Debes asignar una sucursal para admin de sucursal o empleado' }
  }
  if (input.rol === 'super_admin' && farmaciaId) {
    return { error: 'El super administrador no lleva sucursal asignada' }
  }

  if (id === userId && !input.activo) {
    return { error: 'No puedes desactivar tu propia cuenta desde aquí.' }
  }

  if (id === userId && input.rol !== 'super_admin') {
    return { error: 'No puedes quitarte el rol de super administrador.' }
  }

  const { error } = await adminDb
    .from('empleados')
    .update({
      nombre,
      email,
      rol: input.rol,
      farmacia_id: farmaciaId,
      activo: input.activo,
    })
    .eq('id', id)

  if (error) {
    if (error.message.includes('unique') || error.code === '23505') {
      return { error: 'Ya existe otro empleado con ese correo.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/usuarios')
  revalidatePath('/', 'layout')
  return {}
}
