function winRate(closedTrades) {
  const closed = closedTrades.filter(t => t.result != null && t.result !== 'BREAKEVEN');
  if (closed.length === 0) return { wins: 0, losses: 0, breakeven: 0, winPct: null };

  const wins = closed.filter(t => t.result === 'WIN').length;
  const losses = closed.filter(t => t.result === 'LOSS').length;
  const breakeven = closedTrades.filter(t => t.result === 'BREAKEVEN').length;

  return {
    wins,
    losses,
    breakeven,
    winPct: closed.length > 0 ? (wins / closed.length) * 100 : null,
  };
}

function profitFactor(closedTrades) {
  const profits = closedTrades
    .filter(t => t.realized_pnl != null && t.realized_pnl > 0)
    .reduce((sum, t) => sum + t.realized_pnl, 0);

  const losses = closedTrades
    .filter(t => t.realized_pnl != null && t.realized_pnl < 0)
    .reduce((sum, t) => sum + Math.abs(t.realized_pnl), 0);

  if (losses === 0) return 'Infinity';
  return profits / losses;
}

function avgWin(closedTrades) {
  const wins = closedTrades.filter(t => t.result === 'WIN' && t.realized_pnl != null);
  if (wins.length === 0) return null;
  const sumWins = wins.reduce((sum, t) => sum + t.realized_pnl, 0);
  return sumWins / wins.length;
}

function avgLoss(closedTrades) {
  const losses = closedTrades.filter(t => t.result === 'LOSS' && t.realized_pnl != null);
  if (losses.length === 0) return null;
  const sumLosses = losses.reduce((sum, t) => sum + t.realized_pnl, 0);
  return sumLosses / losses.length;
}

function expectancy({ winPct, avgWin, lossPct, avgLoss }) {
  if (winPct == null || avgWin == null || lossPct == null || avgLoss == null) return null;
  return winPct * avgWin + lossPct * avgLoss;
}

function buildEquityCurve(closedTradesSortedByExitDate) {
  const curve = [];
  let cumulativePnl = 0;

  for (const trade of closedTradesSortedByExitDate) {
    if (trade.exit_date && trade.realized_pnl != null) {
      cumulativePnl += trade.realized_pnl;
      curve.push({
        date: trade.exit_date,
        cumulativePnl,
      });
    }
  }

  return curve;
}

function maxDrawdown(equityCurve) {
  if (equityCurve.length === 0) return { amount: 0, pct: 0 };

  let peak = equityCurve[0].cumulativePnl;
  let maxDD = 0;

  for (const point of equityCurve) {
    if (point.cumulativePnl > peak) {
      peak = point.cumulativePnl;
    }
    const dd = peak - point.cumulativePnl;
    if (dd > maxDD) {
      maxDD = dd;
    }
  }

  const peakValue = Math.max(...equityCurve.map(p => p.cumulativePnl));
  const peakIndex = equityCurve.findIndex(p => p.cumulativePnl === peakValue);
  const maxPeak = peakValue > 0 ? peakValue : 1; // Avoid division by zero

  return {
    amount: maxDD,
    pct: peakValue > 0 ? (maxDD / maxPeak) * 100 : 0,
  };
}

function openRisk(openTrades) {
  return openTrades
    .filter(t => t.stoploss != null)
    .reduce((sum, t) => {
      const risk = Math.abs(t.entry_price - t.stoploss) * t.quantity;
      return sum + risk;
    }, 0);
}

function marginUsed(openTrades) {
  return openTrades.reduce((sum, t) => sum + (t.investment_amount || 0), 0);
}

module.exports = {
  winRate,
  profitFactor,
  avgWin,
  avgLoss,
  expectancy,
  buildEquityCurve,
  maxDrawdown,
  openRisk,
  marginUsed,
};
