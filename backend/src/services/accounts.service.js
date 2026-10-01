// Accounts Service - Schema Constraints Migrated
const db = require('../db');


function getAllAccounts() {
  return db.all('SELECT * FROM accounts ORDER BY id', []);
}

function getAccountById(id) {
  return db.get('SELECT * FROM accounts WHERE id = ?', [id]);
}

function createAccount(data) {
  const {
    account_name,
    broker_name,
    account_type,
    purpose,
    starting_capital,
    risk_limit_pct,
    algo_platform,
    is_master_account,
    parent_account_id,
    market_cap_category,
  } = data;

  const res = db.run(
    `INSERT INTO accounts (
      account_name, broker_name, account_type, purpose, starting_capital,
      risk_limit_pct, algo_platform, is_master_account, parent_account_id,
      market_cap_category, current_capital
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      account_name,
      broker_name,
      account_type,
      purpose,
      starting_capital || 0,
      risk_limit_pct || 2,
      algo_platform || null,
      is_master_account ? 1 : 0,
      parent_account_id || null,
      market_cap_category || null,
      starting_capital || 0,
    ]
  );

  return getAccountById(res.lastID);
}

function updateAccount(id, data) {
  const account = getAccountById(id);
  if (!account) throw new Error('Account not found');

  const updates = [];
  const values = [];
  const allowedFields = [
    'account_name',
    'broker_name',
    'account_type',
    'purpose',
    'risk_limit_pct',
    'algo_platform',
    'is_master_account',
    'parent_account_id',
    'market_cap_category',
    'password_last_changed',
    'password_expiry_date',
    'is_active',
  ];

  for (const field of allowedFields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) return account;

  values.push(id);
  db.run(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`, values);
  return getAccountById(id);
}

function deleteAccount(id) {
  const account = getAccountById(id);
  if (!account) throw new Error('Account not found');

  db.run('DELETE FROM accounts WHERE id = ?', [id]);
  return account;
}

function recalculateCurrentCapital(accountId) {
  const account = getAccountById(accountId);
  if (!account) throw new Error('Account not found');

  const closedTrades = db.all(
    `SELECT realized_pnl FROM trades WHERE account_id = ? AND status = 'Closed'`,
    [accountId]
  );
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);

  // Include net fund flows so demat deposits/withdrawals move current capital.
  const fundsAdded = account.funds_added_total || 0;
  const fundsWithdrawn = account.funds_withdrawn_total || 0;
  const currentCapital = account.starting_capital + fundsAdded - fundsWithdrawn + totalPnl;

  db.run('UPDATE accounts SET current_capital = ? WHERE id = ?', [currentCapital, accountId]);
  db.saveDB();

  return getAccountById(accountId);
}

module.exports = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  recalculateCurrentCapital,
};
