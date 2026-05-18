-- FARMARENOVAR — Póliza y certificado (seguro)

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS numero_poliza text,
  ADD COLUMN IF NOT EXISTS numero_certificado text;

COMMENT ON COLUMN public.pacientes.numero_poliza IS 'Número de póliza del seguro';
COMMENT ON COLUMN public.pacientes.numero_certificado IS 'Número de certificado';
