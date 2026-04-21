-- FARMARENOVAR — Dirección estructurada (Costa Rica) en pacientes
-- Provincia, cantón, distrito y señas para ficha y reportes; `direccion` sigue pudiendo usarse como texto legado o resumen.

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS provincia_cr   TEXT,
  ADD COLUMN IF NOT EXISTS canton_cr     TEXT,
  ADD COLUMN IF NOT EXISTS distrito_cr   TEXT,
  ADD COLUMN IF NOT EXISTS direccion_senas TEXT;

COMMENT ON COLUMN public.pacientes.provincia_cr IS 'Provincia (Costa Rica), catálogo del formulario';
COMMENT ON COLUMN public.pacientes.canton_cr IS 'Cantón (Costa Rica)';
COMMENT ON COLUMN public.pacientes.distrito_cr IS 'Distrito (Costa Rica)';
COMMENT ON COLUMN public.pacientes.direccion_senas IS 'Señas o detalle de dirección (opcional)';
