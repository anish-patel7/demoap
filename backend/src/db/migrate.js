const { getDB, saveDB } = require('./index');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const db = getDB();

  // Create _migrations table if it doesn't exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  } catch (err) {
    // Table might already exist
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const filename of files) {
    // Check if migration has been applied
    try {
      const stmt = db.prepare('SELECT * FROM _migrations WHERE filename = ?');
      stmt.bind([filename]);
      const exists = stmt.step();
      stmt.free();

      if (exists) {
        console.log(`✓ ${filename} already applied`);
        continue;
      }
    } catch (err) {
      console.error(`Error checking migration ${filename}:`, err);
    }

    // Read and execute migration
    const filepath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(filepath, 'utf-8');

    try {
      db.exec(sql);
      // Record the migration
      db.run('INSERT INTO _migrations (filename) VALUES (?)', [filename]);
      console.log(`✓ ${filename} applied`);
    } catch (err) {
      console.error(`Error applying migration ${filename}:`, err);
      throw err;
    }
  }

  saveDB();
}

module.exports = { migrate };
