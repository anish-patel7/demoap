# WealthTrack

A local, single-user wealth & trading management suite — trade journal, wealth
planner, monthly tracker, accounts/brokers, and algo-strategy tracking.

- **Backend:** Node.js + Express + SQLite (via `sql.js`, pure JavaScript — no
  compiler needed). Data lives in a single file: `data/wealthtrack.db`.
- **Frontend:** React + Vite + Tailwind CSS.
- Runs entirely on your own machine. Nothing is sent to the cloud.

---

## Quick start (Windows)

Three double-click batch files do everything:

| File | What it does |
|------|--------------|
| **`setup.bat`** | Run **once** on a new computer. Installs everything and creates the database. |
| **`start.bat`** | Launches the app and opens your browser. Use this every day. |
| **`backup.bat`** | Creates a full backup (`.db` + CSV export) from the command line. |

### First time on this computer
1. Install **Node.js LTS** from <https://nodejs.org> (only needed once).
2. Double-click **`setup.bat`** and wait for "Setup complete".

### Every day after that
1. Double-click **`start.bat`**.
2. Your browser opens at <http://localhost:3000>.
3. To stop the app, close the black `start.bat` window.

---

## Setting up on ANOTHER computer

The whole app is self-contained in this folder. To move it:

1. **Back up first** on the old computer — click the **backup icon** in the
   app's top-right header (or run `backup.bat`). This guarantees you have your
   latest `data/wealthtrack.db`.
2. **Copy the project folder** to the new computer. You can safely skip the
   large `node_modules` folders and the build output — `setup.bat` recreates
   them. The important file to bring is **`data/wealthtrack.db`** (your data).
3. On the new computer, install **Node.js LTS** (<https://nodejs.org>).
4. Double-click **`setup.bat`**.
   - If you copied your existing `data/wealthtrack.db`, your data is kept and
     seeding is skipped.
   - If not, a fresh database with sample data is created — then manually copy your backup over to restore your data (see the Restore checklist below).
5. Double-click **`start.bat`**.

> Tip: the simplest transfer is to copy the whole folder to a USB drive or
> cloud drive, or zip it (excluding `node_modules`) and unzip on the new PC.

---

## Backup & Restore

Your entire database is a single file: **`data/wealthtrack.db`**. A backup is
just a copy of that file. There are three actions available inside the app:

### From inside the app (easiest)
Click the **backup icon** (☁) in the **top-right header**. A menu appears:

- **Download Backup (.db)** — saves a timestamped copy of the database to your browser's Downloads folder. Keep this somewhere safe (USB, cloud drive).
- **Restore from File…** — pick a previously downloaded `.db` file to load it. A safety copy of the current database is automatically saved to `backups/` first as `pre-restore_*.db`, and the app will automatically reload when the restore finishes.
- **Clean Website (DEV)** — a temporary development utility to completely wipe all user data (trades, accounts, scripts, goals, plans) from the database so you can start with a fresh empty state. Re-seeding is automatically skipped on server restart. (To restore sample data, delete `data/wealthtrack.db` and start/seed again).


### From the command line
Double-click **`backup.bat`**, or run:

```bash
npm run backup
```

This creates, inside the `backups/` folder:
- `wealthtrack_<timestamp>.db` — a full database snapshot, **and**
- `wealthtrack_<timestamp>_csv/` — a CSV file for every table (accounts,
  trades, wealth_plan, etc.) so your data is also readable in Excel.

### Manual backups
- Backup processes are **fully manual**. Daily automatic backups on startup have been disabled per design requirements.
- To create a backup, click the backup icon (☁) in the top-right header and choose **Download Backup (.db)**.
- Database saves are **crash-safe** (written to a temp file and atomically
  renamed), so an interruption can't corrupt `wealthtrack.db`.
- These local snapshots protect against mistakes, **not** disk failure — keep an
  occasional copy off the machine (USB / cloud).


### Where backups live
```
data/wealthtrack.db          <- the live database
backups/                     <- all snapshots (git-ignored, local only)
  wealthtrack_2026-07-04_17-46-03.db
  wealthtrack_2026-07-04_17-46-03_csv/
  pre-restore_2026-07-04_17-46-33.db   <- auto safety copy before a restore
```

### Restore checklist
There are two ways to restore a backup:

#### Option 1: From inside the app (easiest)
1. Click the backup icon (☁) in the top-right header and choose **Restore from File…**.
2. Select your backup `.db` file and confirm.
3. The app will automatically create a safety backup in `backups/` first, replace the active database, and reload.

#### Option 2: Manually (offline)
1. Stop the application (close the `start.bat` terminal/window).
2. Copy your desired backup `.db` file (from your Downloads or `backups/` folder).
3. Overwrite `data/wealthtrack.db` with your backup file.
4. Launch the application again (double-click `start.bat`).


---

## Profile name

The name and subtitle shown in the sidebar (bottom-left) and the header avatar
are editable. Click **Settings** or the **profile card** in the sidebar to open
the edit dialog, change the display name / subtitle, and Save. The avatar
initials update automatically. The value is stored in the database, so it
travels with your backups. There is no login or password — the app is
single-user and local by design.

---

## Running manually (without the .bat files)

```bash
# install dependencies (once)
npm install
npm --prefix backend install
npm --prefix frontend install

# initialize the database (once)
npm run migrate
npm run seed

# start backend (port 4000) + frontend (port 3000) together
npm run dev
```

Then open <http://localhost:3000>.

### Useful scripts (from the project root)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend together |
| `npm run dev:backend` | Backend only (port 4000) |
| `npm run dev:frontend` | Frontend only (port 3000) |
| `npm run migrate` | Apply database migrations |
| `npm run seed` | Seed sample data (skips if data already exists) |
| `npm run backup` | Create a `.db` snapshot + CSV export in `backups/` |
| `npm run import:excel -- --file "Trading Journal.xlsx"` | Import from Excel |
| `npm test` | Run the calc-engine unit tests (P&L, win-rate, drawdown, etc.) |

## Annual growth goal (dashboard)

The top of the dashboard tracks a year-on-year growth goal.

**Formula (per year):**
```
target = opening + (opening × return% / 100) + yearly SIP
```
- **opening** — the capital you had at the previous December-end (you set this).
- **return%** — your target growth (default 18%).
- **yearly SIP** — that year's contributions, taken from the Investment Tracker
  (fund Add/Withdraw ledger); falls back to monthly SIP × 12 when a year has no
  recorded contributions yet.

Each year rolls forward on the target basis, e.g. starting at ₹1,00,000:
`1,00,000 + 18% + 1,80,000 SIP = ₹2,98,000` → next year 18% is applied on
₹2,98,000, and so on.

**On the dashboard you get:**
- A **current-year progress bar** — current capital ÷ target, with a 🎉
  *Congratulations* banner when you hit 100%.
- A **year-by-year column chart** of *% goal achieved* (green ≥100%, amber ≥75%,
  red below), with a dashed 100% reference line.

Click **Set Goal** to enter your opening capital, start year, target return %,
and monthly SIP. Past years' "achieved %" fill in as you record actual month-end
corpus in the Investment Tracker.

## Notifications

The 🔔 bell in the header shows **password-expiry alerts** for your broker
accounts. Set an account's *password expiry date* (Accounts & Brokers page) and
the bell warns you when it's within 14 days or already expired — red for
expired/≤3 days, amber otherwise. The list refreshes every 10 minutes.

---

## Backup / Restore API (for reference)

The frontend buttons call these backend endpoints:

| Method & path | Purpose |
|---------------|---------|
| `GET /api/backup/download` | Download the current database file |
| `POST /api/backup/restore` | Restore from an uploaded `.db` file (raw body) |
| `POST /api/backup/cleanup` | Wipe all database tables (development cleanup) |

---

## Troubleshooting

- **"Node.js is not installed"** — install the LTS build from
  <https://nodejs.org> and re-run `setup.bat`.
- **Browser shows nothing / can't connect** — give the servers a few seconds
  after `start.bat`, then refresh <http://localhost:3000>. Make sure the black
  `start.bat` window is still open.
- **Port already in use (`EADDRINUSE :4000` or `:3000`)** — another copy is
  already running. Close the other `start.bat` window (or reboot) and try again.
- **How to revert a manual restore?** — if you manually copied a database file over `data/wealthtrack.db`, you can copy any of your timestamped backups from the `backups/` folder to restore a previous state.

---

## Project layout

```
Wealth/
├── setup.bat            # one-time install for a new computer
├── start.bat            # launch the app
├── backup.bat           # command-line backup
├── data/
│   └── wealthtrack.db   # your database (the file to back up)
├── backups/             # snapshots & CSV exports (local only)
├── backend/             # Express API + SQLite + calc engine
│   └── src/
│       ├── routes/      # includes backup.routes.js
│       ├── services/    # includes backup.service.js
│       └── scripts/     # backupExport.js, seed.js, migrate.js
└── frontend/            # React + Vite UI
    └── src/
        └── components/layout/BackupMenu.jsx   # backup/restore UI
```
