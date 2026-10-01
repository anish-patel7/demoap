const express = require('express');
const tradesService = require('../services/trades.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const trades = tradesService.getAllTrades(req.query);
    res.json(trades);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const trade = tradesService.getTradeById(parseInt(req.params.id));
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const trade = tradesService.createTrade(req.body);
    res.status(201).json(trade);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const trade = tradesService.updateTrade(parseInt(req.params.id), req.body);
    res.json(trade);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/close', (req, res, next) => {
  try {
    const trade = tradesService.closeTrade(parseInt(req.params.id), req.body);
    res.json(trade);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const trade = tradesService.deleteTrade(parseInt(req.params.id));
    res.json({ message: 'Trade deleted', trade });
  } catch (err) {
    next(err);
  }
});

router.post('/import-csv', express.raw({ type: 'text/csv', limit: '10mb' }), (req, res, next) => {
  try {
    const result = tradesService.importFromCSV(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
