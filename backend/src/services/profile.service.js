const db = require('../db');

const DEFAULT_PROFILE = { id: 1, display_name: 'V. K. Sharma', subtitle: 'Pro Account' };

function getProfile() {
  const row = db.get(
    'SELECT id, display_name, subtitle, updated_at FROM app_profile WHERE id = 1'
  );
  return row || { ...DEFAULT_PROFILE };
}

function updateProfile({ display_name, subtitle } = {}) {
  const current = getProfile();
  const name = (display_name !== undefined ? display_name : current.display_name).trim();
  const sub = (subtitle !== undefined ? subtitle : current.subtitle || '').trim();

  if (!name) {
    const err = new Error('Display name is required.');
    err.status = 400;
    throw err;
  }
  if (name.length > 60) {
    const err = new Error('Display name is too long (max 60 characters).');
    err.status = 400;
    throw err;
  }

  db.run(
    "UPDATE app_profile SET display_name = ?, subtitle = ?, updated_at = datetime('now') WHERE id = 1",
    [name, sub]
  );
  return getProfile();
}

module.exports = { getProfile, updateProfile };
