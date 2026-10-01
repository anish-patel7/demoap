const { initDB } = require('../db');
const { migrate } = require('../db/migrate');

async function run() {
  try {
    await initDB();
    await migrate();
    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
