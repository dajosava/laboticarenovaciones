-- Tabla de alertas automáticas: la app ya no registra ni consulta alertas_enviadas.
-- DROP TABLE elimina índices, RLS y políticas asociadas.

DROP TABLE IF EXISTS public.alertas_enviadas CASCADE;
