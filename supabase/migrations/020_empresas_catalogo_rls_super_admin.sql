-- Solo super_admin puede crear/editar/desactivar empresas del catálogo.
-- Los empleados activos siguen pudiendo leer (para combos en pacientes).

DROP POLICY IF EXISTS "empresas_catalogo_insert_admins" ON empresas_catalogo;
DROP POLICY IF EXISTS "empresas_catalogo_update_admins" ON empresas_catalogo;

CREATE POLICY "empresas_catalogo_insert_super_admin" ON empresas_catalogo
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol = 'super_admin'
    )
  );

CREATE POLICY "empresas_catalogo_update_super_admin" ON empresas_catalogo
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol = 'super_admin'
    )
  );
