import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calcularFechaVencimiento,
  calcularDiasRestantes,
  calcularDiasRestantesEnReferencia,
  bandaOrdenPanelRenovaciones,
  etiquetaPrioridadPanelPrincipal,
  getNivelUrgencia,
  ordenarTratamientosPorPrioridadPanel,
  compararFilasPanelRenovacionPorPrioridad,
  parseMontoFacturaInput,
  formatMontoFacturaCrc,
  normalizarNombrePersona,
  formatoMedicamento,
} from './index'

/** Referencia fija — evita fallos por zona horaria (skill: fechas en tests). */
const REF_PANEL = new Date(2024, 5, 10)

describe('calcularFechaVencimiento', () => {
  it('suma días según unidades y dosis', () => {
    expect(calcularFechaVencimiento('2024-01-01', 30, 1)).toBe('2024-01-31')
  })

  it('redondea hacia abajo la duración en días', () => {
    expect(calcularFechaVencimiento('2024-01-01', 29, 2)).toBe('2024-01-15')
  })
})

describe('calcularDiasRestantesEnReferencia', () => {
  it('cuenta días positivos hasta el vencimiento', () => {
    expect(calcularDiasRestantesEnReferencia('2024-06-15', REF_PANEL)).toBe(5)
  })

  it('cuenta días negativos cuando ya venció', () => {
    expect(calcularDiasRestantesEnReferencia('2024-06-05', REF_PANEL)).toBe(-5)
  })
})

describe('calcularDiasRestantes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(REF_PANEL)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('usa la fecha local de hoy como referencia', () => {
    expect(calcularDiasRestantes('2024-06-15')).toBe(5)
    expect(calcularDiasRestantes('2024-06-05')).toBe(-5)
  })
})

/** Bandas KPI — tabla en `.cursor/skills/.../farmarenovar-domain.md` */
describe('bandaOrdenPanelRenovaciones', () => {
  it.each([
    [-1, 0],
    [0, 1],
    [1, 1],
    [5, 2],
    [6, 3],
    [20, 3],
  ])('con %i días restantes devuelve banda %i', (dias, banda) => {
    expect(bandaOrdenPanelRenovaciones(dias)).toBe(banda)
  })
})

describe('etiquetaPrioridadPanelPrincipal', () => {
  it.each([
    [-2, '2 días vencidos'],
    [-1, '1 día vencido'],
    [0, 'Crítico'],
    [1, 'Crítico'],
    [3, 'Urgente'],
    [10, 'Planificación'],
    [16, 'Al día'],
  ])('con %i días muestra "%s"', (dias, etiqueta) => {
    expect(etiquetaPrioridadPanelPrincipal(dias)).toBe(etiqueta)
  })
})

describe('getNivelUrgencia', () => {
  it.each([
    [0, 'critico'],
    [1, 'critico'],
    [5, 'urgente'],
    [10, 'temprano'],
    [20, 'ok'],
  ])('con %i días devuelve nivel %s', (dias, nivel) => {
    expect(getNivelUrgencia(dias)).toBe(nivel)
  })
})

describe('ordenarTratamientosPorPrioridadPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(REF_PANEL)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ordena vencidos antes que urgentes y planificación', () => {
    const vencido = { id: 'v', fecha_vencimiento: '2024-06-05' }
    const urgente = { id: 'u', fecha_vencimiento: '2024-06-12' }
    const planificacion = { id: 'p', fecha_vencimiento: '2024-06-20' }

    const ordenados = ordenarTratamientosPorPrioridadPanel([planificacion, urgente, vencido])

    expect(ordenados.map(t => t.id)).toEqual(['v', 'u', 'p'])
  })

  it('desempata por fecha de vencimiento dentro de la misma banda', () => {
    const a = { id: 'a', fecha_vencimiento: '2024-06-14' }
    const b = { id: 'b', fecha_vencimiento: '2024-06-12' }

    const ordenados = ordenarTratamientosPorPrioridadPanel([a, b])

    expect(ordenados.map(t => t.id)).toEqual(['b', 'a'])
  })
})

describe('compararFilasPanelRenovacionPorPrioridad', () => {
  it('prioriza fila con menos días restantes', () => {
    const a = { dias: -2, fecha_vencimiento: '2024-06-01' }
    const b = { dias: 3, fecha_vencimiento: '2024-06-15' }
    expect(compararFilasPanelRenovacionPorPrioridad(a, b)).toBeLessThan(0)
  })
})

describe('parseMontoFacturaInput', () => {
  it.each([
    ['15000', 15000],
    ['15000,50', 15000.5],
    ['  1250.75  ', 1250.75],
  ])('parsea "%s" como %s', (raw, esperado) => {
    expect(parseMontoFacturaInput(raw)).toBe(esperado)
  })

  it.each([[''], ['   '], ['abc'], ['-100']])('rechaza entrada inválida "%s"', raw => {
    expect(parseMontoFacturaInput(raw)).toBeNull()
  })
})

describe('formatMontoFacturaCrc', () => {
  it('formatea en colones costarricenses', () => {
    expect(formatMontoFacturaCrc(15000)).toMatch(/15[\s.,]?000,00/)
    expect(formatMontoFacturaCrc(15000)).toContain('₡')
  })
})

describe('normalizarNombrePersona', () => {
  it('recorta espacios y pasa a mayúsculas', () => {
    expect(normalizarNombrePersona('  maría   elena  ')).toBe('MARÍA ELENA')
  })

  it('devuelve cadena vacía si solo hay espacios', () => {
    expect(normalizarNombrePersona('   ')).toBe('')
  })
})

describe('formatoMedicamento', () => {
  it('concatena concentración y marca', () => {
    expect(
      formatoMedicamento({
        medicamento: 'Losartán',
        concentracion: '50 mg',
        marca: 'MK',
      }),
    ).toBe('Losartán (50 mg) · MK')
  })

  it('omite campos vacíos', () => {
    expect(formatoMedicamento({ medicamento: 'Metformina' })).toBe('Metformina')
  })
})
