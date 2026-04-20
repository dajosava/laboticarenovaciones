function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ─── Usuario mock para auth ─────────────────────
export const MOCK_USER = {
  id: 'mock-user-001',
  email: 'admin@farmarenovar.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
}

// ─── Farmacias (alineadas con sedes reales CR — migración 006 en Supabase) ───
export const farmacias = [
  { id: 'f001', nombre: 'La Botica Liberia', ciudad: 'Guanacaste', direccion: 'Clínica 25 de Julio · Horario: l-d de 8 am a 8 pm', telefono: '62638468', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f002', nombre: 'La Botica Marina Pez Vela', ciudad: 'Puntarenas', direccion: 'Marina de Quepos · Horario: L-V de 7am a 10pm, sábados de 7-7', telefono: '61805994', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f003', nombre: 'La Botica Avenida Escazú', ciudad: 'San José', direccion: 'Avenida Escazú · Horario: L-V de 7 am a 7 pm, sábados de 7 am a 2 pm', telefono: '73006046', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f004', nombre: 'La Botica Lindora', ciudad: 'San José', direccion: 'Hospital Metropolitano Lindora · Horario: 24/7', telefono: '62252522', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f005', nombre: 'Farmacia Magna Médica', ciudad: 'San José', direccion: 'Magna Médica · Horario: L-V 7am-7pm, sábado 7am-12md', telefono: '60975863', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f006', nombre: 'La Botica Hospital San José', ciudad: 'San José', direccion: 'Hospital Metropolitano San José · Horario: 24/7', telefono: '64207995', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f007', nombre: 'La Botica Plaza Lincoln', ciudad: 'San José', direccion: 'Plaza Lincoln · Horario: lunes a sábado de 7 am a 10 pm', telefono: '61775240', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f008', nombre: 'La Botica Plaza del Sol', ciudad: 'San José', direccion: 'Plaza del Sol · Horario: 24/7', telefono: '64882119', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f009', nombre: 'La Botica Plaza Vizcaya', ciudad: 'Heredia', direccion: 'Plaza Vizcaya · Horario: L-V 7am-7pm, sábados 7am-2pm', telefono: '63828218', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f010', nombre: 'La Botica Plaza Real', ciudad: 'Alajuela', direccion: 'Plaza Real · Horario: lunes a sábado de 7 am a 10 pm', telefono: '61698077', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f011', nombre: 'Farmacia C3 HM', ciudad: 'Alajuela', direccion: 'C3 · Horario: L-V 7am-10pm, sábados 7am-4pm', telefono: '64826236', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f012', nombre: 'Farmacia Santa Catalina', ciudad: 'San José', direccion: 'Desamparados · Horario: 24/7', telefono: '89732384', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f013', nombre: 'La Botica San Carlos', ciudad: 'Alajuela', direccion: 'San Carlos · Horario: lunes a sábado de 7 am a 10 pm', telefono: '64733294', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f014', nombre: 'Farmacia Torre Medica', ciudad: 'San José', direccion: 'Hospital Metropolitano San José · Horario: L-V 8am-6pm', telefono: '63421015', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f015', nombre: 'AFZ', ciudad: 'Heredia', direccion: 'Zona Franca Americana Heredia · Horario: L-V 7am-5pm', telefono: '64636824', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f016', nombre: 'LHS Belén', ciudad: 'Heredia', direccion: '1 km al Oeste del Hotel Marriott, Edificio Altos de Belén · Horario: L-V 7am-7pm, sábados 7am-2pm', telefono: '64636908', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f017', nombre: 'Centro Medico Metropolitano Escazu', ciudad: 'San José', direccion: 'Centro Comercial Boulevard, local 15 · Horario: lunes a sábado de 7 am a 10 pm', telefono: '', activa: true, creada_en: '2024-01-01T00:00:00Z' },
  { id: 'f018', nombre: 'Virtual', ciudad: 'San José', direccion: 'Desamparados · Horario: L-V 8am-7pm, sábados 8am-4pm', telefono: '71631334', activa: true, creada_en: '2024-01-01T00:00:00Z' },
]

// ─── Empleados ──────────────────────────────────
export const empleados = [
  {
    id: 'mock-user-001', nombre: 'Carlos Mendoza', email: 'admin@farmarenovar.com',
    rol: 'super_admin', farmacia_id: 'f001', activo: true, creado_en: '2024-01-15T00:00:00Z',
    farmacia: farmacias[0],
  },
  {
    id: 'mock-user-002', nombre: 'Ana García Ríos', email: 'ana@farmarenovar.com',
    rol: 'admin_sucursal', farmacia_id: 'f001', activo: true, creado_en: '2024-02-01T00:00:00Z',
    farmacia: farmacias[0],
  },
  {
    id: 'mock-user-003', nombre: 'Roberto López', email: 'roberto@farmarenovar.com',
    rol: 'empleado', farmacia_id: 'f002', activo: true, creado_en: '2024-03-01T00:00:00Z',
    farmacia: farmacias[1],
  },
]

// ─── Pacientes ──────────────────────────────────
export const pacientes = [
  {
    id: 'p001', nombre: 'María Elena Hernández', telefono: '5512345001', email: 'maria@correo.com',
    direccion: 'Av. Reforma 123, Col. Centro', empresa: 'Acme SA', seguro_medico: 'GNP', tipo_pago: 'directo',
    farmacia_id: 'f001', registrado_por: 'mock-user-001', notas: 'Paciente con hipertensión controlada.',
    activo: true, creado_en: isoDaysAgo(90),
    farmacia: { nombre: farmacias[0]!.nombre },
    tratamientos: [{ count: 2 }],
  },
  {
    id: 'p002', nombre: 'José Luis Martínez', telefono: '5512345002', email: null,
    direccion: null, empresa: null, seguro_medico: 'MetLife', tipo_pago: 'reembolso',
    farmacia_id: 'f001', registrado_por: 'mock-user-001', notas: null,
    activo: true, creado_en: isoDaysAgo(75),
    farmacia: { nombre: farmacias[0]!.nombre },
    tratamientos: [{ count: 1 }],
  },
  {
    id: 'p003', nombre: 'Carmen Ruiz Sánchez', telefono: '5512345003', email: 'carmen@correo.com',
    direccion: 'Calle Hidalgo 45, Col. Jardines', empresa: null, seguro_medico: 'IMSS', tipo_pago: 'directo',
    farmacia_id: 'f001', registrado_por: 'mock-user-002', notas: 'Diabética tipo 2. Revisar interacciones.',
    activo: true, creado_en: isoDaysAgo(60),
    farmacia: { nombre: farmacias[0]!.nombre },
    tratamientos: [{ count: 2 }],
  },
  {
    id: 'p004', nombre: 'Ricardo Torres Díaz', telefono: '5512345004', email: 'ricardo@correo.com',
    direccion: 'Blvd. Norte 789', empresa: 'Torres y Asoc.', seguro_medico: 'AXA', tipo_pago: 'reembolso',
    farmacia_id: 'f002', registrado_por: 'mock-user-003', notas: null,
    activo: true, creado_en: isoDaysAgo(45),
    farmacia: { nombre: farmacias[1]!.nombre },
    tratamientos: [{ count: 1 }],
  },
  {
    id: 'p005', nombre: 'Laura Patricia Gómez', telefono: '5512345005', email: null,
    direccion: 'Fracc. Las Flores, Casa 12', empresa: null, seguro_medico: null, tipo_pago: 'directo',
    farmacia_id: 'f002', registrado_por: 'mock-user-003', notas: 'Adulto mayor, familiar recoge medicamento.',
    activo: true, creado_en: isoDaysAgo(30),
    farmacia: { nombre: farmacias[1]!.nombre },
    tratamientos: [{ count: 1 }],
  },
  {
    id: 'p006', nombre: 'Miguel Ángel Flores', telefono: '5512345006', email: 'miguel@correo.com',
    direccion: null, empresa: 'Flores Construcción', seguro_medico: 'GNP', tipo_pago: 'directo',
    farmacia_id: 'f001', registrado_por: 'mock-user-001', notas: null,
    activo: true, creado_en: isoDaysAgo(20),
    farmacia: { nombre: farmacias[0]!.nombre },
    tratamientos: [{ count: 1 }],
  },
  {
    id: 'p007', nombre: 'Sofía Ramírez López', telefono: '5512345007', email: 'sofia@correo.com',
    direccion: 'Calle Juárez 56', empresa: null, seguro_medico: 'Seguro Popular', tipo_pago: 'directo',
    farmacia_id: 'f002', registrado_por: 'mock-user-003', notas: null,
    activo: true, creado_en: isoDaysAgo(15),
    farmacia: { nombre: farmacias[1]!.nombre },
    tratamientos: [{ count: 1 }],
  },
  {
    id: 'p008', nombre: 'Fernando Castro Vega', telefono: '5512345008', email: null,
    direccion: null, empresa: null, seguro_medico: null, tipo_pago: 'reembolso',
    farmacia_id: 'f001', registrado_por: 'mock-user-002', notas: 'Alergia a penicilina.',
    activo: true, creado_en: isoDaysAgo(10),
    farmacia: { nombre: farmacias[0]!.nombre },
    tratamientos: [{ count: 1 }],
  },
]

// ─── Medicamentos (catálogo mock, formato MED- + descripción) ───
export const medicamentos = [
  { id: 'm001', codigo: 'MED-MOCK-001', descripcion: 'Losartán 50mg', nombre: 'Losartán 50mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm002', codigo: 'MED-MOCK-002', descripcion: 'Amlodipino 5mg', nombre: 'Amlodipino 5mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm003', codigo: 'MED-MOCK-003', descripcion: 'Omeprazol 20mg', nombre: 'Omeprazol 20mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm004', codigo: 'MED-MOCK-004', descripcion: 'Metformina 850mg', nombre: 'Metformina 850mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm005', codigo: 'MED-MOCK-005', descripcion: 'Glibenclamida 5mg', nombre: 'Glibenclamida 5mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm006', codigo: 'MED-MOCK-006', descripcion: 'Atorvastatina 20mg', nombre: 'Atorvastatina 20mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm007', codigo: 'MED-MOCK-007', descripcion: 'Levotiroxina 100mcg', nombre: 'Levotiroxina 100mcg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm008', codigo: 'MED-MOCK-008', descripcion: 'Captopril 25mg', nombre: 'Captopril 25mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm009', codigo: 'MED-MOCK-009', descripcion: 'Fluoxetina 20mg', nombre: 'Fluoxetina 20mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
  { id: 'm010', codigo: 'MED-MOCK-010', descripcion: 'Ciprofloxacino 500mg', nombre: 'Ciprofloxacino 500mg', marca: null, concentracion: null, activo: true, creado_en: '2024-01-01T00:00:00Z', actualizado_en: '2024-01-01T00:00:00Z' },
]

// ─── Tratamientos ───────────────────────────────
// Fechas relativas a hoy para que el dashboard siempre muestre datos relevantes
export const tratamientos = [
  {
    id: 't001', paciente_id: 'p001', medicamento_id: 'm001', medicamento: 'Losartán 50mg', dosis_diaria: 1, unidades_caja: 30,
    fecha_surtido: daysFromNow(-29), fecha_inicio_tratamiento: daysFromNow(-29), fecha_vencimiento: daysFromNow(1),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-001', creado_en: isoDaysAgo(29),
    paciente: { nombre: 'María Elena Hernández', telefono: '5512345001', farmacia_id: 'f001' },
  },
  {
    id: 't002', paciente_id: 'p001', medicamento_id: 'm002', medicamento: 'Amlodipino 5mg', dosis_diaria: 1, unidades_caja: 30,
    fecha_surtido: daysFromNow(-23), fecha_inicio_tratamiento: daysFromNow(-23), fecha_vencimiento: daysFromNow(7),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-001', creado_en: isoDaysAgo(23),
    paciente: { nombre: 'María Elena Hernández', telefono: '5512345001', farmacia_id: 'f001' },
  },
  {
    id: 't003', paciente_id: 'p002', medicamento_id: 'm003', medicamento: 'Omeprazol 20mg', dosis_diaria: 1, unidades_caja: 14,
    fecha_surtido: daysFromNow(-11), fecha_inicio_tratamiento: daysFromNow(-11), fecha_vencimiento: daysFromNow(3),
    tipo: 'temporal', activo: true, notas: 'Tratamiento por 14 días', registrado_por: 'mock-user-001', creado_en: isoDaysAgo(11),
    paciente: { nombre: 'José Luis Martínez', telefono: '5512345002', farmacia_id: 'f001' },
  },
  {
    id: 't004', paciente_id: 'p003', medicamento_id: 'm004', medicamento: 'Metformina 850mg', dosis_diaria: 2, unidades_caja: 60,
    fecha_surtido: daysFromNow(-25), fecha_inicio_tratamiento: daysFromNow(-25), fecha_vencimiento: daysFromNow(5),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-002', creado_en: isoDaysAgo(25),
    paciente: { nombre: 'Carmen Ruiz Sánchez', telefono: '5512345003', farmacia_id: 'f001' },
  },
  {
    id: 't005', paciente_id: 'p003', medicamento_id: 'm005', medicamento: 'Glibenclamida 5mg', dosis_diaria: 1, unidades_caja: 30,
    fecha_surtido: daysFromNow(-18), fecha_inicio_tratamiento: daysFromNow(-18), fecha_vencimiento: daysFromNow(12),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-002', creado_en: isoDaysAgo(18),
    paciente: { nombre: 'Carmen Ruiz Sánchez', telefono: '5512345003', farmacia_id: 'f001' },
  },
  {
    id: 't006', paciente_id: 'p004', medicamento_id: 'm006', medicamento: 'Atorvastatina 20mg', dosis_diaria: 1, unidades_caja: 30,
    fecha_surtido: daysFromNow(-28), fecha_inicio_tratamiento: daysFromNow(-28), fecha_vencimiento: daysFromNow(2),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-003', creado_en: isoDaysAgo(28),
    paciente: { nombre: 'Ricardo Torres Díaz', telefono: '5512345004', farmacia_id: 'f002' },
  },
  {
    id: 't007', paciente_id: 'p005', medicamento_id: 'm007', medicamento: 'Levotiroxina 100mcg', dosis_diaria: 1, unidades_caja: 30,
    fecha_surtido: daysFromNow(-20), fecha_inicio_tratamiento: daysFromNow(-20), fecha_vencimiento: daysFromNow(10),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-003', creado_en: isoDaysAgo(20),
    paciente: { nombre: 'Laura Patricia Gómez', telefono: '5512345005', farmacia_id: 'f002' },
  },
  {
    id: 't008', paciente_id: 'p006', medicamento_id: 'm008', medicamento: 'Captopril 25mg', dosis_diaria: 2, unidades_caja: 60,
    fecha_surtido: daysFromNow(-29), fecha_inicio_tratamiento: daysFromNow(-29), fecha_vencimiento: daysFromNow(1),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-001', creado_en: isoDaysAgo(29),
    paciente: { nombre: 'Miguel Ángel Flores', telefono: '5512345006', farmacia_id: 'f001' },
  },
  {
    id: 't009', paciente_id: 'p007', medicamento_id: 'm009', medicamento: 'Fluoxetina 20mg', dosis_diaria: 1, unidades_caja: 28,
    fecha_surtido: daysFromNow(-14), fecha_inicio_tratamiento: daysFromNow(-14), fecha_vencimiento: daysFromNow(14),
    tipo: 'cronico', activo: true, notas: null, registrado_por: 'mock-user-003', creado_en: isoDaysAgo(14),
    paciente: { nombre: 'Sofía Ramírez López', telefono: '5512345007', farmacia_id: 'f002' },
  },
  {
    id: 't010', paciente_id: 'p008', medicamento_id: 'm010', medicamento: 'Ciprofloxacino 500mg', dosis_diaria: 2, unidades_caja: 14,
    fecha_surtido: daysFromNow(-5), fecha_inicio_tratamiento: daysFromNow(-5), fecha_vencimiento: daysFromNow(2),
    tipo: 'temporal', activo: true, notas: 'Tratamiento de 7 días', registrado_por: 'mock-user-002', creado_en: isoDaysAgo(5),
    paciente: { nombre: 'Fernando Castro Vega', telefono: '5512345008', farmacia_id: 'f001' },
  },
]

// ─── Renovaciones ───────────────────────────────
export const renovaciones = [
  {
    id: 'r001', tratamiento_id: 't001', farmacia_id: 'f001', empleado_id: 'mock-user-002',
    fecha: daysFromNow(-30), fecha_inicio_tratamiento: daysFromNow(-30), notas: 'Renovación mensual', numero_factura: 'FAC-1001', monto_total_factura: 45250.5, creada_en: isoDaysAgo(30),
    farmacia: { nombre: farmacias[0]!.nombre },
    empleado: { nombre: 'Ana García Ríos' },
  },
  {
    id: 'r002', tratamiento_id: 't004', farmacia_id: 'f001', empleado_id: 'mock-user-001',
    fecha: daysFromNow(-30), fecha_inicio_tratamiento: daysFromNow(-30), notas: null, numero_factura: 'FAC-2002', monto_total_factura: 8900, creada_en: isoDaysAgo(30),
    farmacia: { nombre: farmacias[0]!.nombre },
    empleado: { nombre: 'Carlos Mendoza' },
  },
  {
    id: 'r003', tratamiento_id: 't006', farmacia_id: 'f002', empleado_id: 'mock-user-003',
    fecha: daysFromNow(-28), fecha_inicio_tratamiento: daysFromNow(-28), notas: 'Paciente pidió presentación de 60 tabletas', numero_factura: 'FAC-2003', monto_total_factura: 15600, creada_en: isoDaysAgo(28),
    farmacia: { nombre: farmacias[1]!.nombre },
    empleado: { nombre: 'Roberto López' },
  },
]

// ─── Mapa de tablas ─────────────────────────────
export const mockTables: Record<string, any[]> = {
  farmacias,
  empleados,
  pacientes,
  medicamentos,
  tratamientos,
  renovaciones,
}
