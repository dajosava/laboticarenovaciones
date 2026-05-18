-- Identificador del médico que prescribió la receta (control interno por despacho/tratamiento).
ALTER TABLE public.tratamientos
  ADD COLUMN IF NOT EXISTS medico_receta_id text NULL;

COMMENT ON COLUMN public.tratamientos.medico_receta_id IS
  'ID o código del médico que emitió la receta asociada a este registro de tratamiento/despacho.';
