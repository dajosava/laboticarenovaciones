-- Segunda aseguradora del paciente (opcional).
-- Misma fuente que `seguro_medico`: catálogo `aseguradoras_catalogo`.
-- Mismo tope de caracteres (150) que el seguro principal para mantener consistencia.

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS seguro_medico_secundario VARCHAR(150);

COMMENT ON COLUMN public.pacientes.seguro_medico_secundario IS
  'Segunda aseguradora del paciente (opcional). Tomada del mismo catálogo aseguradoras_catalogo que seguro_medico.';
