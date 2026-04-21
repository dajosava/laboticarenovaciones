/**
 * División territorial administrativa — provincia de Heredia (Costa Rica).
 * Cantones y distritos (10 cantones) según DTA; filas tomadas de tabla tipo anexo provincial.
 */

export const PROVINCIA_HEREDIA = 'Heredia' as const

/** Orden administrativo habitual (código cantonal provincial). */
export const CANTONES_PROVINCIA_HEREDIA = [
  'Heredia',
  'Barva',
  'Santo Domingo',
  'Santa Bárbara',
  'San Rafael',
  'San Isidro',
  'Belén',
  'Flores',
  'San Pablo',
  'Sarapiquí',
] as const

export type CantonHeredia = (typeof CANTONES_PROVINCIA_HEREDIA)[number]

export const DISTRITOS_POR_CANTON_HEREDIA: Record<CantonHeredia, readonly string[]> = {
  Heredia: ['Heredia', 'Mercedes', 'San Francisco', 'Ulloa', 'Varablanca'],
  Barva: [
    'Barva',
    'San Pedro',
    'San Pablo',
    'San Roque',
    'Santa Lucía',
    'San José de la Montaña',
    'Puente Salas',
  ],
  'Santo Domingo': [
    'Santo Domingo',
    'San Vicente',
    'San Miguel',
    'Paracito',
    'Santo Tomás',
    'Santa Rosa',
    'Tures',
    'Pará',
  ],
  'Santa Bárbara': ['Santa Bárbara', 'San Pedro', 'San Juan', 'Jesús', 'Santo Domingo', 'Purabá'],
  'San Rafael': ['San Rafael', 'San Josecito', 'Santiago', 'Ángeles', 'Concepción'],
  'San Isidro': ['San Isidro', 'San José', 'Concepción', 'San Francisco'],
  Belén: ['San Antonio', 'La Ribera', 'La Asunción'],
  Flores: ['San Joaquín', 'Barrantes', 'Llorente'],
  'San Pablo': ['San Pablo', 'Rincón de Sabanilla'],
  Sarapiquí: ['Puerto Viejo', 'La Virgen', 'Horquetas', 'Llanuras del Gaspar', 'Cureña'],
}
