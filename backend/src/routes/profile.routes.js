const express = require('express');
const service = require('../services/profile.service');

const router = express.Router();

// GET /api/profile — current display name + subtitle
router.get('/', (req, res, next) => {
  try {
    res.json(service.getProfile());
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile — update display name / subtitle
router.put('/', (req, res, next) => {
  try {
    const updated = service.updateProfile(req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
