// /api/planes/publico/fotos/:archivo — fotos de platillos (sin sesión, nombre aleatorio).
const path = require('path');
const router = require('express').Router();

const DIR = path.join(__dirname, '..', '..', 'uploads', 'platillos');

router.get('/fotos/:archivo', (req, res) => {
  if (!/^[a-f0-9]{24}\.(jpg|png|webp)$/.test(req.params.archivo)) return res.status(404).end();
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(path.join(DIR, req.params.archivo), (err) => { if (err && !res.headersSent) res.status(404).end(); });
});

module.exports = router;
