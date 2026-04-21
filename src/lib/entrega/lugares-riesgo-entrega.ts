/**
 * Lugares (cantón, distrito o mención en señas) considerados de mayor riesgo operativo para entrega a domicilio.
 * Lista editable: se compara contra cantón, distrito y texto de señas al registrar o revisar pacientes.
 */

/** Mínimo de caracteres en «arreglo de entrega» cuando hay coincidencia con zona de riesgo. */
export const MIN_CARACTERES_ARREGLO_ENTREGA = 10

export const LUGARES_RIESGO_ENTREGA_ETIQUETAS = [
  'Desamparados',
  'Hatillo',
  'Alajuelita',
  'Cuatro Reinas',
  'Pavas',
  'Paso Ancho',
  'San Sebastián',
  'Léon XIII',
  'Vázquez de Coronado',
] as const

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Palabras cortas o ambiguas si solo se usa `includes` en señas. */
const USAR_PALABRA_COMPLETA_EN_SENAS = new Set(
  ['hatillo', 'pavas', 'alajuelita'].map((x) => normalizar(x)),
)

function senasCoincideEtiqueta(senasOriginal: string, etiquetaNorm: string): boolean {
  const senasNorm = normalizar(senasOriginal)
  if (!senasNorm) return false
  if (!senasNorm.includes(etiquetaNorm)) return false
  if (USAR_PALABRA_COMPLETA_EN_SENAS.has(etiquetaNorm)) {
    const re = new RegExp(`(^|[^0-9a-záéíóúüñ])${escaparRegex(etiquetaNorm)}([^0-9a-záéíóúüñ]|$)`, 'i')
    return re.test(normalizar(senasOriginal))
  }
  return true
}

/**
 * Devuelve las etiquetas de riesgo detectadas en cantón, distrito y/o señas (sin duplicados).
 */
export function coincidenciasRiesgoEntrega(input: {
  canton?: string
  distrito?: string
  senas?: string
}): string[] {
  const vistos = new Set<string>()
  const cantonN = input.canton ? normalizar(input.canton) : ''
  const distN = input.distrito ? normalizar(input.distrito) : ''
  const senas = input.senas ?? ''

  for (const etiqueta of LUGARES_RIESGO_ENTREGA_ETIQUETAS) {
    const e = normalizar(etiqueta)
    if (cantonN && cantonN === e) vistos.add(etiqueta)
    if (distN && distN === e) vistos.add(etiqueta)
    if (senasCoincideEtiqueta(senas, e)) vistos.add(etiqueta)
  }
  return [...vistos]
}

export function hayRiesgoEntrega(input: {
  canton?: string
  distrito?: string
  senas?: string
}): boolean {
  return coincidenciasRiesgoEntrega(input).length > 0
}
