const db = require('../db');
const { recomputeTradeFields } = require('../calc-engine/tradeCalculations');
const accountsService = require('./accounts.service');
const { parse } = require('csv-parse/sync');

function getAllTrades(filters = {}) {
  let query = 'SELECT * FROM trades WHERE 1=1';
  const params = [];

  if (filters.account_id && filters.account_id !== 'all') {
    query += ' AND account_id = ?';
    params.push(filters.account_id);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.ticker) {
    query += ' AND ticker LIKE ?';
    params.push(`%${filters.ticker}%`);
  }
  if (filters.result) {
    query += ' AND result = ?';
    params.push(filters.result);
  }
  if (filters.trade_setup) {
    query += ' AND trade_setup = ?';
    params.push(filters.trade_setup);
  }

  query += ' ORDER BY entry_date DESC';
  return db.all(query, params);
}

function getTradeById(id) {
  return db.get('SELECT * FROM trades WHERE id = ?', [id]);
}

function createTrade(data) {
  if (!data.account_id) throw new Error('account_id is required');
  if (!data.direction) throw new Error('direction is required');
  if (!data.entry_price || data.entry_price <= 0) throw new Error('entry_price must be > 0');
  if (!data.quantity || data.quantity <= 0) throw new Error('quantity must be > 0');

  const computed = recomputeTradeFields(data);

  const result = db.run(
    `INSERT INTO trades (
      account_id, ticker, instrument_type, trade_setup, direction,
      entry_date, entry_time, quantity, entry_price, target_price, stoploss,
      margin_pct, investment_amount, exit_date, exit_time, exit_price,
      status, ltp, realized_pnl, unrealized_pnl, pnl_pct, holding_days,
      result, month_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      computed.account_id,
      computed.ticker,
      computed.instrument_type || null,
      computed.trade_setup || null,
      computed.direction,
      computed.entry_date,
      computed.entry_time || null,
      computed.quantity,
      computed.entry_price,
      computed.target_price || null,
      computed.stoploss || null,
      computed.margin_pct,
      computed.investment_amount,
      computed.exit_date || null,
      computed.exit_time || null,
      computed.exit_price || null,
      computed.status,
      computed.ltp || null,
      computed.realized_pnl || null,
      computed.unrealized_pnl || null,
      computed.pnl_pct || null,
      computed.holding_days || null,
      computed.result || null,
      computed.month_label || null,
    ]
  );

  return getTradeById(result.lastID);
}

function updateTrade(id, data) {
  const trade = getTradeById(id);
  if (!trade) throw new Error('Trade not found');

  const updated = { ...trade, ...data };
  const computed = recomputeTradeFields(updated);

  const updates = [];
  const values = [];
  const fields = [
    'ticker',
    'instrument_type',
    'trade_setup',
    'direction',
    'entry_date',
    'entry_time',
    'quantity',
    'entry_price',
    'target_price',
    'stoploss',
    'margin_pct',
    'exit_date',
    'exit_time',
    'exit_price',
    'ltp',
    'remarks',
  ];

  for (const field of fields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push(data[field] || null);
    }
  }

  if (updates.length > 0) {
    values.push(id);
    db.run(
      `UPDATE trades SET ${updates.join(', ')},
       status = ?, realized_pnl = ?, unrealized_pnl = ?, pnl_pct = ?,
       holding_days = ?, result = ?, month_label = ?, investment_amount = ?
       WHERE id = ?`,
      [
        ...values.slice(0, -1),
        computed.status,
        computed.realized_pnl || null,
        computed.unrealized_pnl || null,
        computed.pnl_pct || null,
        computed.holding_days || null,
        computed.result || null,
        computed.month_label || null,
        computed.investment_amount,
        id,
      ]
    );

    accountsService.recalculateCurrentCapital(computed.account_id);
  }

  db.saveDB();
  return getTradeById(id);
}

function closeTrade(id, exitData) {
  const trade = getTradeById(id);
  if (!trade) throw new Error('Trade not found');

  return updateTrade(id, exitData);
}

function deleteTrade(id) {
  const trade = getTradeById(id);
  if (!trade) throw new Error('Trade not found');

  db.run('DELETE FROM trades WHERE id = ?', [id]);
  accountsService.recalculateCurrentCapital(trade.account_id);
  db.saveDB();

  return trade;
}

function importFromCSV(csvBuffer) {
  const content = csvBuffer.toString('utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true });

  const imported = [];
  const skipped = [];
  const anomalies = [];

  for (const record of records) {
    try {
      // Map CSV columns to trade fields
      const trade = {
        account_id: record.account_id ? parseInt(record.account_id) : null,
        ticker: record.ticker,
        instrument_type: record.instrument_type || 'Equity',
        trade_setup: record.trade_setup || null,
        direction: record.direction,
        entry_date: record.entry_date,
        entry_time: record.entry_time || null,
        quantity: parseFloat(record.quantity),
        entry_price: parseFloat(record.entry_price),
        target_price: record.target_price ? parseFloat(record.target_price) : null,
        stoploss: record.stoploss ? parseFloat(record.stoploss) : null,
        margin_pct: record.margin_pct ? parseFloat(record.margin_pct) : 100,
        exit_date: record.exit_date || null,
        exit_time: record.exit_time || null,
        exit_price: record.exit_price ? parseFloat(record.exit_price) : null,
        ltp: record.ltp ? parseFloat(record.ltp) : null,
        remarks: record.remarks || null,
      };

      if (!trade.account_id) {
        anomalies.push({ record, reason: 'missing account_id' });
        skipped.push(record);
        continue;
      }
      if (!trade.quantity || trade.quantity <= 0) {
        anomalies.push({ record, reason: 'zero or negative quantity' });
        skipped.push(record);
        continue;
      }

      const created = createTrade(trade);
      imported.push(created);
    } catch (err) {
      anomalies.push({ record, reason: err.message });
      skipped.push(record);
    }
  }

  db.saveDB();
  return { imported: imported.length, skipped: skipped.length, anomalies };
}

module.exports = {
  getAllTrades,
  getTradeById,
  createTrade,
  updateTrade,
  closeTrade,
  deleteTrade,
  importFromCSV,
};
