const db = require('../db');
const tradesService = require('./trades.service');
const { performanceMetrics } = require('../calc-engine');

function getAll() {
  return db.all('SELECT * FROM algo_scripts ORDER BY script_name', []);
}

function getById(id) {
  return db.get('SELECT * FROM algo_scripts WHERE id = ?', [id]);
}

function create(data) {
  const { script_name, trade_direction, ...rest } = data;

  if (!script_name || !trade_direction)
    throw new Error('script_name and trade_direction are required');

  const columns = ['script_name', 'trade_direction'];
  const values = [script_name, trade_direction];

  const optionalFields = [
    'ma_fast_type',
    'ma_fast_length',
    'ma_slow_type',
    'ma_slow_length',
    'ma_filter_type',
    'ma_filter_length',
    'macd_zero_range_min',
    'macd_zero_range_max',
    'rsi_min',
    'rsi_max',
    'stoploss_multiplier',
    'stoploss_lookback',
    'ao_fast_sma_length',
    'ao_slow_sma_length',
    'gap_filter',
    'htf_filter',
    'supertrend_period',
    'supertrend_multiplier',
    'timeframe',
    'lot_size',
    'backtest_start_date',
    'backtest_end_date',
    'backtest_total_pnl',
    'backtest_max_drawdown',
    'backtest_total_trades',
    'backtest_win_pct',
    'backtest_profit_factor',
    'linked_account_id',
    'master_child_note',
  ];

  for (const field of optionalFields) {
    if (field in rest) {
      columns.push(field);
      values.push(rest[field] || null);
    }
  }

  const res = db.run(
    `INSERT INTO algo_scripts (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );

  db.saveDB();
  return getById(res.lastID);
}

function update(id, data) {
  const script = getById(id);
  if (!script) throw new Error('Script not found');

  const updates = [];
  const values = [];

  const allowedFields = [
    'script_name',
    'trade_direction',
    'ma_fast_type',
    'ma_fast_length',
    'ma_slow_type',
    'ma_slow_length',
    'ma_filter_type',
    'ma_filter_length',
    'macd_zero_range_min',
    'macd_zero_range_max',
    'rsi_min',
    'rsi_max',
    'stoploss_multiplier',
    'stoploss_lookback',
    'ao_fast_sma_length',
    'ao_slow_sma_length',
    'gap_filter',
    'htf_filter',
    'supertrend_period',
    'supertrend_multiplier',
    'timeframe',
    'lot_size',
    'backtest_start_date',
    'backtest_end_date',
    'backtest_total_pnl',
    'backtest_max_drawdown',
    'backtest_total_trades',
    'backtest_win_pct',
    'backtest_profit_factor',
    'linked_account_id',
    'master_child_note',
  ];

  for (const field of allowedFields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push(data[field] || null);
    }
  }

  if (updates.length > 0) {
    values.push(id);
    db.run(`UPDATE algo_scripts SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  db.saveDB();
  return getById(id);
}

function deleteScript(id) {
  const script = getById(id);
  if (!script) throw new Error('Script not found');

  db.run('DELETE FROM algo_scripts WHERE id = ?', [id]);
  db.saveDB();
  return script;
}

function getLiveVsBacktest(id) {
  const script = getById(id);
  if (!script) throw new Error('Script not found');

  // Get backtest stats from script
  const backtest = {
    total_pnl: script.backtest_total_pnl,
    max_drawdown: script.backtest_max_drawdown,
    total_trades: script.backtest_total_trades,
    win_pct: script.backtest_win_pct,
    profit_factor: script.backtest_profit_factor,
  };

  // Get live trades matching this script
  const liveTrades = db.all(
    `SELECT * FROM trades
     WHERE trade_setup = ? AND status = 'Closed'
     ORDER BY exit_date`,
    [script.script_name]
  );

  if (liveTrades.length === 0) {
    return {
      script_name: script.script_name,
      backtest,
      live: null,
    };
  }

  // Compute live performance
  const { winRate, profitFactor, avgWin, avgLoss, maxDrawdown, buildEquityCurve } = require(
    '../calc-engine'
  );

  const wr = winRate(liveTrades);
  const pf = profitFactor(liveTrades);
  const curve = buildEquityCurve(liveTrades);
  const dd = maxDrawdown(curve);

  const live = {
    total_pnl: liveTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0),
    max_drawdown: dd.amount,
    max_drawdown_pct: dd.pct,
    total_trades: liveTrades.length,
    win_pct: wr.winPct,
    profit_factor: pf === 'Infinity' ? null : pf,
  };

  return {
    script_name: script.script_name,
    backtest,
    live,
  };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteScript,
  getLiveVsBacktest,
};
