const express = require('express');
const dashboardService = require('../services/dashboard.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const accountId = req.query.account_id || 'all';
    const data = dashboardService.getDashboardData(accountId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
