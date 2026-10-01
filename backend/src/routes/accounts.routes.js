const express = require('express');
const accountsService = require('../services/accounts.service');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const accounts = accountsService.getAllAccounts();
    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const account = accountsService.getAccountById(parseInt(req.params.id));
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const account = accountsService.createAccount(req.body);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const account = accountsService.updateAccount(parseInt(req.params.id), req.body);
    res.json(account);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const account = accountsService.deleteAccount(parseInt(req.params.id));
    res.json({ message: 'Account deleted', account });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
