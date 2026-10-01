const fs = require('fs');
const path = require('path');
const { saveDB, reloadDB, getDbPath } = require('../db');

// SQLite files always begin with this 16-byte magic string. We use it to
// reject uploads that are not real SQLite databases before overwriting data.
const SQLITE_MAGIC = 'SQLite format 3 ';

function getBackupsDir() {
  const dir = path.join(path.dirname(getDbPath()), '..', 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// e.g. 2026-07-04_15-30-12
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

function isValidSqlite(buffer) {
  if (!buffer || buffer.length < 16) return false;
  return buffer.slice(0, 16).toString('binary') === SQLITE_MAGIC;
}

// Flush the in-memory DB to disk, then copy it into /backups with a timestamp.
// Used by the command-line backup script (npm run backup / backup.bat).
function createBackup() {
  saveDB();
  const dbPath = getDbPath();
  const filename = `wealthtrack_${timestamp()}.db`;
  const dest = path.join(getBackupsDir(), filename);
  fs.copyFileSync(dbPath, dest);
  const stat = fs.statSync(dest);
  return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
}

// Return the current live DB as a buffer (for download). Saves first so the
// download always reflects the latest in-memory state.
function getCurrentDbBuffer() {
  saveDB();
  return fs.readFileSync(getDbPath());
}

// Overwrite the live DB with an uploaded buffer from manual restore in UI.
function restoreFromBuffer(buffer) {
  if (!isValidSqlite(buffer)) {
    const err = new Error('Uploaded file is not a valid SQLite database.');
    err.status = 400;
    throw err;
  }

  const dbPath = getDbPath();
  fs.writeFileSync(dbPath, buffer);
  reloadDB(); // running server now serves restored data — no restart needed
  return { restored: true };
}

// Wipes all data from user tables and resets autoincrement IDs.
// Keeps the seeded flag as true in db_metadata so the application does not re-seed on next restart.
function cleanupDatabase() {
  const db = require('../db');

  // Deletion order respects foreign keys (child tables first)
  db.run('DELETE FROM trades');
  db.run('DELETE FROM fund_transactions');
  db.run('DELETE FROM algo_scripts');
  db.run('DELETE FROM accounts');
  db.run('DELETE FROM trade_setups');
  db.run('DELETE FROM wealth_plan');
  db.run(`INSERT INTO wealth_plan (
    id, my_age, son_age, daughter_age, starting_lumpsum, monthly_sip,
    expected_return_pct, inflation_pct, monthly_home_expense_today,
    yearly_added_fund, withdrawal_start_year, projection_end_age,
    alloc_large_cap_pct, alloc_mid_cap_pct, alloc_small_cap_pct, alloc_penny_pct
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  db.run('DELETE FROM wealth_actuals');

  // Reset AUTOINCREMENT sequences
  try {
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('accounts', 'trade_setups', 'trades', 'fund_transactions', 'wealth_plan', 'wealth_actuals', 'algo_scripts')");
  } catch (_) {
    // Ignore if table/sequence doesn't exist
  }

  // Ensure metadata table has seeded = true so server startup does not re-seed
  try {
    db.run('CREATE TABLE IF NOT EXISTS db_metadata (key TEXT UNIQUE, value TEXT)');
    db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('seeded', 'true')");
  } catch (_) {
    // Ignore if metadata table cannot be updated
  }

  saveDB();
}

module.exports = {
  getBackupsDir,
  createBackup,
  getCurrentDbBuffer,
  restoreFromBuffer,
  isValidSqlite,
  cleanupDatabase,
};
