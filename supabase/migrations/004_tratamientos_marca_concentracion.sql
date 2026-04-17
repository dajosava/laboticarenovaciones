-- FARMARENOVAR — Marca y concentración en tratamientos
ALTER TABLE tratamientos
  ADD COLUMN IF NOT EXISTS marca VARCHAR(200),
  ADD COLUMN IF NOT EXISTS concentracion VARCHAR(200);

COMMENT ON COLUMN tratamientos.marca IS 'Marca comercial del medicamento (opcional)';

COMMENT ON COLUMN tratamientos.concentracion IS 'Concentración del medicamento, ej: 500mg, 20mg (opcional)';
