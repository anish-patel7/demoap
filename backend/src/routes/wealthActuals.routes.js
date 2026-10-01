const express = require('express');
const service = require('../services/wealthActuals.service');
const wealthPlanService = require('../services/wealthPlan.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const actuals = service.getAll();
    res.json(actuals);
  } catch (err) {
    next(err);
  }
});

router.get('/:year', (req, res, next) => {
  try {
    const actuals = service.getByYear(parseInt(req.params.year));
    res.json(actuals);
  } catch (err) {
    next(err);
  }
});

router.get('/:year/:month', (req, res, next) => {
  try {
    const actual = service.getByYearMonth(parseInt(req.params.year), parseInt(req.params.month));
    if (!actual) return res.status(404).json({ error: 'Actual not found' });
    res.json(actual);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { year, month, ...data } = req.body;
    const actual = service.upsertActual(year, month, data);
    res.status(201).json(actual);
  } catch (err) {
    next(err);
  }
});

router.put('/:year/:month', (req, res, next) => {
  try {
    const actual = service.upsertActual(parseInt(req.params.year), parseInt(req.params.month), req.body);
    res.json(actual);
  } catch (err) {
    next(err);
  }
});

// Projected vs Actual comparison
router.get('/comparison/all', (req, res, next) => {
  try {
    const baseProjection = wealthPlanService.getProjection('base');
    const actuals = service.getAll();

    const comparison = baseProjection.map(row => {
      const actual = actuals.find(a => a.year === row.year);
      return {
        year: row.year,
        nominalPlanned: row.nominalCorpus,
        realPlanned: row.realCorpus,
        actualCorpus: actual ? actual.actual_total_corpus : null,
        gap: actual ? actual.actual_total_corpus - row.nominalCorpus : null,
        gapPct: actual && row.nominalCorpus > 0
          ? ((actual.actual_total_corpus - row.nominalCorpus) / row.nominalCorpus) * 100
          : null,
      };
    });

    res.json(comparison);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
