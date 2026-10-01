const express = require('express');
const service = require('../services/goal.service');

const router = express.Router();

// GET /api/goal — annual growth goal + progress
router.get('/', (req, res, next) => {
  try {
    res.json(service.computeGoal());
  } catch (err) {
    next(err);
  }
});

// PUT /api/goal — set opening capital / year / return% / monthly SIP
router.put('/', (req, res, next) => {
  try {
    res.json(service.updateGoal(req.body));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
