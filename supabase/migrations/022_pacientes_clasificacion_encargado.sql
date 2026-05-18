-- FARMARENOVAR (BD app) — Campos de alta extendida: menores, extranjeros, no listados en padrón nacional
-- Menores y extranjeros solo se guardan aquí. «no_listado_cr» además se replica al padrón vía API + service role.

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS clasificacion_alta VARCHAR(32) NOT NULL DEFAULT 'padron_nacional'
    CHECK (clasificacion_alta IN ('padron_nacional', 'no_listado_cr', 'menor', 'extranjero')),
  ADD COLUMN IF NOT EXISTS cedula_identidad TEXT,
  ADD COLUMN IF NOT EXISTS pasaporte TEXT,
  ADD COLUMN IF NOT EXISTS dimex TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS encargado_nombre TEXT,
  ADD COLUMN IF NOT EXISTS encargado_documento TEXT,
  ADD COLUMN IF NOT EXISTS encargado_telefono TEXT,
  ADD COLUMN IF NOT EXISTS encargado_parentesco TEXT;

COMMENT ON COLUMN public.pacientes.clasificacion_alta IS 'Origen del registro del paciente';
COMMENT ON COLUMN public.pacientes.encargado_nombre IS 'Persona que recibe medicamentos (menores)';
