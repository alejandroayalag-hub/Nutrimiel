// Rutas de planes alimenticios, montadas en /api/planes.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const router = require('express').Router();
const pool = require('../../src/db/pool');

const DIR = path.join(__dirname, '..', '..', 'uploads', 'platillos');
fs.mkdirSync(DIR, { recursive: true });
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: DIR,
    filename: (req, file, cb) => cb(null, `${crypto.randomBytes(12).toString('hex')}.${EXT[file.mimetype]}`),
  }),
  fileFilter: (req, file, cb) => cb(EXT[file.mimetype] ? null : Object.assign(new Error('Solo imágenes JPG, PNG o WEBP'), { status: 400 }), !!EXT[file.mimetype]),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const fallo = (res, status, error) => res.status(status).json({ error });
const txt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esFoto = (f) => typeof f === 'string' && /^[a-f0-9]{24}\.(jpg|png|webp)$/.test(f) ? f : null;

function ingredientes(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.slice(0, 40)
    .map(i => ({ alimento: txt(i?.alimento, 120), cantidad: txt(i?.cantidad, 30), porcion: txt(i?.porcion, 60) }))
    .filter(i => i.alimento);
}

// ───────────── Catálogo de platillos ─────────────

router.get('/platillos', async (req, res) => {
  const q = req.query.q?.trim();
  const { rows } = await pool.query(
    `SELECT * FROM planes_platillos WHERE activo AND ($1::text IS NULL OR nombre ILIKE $2) ORDER BY nombre LIMIT 500`,
    [q || null, `%${q}%`]);
  res.json(rows);
});

router.post('/fotos', upload.single('foto'), (req, res) => {
  if (!req.file) return fallo(res, 400, 'Falta la imagen');
  res.status(201).json({ foto: req.file.filename });
});

function datosPlatillo(b) {
  const nombre = txt(b.nombre, 150);
  if (!nombre) return [null, 'Nombre requerido'];
  return [[nombre, JSON.stringify(ingredientes(b.ingredientes)), esFoto(b.foto)]];
}

router.post('/platillos', async (req, res) => {
  const [p, error] = datosPlatillo(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [nuevo] } = await pool.query(
    'INSERT INTO planes_platillos (nombre, ingredientes, foto) VALUES ($1, $2, $3) RETURNING *', p);
  res.status(201).json(nuevo);
});

router.put('/platillos/:id', async (req, res) => {
  const [p, error] = datosPlatillo(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [act] } = await pool.query(
    'UPDATE planes_platillos SET nombre = $1, ingredientes = $2, foto = $3 WHERE id = $4 RETURNING *', [...p, req.params.id]);
  if (!act) return fallo(res, 404, 'Platillo no encontrado');
  res.json(act);
});

// Baja lógica: la foto puede seguir usándose en menús ya hechos
router.delete('/platillos/:id', async (req, res) => {
  const { rowCount } = await pool.query('UPDATE planes_platillos SET activo = false WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Platillo no encontrado');
  res.json({ ok: true });
});

// ───────────── Planes por paciente ─────────────

const SELECT_PLAN = `SELECT pl.*, p.nombre || coalesce(' ' || p.apellidos, '') AS paciente
                     FROM planes_planes pl JOIN pacientes_pacientes p ON p.id = pl.paciente_id`;

router.get('/pacientes/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, fecha, titulo, created_at, updated_at, jsonb_array_length(tiempos) AS n_tiempos
     FROM planes_planes WHERE paciente_id = $1 ORDER BY fecha DESC, id DESC`, [req.params.id]);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [plan] } = await pool.query(`${SELECT_PLAN} WHERE pl.id = $1`, [req.params.id]);
  if (!plan) return fallo(res, 404, 'Plan no encontrado');
  res.json(plan);
});

function datosPlan(b) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '')) return [null, 'Fecha requerida'];
  if (!Array.isArray(b.tiempos)) return [null, 'Tiempos inválidos'];
  const tiempos = b.tiempos.slice(0, 12).map(t => ({
    nombre: txt(t?.nombre, 60) || 'Comida',
    hora: /^\d{2}:\d{2}$/.test(t?.hora || '') ? t.hora : '',
    nota: txt(t?.nota, 500),
    platillos: (Array.isArray(t?.platillos) ? t.platillos : []).slice(0, 12)
      .map(p => ({ nombre: txt(p?.nombre, 150), foto: esFoto(p?.foto), ingredientes: ingredientes(p?.ingredientes) }))
      .filter(p => p.nombre),
  }));
  return [[b.fecha, txt(b.titulo, 150) || null, JSON.stringify(tiempos), txt(b.notas, 2000) || null]];
}

router.post('/pacientes/:id', async (req, res) => {
  const [p, error] = datosPlan(req.body);
  if (error) return fallo(res, 400, error);
  try {
    const { rows: [nuevo] } = await pool.query(
      `INSERT INTO planes_planes (paciente_id, fecha, titulo, tiempos, notas, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, [req.params.id, ...p, req.user.id]);
    res.status(201).json(nuevo);
  } catch (e) {
    if (e.code === '23503') return fallo(res, 404, 'Paciente no encontrado');
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const [p, error] = datosPlan(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [act] } = await pool.query(
    `UPDATE planes_planes SET fecha = $1, titulo = $2, tiempos = $3, notas = $4, updated_at = NOW()
     WHERE id = $5 RETURNING id`, [...p, req.params.id]);
  if (!act) return fallo(res, 404, 'Plan no encontrado');
  res.json(act);
});

// Copia un plan (al mismo paciente u otro) con fecha de hoy, para ajustar en la siguiente consulta
router.post('/:id/duplicar', async (req, res) => {
  const { rows: [nuevo] } = await pool.query(
    `INSERT INTO planes_planes (paciente_id, fecha, titulo, tiempos, notas, creado_por)
     SELECT coalesce($2, paciente_id), (now() AT TIME ZONE 'America/Mexico_City')::date, titulo, tiempos, notas, $3
     FROM planes_planes WHERE id = $1 RETURNING id`, [req.params.id, req.body?.paciente_id || null, req.user.id]);
  if (!nuevo) return fallo(res, 404, 'Plan no encontrado');
  res.status(201).json(nuevo);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM planes_planes WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Plan no encontrado');
  res.json({ ok: true });
});

module.exports = router;
