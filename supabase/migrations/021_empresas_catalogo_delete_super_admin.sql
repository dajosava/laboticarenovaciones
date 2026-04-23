-- Solo super_admin puede borrar filas del catálogo de empresas.
-- pacientes.empresa es texto libre; no hay FK desde pacientes hacia empresas_catalogo.

CREATE POLICY "empresas_catalogo_delete_super_admin" ON empresas_catalogo
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol = 'super_admin'
    )
  );
