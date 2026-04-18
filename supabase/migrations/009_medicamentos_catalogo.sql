-- Catálogo de medicamentos (sin precio). Tratamientos pueden referenciar medicamento_id.

CREATE TABLE medicamentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(200) NOT NULL,
  marca           TEXT,
  concentracion   TEXT,
  activo          BOOLEAN NOT NULL DEFAULT true,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medicamentos_nombre_lower ON medicamentos (lower(nombre));
CREATE INDEX idx_medicamentos_activo_nombre ON medicamentos (activo, nombre);

COMMENT ON TABLE medicamentos IS 'Catálogo para recetas; importación desde Excel (TSV).';
COMMENT ON COLUMN medicamentos.marca IS 'Laboratorio o marca comercial (opcional)';
COMMENT ON COLUMN medicamentos.concentracion IS 'Ej. 500 mg, 20 mg (opcional)';

ALTER TABLE tratamientos
  ADD COLUMN medicamento_id UUID REFERENCES medicamentos(id) ON DELETE SET NULL;

CREATE INDEX idx_tratamientos_medicamento_id ON tratamientos (medicamento_id) WHERE medicamento_id IS NOT NULL;

ALTER TABLE medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicamentos_select_empleados" ON medicamentos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM empleados e WHERE e.id = auth.uid() AND e.activo = true)
  );

CREATE POLICY "medicamentos_insert_admins" ON medicamentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM empleados e
      WHERE e.id = auth.uid() AND e.activo = true
        AND e.rol IN ('super_admin', 'admin_sucursal')
    )
  );

CREATE POLICY "medicamentos_update_admins" ON medicamentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM empleados e
      WHERE e.id = auth.uid() AND e.activo = true
        AND e.rol IN ('super_admin', 'admin_sucursal')
    )
  );
