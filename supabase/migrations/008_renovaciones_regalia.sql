-- Regalía por compra en renovación: unidades extra que alargan el cálculo de vencimiento.

ALTER TABLE public.renovaciones
  ADD COLUMN IF NOT EXISTS hubo_regalia boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unidades_regalia integer NULL;

COMMENT ON COLUMN public.renovaciones.hubo_regalia IS 'Si en esta renovación hubo promoción/regalía por compra.';
COMMENT ON COLUMN public.renovaciones.unidades_regalia IS 'Unidades extra otorgadas; se suman a unidades_caja solo para calcular fecha_vencimiento.';

ALTER TABLE public.renovaciones
  ADD CONSTRAINT renovaciones_unidades_regalia_positivas
  CHECK (unidades_regalia IS NULL OR unidades_regalia > 0);
