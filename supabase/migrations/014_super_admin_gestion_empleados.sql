-- Permite al super_admin dar de alta y editar perfiles en `empleados`
-- (los usuarios deben existir antes en Supabase Auth; el id = auth.users.id)

CREATE POLICY "super_admin_inserta_empleados" ON public.empleados
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empleados e
      WHERE e.id = auth.uid() AND e.activo = true AND e.rol = 'super_admin'
    )
  );

CREATE POLICY "super_admin_actualiza_empleados" ON public.empleados
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.empleados e
      WHERE e.id = auth.uid() AND e.activo = true AND e.rol = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.empleados e
      WHERE e.id = auth.uid() AND e.activo = true AND e.rol = 'super_admin'
    )
  );
