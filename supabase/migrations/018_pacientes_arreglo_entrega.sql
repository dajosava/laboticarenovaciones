-- FARMARENOVAR — Acuerdo de entrega cuando la dirección cae en zona de riesgo operativo

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS arreglo_entrega TEXT;

COMMENT ON COLUMN public.pacientes.arreglo_entrega IS
  'Coordenadas acordadas con el cliente (punto medio, trabajo, etc.) cuando la dirección está en zona de riesgo para entrega.';
