import type { SupabaseClient } from '@supabase/supabase-js'

export type MedicamentoAdminRow = {
  id: string
  codigo: string | null
  descripcion: string | null
  nombre: string
  marca: string | null
  concentracion: string | null
  activo: boolean
  creado_en: string
}

const MED_SELECT = 'id, codigo, descripcion, nombre, marca, concentracion, activo, creado_en'

/** Comodines ILIKE en PostgreSQL: escapar \ % _ */
function escapeSqlIlike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function baseList(supabase: SupabaseClient, soloActivos: boolean) {
  let q = supabase.from('medicamentos').select(MED_SELECT).order('descripcion', { ascending: true }).limit(10_000)
  if (soloActivos) q = q.eq('activo', true)
  return q
}

/**
 * Listado del panel Medicamentos: sin búsqueda devuelve hasta 10 000 filas;
 * con texto busca en **toda la tabla** (varias columnas) y une resultados por `id`.
 */
export async function fetchMedicamentosAdminList(
  supabase: SupabaseClient,
  opts: { q: string; soloActivos: boolean },
): Promise<MedicamentoAdminRow[]> {
  const raw = opts.q.trim()
  if (!raw) {
    const { data } = await baseList(supabase, opts.soloActivos)
    return (data as MedicamentoAdminRow[]) ?? []
  }

  const pat = `%${escapeSqlIlike(raw)}%`
  const b = () => baseList(supabase, opts.soloActivos)

  const [r1, r2, r3, r4, r5] = await Promise.all([
    b().ilike('descripcion', pat),
    b().ilike('nombre', pat),
    b().ilike('codigo', pat),
    b().ilike('marca', pat),
    b().ilike('concentracion', pat),
  ])

  const map = new Map<string, MedicamentoAdminRow>()
  for (const res of [r1, r2, r3, r4, r5]) {
    for (const row of (res.data as MedicamentoAdminRow[]) ?? []) {
      map.set(row.id, row)
    }
  }

  return [...map.values()].sort((a, b) =>
    (a.descripcion ?? a.nombre ?? '').localeCompare(b.descripcion ?? b.nombre ?? '', undefined, {
      sensitivity: 'base',
    }),
  )
}
