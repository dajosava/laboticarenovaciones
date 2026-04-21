/**
 * División territorial administrativa — provincia de San José (Costa Rica).
 * Cantones y distritos según DTA vigente (referencia habitual: INEC / TSE).
 */

export const PROVINCIA_SAN_JOSE = 'San José' as const

/** Orden oficial de los 20 cantones de la provincia de San José */
export const CANTONES_PROVINCIA_SAN_JOSE = [
  'San José',
  'Escazú',
  'Desamparados',
  'Puriscal',
  'Tarrazú',
  'Aserrí',
  'Mora',
  'Goicoechea',
  'Santa Ana',
  'Alajuelita',
  'Vázquez de Coronado',
  'Acosta',
  'Tibás',
  'Moravia',
  'Montes de Oca',
  'Turrubares',
  'Dota',
  'Curridabat',
  'Pérez Zeledón',
  'León Cortés Castro',
] as const

export type CantonSanJose = (typeof CANTONES_PROVINCIA_SAN_JOSE)[number]

export const DISTRITOS_POR_CANTON: Record<CantonSanJose, readonly string[]> = {
  'San José': [
    'Carmen',
    'Merced',
    'Hospital',
    'Catedral',
    'Zapote',
    'San Francisco de Dos Ríos',
    'Uruca',
    'Mata Redonda',
    'Pavas',
    'Hatillo',
    'San Sebastián',
  ],
  Escazú: ['Escazú', 'San Antonio', 'San Rafael'],
  Desamparados: [
    'Desamparados',
    'San Miguel',
    'San Juan de Dios',
    'San Rafael Arriba',
    'San Antonio',
    'Frailes',
    'Patarrá',
    'San Cristóbal',
    'Rosario',
    'Damas',
    'San Rafael Abajo',
    'Gravilias',
    'Los Guido',
  ],
  Puriscal: [
    'Santiago',
    'Mercedes Sur',
    'Barbacoas',
    'Grifo Alto',
    'San Rafael',
    'Candelarita',
    'Desamparaditos',
    'San Antonio',
    'Chires',
  ],
  Tarrazú: ['San Marcos', 'San Lorenzo', 'San Carlos'],
  Aserrí: ['Aserrí', 'Tarbaca', 'Vuelta de Jorco', 'San Gabriel', 'Legua', 'Monterrey', 'Salitrillos'],
  Mora: ['Colón', 'Guayabo', 'Tabarcia', 'Piedras Negras', 'Picagres', 'Jaris', 'Quitirrisí'],
  Goicoechea: ['Guadalupe', 'San Francisco', 'Calle Blancos', 'Mata de Plátano', 'Ipís', 'Rancho Redondo', 'Purral'],
  'Santa Ana': ['Santa Ana', 'Salitral', 'Pozos', 'Uruca', 'Piedades', 'Brasil'],
  Alajuelita: ['Alajuelita', 'San Josecito', 'San Antonio', 'Concepción', 'San Felipe'],
  'Vázquez de Coronado': ['San Isidro', 'San Rafael', 'Dulce Nombre de Jesús', 'Patalillo', 'Cascajal'],
  Acosta: ['San Ignacio', 'Guaitil', 'Palmichal', 'Cangrejal', 'Sabanillas'],
  Tibás: ['San Juan', 'Cinco Esquinas', 'Anselmo Llorente', 'León XIII', 'Colima'],
  Moravia: ['San Vicente', 'San Jerónimo', 'La Trinidad'],
  'Montes de Oca': ['San Pedro', 'Sabanilla', 'Mercedes', 'San Rafael'],
  Turrubares: ['San Pablo', 'San Pedro', 'San Juan de Mata', 'San Luis', 'Carara'],
  Dota: ['Santa María', 'Jardín', 'Copey'],
  Curridabat: ['Curridabat', 'Granadilla', 'Sánchez', 'Tirrases'],
  'Pérez Zeledón': [
    'San Isidro de El General',
    'El General',
    'Daniel Flores',
    'Rivas',
    'San Pedro',
    'Platanares',
    'Pejibaye',
    'Cajón',
    'Barú',
    'Río Nuevo',
    'Páramo',
    'La Amistad',
  ],
  'León Cortés Castro': ['San Pablo', 'San Andrés', 'Llano Bonito', 'San Isidro', 'Santa Cruz', 'San Antonio'],
}

export function distritosDeCanton(canton: string): readonly string[] {
  if (canton in DISTRITOS_POR_CANTON) {
    return DISTRITOS_POR_CANTON[canton as CantonSanJose]
  }
  return []
}
