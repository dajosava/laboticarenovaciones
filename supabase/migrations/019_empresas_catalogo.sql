-- Catálogo de empresas para selección en alta/edición de pacientes.

CREATE TABLE IF NOT EXISTS empresas_catalogo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_empresas_catalogo_nombre_norm
  ON empresas_catalogo ((lower(btrim(nombre))));

CREATE INDEX IF NOT EXISTS idx_empresas_catalogo_activa_nombre
  ON empresas_catalogo (activa, nombre);

ALTER TABLE empresas_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_catalogo_select_empleados" ON empresas_catalogo
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM empleados e WHERE e.id = auth.uid() AND e.activo = true)
  );

CREATE POLICY "empresas_catalogo_insert_admins" ON empresas_catalogo
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol IN ('super_admin', 'admin_sucursal')
    )
  );

CREATE POLICY "empresas_catalogo_update_admins" ON empresas_catalogo
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM empleados e
      WHERE e.id = auth.uid()
        AND e.activo = true
        AND e.rol IN ('super_admin', 'admin_sucursal')
    )
  );

INSERT INTO empresas_catalogo (nombre) VALUES
  ('ERNST & YOUNG'),
  ('EY LAW SA'),
  ('BTH SSC, SA'),
  ('NEVRO MEDICAL S.R.L'),
  ('COND HORIZONTAL'),
  ('CDG ZONA FRANCA SERVICIOS S.A.'),
  ('ZONA FRANCA COYOL'),
  ('COYOL DESARROLLO'),
  ('EVOLUTION FREE ZONE S.A'),
  ('CALECO FREE ZONE'),
  ('BAXTER AMERICAS'),
  ('MICRA CONSULTING-INTERTEC'),
  ('GRUPO SEAR'),
  ('REXCARGO'),
  ('FINPLAT TECH CR'),
  ('RIVERPOINT'),
  ('EBS Employee'),
  ('CONGELADOS DEL MONTE'),
  ('CONDUCEN'),
  ('ALLERGAN'),
  ('BIMBO S.A.'),
  ('IBM BUSINESS'),
  ('SAMTEC INTERCONNECT ASSEMBLY'),
  ('BASS AMERICA(BAT)'),
  ('ACCENTURE'),
  ('PRAXAIR COSTA RICA SOCIEDAD ANONIMA'),
  ('KYNDRYL'),
  ('Abbott'),
  ('ADT -Circuito'),
  ('Align Technology'),
  ('Soldanza'),
  ('ASSECCSS'),
  ('Farmagro'),
  ('BAC Latam'),
  ('Banco Improsa'),
  ('Promerica'),
  ('Brightpoint'),
  ('Central de Mangueras'),
  ('St. Jude School'),
  ('Citi Bank'),
  ('COLPER'),
  ('CONVERA'),
  ('Credix'),
  ('BAC Credomatic'),
  ('DELL'),
  ('Reserva Conchal'),
  ('DHL'),
  ('Eaton'),
  ('Eco Desarrollos'),
  ('Emerson'),
  ('EPA'),
  ('Firestone'),
  ('Grupo Roble'),
  ('GSK Pharma'),
  ('DXC Technology'),
  ('HP Enterprise'),
  ('Hotel Flamingo'),
  ('Hotel Andaz'),
  ('ICON'),
  ('Hotel Tabacon'),
  ('MCM Midland'),
  ('MSD'),
  ('Persianas Canet'),
  ('Hotel Arenas'),
  ('Procter Ventas(Procter & Gamble Interamericas)'),
  ('Adobe Rent a Car'),
  ('Terumo CV'),
  ('Tractomotriz'),
  ('TSI'),
  ('Viant'),
  ('Kaiser'),
  ('Purdy'),
  ('TE Conectivity'),
  ('Kaiser Permanente'),
  ('Roche'),
  ('Terumo'),
  ('Edwards'),
  ('Philips'),
  ('Newrest'),
  ('Grupo Enjoy'),
  ('Smith & Nephew'),
  ('Hertz'),
  ('Hotel Secrets Papagayo'),
  ('Holcim')
ON CONFLICT DO NOTHING;
