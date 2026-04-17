-- =============================================
-- FARMARENOVAR — Schema Completo de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── FARMACIAS ────────────────────────────────
CREATE TABLE farmacias (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     VARCHAR(150) NOT NULL,
  direccion  TEXT NOT NULL,
  telefono   VARCHAR(20),
  ciudad     VARCHAR(100),
  activa     BOOLEAN DEFAULT true,
  creada_en  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── EMPLEADOS ───────────────────────────────
-- Nota: Los empleados usan Supabase Auth. Su auth.uid() se vincula aquí.
CREATE TABLE empleados (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre       VARCHAR(150) NOT NULL,
  email        VARCHAR(200) UNIQUE NOT NULL,
  rol          VARCHAR(30) NOT NULL CHECK (rol IN ('super_admin', 'admin_sucursal', 'empleado')),
  farmacia_id  UUID REFERENCES farmacias(id),
  activo       BOOLEAN DEFAULT true,
  creado_en    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── PACIENTES ────────────────────────────────
CREATE TABLE pacientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(150) NOT NULL,
  telefono        VARCHAR(20) NOT NULL,
  email           VARCHAR(200),
  direccion       TEXT,
  empresa         VARCHAR(200),
  seguro_medico   VARCHAR(200),
  tipo_pago       VARCHAR(20) CHECK (tipo_pago IN ('directo', 'reembolso')),
  farmacia_id     UUID NOT NULL REFERENCES farmacias(id),
  registrado_por  UUID NOT NULL REFERENCES empleados(id),
  notas           TEXT,
  activo          BOOLEAN DEFAULT true,
  creado_en       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── TRATAMIENTOS ─────────────────────────────
CREATE TABLE tratamientos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id         UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medicamento         VARCHAR(200) NOT NULL,
  dosis_diaria        DECIMAL(6,2) NOT NULL CHECK (dosis_diaria > 0),
  unidades_caja       INTEGER NOT NULL CHECK (unidades_caja > 0),
  fecha_surtido       DATE NOT NULL,
  fecha_vencimiento   DATE NOT NULL,
  tipo                VARCHAR(20) NOT NULL DEFAULT 'cronico' CHECK (tipo IN ('cronico', 'temporal')),
  activo              BOOLEAN DEFAULT true,
  notas               TEXT,
  registrado_por      UUID NOT NULL REFERENCES empleados(id),
  creado_en           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para el cron diario (buscar por fecha_vencimiento)
CREATE INDEX idx_tratamientos_vencimiento ON tratamientos(fecha_vencimiento) WHERE activo = true;

-- ─── ALERTAS ENVIADAS ─────────────────────────
CREATE TABLE alertas_enviadas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tratamiento_id  UUID NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
  tipo            VARCHAR(5) NOT NULL CHECK (tipo IN ('7d', '3d', '1d')),
  canal           VARCHAR(20) NOT NULL CHECK (canal IN ('whatsapp', 'sms', 'email', 'interno')),
  enviada_en      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exitosa         BOOLEAN DEFAULT false,
  respuesta_api   TEXT
);

-- Índice para verificar duplicados en el cron
CREATE INDEX idx_alertas_tratamiento_tipo ON alertas_enviadas(tratamiento_id, tipo, enviada_en);

-- ─── RENOVACIONES ─────────────────────────────
CREATE TABLE renovaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tratamiento_id  UUID NOT NULL REFERENCES tratamientos(id),
  farmacia_id     UUID NOT NULL REFERENCES farmacias(id),
  empleado_id     UUID NOT NULL REFERENCES empleados(id),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  notas           TEXT,
  creada_en       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE farmacias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratamientos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_enviadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovaciones    ENABLE ROW LEVEL SECURITY;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT rol FROM empleados WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Función para obtener la farmacia del usuario actual
CREATE OR REPLACE FUNCTION get_user_farmacia()
RETURNS UUID AS $$
  SELECT farmacia_id FROM empleados WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- FARMACIAS: todos los empleados pueden ver, solo super_admin modifica
CREATE POLICY "empleados_ven_farmacias" ON farmacias
  FOR SELECT USING (auth.uid() IN (SELECT id FROM empleados WHERE activo = true));

CREATE POLICY "super_admin_gestiona_farmacias" ON farmacias
  FOR ALL USING (get_user_role() = 'super_admin');

-- EMPLEADOS: cada uno ve su perfil; admins ven los de su farmacia; super_admin ve todos
CREATE POLICY "empleado_ve_su_perfil" ON empleados
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "admin_ve_empleados_sucursal" ON empleados
  FOR SELECT USING (
    get_user_role() IN ('super_admin', 'admin_sucursal') AND
    (get_user_role() = 'super_admin' OR farmacia_id = get_user_farmacia())
  );

-- PACIENTES: empleados ven su farmacia; super_admin ve todos
CREATE POLICY "empleado_ve_pacientes_sucursal" ON pacientes
  FOR SELECT USING (
    get_user_role() = 'super_admin' OR
    farmacia_id = get_user_farmacia()
  );

CREATE POLICY "empleado_crea_pacientes" ON pacientes
  FOR INSERT WITH CHECK (
    farmacia_id = get_user_farmacia() OR get_user_role() = 'super_admin'
  );

CREATE POLICY "empleado_actualiza_pacientes_sucursal" ON pacientes
  FOR UPDATE USING (
    get_user_role() = 'super_admin' OR farmacia_id = get_user_farmacia()
  );

-- TRATAMIENTOS: misma lógica que pacientes
CREATE POLICY "empleado_ve_tratamientos_sucursal" ON tratamientos
  FOR SELECT USING (
    get_user_role() = 'super_admin' OR
    paciente_id IN (SELECT id FROM pacientes WHERE farmacia_id = get_user_farmacia())
  );

CREATE POLICY "empleado_crea_tratamientos" ON tratamientos
  FOR INSERT WITH CHECK (
    get_user_role() = 'super_admin' OR
    paciente_id IN (SELECT id FROM pacientes WHERE farmacia_id = get_user_farmacia())
  );

CREATE POLICY "empleado_actualiza_tratamientos" ON tratamientos
  FOR UPDATE USING (
    get_user_role() = 'super_admin' OR
    paciente_id IN (SELECT id FROM pacientes WHERE farmacia_id = get_user_farmacia())
  );

-- ALERTAS y RENOVACIONES: misma lógica
CREATE POLICY "empleado_ve_alertas_sucursal" ON alertas_enviadas
  FOR SELECT USING (
    get_user_role() = 'super_admin' OR
    tratamiento_id IN (
      SELECT t.id FROM tratamientos t
      JOIN pacientes p ON t.paciente_id = p.id
      WHERE p.farmacia_id = get_user_farmacia()
    )
  );

CREATE POLICY "empleado_ve_renovaciones_sucursal" ON renovaciones
  FOR SELECT USING (
    get_user_role() = 'super_admin' OR
    farmacia_id = get_user_farmacia()
  );

CREATE POLICY "empleado_crea_renovaciones" ON renovaciones
  FOR INSERT WITH CHECK (
    get_user_role() = 'super_admin' OR
    farmacia_id = get_user_farmacia()
  );

-- =============================================
-- DATOS INICIALES — 16 Farmacias
-- =============================================
-- Reemplaza con los datos reales de las 16 sucursales

INSERT INTO farmacias (nombre, direccion, telefono, ciudad) VALUES
  ('Sucursal Centro',        'Calle Principal #100, Centro',         '555-0001', 'Ciudad Principal'),
  ('Sucursal Norte',         'Av. Norte #200, Col. Norte',           '555-0002', 'Ciudad Principal'),
  ('Sucursal Sur',           'Blvd. Sur #300, Col. Sur',             '555-0003', 'Ciudad Principal'),
  ('Sucursal Oriente',       'Calle Oriente #400, Col. Oriente',     '555-0004', 'Ciudad Principal'),
  ('Sucursal Poniente',      'Av. Poniente #500, Col. Poniente',     '555-0005', 'Ciudad Principal'),
  ('Sucursal Plaza Mayor',   'Plaza Mayor Local 10',                 '555-0006', 'Ciudad Principal'),
  ('Sucursal Jardines',      'Av. Jardines #700, Col. Jardines',     '555-0007', 'Ciudad Principal'),
  ('Sucursal Las Palmas',    'Calle Las Palmas #800',                '555-0008', 'Ciudad Secundaria'),
  ('Sucursal Reforma',       'Blvd. Reforma #900',                   '555-0009', 'Ciudad Secundaria'),
  ('Sucursal Universitaria', 'Av. Universidad #1000',               '555-0010', 'Ciudad Secundaria'),
  ('Sucursal Industrial',    'Zona Industrial #1100',               '555-0011', 'Ciudad Secundaria'),
  ('Sucursal Residencial',   'Fracc. Residencial #1200',            '555-0012', 'Ciudad Secundaria'),
  ('Sucursal Comercial',     'Plaza Comercial Local 5',             '555-0013', 'Ciudad Terciaria'),
  ('Sucursal Hidalgo',       'Calle Hidalgo #1400',                  '555-0014', 'Ciudad Terciaria'),
  ('Sucursal Morelos',       'Av. Morelos #1500',                    '555-0015', 'Ciudad Terciaria'),
  ('Sucursal Juárez',        'Blvd. Juárez #1600',                   '555-0016', 'Ciudad Terciaria');
