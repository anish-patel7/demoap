const dbModule = require('../db');
const { recomputeTradeFields } = require('../calc-engine/tradeCalculations');

function seed() {
  // Check if already seeded via metadata table
  try {
    dbModule.run('CREATE TABLE IF NOT EXISTS db_metadata (key TEXT UNIQUE, value TEXT)');
    const meta = dbModule.get("SELECT value FROM db_metadata WHERE key = 'seeded'");
    if (meta && meta.value === 'true') {
      console.log('Database already seeded (metadata check), skipping...');
      return;
    }
  } catch (err) {
    console.error('Error checking db_metadata:', err);
  }

  // Fallback to trades count check if db_metadata check didn't return true
  const result = dbModule.get('SELECT COUNT(*) as count FROM trades', []);
  const tradeCount = result ? (result.count || 0) : 0;
  if (tradeCount > 0) {
    console.log('Database already seeded (trades count check), skipping...');
    // Write the metadata flag so we don't have to count next time
    try {
      dbModule.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('seeded', 'true')");
      dbModule.saveDB();
    } catch (_) {}
    return;
  }

  console.log('Seeding database...');

  try {
    // Seed trade setups
    const setups = ['JK_SILVER', 'JK_AU', 'NGAS_LIVE', 'PRICE ACTION', 'Divergence', 'HA 9'];
    for (const setup of setups) {
      try {
        dbModule.run('INSERT OR IGNORE INTO trade_setups (name) VALUES (?)', [setup]);
      } catch (err) {
        // Ignore duplicates
      }
    }

    // Seed accounts
    const accounts = [
      {
        account_name: 'Dhan-Commodity-01',
        broker_name: 'Dhan',
        account_type: 'Live',
        purpose: 'Silver_Gold',
        starting_capital: 100000,
        risk_limit_pct: 2,
        algo_platform: 'NextLevelBot',
        market_cap_category: null,
      },
      {
        account_name: 'Zerodha-Equity-01',
        broker_name: 'Zerodha',
        account_type: 'Live',
        purpose: 'Equity Trading',
        starting_capital: 200000,
        risk_limit_pct: 2,
        algo_platform: null,
        market_cap_category: 'Large Cap',
      },
      {
        account_name: 'AngelOne-Crypto-Paper',
        broker_name: 'AngelOne',
        account_type: 'Paper',
        purpose: 'Crypto',
        starting_capital: 50000,
        risk_limit_pct: 2,
        algo_platform: null,
        market_cap_category: null,
      },
    ];

    for (const acc of accounts) {
      dbModule.run(
        `INSERT INTO accounts (
          account_name, broker_name, account_type, purpose, starting_capital,
          risk_limit_pct, algo_platform, market_cap_category, current_capital
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          acc.account_name,
          acc.broker_name,
          acc.account_type,
          acc.purpose,
          acc.starting_capital,
          acc.risk_limit_pct,
          acc.algo_platform || null,
          acc.market_cap_category || null,
          acc.starting_capital,
        ]
      );
    }

    // Get account IDs by querying the inserted accounts
    const allAccounts = dbModule.all('SELECT id FROM accounts ORDER BY id', []);
    const accountIds = allAccounts.map(a => a.id);

    // Seed trades
    const trades = [
      {
        account_id: accountIds[0],
        ticker: 'GOLDGUINEA',
        instrument_type: 'Commodity',
        trade_setup: 'JK_AU',
        direction: 'Buy',
        entry_date: '2026-06-18',
        entry_time: '09:30',
        quantity: 1,
        entry_price: 62500,
        target_price: 64000,
        stoploss: 61000,
        margin_pct: 100,
        exit_date: '2026-06-25',
        exit_time: '14:15',
        exit_price: 63200,
      },
      {
        account_id: accountIds[0],
        ticker: 'SILVERMIC',
        instrument_type: 'Commodity',
        trade_setup: 'JK_SILVER',
        direction: 'Sell',
        entry_date: '2026-06-23',
        entry_time: '10:00',
        quantity: 100,
        entry_price: 75600,
        target_price: 74000,
        stoploss: 77000,
        margin_pct: 100,
        exit_date: '2026-06-28',
        exit_time: '11:45',
        exit_price: 75200,
      },
      {
        account_id: accountIds[0],
        ticker: 'NATGASMINI',
        instrument_type: 'Commodity',
        trade_setup: 'NGAS_LIVE',
        direction: 'Buy',
        entry_date: '2026-06-30',
        entry_time: '09:15',
        quantity: 10,
        entry_price: 198.5,
        target_price: 210,
        stoploss: 195,
        margin_pct: 100,
        ltp: 205,
      },
      {
        account_id: accountIds[1],
        ticker: 'RELIANCE',
        instrument_type: 'Equity',
        trade_setup: 'PRICE ACTION',
        direction: 'Buy',
        entry_date: '2026-05-03',
        entry_time: '09:45',
        quantity: 10,
        entry_price: 2950,
        target_price: 3100,
        stoploss: 2850,
        margin_pct: 100,
        exit_date: '2026-06-15',
        exit_time: '15:00',
        exit_price: 3050,
      },
      {
        account_id: accountIds[2],
        ticker: 'BTCUSD',
        instrument_type: 'Crypto',
        trade_setup: 'Divergence',
        direction: 'Buy',
        entry_date: '2026-06-28',
        entry_time: '18:30',
        quantity: 0.002,
        entry_price: 65000,
        target_price: 70000,
        stoploss: 62000,
        margin_pct: 100,
      },
    ];

    for (const trade of trades) {
      const computed = recomputeTradeFields(trade);
      dbModule.run(
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
          computed.instrument_type,
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
    }

    // Seed wealth_plan
    dbModule.run(
      `INSERT OR REPLACE INTO wealth_plan (
        id, my_age, son_age, daughter_age, starting_lumpsum, monthly_sip,
        expected_return_pct, inflation_pct, monthly_home_expense_today,
        yearly_added_fund, withdrawal_start_year, projection_end_age,
        alloc_large_cap_pct, alloc_mid_cap_pct, alloc_small_cap_pct, alloc_penny_pct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 35, 7, 2, 470000, 15000, 18, 6, 30000, 180000, 2038, 85, 50, 20, 20, 10]
    );

    // Seed algo_scripts
    dbModule.run(
      `INSERT INTO algo_scripts (
        script_name, trade_direction, timeframe, lot_size,
        backtest_start_date, backtest_end_date, backtest_total_pnl,
        backtest_max_drawdown, backtest_total_trades, backtest_win_pct,
        backtest_profit_factor, linked_account_id, master_child_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'NATGASMINI',
        'BOTH',
        '5m',
        10,
        '2025-01-01',
        '2026-06-30',
        185000,
        32000,
        140,
        54,
        2.07,
        accountIds[0],
        'NGAS_LIVE strategy on Dhan-Commodity-01',
      ]
    );

    // Recalculate account current_capital
    for (const accountId of accountIds) {
      const accRow = dbModule.get('SELECT starting_capital FROM accounts WHERE id = ?', [accountId]);
      const pnlRow = dbModule.get(
        `SELECT COALESCE(SUM(realized_pnl), 0) as total FROM trades WHERE account_id = ? AND status = 'Closed'`,
        [accountId]
      );

      const currentCapital = accRow.starting_capital + (pnlRow.total || 0);
      dbModule.run('UPDATE accounts SET current_capital = ? WHERE id = ?', [currentCapital, accountId]);
    }

    dbModule.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('seeded', 'true')");
    dbModule.saveDB();
    console.log('✓ Seed complete');
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
}

// Run migration and seed on module load
const { migrate } = require('../db/migrate');

async function init() {
  try {
    const { initDB } = require('../db');
    await initDB();
    await migrate();
    seed();
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}

module.exports = { seed, init };

// Auto-run if this is the main module
if (require.main === module) {
  init().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
