-- Referencia opcional al sistema de inventario / facturación de la farmacia
ALTER TABLE public.renovaciones
  ADD COLUMN IF NOT EXISTS numero_factura TEXT;

COMMENT ON COLUMN public.renovaciones.numero_factura IS
  'Número de factura u otro identificador del POS/inventario de la sucursal; no validado por FarmaRenovar.';
