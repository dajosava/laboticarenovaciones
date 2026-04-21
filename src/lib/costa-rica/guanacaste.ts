/**
 * División territorial administrativa — provincia de Guanacaste (Costa Rica).
 * Cantones y distritos (11 cantones) según DTA; nombres tomados de tabla tipo anexo provincial.
 */

export const PROVINCIA_GUANACASTE = 'Guanacaste' as const

/** Orden administrativo habitual (código cantonal provincial). */
export const CANTONES_PROVINCIA_GUANACASTE = [
  'Liberia',
  'Nicoya',
  'Santa Cruz',
  'Bagaces',
  'Carrillo',
  'Cañas',
  'Abangares',
  'Tilarán',
  'Nandayure',
  'La Cruz',
  'Hojancha',
] as const

export type CantonGuanacaste = (typeof CANTONES_PROVINCIA_GUANACASTE)[number]

export const DISTRITOS_POR_CANTON_GUANACASTE: Record<CantonGuanacaste, readonly string[]> = {
  Liberia: ['Liberia', 'Cañas Dulces', 'Mayorga', 'Nacascolo', 'Curubandé'],
  Nicoya: ['Nicoya', 'Mansión', 'San Antonio', 'Quebrada Honda', 'Sámara', 'Nosara', 'Belén de Nosarita'],
  'Santa Cruz': [
    'Santa Cruz',
    'Bolsón',
    'Veintisiete de Abril',
    'Tempate',
    'Cartagena',
    'Cuajiniquil',
    'Diriá',
    'Cabo Velas',
    'Tamarindo',
  ],
  Bagaces: ['Bagaces', 'La Fortuna', 'Mogote', 'Río Naranjo'],
  Carrillo: ['Filadelfia', 'Palmira', 'Sardinal', 'Belén'],
  Cañas: ['Cañas', 'Palmira', 'San Miguel', 'Bebedero', 'Porozal'],
  Abangares: ['Las Juntas', 'Sierra', 'San Juan', 'Colorado'],
  Tilarán: [
    'Tilarán',
    'Quebrada Grande',
    'Tronadora',
    'Santa Rosa',
    'Líbano',
    'Tierras Morenas',
    'Arenal',
    'Cabeceras',
  ],
  Nandayure: ['Carmona', 'Santa Rita', 'Zapotal', 'San Pablo', 'Porvenir', 'Bejuco'],
  'La Cruz': ['La Cruz', 'Santa Cecilia', 'La Garita', 'Santa Elena'],
  Hojancha: ['Hojancha', 'Monte Romo', 'Puerto Carrillo', 'Huacas', 'Matambú'],
}
