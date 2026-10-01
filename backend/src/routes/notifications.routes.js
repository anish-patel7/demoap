const express = require('express');
const service = require('../services/notifications.service');

const router = express.Router();

// GET /api/notifications?warnDays=14 — active alerts (password expiry, etc.)
router.get('/', (req, res, next) => {
  try {
    const warnDays = req.query.warnDays ? parseInt(req.query.warnDays, 10) : 14;
    res.json(service.getNotifications({ warnDays }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
