'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { parseMedicamentosPegado } from '@/lib/medicamentos-import'

type FilaExistente = {
  codigo: string | null
  descripcion: string | null
  nombre: string
  marca: string | null
  concentracion: string | null
}

function clavesImportacion(existentes: FilaExistente[]): { porCodigo: Set<string>; porDescripcion: Set<string> } {
  const porCodigo = new Set<string>()
  const porDescripcion = new Set<string>()
  for (const r of existentes) {
    if (r.codigo?.trim()) porCodigo.add(r.codigo.trim().toUpperCase())
    const d = (r.descripcion ?? r.nombre).trim().toLowerCase()
    if (d) porDescripcion.add(d)
  }
  return { porCodigo, porDescripcion }
}

export async function crearMedicamento(input: {
  codigo?: string | null
  descripcion: string
  marca?: string | null
  concentracion?: string | null
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const descripcion = input.descripcion.trim()
  if (!descripcion) return { error: 'La descripción es obligatoria' }

  const codigo = input.codigo?.trim() || null

  const { data, error } = await supabase
    .from('medicamentos')
    .insert({
      codigo,
      descripcion,
      nombre: descripcion,
      marca: input.marca?.trim() || null,
      concentracion: input.concentracion?.trim() || null,
      activo: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/medicamentos')
  return { id: data?.id as string }
}

export async function actualizarMedicamento(
  id: string,
  input: {
    codigo?: string | null
    descripcion: string
    marca?: string | null
    concentracion?: string | null
    activo?: boolean
  },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const descripcion = input.descripcion.trim()
  if (!descripcion) return { error: 'La descripción es obligatoria' }

  const codigo = input.codigo !== undefined ? (input.codigo?.trim() || null) : undefined

  const payload: Record<string, unknown> = {
    descripcion,
    nombre: descripcion,
    marca: input.marca !== undefined ? input.marca?.trim() || null : undefined,
    concentracion: input.concentracion !== undefined ? input.concentracion?.trim() || null : undefined,
    actualizado_en: new Date().toISOString(),
  }
  if (codigo !== undefined) payload.codigo = codigo
  if (input.activo !== undefined) payload.activo = input.activo

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k]
  })

  const { error } = await supabase.from('medicamentos').update(payload).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/medicamentos')
  return {}
}

export async function importarMedicamentosDesdeTexto(texto: string): Promise<{
  error?: string
  insertados?: number
  omitidos?: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const filas = parseMedicamentosPegado(texto)
  if (filas.length === 0) return { error: 'No se detectaron filas válidas' }

  const { data: existentes } = await supabase
    .from('medicamentos')
    .select('codigo, descripcion, nombre, marca, concentracion')

  const { porCodigo, porDescripcion } = clavesImportacion((existentes as FilaExistente[]) ?? [])

  let insertados = 0
  let omitidos = 0
  for (const f of filas) {
    const descNorm = f.descripcion.trim().toLowerCase()
    if (f.codigo?.trim()) {
      const c = f.codigo.trim().toUpperCase()
      if (porCodigo.has(c)) {
        omitidos++
        continue
      }
      porCodigo.add(c)
    } else if (porDescripcion.has(descNorm)) {
      omitidos++
      continue
    }
    porDescripcion.add(descNorm)

    const { error } = await supabase.from('medicamentos').insert({
      codigo: f.codigo?.trim() || null,
      descripcion: f.descripcion.trim(),
      nombre: f.descripcion.trim(),
      marca: f.marca?.trim() || null,
      concentracion: f.concentracion?.trim() || null,
      activo: true,
    })
    if (error) return { error: error.message }
    insertados++
  }

  revalidatePath('/admin/medicamentos')
  return { insertados, omitidos }
}
