# Master Prompt: Local Wealth Creation & Trading Tracker Web App

Copy everything below this line into your AI coding tool (Claude Code, etc.) to build the application.

---

## ROLE & GOAL

You are a senior full-stack developer. Build me a **local-first web application** called **"WealthTrack"** that replaces my Excel trading journal and wealth-creation planner. It must run entirely on my machine (no cloud, no login required, single user), store data in a local SQLite database, and be usable in a browser at `http://localhost:3000`.

**Tech stack (strict):**
- Frontend: React + Vite, Tailwind CSS, Recharts for charts
- Backend: Node.js + Express
- Database: SQLite (via better-sqlite3 or Prisma)
- All amounts in INR (₹, Indian number format e.g. ₹1,80,000), dates in DD-MM-YYYY, timezone IST
- Provide `npm run dev` to start both frontend and backend, plus a seed script

---

## DOMAIN CONTEXT

I am a 35-year-old trader/investor in India. I trade commodities (GOLDGUINEA, SILVERMIC, NATGASMINI on MCX), equities (NSE), unlisted shares (MSE, NSDL), and crypto (BTCUSD) across ~14 broker accounts (Dhan, Shoonya, Flattrade, AngelOne, Zerodha, Kotak) — some manual, some via algo software (NextLevelBot) with master/child account copy-trading. My wealth goal: grow a starting corpus of ₹4,70,000 with ₹15,000/month SIP additions, targeting long-term financial freedom, with a planned withdrawal phase starting in 2038 (₹30,000/month home expense in today's money, inflation-adjusted at 6%).

---

## DATA MODEL (SQLite tables)

### 1. accounts
- id, account_name, broker_name (Dhan/Shoonya/Flattrade/AngelOne/Zerodha/Kotak/Other)
- account_type: Live | Paper
- purpose: Main Trading | Silver_Gold | Equity Trading | Unlisted | Crypto
- starting_capital, funds_added_total, funds_withdrawn_total
- current_capital (auto = starting + added − withdrawn + realized P&L of that account)
- risk_limit_pct (default 2%)
- algo_platform (e.g., NextLevelBot), is_master_account (bool), parent_account_id (nullable, for child accounts copying a master)
- password_last_changed, password_expiry_date (many brokers force 90-day password rotation — show expiry warnings)
- is_active

### 2. trades  (single source of truth — NO separate open/closed tables)
- id, account_id (REQUIRED — reject trades without an account)
- ticker, instrument_type: Commodity | Equity | Unlisted | Crypto | F&O
- trade_setup (free text + dropdown of saved setups, e.g., JK_SILVER, JK_AU, NGAS_LIVE, PRICE ACTION, Divergence, HA 9)
- direction: Buy | Sell
- entry_date, entry_time, quantity (decimal — allow 0.002 for BTC), entry_price
- target_price (nullable), stoploss (nullable), margin_pct, investment_amount (auto = qty × entry_price × margin_pct)
- exit_date, exit_time, exit_price (all nullable while open)
- status: Open | Closed (derived: Closed when exit_price is set)
- ltp (last traded price — manually editable for open trades; used for unrealized P&L)
- realized_pnl (only when closed) = (exit − entry) × qty × direction_sign
- unrealized_pnl (only when open) = (ltp − entry) × qty × direction_sign
- pnl_pct = pnl ÷ investment_amount × 100 (guard divide-by-zero: if qty or investment = 0, show "—", never #DIV/0!)
- holding_days = exit_date − entry_date (or today − entry_date if open; never negative)
- result: WIN | LOSS | BREAKEVEN (auto from realized_pnl; blank while open)
- remarks (e.g., "Algo login issue manually exited", "Stoploss hit", "Signal from previous future chart")
- month_label auto-derived (e.g., Apr-2026)

### 3. wealth_plan  (the Wealth Creation projection inputs)
- Singleton config: my_age (35), son_age (7), daughter_age (2)
- starting_lumpsum (₹4,70,000), monthly_sip (₹15,000)
- expected_return_pct (default 18), inflation_pct (default 6)
- monthly_home_expense_today (₹30,000)
- yearly_added_fund (₹1,80,000), withdrawal_start_year (2038)
- projection_end_age (default 85 — do NOT project to age 129)
- portfolio_allocation: Large Cap 50%, Mid Cap 20%, Small Cap 20%, Penny/High-risk 10% (must total 100%)

### 4. wealth_actuals  (monthly tracking — replaces "Investment tracker for WC" sheet)
- year, month, planned_addition, actual_addition, actual_total_corpus (sum of all account current values + manual external holdings), notes

### 5. algo_scripts  (replaces "ALGO Script Parameter" sheet)
- script_name (NATGASMINI, SILVERMIC, FRESH SILVER…), trade_direction (BOTH/BUY/SELL)
- fast/slow/filter MA types & lengths, MACD zero range, RSI min/max, stoploss multiplier & lookback, AO fast/slow SMA lengths, gap filter, HTF filter, supertrend params, timeframe, lot size
- backtest: start_date, end_date, total_pnl, max_drawdown, total_trades, win_pct, profit_factor
- linked broker account + master/child mapping

---

## PAGES / MODULES

### A. Dashboard (home)
Replicate and improve my Excel Master Dashboard:
- Account selector (single account or "All Accounts")
- Cards: Total Capital, Current Account Value, Net Return ₹ and %, Total Trades, Win Trades, Loss Trades, Win %, Total Profit, Total Loss, Max Drawdown, Margin Used, Free Margin
- Trading performance block: Avg Win, Avg Loss, Profit Factor (gross profit ÷ gross loss), Expectancy per trade
- Open positions panel: each open trade with editable LTP, live unrealized P&L, and total Open Risk = Σ|entry − stoploss| × qty
- Risk alert: if open risk on any account exceeds its risk_limit_pct × capital, show a red warning
- Charts: equity curve (cumulative realized P&L over time), monthly P&L bar chart, P&L by instrument, P&L by trade setup, win-rate by setup
- Password-expiry warnings for broker accounts within 15 days of expiry

### B. Trade Journal
- Table of all trades with filters: account, ticker, setup, status, result, date range, month
- Add/Edit trade form with validation (account required; entry price > 0; quantity > 0; direction required)
- "Close trade" quick-action: enter exit price/date/time → auto-computes realized P&L, result, holding days
- Bulk CSV import matching my Excel TradeLog columns (map Excel serial dates like 46021 to real dates, and time fractions like 0.5834 to HH:MM)
- Views "Open Trades" and "Closed Trades" are just filtered tabs of the same table — never duplicated data

### C. Wealth Creation Planner
This is the core cross-linked module:
1. **Projection engine.** For each year from current age to projection_end_age:
   - Accumulation phase (before withdrawal_start_year): capital = previous capital + yearly additions + return (expected_return_pct on the running balance; apply SIP monthly, not as a year-end lump, for accuracy)
   - Withdrawal phase (from withdrawal_start_year): annual withdrawal = monthly_home_expense_today × 12, inflation-grown at inflation_pct from today to that year; corpus continues compounding after withdrawals
   - Show both nominal corpus and inflation-adjusted (real, today's-rupees) corpus side by side
   - Show milestone rows: my age, son's age, daughter's age each year (education/marriage milestone flags at son 18/25 and daughter 18/25)
2. **Scenario toggle:** three return scenarios side by side — Conservative 12%, Base 15%, Aggressive 18% — on one chart
3. **Projected vs Actual:** overlay the plan with wealth_actuals. For each past year/month show: planned corpus, actual corpus, ₹ gap, % gap ("Live status / % Different" from my sheet, but automated). Actual corpus auto-pulls the sum of all account current capitals (which include trading P&L) so my trading performance directly feeds my wealth goal.
4. **Goal probability hint:** simple sensitivity note — e.g., "At your actual trailing 12-month return of X%, you reach your 2038 target corpus in year YYYY instead."
5. Portfolio allocation donut (Large/Mid/Small/Penny) with drift vs target.

### D. Monthly Investment Tracker
- Year grid like my Excel sheet: 12 month cells per year, planned ₹15,000 vs actual entered
- Auto totals: added funds per year, cumulative capital, shortfall highlighting (red if a month missed)
- One-click "Mark month invested" button

### E. Accounts & Brokers
- Account list with capital, purpose, live/paper, broker, algo platform, master→child mapping tree
- Fund add/withdraw ledger per account
- Password expiry tracker with days-remaining badge

### F. Algo Scripts
- CRUD table of script parameters and backtest stats (profit factor, win %, drawdown)
- Link each script to the trades tagged with its setup → show LIVE performance vs BACKTEST performance for the same script (this comparison is critical: e.g., backtest profit factor 2.07 vs live profit factor from actual NGAS_LIVE trades)

---

## CALCULATIONS — EXACT RULES
- Win % = wins ÷ closed trades (exclude breakeven from wins; never divide by zero — show "—" if no closed trades)
- Profit Factor = Σ profits ÷ |Σ losses| (show "∞" if no losses)
- Max Drawdown = largest peak-to-trough drop of the cumulative equity curve, in ₹ and %
- Expectancy = (Win% × AvgWin) − (Loss% × |AvgLoss|)
- Open trades NEVER show −100% / −333% style P&L; unrealized P&L uses LTP only, and shows "LTP not set" if empty
- Direction sign: Buy = +1 (profit when price rises), Sell = −1
- Inflation adjustment: real value = nominal ÷ (1 + inflation)^years_elapsed

---

## DATA MIGRATION
Write an import script that reads my existing Excel file (`Trading_Journal.xlsx`):
- Import Account Master + Account details → accounts (merge, dedupe, skip zero-capital placeholder rows Account15–22)
- Import TradeLog → trades (convert serial dates/time fractions; rows with blank exit → status Open; recompute all P&L; flag rows where recomputed values differ from Excel values)
- Import Wealth Creation inputs → wealth_plan; Investment tracker → wealth_actuals
- Import ALGO Script Parameter → algo_scripts
- Produce an import report listing anomalies (missing account IDs, zero-quantity rows, #DIV/0! cells, negative holding days)

## NON-FUNCTIONAL
- Everything works offline; one-command backup (export SQLite file + full CSV/Excel export of all tables)
- Clean, dense, dashboard-style dark/light UI; keyboard-friendly trade entry
- Seed with 5 sample trades and my wealth plan defaults so the app is demo-ready on first run

Build the full project now: folder structure, database schema/migrations, seed data, backend API, all six pages, charts, and the Excel import script. After generating, tell me exactly how to run it.
