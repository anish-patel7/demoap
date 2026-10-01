const db = require('../db');
const accountsService = require('./accounts.service');

function getByAccountId(accountId) {
  return db.all('SELECT * FROM fund_transactions WHERE account_id = ? ORDER BY txn_date DESC', [
    accountId,
  ]);
}

// All transactions joined with account + broker, for the broker-wise ledger.
function getAll() {
  return db.all(
    `SELECT ft.*, a.account_name, a.broker_name
     FROM fund_transactions ft
     JOIN accounts a ON a.id = ft.account_id
     ORDER BY ft.txn_date DESC, ft.id DESC`,
    []
  );
}

function createTransaction(data) {
  const { account_id, type, amount, txn_date, notes } = data;

  if (!account_id || !type || !amount) throw new Error('account_id, type, and amount required');
  if (!['Add', 'Withdraw'].includes(type)) throw new Error('type must be Add or Withdraw');

  db.run(
    `INSERT INTO fund_transactions (account_id, type, amount, txn_date, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [account_id, type, amount, txn_date || new Date().toISOString().slice(0, 10), notes || null]
  );

  const added = db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions
     WHERE account_id = ? AND type = 'Add'`,
    [account_id]
  ).total;

  const withdrawn = db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions
     WHERE account_id = ? AND type = 'Withdraw'`,
    [account_id]
  ).total;

  db.run(`UPDATE accounts SET funds_added_total = ?, funds_withdrawn_total = ? WHERE id = ?`, [
    added,
    withdrawn,
    account_id,
  ]);

  accountsService.recalculateCurrentCapital(account_id);
  db.saveDB();

  return getByAccountId(account_id);
}

function deleteTransaction(id) {
  const txn = db.get('SELECT * FROM fund_transactions WHERE id = ?', [id]);
  if (!txn) throw new Error('Transaction not found');
  db.run('DELETE FROM fund_transactions WHERE id = ?', [id]);

  const accountId = txn.account_id;
  const added = db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions WHERE account_id = ? AND type = 'Add'`,
    [accountId]
  ).total;
  const withdrawn = db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions WHERE account_id = ? AND type = 'Withdraw'`,
    [accountId]
  ).total;
  db.run(`UPDATE accounts SET funds_added_total = ?, funds_withdrawn_total = ? WHERE id = ?`, [
    added,
    withdrawn,
    accountId,
  ]);
  accountsService.recalculateCurrentCapital(accountId);
  db.saveDB();
  return { deleted: true };
}

function updateTransaction(id, data) {
  const { account_id, type, amount, txn_date, notes } = data;

  const txn = db.get('SELECT * FROM fund_transactions WHERE id = ?', [id]);
  if (!txn) throw new Error('Transaction not found');

  if (!account_id || !type || !amount) throw new Error('account_id, type, and amount required');
  if (!['Add', 'Withdraw'].includes(type)) throw new Error('type must be Add or Withdraw');

  const oldAccountId = txn.account_id;

  db.run(
    `UPDATE fund_transactions
     SET account_id = ?, type = ?, amount = ?, txn_date = ?, notes = ?
     WHERE id = ?`,
    [account_id, type, amount, txn_date || new Date().toISOString().slice(0, 10), notes || null, id]
  );

  // Recalculate old account if it was different
  if (oldAccountId !== account_id) {
    const oldAdded = db.get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions
       WHERE account_id = ? AND type = 'Add'`,
      [oldAccountId]
    ).total;

    const oldWithdrawn = db.get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions
       WHERE account_id = ? AND type = 'Withdraw'`,
      [oldAccountId]
    ).total;

    db.run(`UPDATE accounts SET funds_added_total = ?, funds_withdrawn_total = ? WHERE id = ?`, [
      oldAdded,
      oldWithdrawn,
      oldAccountId,
    ]);

    accountsService.recalculateCurrentCapital(oldAccountId);
  }

  // Recalculate new account
  const added = db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions
     WHERE account_id = ? AND type = 'Add'`,
    [account_id]
  ).total;

  const withdrawn = db.get(
    `SELECT COALESCE(SUM(amount), 0) as total FROM fund_transactions
     WHERE account_id = ? AND type = 'Withdraw'`,
    [account_id]
  ).total;

  db.run(`UPDATE accounts SET funds_added_total = ?, funds_withdrawn_total = ? WHERE id = ?`, [
    added,
    withdrawn,
    account_id,
  ]);

  accountsService.recalculateCurrentCapital(account_id);
  db.saveDB();

  return db.get('SELECT * FROM fund_transactions WHERE id = ?', [id]);
}


/**
 * Investment-tracker matrix for a year:
 * per-account monthly "Add" totals (Jan..Dec), account year total,
 * plus monthly totals across accounts.
 */
function getMonthlyMatrix(year) {
  const accounts = accountsService.getAllAccounts();
  const txns = db.all(
    `SELECT account_id, type, amount, txn_date FROM fund_transactions
     WHERE substr(txn_date, 1, 4) = ?`,
    [String(year)]
  );

  const rows = accounts.map((acc) => {
    const months = Array(12).fill(0);
    let total = 0;
    for (const t of txns) {
      if (t.account_id !== acc.id) continue;
      const m = parseInt(t.txn_date.slice(5, 7), 10) - 1;
      if (m < 0 || m > 11) continue;
      const signed = t.type === 'Add' ? t.amount : -t.amount;
      months[m] += signed;
      total += signed;
    }
    return {
      account_id: acc.id,
      account_name: acc.account_name,
      broker_name: acc.broker_name,
      current_capital: acc.current_capital,
      months,
      total,
    };
  });

  const monthlyTotals = Array(12).fill(0);
  let grandTotal = 0;
  for (const r of rows) {
    r.months.forEach((v, i) => (monthlyTotals[i] += v));
    grandTotal += r.total;
  }

  return { year, rows, monthlyTotals, grandTotal };
}

module.exports = {
  getByAccountId,
  getAll,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlyMatrix,
};
