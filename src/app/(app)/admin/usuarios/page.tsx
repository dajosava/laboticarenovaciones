import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { mapaUltimoInicioSesionAuth } from '@/lib/supabase/auth-admin'
import { redirect } from 'next/navigation'
import UsuariosAdminCliente, { type EmpleadoListRow } from './UsuariosAdminCliente'

type EmpleadoDesdeDb = Omit<EmpleadoListRow, 'ultimo_acceso_etiqueta' | 'ultimo_acceso_title'>

function etiquetaUltimoAccesoAuth(
  disponible: boolean,
  empleadoId: string,
  map: Map<string, string | null>,
): { etiqueta: string; title: string } {
  if (!disponible) {
    return {
      etiqueta: 'N/D',
      title: 'No se pudo leer Authentication (comprueba SUPABASE_SERVICE_ROLE_KEY en el servidor).',
    }
  }
  if (!map.has(empleadoId)) {
    return {
      etiqueta: '—',
      title: 'No hay usuario con este UUID en Supabase Authentication.',
    }
  }
  const raw = map.get(empleadoId) ?? null
  if (raw == null) {
    return { etiqueta: 'Nunca', title: 'El usuario no ha iniciado sesión en el panel.' }
  }
  try {
    const d = parseISO(raw)
    if (Number.isNaN(d.getTime())) return { etiqueta: '—', title: raw }
    return {
      etiqueta: format(d, "dd/MM/yyyy HH:mm", { locale: es }),
      title: `Último acceso (Auth): ${raw}`,
    }
  } catch {
    return { etiqueta: '—', title: raw }
  }
}

export default async function UsuariosAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empleado } = await supabase.from('empleados').select('rol, activo').eq('id', user.id).single()
  if (!empleado?.activo || empleado.rol !== 'super_admin') {
    redirect('/dashboard')
  }

  const [{ data: lista }, { data: farmacias }, { map: loginPorAuthId, disponible: authLoginDisponible }] =
    await Promise.all([
      supabase
        .from('empleados')
        .select('id, nombre, email, rol, farmacia_id, activo, creado_en, farmacia:farmacias(nombre)')
        .order('creado_en', { ascending: false }),
      supabase.from('farmacias').select('id, nombre').eq('activa', true).order('nombre'),
      mapaUltimoInicioSesionAuth(),
    ])

  const filas: EmpleadoListRow[] = ((lista ?? []) as EmpleadoDesdeDb[]).map((row) => {
    const { etiqueta, title } = etiquetaUltimoAccesoAuth(authLoginDisponible, row.id, loginPorAuthId)
    return {
      ...row,
      ultimo_acceso_etiqueta: etiqueta,
      ultimo_acceso_title: title,
    }
  })
  const opts = (farmacias ?? []) as { id: string; nombre: string }[]

  return (
    <div className="mx-auto max-w-7xl p-6">
      <UsuariosAdminCliente iniciales={filas} farmacias={opts} authUltimoAccesoDisponible={authLoginDisponible} />
    </div>
  )
}
