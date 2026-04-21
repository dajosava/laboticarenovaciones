/**
 * División territorial administrativa — provincia de Cartago (Costa Rica).
 * Cantones y distritos según DTA (8 cantones).
 */

export const PROVINCIA_CARTAGO = 'Cartago' as const

/** Orden habitual: código cantonal provincial (01–08). */
export const CANTONES_PROVINCIA_CARTAGO = [
  'Cartago',
  'Paraíso',
  'La Unión',
  'Jiménez',
  'Turrialba',
  'Alvarado',
  'Oreamuno',
  'El Guarco',
] as const

export type CantonCartago = (typeof CANTONES_PROVINCIA_CARTAGO)[number]

export const DISTRITOS_POR_CANTON_CARTAGO: Record<CantonCartago, readonly string[]> = {
  Cartago: [
    'Agua Caliente',
    'Carmen',
    'Corralillo',
    'Dulce Nombre',
    'Guadalupe',
    'Llano Grande',
    'Occidental',
    'Oriental',
    'Quebradilla',
    'San Nicolás',
    'Tierra Blanca',
  ],
  Paraíso: ['Paraíso', 'Santiago', 'Orosi', 'Cachí'],
  'La Unión': ['Tres Ríos', 'Concepción', 'Dulce Nombre', 'San Ramón', 'Río Azul'],
  Jiménez: ['Juan Viñas', 'Tucurrique', 'Pejibaye'],
  Turrialba: [
    'Turrialba',
    'La Suiza',
    'Peralta',
    'Santa Cruz',
    'Santa Teresita',
    'Pavones',
    'Tuis',
    'Tayutic',
    'Santa Rosa',
    'Tres Equis',
    'La Isabel',
    'Chirripó',
  ],
  Alvarado: ['Pacayas', 'Cervantes', 'Capellades'],
  Oreamuno: ['Cot', 'Potrero Cerrado', 'Cipreses', 'Santa Rosa', 'San Rafael', 'Morelia'],
  'El Guarco': ['El Tejar', 'San Isidro', 'Tobosi', 'Patio de Agua'],
}
