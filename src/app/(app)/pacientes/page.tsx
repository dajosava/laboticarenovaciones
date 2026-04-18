import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { Paciente } from '@/types'
import Link from 'next/link'
import { formatearFechaCorta } from '@/lib/utils'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const term = q?.trim() || ''
  const supabase = await createClient()
  const cookieStore = await cookies()
  const filtroFarmaciaId = cookieStore.get('farmarenovar-filtro-farmacia')?.value ?? null

  const { data: { user } } = await supabase.auth.getUser()
  const { data: empleado } = await supabase
    .from('empleados')
    .select('rol, farmacia_id')
    .eq('id', user!.id)
    .single()

  let nombreFiltroSucursal: string | null = null
  if (empleado?.rol === 'super_admin' && filtroFarmaciaId) {
    const { data: farm } = await supabase.from('farmacias').select('nombre').eq('id', filtroFarmaciaId).maybeSingle()
    nombreFiltroSucursal = farm?.nombre ?? null
  }

  let query = supabase
    .from('pacientes')
    .select('*, farmacia:farmacias(nombre), tratamientos(count)')
    .eq('activo', true)
    .order('creado_en', { ascending: false })

  if (empleado?.rol !== 'super_admin') {
    query = query.eq('farmacia_id', empleado!.farmacia_id!)
  } else if (filtroFarmaciaId) {
    query = query.eq('farmacia_id', filtroFarmaciaId)
  }

  if (term) {
    const safeTerm = term.replace(/'/g, "''")
    query = query.or(`nombre.ilike.%${safeTerm}%,telefono.ilike.%${safeTerm}%`)
  }

  const { data: pacientes } = await query

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          {empleado?.rol === 'super_admin' && nombreFiltroSucursal ? (
            <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Sucursal seleccionada: {nombreFiltroSucursal}
            </p>
          ) : null}
          <p className="text-gray-500 text-sm mt-1">
            {term
              ? `${pacientes?.length ?? 0} resultado${(pacientes?.length ?? 0) !== 1 ? 's' : ''}`
              : `${pacientes?.length || 0} pacientes registrados`}
          </p>
        </div>
        <Link
          href="/pacientes/nuevo"
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          + Nuevo paciente
        </Link>
      </div>

      {/* Barra de búsqueda */}
      <form method="get" action="/pacientes" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Buscar por nombre o teléfono"
          className="flex-1 max-w-md px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
        >
          Buscar
        </button>
        {term ? (
          <Link
            href="/pacientes"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </Link>
        ) : null}
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Farmacia</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Registrado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pacientes?.map((p: Paciente) => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                      {p.nombre.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{p.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-600">{p.telefono}</td>
                <td className="px-5 py-4 text-gray-500 text-sm">{p.farmacia?.nombre}</td>
                <td className="px-5 py-4 text-gray-400 text-sm">{formatearFechaCorta(p.creado_en)}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/pacientes/${p.id}`}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Ver ficha →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!pacientes || pacientes.length === 0) && (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium">
              {term ? 'Ningún paciente coincide con la búsqueda.' : 'Sin pacientes aún'}
            </p>
            <p className="text-sm mt-1">
              {term ? 'Prueba con otro nombre o teléfono.' : 'Registra tu primer paciente para comenzar.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
