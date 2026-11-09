// Rutas de seguimiento, montadas en /api/seguimiento.
const router = require('express').Router();
const pool = require('../../src/db/pool');

const CAMPOS = ['peso_kg', 'talla_cm', 'grasa_pct', 'musculo_kg', 'agua_pct', 'grasa_visceral', 'cintura_cm', 'cadera_cm', 'brazo_cm'];
const fallo = (res, status, error) => res.status(status).json({ error });

router.get('/pacientes/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM seguimiento_mediciones WHERE paciente_id = $1 ORDER BY fecha DESC, id DESC', [req.params.id]);
  res.json(rows);
});

function datos(b) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '')) return [null, 'Fecha requerida'];
  const nums = CAMPOS.map(k => (b[k] === '' || b[k] == null ? null : Number(b[k])));
  if (nums.some(n => n !== null && !Number.isFinite(n))) return [null, 'Hay un valor que no es número'];
  if (nums.every(n => n === null)) return [null, 'Captura al menos una medida'];
  return [[b.fecha, ...nums, typeof b.notas === 'string' ? b.notas.trim() || null : null]];
}

router.post('/pacientes/:id', async (req, res) => {
  const [d, error] = datos(req.body);
  if (error) return fallo(res, 400, error);
  try {
    const { rows: [m] } = await pool.query(
      `INSERT INTO seguimiento_mediciones (paciente_id, fecha, ${CAMPOS.join(', ')}, notas, creado_por)
       VALUES ($1, ${d.map((_, i) => `$${i + 2}`).join(', ')}, $${d.length + 2}) RETURNING *`,
      [req.params.id, ...d, req.user.id]);
    res.status(201).json(m);
  } catch (e) {
    if (e.code === '23514') return fallo(res, 400, 'Algún valor está fuera de rango');
    if (e.code === '23503') return fallo(res, 404, 'Paciente no encontrado');
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const [d, error] = datos(req.body);
  if (error) return fallo(res, 400, error);
  try {
    const cols = ['fecha', ...CAMPOS, 'notas'];
    const { rows: [m] } = await pool.query(
      `UPDATE seguimiento_mediciones SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')}
       WHERE id = $${cols.length + 1} RETURNING *`, [...d, req.params.id]);
    if (!m) return fallo(res, 404, 'Medición no encontrada');
    res.json(m);
  } catch (e) {
    if (e.code === '23514') return fallo(res, 400, 'Algún valor está fuera de rango');
    throw e;
  }
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM seguimiento_mediciones WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Medición no encontrada');
  res.json({ ok: true });
});

module.exports = router;
