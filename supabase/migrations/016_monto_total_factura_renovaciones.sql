-- Monto total del comprobante, asociado al número de factura cuando aplica.

ALTER TABLE public.renovaciones
  ADD COLUMN IF NOT EXISTS monto_total_factura NUMERIC(14, 2);

COMMENT ON COLUMN public.renovaciones.monto_total_factura IS
  'Monto total del comprobante/factura (CRC); en la aplicación es obligatorio junto a numero_factura al registrar despacho/renovación.';
