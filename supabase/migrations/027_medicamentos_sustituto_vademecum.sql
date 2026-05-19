-- Marca de disponibilidad de sustituto en el vademecum para cada medicamento del catálogo.
-- Útil para que el equipo identifique rápido qué productos tienen alternativa equivalente.

ALTER TABLE medicamentos
  ADD COLUMN IF NOT EXISTS tiene_sustituto_vademecum BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN medicamentos.tiene_sustituto_vademecum IS
  'true cuando el medicamento cuenta con sustituto registrado en el vademecum.';
