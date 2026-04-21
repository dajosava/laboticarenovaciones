/**
 * División territorial administrativa — provincia de Puntarenas (Costa Rica).
 * 13 cantones; distritos según DTA / tabla tipo anexo provincial.
 * Golfito incluye además **Conte Burica** (4.º distrito oficial), no figuraba en la tabla pegada.
 */

export const PROVINCIA_PUNTARENAS = 'Puntarenas' as const

/** Orden habitual: fundación histórica, con Monteverde y Puerto Jiménez al final. */
export const CANTONES_PROVINCIA_PUNTARENAS = [
  'Puntarenas',
  'Esparza',
  'Buenos Aires',
  'Montes de Oro',
  'Osa',
  'Quepos',
  'Golfito',
  'Coto Brus',
  'Parrita',
  'Corredores',
  'Garabito',
  'Monteverde',
  'Puerto Jiménez',
] as const

export type CantonPuntarenas = (typeof CANTONES_PROVINCIA_PUNTARENAS)[number]

export const DISTRITOS_POR_CANTON_PUNTARENAS: Record<CantonPuntarenas, readonly string[]> = {
  Puntarenas: [
    'Puntarenas',
    'Pitahaya',
    'Chomes',
    'Lepanto',
    'Paquera',
    'Manzanillo',
    'Guacimal',
    'Barranca',
    'Isla del Coco',
    'Cóbano',
    'Chacarita',
    'Chira',
    'Acapulco',
    'El Roble',
    'Arancibia',
  ],
  Esparza: ['Espíritu Santo', 'San Juan Grande', 'Macacona', 'San Rafael', 'San Jerónimo', 'Caldera'],
  'Buenos Aires': [
    'Buenos Aires',
    'Volcán',
    'Potrero Grande',
    'Boruca',
    'Pilas',
    'Colinas',
    'Chánguena',
    'Biolley',
    'Brunka',
  ],
  'Montes de Oro': ['Miramar', 'La Unión', 'San Isidro'],
  Osa: ['Puerto Cortés', 'Palmar', 'Sierpe', 'Piedras Blancas', 'Bahía Ballena', 'Bahía Drake'],
  Quepos: ['Quepos', 'Savegre', 'Naranjito'],
  Golfito: ['Golfito', 'Guaycará', 'Pavón', 'Conte Burica'],
  'Coto Brus': ['San Vito', 'Sabalito', 'Aguabuena', 'Limoncito', 'Pittier', 'Gutiérrez Braun'],
  Parrita: ['Parrita'],
  Corredores: ['Corredor', 'La Cuesta', 'Canoas', 'Laurel'],
  Garabito: ['Jacó', 'Tárcoles', 'Lagunillas'],
  Monteverde: ['Monteverde'],
  'Puerto Jiménez': ['Puerto Jiménez'],
}
