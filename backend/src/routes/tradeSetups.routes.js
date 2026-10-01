const express = require('express');
const service = require('../services/tradeSetups.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const setups = service.getAll();
    res.json(setups);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const setup = service.getById(parseInt(req.params.id));
    if (!setup) return res.status(404).json({ error: 'Setup not found' });
    res.json(setup);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const setup = service.create(req.body.name);
    res.status(201).json(setup);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const setup = service.deleteSetup(parseInt(req.params.id));
    res.json({ message: 'Setup deleted', setup });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
