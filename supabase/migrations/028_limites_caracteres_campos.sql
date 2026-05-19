-- =============================================================================
-- Límites de caracteres unificados entre frontend (maxLength) y base de datos.
--
-- Estrategia:
--   1. Para columnas VARCHAR ampliadas (sin riesgo de pérdida): ALTER COLUMN
--      directo. Postgres no penaliza por longitud y no hay datos afectados.
--   2. Para columnas VARCHAR reducidas: ALTER COLUMN con USING substring(...)
--      para truncar de forma segura datos legacy.
--   3. Para columnas TEXT donde queremos imponer un tope: primero un UPDATE
--      truncador (idempotente) y después un CHECK validable. Si la columna ya
--      cumple, el CHECK no rompe nada.
--
-- Convención (alineada con el frontend):
--   nombre paciente / farmacia / empleado : 150
--   ciudad                                : 100
--   teléfono                              : 20
--   email                                 : 254
--   dirección estructurada / señas        : 255
--   empresa / aseguradora                 : 150
--   marca / concentración                 : 100
--   código medicamento                    : 50
--   descripción medicamento               : 255
--   número de factura                     : 50
--   documentos personales (cédula,
--     pasaporte, DIMEX, póliza,
--     certificado, encargado_documento,
--     medico_receta_id)                   : 50
--   parentesco                            : 50
--   notas / arreglo entrega               : 1000
-- =============================================================================

-- ─── PACIENTES: ampliar email ────────────────────────────────────────────────
ALTER TABLE public.pacientes
  ALTER COLUMN email TYPE VARCHAR(254);

-- ─── PACIENTES: reducir empresa y seguro_medico a 150 (trunca legacy) ───────
ALTER TABLE public.pacientes
  ALTER COLUMN empresa       TYPE VARCHAR(150) USING substring(empresa, 1, 150),
  ALTER COLUMN seguro_medico TYPE VARCHAR(150) USING substring(seguro_medico, 1, 150);

-- ─── EMPLEADOS: ampliar email ────────────────────────────────────────────────
ALTER TABLE public.empleados
  ALTER COLUMN email TYPE VARCHAR(254);

-- ─── TRATAMIENTOS: reducir marca y concentración a 100 ──────────────────────
ALTER TABLE public.tratamientos
  ALTER COLUMN marca         TYPE VARCHAR(100) USING substring(marca, 1, 100),
  ALTER COLUMN concentracion TYPE VARCHAR(100) USING substring(concentracion, 1, 100);

-- ─── MEDICAMENTOS: ampliar código a 50 ──────────────────────────────────────
ALTER TABLE public.medicamentos
  ALTER COLUMN codigo TYPE VARCHAR(50);

-- ─── EMPRESAS / ASEGURADORAS: reducir nombre a 150 ──────────────────────────
ALTER TABLE public.empresas_catalogo
  ALTER COLUMN nombre TYPE VARCHAR(150) USING substring(nombre, 1, 150);

ALTER TABLE public.aseguradoras_catalogo
  ALTER COLUMN nombre TYPE VARCHAR(150) USING substring(nombre, 1, 150);

-- ─── Truncado preventivo de columnas TEXT antes de aplicar CHECKs ───────────
UPDATE public.pacientes SET direccion          = substring(direccion, 1, 255)        WHERE char_length(direccion) > 255;
UPDATE public.pacientes SET direccion_senas    = substring(direccion_senas, 1, 255)  WHERE char_length(direccion_senas) > 255;
UPDATE public.pacientes SET notas              = substring(notas, 1, 1000)           WHERE char_length(notas) > 1000;
UPDATE public.pacientes SET arreglo_entrega    = substring(arreglo_entrega, 1, 1000) WHERE char_length(arreglo_entrega) > 1000;
UPDATE public.pacientes SET encargado_nombre   = substring(encargado_nombre, 1, 100) WHERE char_length(encargado_nombre) > 100;
UPDATE public.pacientes SET encargado_telefono = substring(encargado_telefono, 1, 20) WHERE char_length(encargado_telefono) > 20;
UPDATE public.pacientes SET encargado_documento = substring(encargado_documento, 1, 50) WHERE char_length(encargado_documento) > 50;
UPDATE public.pacientes SET encargado_parentesco = substring(encargado_parentesco, 1, 50) WHERE char_length(encargado_parentesco) > 50;
UPDATE public.pacientes SET cedula_identidad   = substring(cedula_identidad, 1, 50)   WHERE char_length(cedula_identidad) > 50;
UPDATE public.pacientes SET pasaporte          = substring(pasaporte, 1, 50)          WHERE char_length(pasaporte) > 50;
UPDATE public.pacientes SET dimex              = substring(dimex, 1, 50)              WHERE char_length(dimex) > 50;
UPDATE public.pacientes SET numero_poliza      = substring(numero_poliza, 1, 50)      WHERE char_length(numero_poliza) > 50;
UPDATE public.pacientes SET numero_certificado = substring(numero_certificado, 1, 50) WHERE char_length(numero_certificado) > 50;

UPDATE public.tratamientos SET notas            = substring(notas, 1, 1000)         WHERE char_length(notas) > 1000;
UPDATE public.tratamientos SET medico_receta_id = substring(medico_receta_id, 1, 50) WHERE char_length(medico_receta_id) > 50;

UPDATE public.renovaciones SET numero_factura = substring(numero_factura, 1, 50)   WHERE char_length(numero_factura) > 50;
UPDATE public.renovaciones SET notas          = substring(notas, 1, 1000)          WHERE char_length(notas) > 1000;

UPDATE public.medicamentos SET descripcion = substring(descripcion, 1, 255)        WHERE char_length(descripcion) > 255;
UPDATE public.medicamentos SET marca       = substring(marca, 1, 100)              WHERE char_length(marca) > 100;
UPDATE public.medicamentos SET concentracion = substring(concentracion, 1, 100)    WHERE char_length(concentracion) > 100;

-- ─── CHECKs validables (datos ya truncados arriba, no debería fallar) ───────
DO $migration$
DECLARE
  v_checks TEXT[][] := ARRAY[
    -- [tabla, columna, longitud_maxima]
    ['pacientes',   'direccion',           '255'],
    ['pacientes',   'direccion_senas',     '255'],
    ['pacientes',   'notas',               '1000'],
    ['pacientes',   'arreglo_entrega',     '1000'],
    ['pacientes',   'encargado_nombre',    '100'],
    ['pacientes',   'encargado_telefono',  '20'],
    ['pacientes',   'encargado_documento', '50'],
    ['pacientes',   'encargado_parentesco', '50'],
    ['pacientes',   'cedula_identidad',    '50'],
    ['pacientes',   'pasaporte',           '50'],
    ['pacientes',   'dimex',               '50'],
    ['pacientes',   'numero_poliza',       '50'],
    ['pacientes',   'numero_certificado',  '50'],
    ['tratamientos', 'notas',              '1000'],
    ['tratamientos', 'medico_receta_id',   '50'],
    ['renovaciones', 'numero_factura',     '50'],
    ['renovaciones', 'notas',              '1000'],
    ['medicamentos', 'descripcion',        '255'],
    ['medicamentos', 'marca',              '100'],
    ['medicamentos', 'concentracion',      '100']
  ];
  r TEXT[];
  v_tabla TEXT;
  v_col TEXT;
  v_max INTEGER;
  v_constraint TEXT;
BEGIN
  FOREACH r SLICE 1 IN ARRAY v_checks LOOP
    v_tabla := r[1];
    v_col := r[2];
    v_max := r[3]::INTEGER;
    v_constraint := format('chk_%s_%s_maxlen', v_tabla, v_col);

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      v_tabla, v_constraint
    );

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%I IS NULL OR char_length(%I) <= %s)',
      v_tabla, v_constraint, v_col, v_col, v_max
    );
  END LOOP;
END
$migration$;

COMMENT ON CONSTRAINT chk_pacientes_notas_maxlen ON public.pacientes IS
  'Tope alineado con maxLength del frontend (1000 caracteres).';
