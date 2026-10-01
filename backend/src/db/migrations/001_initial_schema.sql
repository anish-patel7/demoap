CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  starting_capital REAL NOT NULL DEFAULT 0,
  funds_added_total REAL NOT NULL DEFAULT 0,
  funds_withdrawn_total REAL NOT NULL DEFAULT 0,
  current_capital REAL NOT NULL DEFAULT 0,
  risk_limit_pct REAL NOT NULL DEFAULT 2,
  algo_platform TEXT,
  is_master_account INTEGER NOT NULL DEFAULT 0,
  parent_account_id INTEGER REFERENCES accounts(id),
  market_cap_category TEXT CHECK (market_cap_category IN ('Large Cap','Mid Cap','Small Cap','Penny') OR market_cap_category IS NULL),
  password_last_changed TEXT,
  password_expiry_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trade_setups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  ticker TEXT NOT NULL,
  instrument_type TEXT NOT NULL CHECK (instrument_type IN ('Commodity','Equity','Unlisted','Crypto','F&O')),
  trade_setup TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('Buy','Sell')),
  entry_date TEXT NOT NULL,
  entry_time TEXT,
  quantity REAL NOT NULL,
  entry_price REAL NOT NULL,
  target_price REAL,
  stoploss REAL,
  margin_pct REAL NOT NULL DEFAULT 100,
  investment_amount REAL NOT NULL,
  exit_date TEXT,
  exit_time TEXT,
  exit_price REAL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed')),
  ltp REAL,
  realized_pnl REAL,
  unrealized_pnl REAL,
  pnl_pct REAL,
  holding_days INTEGER,
  result TEXT CHECK (result IN ('WIN','LOSS','BREAKEVEN') OR result IS NULL),
  remarks TEXT,
  month_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);

CREATE TABLE IF NOT EXISTS fund_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  type TEXT NOT NULL CHECK (type IN ('Add','Withdraw')),
  amount REAL NOT NULL,
  txn_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fundtxn_account ON fund_transactions(account_id);

CREATE TABLE IF NOT EXISTS wealth_plan (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  my_age INTEGER NOT NULL DEFAULT 35,
  son_age INTEGER NOT NULL DEFAULT 7,
  daughter_age INTEGER NOT NULL DEFAULT 2,
  starting_lumpsum REAL NOT NULL DEFAULT 470000,
  monthly_sip REAL NOT NULL DEFAULT 15000,
  expected_return_pct REAL NOT NULL DEFAULT 18,
  inflation_pct REAL NOT NULL DEFAULT 6,
  monthly_home_expense_today REAL NOT NULL DEFAULT 30000,
  yearly_added_fund REAL NOT NULL DEFAULT 180000,
  withdrawal_start_year INTEGER NOT NULL DEFAULT 2038,
  projection_end_age INTEGER NOT NULL DEFAULT 85,
  alloc_large_cap_pct REAL NOT NULL DEFAULT 50,
  alloc_mid_cap_pct REAL NOT NULL DEFAULT 20,
  alloc_small_cap_pct REAL NOT NULL DEFAULT 20,
  alloc_penny_pct REAL NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wealth_actuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  planned_addition REAL NOT NULL,
  actual_addition REAL NOT NULL DEFAULT 0,
  actual_total_corpus REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(year, month)
);

CREATE TABLE IF NOT EXISTS algo_scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_name TEXT NOT NULL,
  trade_direction TEXT NOT NULL CHECK (trade_direction IN ('BOTH','BUY','SELL')),
  ma_fast_type TEXT,
  ma_fast_length INTEGER,
  ma_slow_type TEXT,
  ma_slow_length INTEGER,
  ma_filter_type TEXT,
  ma_filter_length INTEGER,
  macd_zero_range_min REAL,
  macd_zero_range_max REAL,
  rsi_min REAL,
  rsi_max REAL,
  stoploss_multiplier REAL,
  stoploss_lookback INTEGER,
  ao_fast_sma_length INTEGER,
  ao_slow_sma_length INTEGER,
  gap_filter TEXT,
  htf_filter TEXT,
  supertrend_period INTEGER,
  supertrend_multiplier REAL,
  timeframe TEXT,
  lot_size REAL,
  backtest_start_date TEXT,
  backtest_end_date TEXT,
  backtest_total_pnl REAL,
  backtest_max_drawdown REAL,
  backtest_total_trades INTEGER,
  backtest_win_pct REAL,
  backtest_profit_factor REAL,
  linked_account_id INTEGER REFERENCES accounts(id),
  master_child_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

PRAGMA foreign_keys = ON;
