const db = require('../db');
const accountsService = require('./accounts.service');

function getByYear(year) {
  return db.all('SELECT * FROM wealth_actuals WHERE year = ? ORDER BY month', [year]);
}

function getByYearMonth(year, month) {
  return db.get('SELECT * FROM wealth_actuals WHERE year = ? AND month = ?', [year, month]);
}

function getAll() {
  return db.all('SELECT * FROM wealth_actuals ORDER BY year, month', []);
}

function upsertActual(year, month, data) {
  const existing = getByYearMonth(year, month);

  if (existing) {
    db.run(
      `UPDATE wealth_actuals SET
       planned_addition = ?, actual_addition = ?, actual_total_corpus = ?, notes = ?
       WHERE year = ? AND month = ?`,
      [
        data.planned_addition !== undefined ? data.planned_addition : existing.planned_addition,
        data.actual_addition || existing.actual_addition,
        data.actual_total_corpus || existing.actual_total_corpus,
        data.notes || existing.notes,
        year,
        month,
      ]
    );
  } else {
    db.run(
      `INSERT INTO wealth_actuals (year, month, planned_addition, actual_addition, actual_total_corpus, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        year,
        month,
        data.planned_addition || 0,
        data.actual_addition || 0,
        data.actual_total_corpus || null,
        data.notes || null,
      ]
    );
  }

  db.saveDB();
  return getByYearMonth(year, month);
}

function computeActualCorpus() {
  // Sum of all account current_capital values
  const accounts = accountsService.getAllAccounts();
  return accounts.reduce((sum, acc) => sum + (acc.current_capital || 0), 0);
}

module.exports = {
  getByYear,
  getByYearMonth,
  getAll,
  upsertActual,
  computeActualCorpus,
};
