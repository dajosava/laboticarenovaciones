/**
 * Límites de caracteres por tipo de campo.
 *
 * Estos valores DEBEN coincidir con los CHECK / VARCHAR(n) definidos en
 * supabase/migrations/028_limites_caracteres_campos.sql para evitar errores
 * silenciosos en la base de datos.
 */
export const LIMITES_CAMPOS = {
  // ─── Personas y contacto ──────────────────────────────────────────────────
  /** Nombre de paciente, empleado, farmacia, encargado adulto. */
  nombrePersona: 150,
  /** Nombre del encargado (menor de edad). */
  nombreEncargado: 100,
  /** Teléfono local o internacional (con separadores). */
  telefono: 20,
  /** Email RFC 5321: máximo 254. */
  email: 254,

  // ─── Direcciones ─────────────────────────────────────────────────────────
  /** Línea de dirección o señas. */
  direccion: 255,
  /** Ciudad o cantón. */
  ciudad: 100,
  /** Acuerdo o coordenadas alternas de entrega. */
  arregloEntrega: 1000,

  // ─── Empresa y seguro ────────────────────────────────────────────────────
  /** Empresa pagadora o catálogo de empresas. */
  empresa: 150,
  /** Aseguradora o seguro médico. */
  aseguradora: 150,
  /** Parentesco del encargado. */
  parentesco: 50,

  // ─── Documentos personales ───────────────────────────────────────────────
  /** Cédula, pasaporte, DIMEX, póliza, certificado, ID médico, etc. */
  documento: 50,

  // ─── Medicamentos y tratamiento ──────────────────────────────────────────
  /** Código interno de medicamento (MED-xxxxx). */
  codigoMedicamento: 50,
  /** Descripción larga del medicamento. */
  descripcionMedicamento: 255,
  /** Marca comercial. */
  marca: 100,
  /** Concentración (ej. 500 mg). */
  concentracion: 100,

  // ─── Renovaciones y facturación ──────────────────────────────────────────
  /** Número de factura o folio POS. */
  numeroFactura: 50,

  // ─── Notas libres ────────────────────────────────────────────────────────
  /** Comentarios u observaciones generales. */
  notas: 1000,
} as const

export type LimiteCampoKey = keyof typeof LIMITES_CAMPOS
