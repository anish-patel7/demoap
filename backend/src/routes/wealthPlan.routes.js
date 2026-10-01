const express = require('express');
const service = require('../services/wealthPlan.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const plan = service.getPlan();
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.put('/', (req, res, next) => {
  try {
    const plan = service.updatePlan(req.body);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.get('/projection-actual', (req, res, next) => {
  try {
    res.json(service.getProjectionWithActual());
  } catch (err) {
    next(err);
  }
});

router.get('/projection/:scenario', (req, res, next) => {
  try {
    const scenario = req.params.scenario || 'base';
    const projection = service.getProjection(scenario);
    res.json(projection);
  } catch (err) {
    next(err);
  }
});

router.get('/scenarios/all', (req, res, next) => {
  try {
    const scenarios = service.getAllScenarios();
    res.json(scenarios);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
