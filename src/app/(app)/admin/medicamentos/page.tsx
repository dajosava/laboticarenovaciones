import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchMedicamentosAdminList } from '@/lib/medicamentos-admin-query'
import MedicamentosAdminCliente, { type MedicamentoRow } from './MedicamentosAdminCliente'

function paramPrimero(v: string | string[] | undefined): string {
  if (v == null) return ''
  return Array.isArray(v) ? (v[0] ?? '') : v
}

export default async function MedicamentosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; solo?: string | string[] }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empleado } = await supabase.from('empleados').select('rol').eq('id', user.id).single()
  if (!empleado || empleado.rol === 'empleado') redirect('/dashboard')

  const sp = await searchParams
  const q = paramPrimero(sp.q).trim()
  const soloActivos = paramPrimero(sp.solo) !== '0'

  const [{ count: cntTotal }, { count: cntActivos }, filas] = await Promise.all([
    supabase.from('medicamentos').select('id', { count: 'exact', head: true }),
    supabase.from('medicamentos').select('id', { count: 'exact', head: true }).eq('activo', true),
    fetchMedicamentosAdminList(supabase, { q, soloActivos }),
  ])

  const totalLineas = cntTotal ?? 0
  const lineasActivas = cntActivos ?? 0
  const lineasInactivas = Math.max(0, totalLineas - lineasActivas)

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Medicamentos</h1>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          {totalLineas === 0
            ? 'No hay líneas de producto en el catálogo todavía.'
            : `${totalLineas} línea${totalLineas === 1 ? '' : 's'} de producto en el catálogo`}
          {totalLineas > 0 ? (
            <span className="font-normal text-slate-500 dark:text-slate-400">
              {' '}
              · {lineasActivas} activa{lineasActivas === 1 ? '' : 's'}
              {lineasInactivas > 0
                ? ` · ${lineasInactivas} inactiva${lineasInactivas === 1 ? '' : 's'}`
                : ''}
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Mismo formato que tu Excel: <strong>Número de artículo</strong> (MED-xxxxx) y <strong>Descripción del artículo</strong>,
          pegados con tabulador. Ese texto es el que se usa al elegir medicamento en recetas.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Cargando listado…
          </div>
        }
      >
        <MedicamentosAdminCliente iniciales={filas as MedicamentoRow[]} />
      </Suspense>
    </div>
  )
}
