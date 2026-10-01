const db = require('../db');

function getAll() {
  return db.all('SELECT * FROM trade_setups ORDER BY name', []);
}

function getById(id) {
  return db.get('SELECT * FROM trade_setups WHERE id = ?', [id]);
}

function create(name) {
  if (!name) throw new Error('name is required');

  const res = db.run('INSERT INTO trade_setups (name) VALUES (?)', [name]);
  db.saveDB();
  return getById(res.lastID);
}

function deleteSetup(id) {
  const setup = getById(id);
  if (!setup) throw new Error('Setup not found');

  db.run('DELETE FROM trade_setups WHERE id = ?', [id]);
  db.saveDB();
  return setup;
}

module.exports = {
  getAll,
  getById,
  create,
  deleteSetup,
};
