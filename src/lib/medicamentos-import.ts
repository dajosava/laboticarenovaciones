export type FilaMedicamentoImport = {
  codigo: string | null
  descripcion: string
  marca: string | null
  concentracion: string | null
}

/** Primera columna tipo MED-xxxxx → artículo + descripción (resto de columnas unidas por tab). */
function esCodigoArticulo(s: string): boolean {
  return /^MED-/i.test(s.trim())
}

function partirLinea(line: string): string[] {
  return line.includes('\t')
    ? line.split('\t').map((p) => p.trim())
    : line.split(';').map((p) => p.trim())
}

/**
 * Pegado desde Excel (TSV):
 * - **Número de artículo TAB Descripción** (ej. MED-00004 + descripción) — formato principal.
 * - Legacy: 1 col = solo descripción; 2 col sin MED- = descripción + concentración; 3+ = nombre, marca, concentración.
 */
export function parseMedicamentosPegado(texto: string): FilaMedicamentoImport[] {
  const lines = texto.split(/\r?\n/).map((l) => l.trim())
  const out: FilaMedicamentoImport[] = []
  for (const line of lines) {
    if (!line) continue
    const parts = partirLinea(line)
    const p0 = parts[0]
    if (!p0) continue

    if (parts.length >= 2 && esCodigoArticulo(p0)) {
      const codigo = p0.trim()
      const descripcion = parts.slice(1).join('\t').trim()
      if (!descripcion) continue
      out.push({ codigo, descripcion, marca: null, concentracion: null })
      continue
    }

    if (parts.length === 1) {
      out.push({ codigo: null, descripcion: p0, marca: null, concentracion: null })
    } else if (parts.length === 2) {
      out.push({
        codigo: null,
        descripcion: p0,
        marca: null,
        concentracion: parts[1] || null,
      })
    } else {
      out.push({
        codigo: null,
        descripcion: p0,
        marca: parts[1] || null,
        concentracion: parts[2] || null,
      })
    }
  }
  return out
}

/** Texto para listas y recetas (código + descripción si aplica). */
export function etiquetaMedicamentoCatalogo(m: {
  codigo?: string | null
  descripcion?: string | null
  nombre: string
  marca?: string | null
  concentracion?: string | null
}): string {
  const desc = (m.descripcion ?? m.nombre ?? '').trim()
  const code = m.codigo?.trim()
  if (code) return `${code} · ${desc}`
  const sub = [m.marca, m.concentracion].filter(Boolean).join(' · ')
  return sub ? `${desc} · ${sub}` : desc
}

/** Valor que se guarda en tratamientos.medicamento (texto de la receta). */
export function textoMedicamentoParaReceta(m: {
  descripcion?: string | null
  nombre: string
}): string {
  const t = (m.descripcion ?? m.nombre).trim()
  return t || m.nombre.trim()
}
