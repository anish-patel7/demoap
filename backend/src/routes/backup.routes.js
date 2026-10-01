const express = require('express');
const service = require('../services/backup.service');

const router = express.Router();

// Accept a raw binary body (the uploaded .db file) up to 100 MB on the
// restore endpoint. Registered per-route so it doesn't affect JSON routes.
const rawUpload = express.raw({ type: '*/*', limit: '100mb' });

// GET /api/backup/download — download the current database file (manual download)
router.get('/download', (req, res, next) => {
  try {
    const buffer = service.getCurrentDbBuffer();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="wealthtrack_${stamp}.db"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// POST /api/backup/restore — restore from an uploaded .db file (raw body, manual upload)
router.post('/restore', rawUpload, (req, res, next) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = service.restoreFromBuffer(req.body);
    res.json({ message: 'Database restored', ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/backup/cleanup — wipe database tables (for development use)
router.post('/cleanup', (req, res, next) => {
  try {
    service.cleanupDatabase();
    res.json({ message: 'Database cleaned up successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
