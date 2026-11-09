-- Mediciones por consulta. Depende de pacientes_pacientes.

CREATE TABLE seguimiento_mediciones (
  id           SERIAL PRIMARY KEY,
  paciente_id  INTEGER NOT NULL REFERENCES pacientes_pacientes(id) ON DELETE CASCADE,
  fecha        DATE NOT NULL,
  peso_kg      NUMERIC(5,2) CHECK (peso_kg > 0 AND peso_kg < 500),
  talla_cm     NUMERIC(5,1) CHECK (talla_cm > 30 AND talla_cm < 260),
  grasa_pct    NUMERIC(4,1) CHECK (grasa_pct >= 0 AND grasa_pct <= 80),
  musculo_kg   NUMERIC(5,2) CHECK (musculo_kg >= 0),
  agua_pct     NUMERIC(4,1) CHECK (agua_pct >= 0 AND agua_pct <= 100),
  grasa_visceral NUMERIC(4,1) CHECK (grasa_visceral >= 0),
  cintura_cm   NUMERIC(5,1) CHECK (cintura_cm >= 0),
  cadera_cm    NUMERIC(5,1) CHECK (cadera_cm >= 0),
  brazo_cm     NUMERIC(5,1) CHECK (brazo_cm >= 0),
  notas        TEXT,
  creado_por   INTEGER REFERENCES usuarios(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX seguimiento_paciente_idx ON seguimiento_mediciones (paciente_id, fecha DESC);
