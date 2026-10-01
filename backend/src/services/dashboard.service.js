const db = require('../db');
const accountsService = require('./accounts.service');
const {
  winRate,
  profitFactor,
  avgWin,
  avgLoss,
  expectancy,
  buildEquityCurve,
  maxDrawdown,
  openRisk,
  marginUsed,
} = require('../calc-engine');

function getDashboardData(accountId = 'all') {
  let accounts = [];
  if (accountId === 'all') {
    accounts = accountsService.getAllAccounts().filter(a => a.is_active);
  } else {
    const acc = accountsService.getAccountById(parseInt(accountId));
    if (acc && acc.is_active) accounts = [acc];
  }

  if (accounts.length === 0) {
    return {
      totalCapital: 0,
      currentAccountValue: 0,
      netReturnAmount: 0,
      netReturnPct: 0,
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      winPct: null,
      totalProfit: 0,
      totalLoss: 0,
      maxDrawdown: { amount: 0, pct: 0 },
      avgWin: null,
      avgLoss: null,
      profitFactor: null,
      expectancy: null,
      openPositions: [],
      openRiskAmount: 0,
      marginUsedAmount: 0,
      riskLimitExceeded: false,
      passwordExpiryWarnings: [],
      tradingMetrics: {},
    };
  }

  // Get all trades for selected accounts
  const accountIds = accounts.map(a => a.id);
  const allTrades = db.all(
    `SELECT * FROM trades WHERE account_id IN (${accountIds.map(() => '?').join(',')})
     ORDER BY exit_date DESC`,
    accountIds
  );

  const closedTrades = allTrades.filter(t => t.status === 'Closed');
  const openTrades = allTrades.filter(t => t.status === 'Open');

  // Calculate totals
  const totalCapital = accounts.reduce((sum, a) => sum + a.starting_capital, 0);
  const currentAccountValue = accounts.reduce((sum, a) => sum + a.current_capital, 0);
  const netReturnAmount = currentAccountValue - totalCapital;
  const netReturnPct = totalCapital > 0 ? (netReturnAmount / totalCapital) * 100 : 0;

  // Trading metrics
  const wr = winRate(closedTrades);
  const pf = profitFactor(closedTrades);
  const avgW = avgWin(closedTrades);
  const avgL = avgLoss(closedTrades);
  const exp =
    avgW !== null && avgL !== null
      ? expectancy({
          winPct: (wr.winPct || 0) / 100,
          avgWin: avgW,
          lossPct: ((100 - (wr.winPct || 0)) / 100) * (wr.losses / (wr.losses + wr.wins)),
          avgLoss: avgL,
        })
      : null;

  const curve = buildEquityCurve(closedTrades);
  const dd = maxDrawdown(curve);

  // Total profit and loss
  const totalProfit = closedTrades
    .filter(t => t.realized_pnl > 0)
    .reduce((sum, t) => sum + t.realized_pnl, 0);
  const totalLoss = Math.abs(
    closedTrades
      .filter(t => t.realized_pnl < 0)
      .reduce((sum, t) => sum + t.realized_pnl, 0)
  );

  // Open positions with unrealized P&L
  const openPositions = openTrades.map(t => ({
    ...t,
    ltpNotSet: t.ltp === null,
  }));

  // Risk metrics
  const openRiskAmount = openRisk(openTrades);
  const marginUsedAmount = marginUsed(openTrades);

  // Check if risk limit exceeded
  let riskLimitExceeded = false;
  for (const account of accounts) {
    const accountOpenTrades = openTrades.filter(t => t.account_id === account.id);
    const accountOpenRisk = openRisk(accountOpenTrades);
    const riskLimit = (account.risk_limit_pct / 100) * account.current_capital;
    if (accountOpenRisk > riskLimit) {
      riskLimitExceeded = true;
      break;
    }
  }

  // Password expiry warnings (within 15 days)
  const today = new Date();
  const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  const passwordExpiryWarnings = accounts
    .filter(a => a.password_expiry_date && new Date(a.password_expiry_date) <= fifteenDaysFromNow)
    .map(a => ({
      account_id: a.id,
      account_name: a.account_name,
      expiry_date: a.password_expiry_date,
      days_remaining: Math.ceil(
        (new Date(a.password_expiry_date) - today) / (24 * 60 * 60 * 1000)
      ),
    }));

  // P&L by instrument
  const pnlByInstrument = {};
  allTrades.forEach(t => {
    if (!pnlByInstrument[t.ticker]) {
      pnlByInstrument[t.ticker] = 0;
    }
    if (t.status === 'Closed') {
      pnlByInstrument[t.ticker] += t.realized_pnl || 0;
    }
  });

  // P&L by setup
  const pnlBySetup = {};
  allTrades.forEach(t => {
    const setup = t.trade_setup || 'Unknown';
    if (!pnlBySetup[setup]) {
      pnlBySetup[setup] = 0;
    }
    if (t.status === 'Closed') {
      pnlBySetup[setup] += t.realized_pnl || 0;
    }
  });

  // Win rate by setup
  const winRateBySetup = {};
  allTrades.forEach(t => {
    const setup = t.trade_setup || 'Unknown';
    if (!winRateBySetup[setup]) {
      winRateBySetup[setup] = { wins: 0, losses: 0, breakeven: 0 };
    }
    if (t.status === 'Closed') {
      if (t.result === 'WIN') winRateBySetup[setup].wins++;
      else if (t.result === 'LOSS') winRateBySetup[setup].losses++;
      else if (t.result === 'BREAKEVEN') winRateBySetup[setup].breakeven++;
    }
  });

  for (const setup in winRateBySetup) {
    const stats = winRateBySetup[setup];
    const total = stats.wins + stats.losses + stats.breakeven;
    winRateBySetup[setup].winPct = total > 0 ? (stats.wins / total) * 100 : 0;
  }

  return {
    totalCapital,
    currentAccountValue,
    netReturnAmount,
    netReturnPct,
    totalTrades: allTrades.length,
    winTrades: wr.wins,
    lossTrades: wr.losses,
    breakevenTrades: wr.breakeven,
    winPct: wr.winPct,
    totalProfit,
    totalLoss,
    maxDrawdown: dd,
    avgWin: avgW,
    avgLoss: avgL,
    profitFactor: pf === 'Infinity' ? null : pf,
    expectancy: exp,
    openPositions,
    openRiskAmount,
    marginUsedAmount,
    riskLimitExceeded,
    passwordExpiryWarnings,
    pnlByInstrument,
    pnlBySetup,
    winRateBySetup,
    equityCurve: curve,
  };
}

module.exports = {
  getDashboardData,
};
