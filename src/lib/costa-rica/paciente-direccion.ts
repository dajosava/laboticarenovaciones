/** Campos de dirección CR persistidos en `pacientes` (+ `direccion` legado). */
export type PacienteDireccionCampos = {
  provincia_cr?: string | null
  canton_cr?: string | null
  distrito_cr?: string | null
  direccion_senas?: string | null
  direccion?: string | null
}

export function tieneDireccionCr(p: PacienteDireccionCampos): boolean {
  return !!(p.provincia_cr?.trim() && p.canton_cr?.trim() && p.distrito_cr?.trim())
}

/** Texto para ficha: prioriza columnas CR; si no, usa `direccion` libre antigua. */
export function textoDireccionParaFicha(p: PacienteDireccionCampos): string | null {
  if (tieneDireccionCr(p)) {
    const base = `${p.provincia_cr!.trim()}, ${p.canton_cr!.trim()}, ${p.distrito_cr!.trim()}`
    const senas = p.direccion_senas?.trim()
    return senas ? `${base}. Señas: ${senas}` : base
  }
  const leg = p.direccion?.trim()
  return leg || null
}
