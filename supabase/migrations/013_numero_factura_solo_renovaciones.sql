-- Número de factura solo en renovaciones (surtido inicial o renovación).
-- No depende de tratamientos.numero_factura: si esa columna existió en algún entorno
-- (migración antigua retirada), se copia aquí y se elimina.

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'tratamientos'
      AND c.column_name = 'numero_factura'
  ) THEN
    EXECUTE $ins$
    INSERT INTO public.renovaciones (
      tratamiento_id,
      farmacia_id,
      empleado_id,
      fecha,
      notas,
      numero_factura,
      hubo_regalia,
      unidades_regalia
    )
    SELECT
      t.id,
      COALESCE(e.farmacia_id, p.farmacia_id),
      t.registrado_por,
      t.fecha_surtido,
      'Surtido inicial (migrado desde tratamiento)',
      NULLIF(btrim(t.numero_factura), ''),
      false,
      NULL
    FROM public.tratamientos t
    JOIN public.pacientes p ON p.id = t.paciente_id
    LEFT JOIN public.empleados e ON e.id = t.registrado_por
    WHERE NULLIF(btrim(t.numero_factura), '') IS NOT NULL
      AND COALESCE(e.farmacia_id, p.farmacia_id) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.renovaciones r
        WHERE r.tratamiento_id = t.id
          AND r.fecha = t.fecha_surtido
          AND NULLIF(btrim(r.numero_factura), '') IS NOT DISTINCT FROM NULLIF(btrim(t.numero_factura), '')
      )
    $ins$;
  END IF;
END $migration$;

ALTER TABLE public.tratamientos
  DROP COLUMN IF EXISTS numero_factura;

COMMENT ON COLUMN public.renovaciones.numero_factura IS
  'Número de factura u otro identificador del POS/inventario (surtido inicial o renovación); no validado por FarmaRenovar.';
