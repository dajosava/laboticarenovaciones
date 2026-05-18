-- =============================================================================
-- PROYECTO SUPABASE: PADRÓN — public.padron
--
-- Esquema original típico:
--   nombre_completo GENERATED ALWAYS AS (nombre || ' ' || papellido || ' ' || sapellido) STORED
-- Esa columna NO acepta INSERT/UPDATE directo desde PostgREST. Este script la convierte
-- en columna normal NOT NULL y luego permite NULL en nombre/papellido/sapellido si hace falta.
--
-- Si el SQL Editor devuelve 25006 (read-only), ver INSTRUCTIONS.txt (psql por trozos).
-- =============================================================================

-- 1) Columna surrogate
ALTER TABLE public.padron
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;

-- 2) Quitar PK sobre cedula
ALTER TABLE public.padron DROP CONSTRAINT IF EXISTS padron_pkey;

-- 3) PK por id
ALTER TABLE public.padron ADD CONSTRAINT padron_pkey PRIMARY KEY (id);

-- 4) Cédula opcional (extranjeros)
ALTER TABLE public.padron ALTER COLUMN cedula DROP NOT NULL;

-- Índice previo en cedula (CREATE INDEX idx_padron_cedula) ya no aporta si tenemos índice único parcial
DROP INDEX IF EXISTS public.idx_padron_cedula;

CREATE UNIQUE INDEX IF NOT EXISTS padron_cedula_unique_not_null
  ON public.padron (cedula)
  WHERE cedula IS NOT NULL;

-- 5) Sustituir nombre_completo GENERATED por columna almacenada (copia valores actuales)
ALTER TABLE public.padron ADD COLUMN nombre_completo_mig text;
UPDATE public.padron SET nombre_completo_mig = nombre_completo;
ALTER TABLE public.padron DROP COLUMN nombre_completo;
ALTER TABLE public.padron RENAME COLUMN nombre_completo_mig TO nombre_completo;
ALTER TABLE public.padron ALTER COLUMN nombre_completo SET NOT NULL;

-- 6) Partes del nombre opcionales (extranjeros / nombres atípicos)
ALTER TABLE public.padron ALTER COLUMN nombre DROP NOT NULL;
ALTER TABLE public.padron ALTER COLUMN papellido DROP NOT NULL;
ALTER TABLE public.padron ALTER COLUMN sapellido DROP NOT NULL;

-- 7) Columnas nuevas (altas desde FarmaRenovar)
ALTER TABLE public.padron
  ADD COLUMN IF NOT EXISTS tipo_registro text NOT NULL DEFAULT 'electoral'
    CHECK (tipo_registro IN ('electoral', 'no_listado_cr', 'menor', 'extranjero')),
  ADD COLUMN IF NOT EXISTS pasaporte text,
  ADD COLUMN IF NOT EXISTS dimex text,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS encargado_nombre text,
  ADD COLUMN IF NOT EXISTS encargado_documento text,
  ADD COLUMN IF NOT EXISTS encargado_telefono text,
  ADD COLUMN IF NOT EXISTS encargado_parentesco text,
  ADD COLUMN IF NOT EXISTS app_paciente_id uuid,
  ADD COLUMN IF NOT EXISTS creado_en timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.padron.nombre_completo IS 'Texto completo (antes generado; ahora se guarda explícito desde la app o se rellena en migración).';
COMMENT ON COLUMN public.padron.tipo_registro IS 'electoral = carga oficial; resto = altas desde FarmaRenovar';
COMMENT ON COLUMN public.padron.app_paciente_id IS 'UUID del paciente en la BD de FarmaRenovar (referencia lógica, sin FK remota)';
COMMENT ON COLUMN public.padron.pasaporte IS 'Documento extranjero';
COMMENT ON COLUMN public.padron.dimex IS 'DIMEX u otro documento de residencia';
