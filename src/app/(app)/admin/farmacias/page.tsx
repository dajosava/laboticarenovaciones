import { createClient } from '@/lib/supabase/server'

const SEP_HORARIO = ' · Horario: '

function splitDireccionHorario(direccion: string): { lugar: string; horario: string | null } {
  const i = direccion.indexOf(SEP_HORARIO)
  if (i === -1) return { lugar: direccion, horario: null }
  return {
    lugar: direccion.slice(0, i).trim(),
    horario: direccion.slice(i + SEP_HORARIO.length).trim(),
  }
}

export default async function FarmaciasAdminPage() {
  const supabase = await createClient()

  const { data: farmacias } = await supabase.from('farmacias').select('*').order('nombre', { ascending: true })

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sucursales</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {farmacias?.length || 0} sedes · provincia, dirección y horario
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {farmacias?.map((f: {
          id: string
          nombre: string
          direccion: string
          telefono: string | null
          ciudad: string | null
          activa: boolean
        }) => {
          const { lugar, horario } = splitDireccionHorario(f.direccion)
          return (
            <article
              key={f.id}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold leading-snug text-slate-900 dark:text-white">{f.nombre}</h2>
                  {f.ciudad ? <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{f.ciudad}</p> : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    f.activa
                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-500/10 text-red-800 dark:text-red-300'
                  }`}
                >
                  {f.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-medium text-slate-500 dark:text-slate-400">Ubicación: </span>
                  {lugar}
                </p>
                {horario ? (
                  <p>
                    <span className="font-medium text-slate-500 dark:text-slate-400">Horario: </span>
                    {horario}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium text-slate-500 dark:text-slate-400">Teléfono: </span>
                  {f.telefono?.trim() ? f.telefono : <span className="italic text-slate-400">No registrado</span>}
                </p>
              </div>
            </article>
          )
        })}
      </div>

      {(!farmacias || farmacias.length === 0) && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-600 dark:text-slate-300">Sin farmacias registradas</p>
        </div>
      )}
    </div>
  )
}
