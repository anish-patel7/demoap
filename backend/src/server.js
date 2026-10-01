require('dotenv').config();
const app = require('./app');
const { initDB } = require('./db');
const { migrate } = require('./db/migrate');
const { seed } = require('./scripts/seed');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    console.log('Initializing database...');
    await initDB();

    console.log('Running migrations...');
    await migrate();

    console.log('Seeding if needed...');
    seed();

    // Automatic daily backups on startup have been disabled per user request to make all backup operations manual.
    // try {
    //   const { created, pruned } = autoBackup(14);
    //   if (created) console.log(`✓ Daily auto-backup: ${created.filename}`);
    //   if (pruned.length) console.log(`✓ Pruned ${pruned.length} old backup(s)`);
    // } catch (err) {
    //   console.warn('Auto-backup skipped:', err.message);
    // }

    app.listen(PORT, () => {
      console.log(`✓ WealthTrack backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
