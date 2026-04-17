-- FARMARENOVAR — Permiso para eliminar pacientes
-- Empleados pueden eliminar pacientes de su farmacia; super_admin puede eliminar cualquiera.

CREATE POLICY "empleado_elimina_pacientes_sucursal" ON pacientes
  FOR DELETE USING (
    get_user_role() = 'super_admin' OR farmacia_id = get_user_farmacia()
  );
