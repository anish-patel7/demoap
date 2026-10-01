const express = require('express');
const service = require('../services/fundTransactions.service');

const router = express.Router();

// All transactions (broker-wise ledger)
router.get('/', (req, res, next) => {
  try {
    res.json(service.getAll());
  } catch (err) {
    next(err);
  }
});

// Investment-tracker monthly matrix for a year
router.get('/matrix/:year', (req, res, next) => {
  try {
    res.json(service.getMonthlyMatrix(parseInt(req.params.year)));
  } catch (err) {
    next(err);
  }
});

router.get('/:accountId', (req, res, next) => {
  try {
    const txns = service.getByAccountId(parseInt(req.params.accountId));
    res.json(txns);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const txns = service.createTransaction(req.body);
    res.status(201).json(txns);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const txn = service.updateTransaction(parseInt(req.params.id), req.body);
    res.json(txn);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    res.json(service.deleteTransaction(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
