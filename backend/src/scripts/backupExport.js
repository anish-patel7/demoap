require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dbModule = require('../db');
const { initDB } = dbModule;
const { getBackupsDir, createBackup } = require('../services/backup.service');

// Quote a value for CSV (RFC 4180): wrap in quotes and double any inner quote
// whenever the value contains a comma, quote, or newline.
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportTableToCsv(table, destDir) {
  const rows = dbModule.all(`SELECT * FROM ${table}`, []);
  if (rows.length === 0) {
    // Still emit a header-only file if we can read the columns.
    const info = dbModule.all(`PRAGMA table_info(${table})`, []);
    const header = info.map((c) => c.name).join(',');
    fs.writeFileSync(path.join(destDir, `${table}.csv`), header + '\n');
    return 0;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(','));
  }
  fs.writeFileSync(path.join(destDir, `${table}.csv`), lines.join('\n') + '\n');
  return rows.length;
}

async function run() {
  try {
    await initDB();

    // 1. Timestamped copy of the raw .db file.
    const info = createBackup();
    console.log(`✓ Database snapshot: ${info.filename} (${info.size} bytes)`);

    // 2. CSV export of every user table alongside the snapshot.
    const csvDir = path.join(getBackupsDir(), info.filename.replace(/\.db$/, '_csv'));
    fs.mkdirSync(csvDir, { recursive: true });

    const tables = dbModule
      .all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'",
        []
      )
      .map((r) => r.name);

    for (const table of tables) {
      const count = exportTableToCsv(table, csvDir);
      console.log(`  • ${table}: ${count} rows`);
    }

    console.log(`✓ CSV export: ${csvDir}`);
    console.log('Backup complete.');
    // Let the event loop drain naturally — calling process.exit() here triggers
    // a harmless libuv assertion while the sql.js WASM handles tear down.
  } catch (err) {
    console.error('Backup error:', err);
    process.exit(1);
  }
}

run();
