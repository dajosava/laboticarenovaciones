import Link from 'next/link'
import { Building2, Settings, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CuentaConfiguracionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empleado } = await supabase.from('empleados').select('rol, activo').eq('id', user.id).single()
  if (!empleado?.activo || empleado.rol !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200/90 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Settings className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Configuración</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Ajustes del sistema. Solo super administrador. La operación diaria de renovaciones sigue en el menú principal.
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Administración del sistema
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-600/50 dark:hover:bg-brand-950/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <UserCog className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">Usuarios del sistema</span>
                <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                  Vincular cuentas de acceso con empleados, roles y sucursales.
                </span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/empresas"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-600/50 dark:hover:bg-brand-950/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">Empresas</span>
                <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                  Crear, editar, desactivar o eliminar empresas del catálogo (alta de pacientes).
                </span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Preferencias de la aplicación
        </h2>
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          Notificaciones, seguridad y otras preferencias: próximamente disponible.
        </p>
      </section>
    </div>
  )
}
