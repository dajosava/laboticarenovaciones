-- Sedes reales (Costa Rica) — actualiza las 16 sucursales sembradas en 001 y agrega 2 nuevas.
-- Dirección incluye horario en texto para no requerir nueva columna.

UPDATE farmacias SET
  nombre = 'La Botica Liberia',
  ciudad = 'Guanacaste',
  direccion = 'Clínica 25 de Julio · Horario: l-d de 8 am a 8 pm',
  telefono = '62638468'
WHERE nombre = 'Sucursal Centro';

UPDATE farmacias SET
  nombre = 'La Botica Marina Pez Vela',
  ciudad = 'Puntarenas',
  direccion = 'Marina de Quepos · Horario: L-V de 7am a 10pm, sábados de 7-7',
  telefono = '61805994'
WHERE nombre = 'Sucursal Norte';

UPDATE farmacias SET
  nombre = 'La Botica Avenida Escazú',
  ciudad = 'San José',
  direccion = 'Avenida Escazú · Horario: L-V de 7 am a 7 pm, sábados de 7 am a 2 pm',
  telefono = '73006046'
WHERE nombre = 'Sucursal Sur';

UPDATE farmacias SET
  nombre = 'La Botica Lindora',
  ciudad = 'San José',
  direccion = 'Hospital Metropolitano Lindora · Horario: 24/7',
  telefono = '62252522'
WHERE nombre = 'Sucursal Oriente';

UPDATE farmacias SET
  nombre = 'Farmacia Magna Médica',
  ciudad = 'San José',
  direccion = 'Magna Médica · Horario: L-V 7am-7pm, sábado 7am-12md',
  telefono = '60975863'
WHERE nombre = 'Sucursal Poniente';

UPDATE farmacias SET
  nombre = 'La Botica Hospital San José',
  ciudad = 'San José',
  direccion = 'Hospital Metropolitano San José · Horario: 24/7',
  telefono = '64207995'
WHERE nombre = 'Sucursal Plaza Mayor';

UPDATE farmacias SET
  nombre = 'La Botica Plaza Lincoln',
  ciudad = 'San José',
  direccion = 'Plaza Lincoln · Horario: lunes a sábado de 7 am a 10 pm',
  telefono = '61775240'
WHERE nombre = 'Sucursal Jardines';

UPDATE farmacias SET
  nombre = 'La Botica Plaza del Sol',
  ciudad = 'San José',
  direccion = 'Plaza del Sol · Horario: 24/7',
  telefono = '64882119'
WHERE nombre = 'Sucursal Las Palmas';

UPDATE farmacias SET
  nombre = 'La Botica Plaza Vizcaya',
  ciudad = 'Heredia',
  direccion = 'Plaza Vizcaya · Horario: L-V 7am-7pm, sábados 7am-2pm',
  telefono = '63828218'
WHERE nombre = 'Sucursal Reforma';

UPDATE farmacias SET
  nombre = 'La Botica Plaza Real',
  ciudad = 'Alajuela',
  direccion = 'Plaza Real · Horario: lunes a sábado de 7 am a 10 pm',
  telefono = '61698077'
WHERE nombre = 'Sucursal Universitaria';

UPDATE farmacias SET
  nombre = 'Farmacia C3 HM',
  ciudad = 'Alajuela',
  direccion = 'C3 · Horario: L-V 7am-10pm, sábados 7am-4pm',
  telefono = '64826236'
WHERE nombre = 'Sucursal Industrial';

UPDATE farmacias SET
  nombre = 'Farmacia Santa Catalina',
  ciudad = 'San José',
  direccion = 'Desamparados · Horario: 24/7',
  telefono = '89732384'
WHERE nombre = 'Sucursal Residencial';

UPDATE farmacias SET
  nombre = 'La Botica San Carlos',
  ciudad = 'Alajuela',
  direccion = 'San Carlos · Horario: lunes a sábado de 7 am a 10 pm',
  telefono = '64733294'
WHERE nombre = 'Sucursal Comercial';

UPDATE farmacias SET
  nombre = 'Farmacia Torre Medica',
  ciudad = 'San José',
  direccion = 'Hospital Metropolitano San José · Horario: L-V 8am-6pm',
  telefono = '63421015'
WHERE nombre = 'Sucursal Hidalgo';

UPDATE farmacias SET
  nombre = 'AFZ',
  ciudad = 'Heredia',
  direccion = 'Zona Franca Americana Heredia · Horario: L-V 7am-5pm',
  telefono = '64636824'
WHERE nombre = 'Sucursal Morelos';

UPDATE farmacias SET
  nombre = 'LHS Belén',
  ciudad = 'Heredia',
  direccion = '1 km al Oeste del Hotel Marriott, Edificio Altos de Belén · Horario: L-V 7am-7pm, sábados 7am-2pm',
  telefono = '64636908'
WHERE nombre = 'Sucursal Juárez';

INSERT INTO farmacias (nombre, direccion, telefono, ciudad)
SELECT 'Centro Medico Metropolitano Escazu',
  'Centro Comercial Boulevard, local 15 · Horario: lunes a sábado de 7 am a 10 pm',
  NULL,
  'San José'
WHERE NOT EXISTS (SELECT 1 FROM farmacias WHERE nombre = 'Centro Medico Metropolitano Escazu');

INSERT INTO farmacias (nombre, direccion, telefono, ciudad)
SELECT 'Virtual',
  'Desamparados · Horario: L-V 8am-7pm, sábados 8am-4pm',
  '71631334',
  'San José'
WHERE NOT EXISTS (SELECT 1 FROM farmacias WHERE nombre = 'Virtual');
