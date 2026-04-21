import { CANTONES_PROVINCIA_ALAJUELA, DISTRITOS_POR_CANTON_ALAJUELA } from './alajuela'
import { CANTONES_PROVINCIA_CARTAGO, DISTRITOS_POR_CANTON_CARTAGO } from './cartago'
import { CANTONES_PROVINCIA_GUANACASTE, DISTRITOS_POR_CANTON_GUANACASTE } from './guanacaste'
import { CANTONES_PROVINCIA_HEREDIA, DISTRITOS_POR_CANTON_HEREDIA } from './heredia'
import { CANTONES_PROVINCIA_LIMON, DISTRITOS_POR_CANTON_LIMON } from './limon'
import { CANTONES_PROVINCIA_PUNTARENAS, DISTRITOS_POR_CANTON_PUNTARENAS } from './puntarenas'
import { CANTONES_PROVINCIA_SAN_JOSE, DISTRITOS_POR_CANTON } from './san-jose'

/** Provincias con catálogo completo cantón → distrito en el formulario de paciente. */
export const PROVINCIAS_CR = [
  'San José',
  'Alajuela',
  'Cartago',
  'Heredia',
  'Guanacaste',
  'Puntarenas',
  'Limón',
] as const

export type ProvinciaCR = (typeof PROVINCIAS_CR)[number]

const CANTONES_POR_PROVINCIA: Record<ProvinciaCR, readonly string[]> = {
  'San José': CANTONES_PROVINCIA_SAN_JOSE,
  Alajuela: CANTONES_PROVINCIA_ALAJUELA,
  Cartago: CANTONES_PROVINCIA_CARTAGO,
  Heredia: CANTONES_PROVINCIA_HEREDIA,
  Guanacaste: CANTONES_PROVINCIA_GUANACASTE,
  Puntarenas: CANTONES_PROVINCIA_PUNTARENAS,
  'Limón': CANTONES_PROVINCIA_LIMON,
}

const DISTRITOS_POR_PROVINCIA_Y_CANTON: Record<
  ProvinciaCR,
  Record<string, readonly string[]>
> = {
  'San José': DISTRITOS_POR_CANTON as unknown as Record<string, readonly string[]>,
  Alajuela: DISTRITOS_POR_CANTON_ALAJUELA as unknown as Record<string, readonly string[]>,
  Cartago: DISTRITOS_POR_CANTON_CARTAGO as unknown as Record<string, readonly string[]>,
  Heredia: DISTRITOS_POR_CANTON_HEREDIA as unknown as Record<string, readonly string[]>,
  Guanacaste: DISTRITOS_POR_CANTON_GUANACASTE as unknown as Record<string, readonly string[]>,
  Puntarenas: DISTRITOS_POR_CANTON_PUNTARENAS as unknown as Record<string, readonly string[]>,
  'Limón': DISTRITOS_POR_CANTON_LIMON as unknown as Record<string, readonly string[]>,
}

export function cantonesPorProvincia(provincia: string): readonly string[] {
  if (provincia in CANTONES_POR_PROVINCIA) {
    return CANTONES_POR_PROVINCIA[provincia as ProvinciaCR]
  }
  return []
}

export function distritosPorProvinciaCanton(provincia: string, canton: string): readonly string[] {
  if (!canton || !(provincia in DISTRITOS_POR_PROVINCIA_Y_CANTON)) return []
  const map = DISTRITOS_POR_PROVINCIA_Y_CANTON[provincia as ProvinciaCR]
  return map[canton] ?? []
}
