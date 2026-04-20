-- Fecha de despacho (farmacia) vs fecha en que el paciente inicia la toma (base del vencimiento).

ALTER TABLE public.tratamientos
  ADD COLUMN IF NOT EXISTS fecha_inicio_tratamiento DATE;

UPDATE public.tratamientos
SET fecha_inicio_tratamiento = fecha_surtido
WHERE fecha_inicio_tratamiento IS NULL;

ALTER TABLE public.tratamientos
  ALTER COLUMN fecha_inicio_tratamiento SET NOT NULL;

COMMENT ON COLUMN public.tratamientos.fecha_surtido IS
  'Fecha de despacho del medicamento en la farmacia (facturación / entrega).';
COMMENT ON COLUMN public.tratamientos.fecha_inicio_tratamiento IS
  'Fecha en que el paciente inicia la toma; el vencimiento se calcula desde aquí.';

ALTER TABLE public.renovaciones
  ADD COLUMN IF NOT EXISTS fecha_inicio_tratamiento DATE;

UPDATE public.renovaciones
SET fecha_inicio_tratamiento = fecha
WHERE fecha_inicio_tratamiento IS NULL;

ALTER TABLE public.renovaciones
  ALTER COLUMN fecha_inicio_tratamiento SET NOT NULL;

COMMENT ON COLUMN public.renovaciones.fecha IS
  'Fecha de despacho de esta renovación (farmacia).';
COMMENT ON COLUMN public.renovaciones.fecha_inicio_tratamiento IS
  'Fecha en que el paciente inicia la toma con este despacho; usada para el cálculo de vencimiento.';
