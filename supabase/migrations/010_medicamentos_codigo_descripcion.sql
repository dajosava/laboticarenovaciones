-- Formato catálogo: Número de artículo (MED-xxxxx) + Descripción (texto completo).

ALTER TABLE medicamentos
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(40),
  ADD COLUMN IF NOT EXISTS descripcion TEXT;

ALTER TABLE medicamentos
  ALTER COLUMN nombre TYPE TEXT;

UPDATE medicamentos
SET descripcion = nombre
WHERE descripcion IS NULL OR trim(descripcion) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_medicamentos_codigo_unique
  ON medicamentos (upper(trim(codigo)))
  WHERE codigo IS NOT NULL AND trim(codigo) <> '';

COMMENT ON COLUMN medicamentos.codigo IS 'Número de artículo del inventario, ej. MED-00004';
COMMENT ON COLUMN medicamentos.descripcion IS 'Descripción del artículo (texto de receta / Excel)';
