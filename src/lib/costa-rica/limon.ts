/**
 * División territorial administrativa — provincia de Limón (Costa Rica).
 * 6 cantones; distritos según DTA / tabla tipo anexo provincial.
 */

export const PROVINCIA_LIMON = 'Limón' as const

/** Orden administrativo habitual (código cantonal provincial). */
export const CANTONES_PROVINCIA_LIMON = [
  'Limón',
  'Pococí',
  'Siquirres',
  'Talamanca',
  'Matina',
  'Guácimo',
] as const

export type CantonLimon = (typeof CANTONES_PROVINCIA_LIMON)[number]

export const DISTRITOS_POR_CANTON_LIMON: Record<CantonLimon, readonly string[]> = {
  Limón: ['Limón', 'Valle La Estrella', 'Río Blanco', 'Matama'],
  Pococí: ['Guápiles', 'Jiménez', 'La Rita', 'Roxana', 'Cariari', 'Colorado', 'La Colonia'],
  Siquirres: ['Siquirres', 'Pacuarito', 'Florida', 'Germania', 'El Cairo', 'Alegría', 'Reventazón'],
  Talamanca: ['Bratsi', 'Sixaola', 'Cahuita', 'Telire'],
  Matina: ['Matina', 'Batán', 'Carrandi'],
  'Guácimo': ['Guácimo', 'Mercedes', 'Pocora', 'Río Jiménez', 'Duacarí'],
}
