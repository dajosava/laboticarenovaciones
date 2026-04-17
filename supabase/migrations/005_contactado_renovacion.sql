-- FARMARENOVAR — Marcar tratamiento como contactado para renovación pendiente
-- Si tiene valor, el ítem no se muestra por defecto en "Renovaciones pendientes" (se considera ya contactado).
ALTER TABLE tratamientos
  ADD COLUMN IF NOT EXISTS contactado_renovacion_en TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN tratamientos.contactado_renovacion_en IS 'Fecha/hora en que se marcó al paciente como contactado para esta renovación pendiente; NULL = aún no contactado';
