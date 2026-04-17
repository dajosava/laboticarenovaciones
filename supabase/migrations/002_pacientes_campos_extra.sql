-- =============================================
-- FARMARENOVAR — Campos adicionales en pacientes
-- =============================================
-- Ejecutar en Supabase SQL Editor si ya aplicaste 001_schema_inicial.sql
-- =============================================

ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS direccion     TEXT,
  ADD COLUMN IF NOT EXISTS empresa       VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seguro_medico VARCHAR(200),
  ADD COLUMN IF NOT EXISTS tipo_pago     VARCHAR(20) CHECK (tipo_pago IN ('directo', 'reembolso'));

COMMENT ON COLUMN pacientes.direccion IS 'Dirección del paciente';
COMMENT ON COLUMN pacientes.empresa IS 'Empresa o razón social (opcional)';
COMMENT ON COLUMN pacientes.seguro_medico IS 'Seguro médico (opcional)';
COMMENT ON COLUMN pacientes.tipo_pago IS 'directo = pago directo; reembolso = por reembolso';
