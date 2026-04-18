// =============================================
// FARMARENOVAR — Tipos TypeScript Globales
// =============================================

export type Rol = 'super_admin' | 'admin_sucursal' | 'empleado'
export type TipoTratamiento = 'cronico' | 'temporal'
export type TipoPago = 'directo' | 'reembolso'

// ─── FARMACIA ────────────────────────────────
export interface Farmacia {
  id: string
  nombre: string
  direccion: string
  telefono: string
  ciudad: string
  activa: boolean
  creada_en: string
}

// ─── EMPLEADO ────────────────────────────────
export interface Empleado {
  id: string
  nombre: string
  email: string
  rol: Rol
  farmacia_id: string
  activo: boolean
  creado_en: string
  farmacia?: Farmacia
}

// ─── PACIENTE ────────────────────────────────
export interface Paciente {
  id: string
  nombre: string
  telefono: string
  email: string | null
  direccion: string | null
  empresa: string | null
  seguro_medico: string | null
  tipo_pago: TipoPago | null
  farmacia_id: string
  registrado_por: string
  notas: string | null
  activo: boolean
  creado_en: string
  farmacia?: Farmacia
  empleado?: Empleado
  tratamientos?: Tratamiento[]
}

// ─── TRATAMIENTO ─────────────────────────────
export interface Tratamiento {
  id: string
  paciente_id: string
  medicamento_id?: string | null
  medicamento: string
  marca?: string | null
  concentracion?: string | null
  dosis_diaria: number
  unidades_caja: number
  fecha_surtido: string
  fecha_vencimiento: string
  tipo: TipoTratamiento
  activo: boolean
  notas: string | null
  registrado_por: string
  creado_en: string
  contactado_renovacion_en?: string | null
  paciente?: Paciente
  dias_restantes?: number
}

// ─── RENOVACION ──────────────────────────────
export interface Renovacion {
  id: string
  tratamiento_id: string
  farmacia_id: string
  empleado_id: string
  fecha: string
  notas: string | null
  /** Factura / POS: surtido inicial o renovación (opcional). */
  numero_factura?: string | null
  creada_en: string
  hubo_regalia?: boolean
  unidades_regalia?: number | null
  tratamiento?: Tratamiento
  farmacia?: Farmacia
  empleado?: Empleado
}

// ─── DASHBOARD STATS ─────────────────────────
export interface EstadisticasSucursal {
  farmacia: Farmacia
  pacientes_activos: number
  renovaciones_hoy: number
  renovaciones_semana: number
  alertas_pendientes: number
  alertas_criticas: number   // 1 día
  alertas_urgentes: number   // 5 días
  alertas_tempranas: number  // 7 días
}

export interface EstadisticasGlobales {
  total_pacientes: number
  total_tratamientos_activos: number
  renovaciones_hoy: number
  sucursales: EstadisticasSucursal[]
}

// ─── FORMS ───────────────────────────────────
export interface FormPaciente {
  nombre: string
  telefono: string
  email?: string
  direccion?: string
  empresa?: string
  seguro_medico?: string
  tipo_pago?: TipoPago | ''
  farmacia_id: string
  notas?: string
}

export interface FormTratamiento {
  paciente_id: string
  medicamento: string
  dosis_diaria: number
  unidades_caja: number
  fecha_surtido: string
  tipo: TipoTratamiento
  notas?: string
}

export interface FormRenovacion {
  tratamiento_id: string
  farmacia_id: string
  notas?: string
}
