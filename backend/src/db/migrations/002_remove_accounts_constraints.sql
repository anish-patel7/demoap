PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

CREATE TABLE accounts_new (
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

INSERT INTO accounts_new (
  id, account_name, broker_name, account_type, purpose, starting_capital,
  funds_added_total, funds_withdrawn_total, current_capital, risk_limit_pct,
  algo_platform, is_master_account, parent_account_id, market_cap_category,
  password_last_changed, password_expiry_date, is_active, created_at
)
SELECT
  id, account_name, broker_name, account_type, purpose, starting_capital,
  funds_added_total, funds_withdrawn_total, current_capital, risk_limit_pct,
  algo_platform, is_master_account, parent_account_id, market_cap_category,
  password_last_changed, password_expiry_date, is_active, created_at
FROM accounts;

DROP TABLE accounts;

ALTER TABLE accounts_new RENAME TO accounts;

COMMIT;

PRAGMA foreign_keys = ON;
