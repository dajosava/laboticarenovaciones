-- FARMARENOVAR — Flags MediSmart y paciente sin seguro

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS tiene_medismart boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paciente_sin_seguro boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.pacientes.tiene_medismart IS 'Paciente afiliado o con programa MediSmart';
COMMENT ON COLUMN public.pacientes.paciente_sin_seguro IS 'Marcado cuando el paciente no cuenta con seguro médico';
