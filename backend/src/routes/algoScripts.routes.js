const express = require('express');
const service = require('../services/algoScripts.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const scripts = service.getAll();
    res.json(scripts);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const script = service.getById(parseInt(req.params.id));
    if (!script) return res.status(404).json({ error: 'Script not found' });
    res.json(script);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const script = service.create(req.body);
    res.status(201).json(script);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const script = service.update(parseInt(req.params.id), req.body);
    res.json(script);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const script = service.deleteScript(parseInt(req.params.id));
    res.json({ message: 'Script deleted', script });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/live-vs-backtest', (req, res, next) => {
  try {
    const comparison = service.getLiveVsBacktest(parseInt(req.params.id));
    res.json(comparison);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
