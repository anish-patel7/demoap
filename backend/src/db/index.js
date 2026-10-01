const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/wealthtrack.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let SQL = null;

async function initDB() {
  SQL = await initSqlJs();

  // Load existing database if it exists
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    // Atomic write: write to a temp file first, then rename over the real DB.
    // rename() is atomic on the same volume (Windows included), so a crash
    // mid-write leaves the original database intact instead of corrupting it.
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, DB_PATH);
  }
}

// Reload the in-memory database from the file on disk. Used after a restore
// so the running server immediately serves the restored data with no restart.
function reloadDB() {
  if (!SQL) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  const data = fs.readFileSync(DB_PATH);
  db = new SQL.Database(data);
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function getDbPath() {
  return DB_PATH;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

module.exports = {
  initDB,
  getDB,
  saveDB,
  reloadDB,
  getDbPath,
  // Synchronous wrapper methods for convenience
  run(sql, params = []) {
    const database = getDB();
    try {
      database.run(sql, params);
      // Capture the insert id BEFORE saveDB()/export, which resets last_insert_rowid to 0.
      let lastID = null;
      try {
        const res = database.exec('SELECT last_insert_rowid() AS id');
        lastID = res[0] && res[0].values[0] ? res[0].values[0][0] : null;
      } catch (_) {
        /* ignore */
      }
      const changes = database.getRowsModified();
      saveDB();
      return { changes, lastID };
    } catch (error) {
      throw error;
    }
  },
  get(sql, params = []) {
    const database = getDB();
    try {
      const stmt = database.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    } catch (error) {
      throw error;
    }
  },
  all(sql, params = []) {
    const database = getDB();
    try {
      const stmt = database.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (error) {
      throw error;
    }
  },
  exec(sql) {
    const database = getDB();
    try {
      database.exec(sql);
      saveDB();
    } catch (error) {
      throw error;
    }
  },
};
