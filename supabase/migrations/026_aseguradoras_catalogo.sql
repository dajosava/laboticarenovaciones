-- Catálogo de aseguradoras para selección en alta/edición de pacientes.

CREATE TABLE IF NOT EXISTS aseguradoras_catalogo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_aseguradoras_catalogo_nombre_norm
  ON aseguradoras_catalogo ((lower(btrim(nombre))));

CREATE INDEX IF NOT EXISTS idx_aseguradoras_catalogo_activa_nombre
  ON aseguradoras_catalogo (activa, nombre);

ALTER TABLE aseguradoras_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aseguradoras_catalogo_select_empleados" ON aseguradoras_catalogo
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM empleados e WHERE e.id = auth.uid() AND e.activo = true)
  );

CREATE POLICY "aseguradoras_catalogo_insert_super_admin" ON aseguradoras_catalogo
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol = 'super_admin'
    )
  );

CREATE POLICY "aseguradoras_catalogo_update_super_admin" ON aseguradoras_catalogo
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol = 'super_admin'
    )
  );

CREATE POLICY "aseguradoras_catalogo_delete_super_admin" ON aseguradoras_catalogo
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol = 'super_admin'
    )
  );

INSERT INTO aseguradoras_catalogo (nombre) VALUES
  ('INS'),
  ('Pan American Life Insurance'),
  ('ASSA'),
  ('BMI'),
  ('MAPFRE'),
  ('Mediprocesos'),
  ('Koris Insurance'),
  ('Best Doctors Insurance'),
  ('Adisa')
ON CONFLICT DO NOTHING;
