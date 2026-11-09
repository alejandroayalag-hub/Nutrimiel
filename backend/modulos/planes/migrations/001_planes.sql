-- Catálogo de platillos y planes (menús) por paciente. Depende de pacientes_pacientes.
-- ingredientes: [{ alimento, cantidad, porcion }]  p. ej. { "Huevo entero fresco", "100g", "2 piezas" }

CREATE TABLE planes_platillos (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  ingredientes JSONB NOT NULL DEFAULT '[]',
  foto         VARCHAR(80),
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ponytail: el menú completo en JSONB (se edita y se imprime como documento); copia de los platillos,
-- así editar el catálogo no cambia menús ya entregados.
-- tiempos: [{ nombre, hora, nota, platillos: [{ nombre, foto, ingredientes: [...] }] }]
CREATE TABLE planes_planes (
  id          SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes_pacientes(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL,
  titulo      VARCHAR(150),
  tiempos     JSONB NOT NULL DEFAULT '[]',
  notas       TEXT,
  creado_por  INTEGER REFERENCES usuarios(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX planes_paciente_idx ON planes_planes (paciente_id, fecha DESC);
