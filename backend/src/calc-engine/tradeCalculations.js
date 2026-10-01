const { daysBetween, formatMonthLabel, todayISO } = require('./dateUtils');

function directionSign(direction) {
  return direction === 'Buy' ? 1 : -1;
}

function computeInvestmentAmount({ quantity, entry_price, margin_pct }) {
  if (!quantity || !entry_price || !margin_pct) return 0;
  return quantity * entry_price * (margin_pct / 100);
}

function computeHoldingDays({ entry_date, exit_date }) {
  if (!entry_date) return null;
  const exitDateToUse = exit_date || todayISO();
  const days = daysBetween(entry_date, exitDateToUse);
  return days;
}

function computeRealizedPnl({ direction, entry_price, exit_price, quantity }) {
  if (exit_price == null) return null;
  const sign = directionSign(direction);
  return sign * (exit_price - entry_price) * quantity;
}

function computeUnrealizedPnl({ direction, entry_price, ltp, quantity }) {
  if (ltp == null) return null;
  const sign = directionSign(direction);
  return sign * (ltp - entry_price) * quantity;
}

function computePnlPct({ pnl, investment_amount }) {
  if (investment_amount == null || investment_amount === 0 || pnl == null) return null;
  return (pnl / investment_amount) * 100;
}

function computeStatus({ exit_price }) {
  return exit_price != null ? 'Closed' : 'Open';
}

function computeResult({ status, realized_pnl }) {
  if (status !== 'Closed' || realized_pnl == null) return null;
  if (realized_pnl > 0.01) return 'WIN';
  if (realized_pnl < -0.01) return 'LOSS';
  return 'BREAKEVEN';
}

function recomputeTradeFields(tradeInput) {
  const trade = { ...tradeInput };

  // Derive basic fields
  trade.investment_amount = computeInvestmentAmount({
    quantity: trade.quantity,
    entry_price: trade.entry_price,
    margin_pct: trade.margin_pct || 100,
  });

  trade.status = computeStatus({ exit_price: trade.exit_price });
  trade.holding_days = computeHoldingDays({
    entry_date: trade.entry_date,
    exit_date: trade.exit_date,
  });

  // P&L calculations
  if (trade.status === 'Closed') {
    trade.realized_pnl = computeRealizedPnl({
      direction: trade.direction,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price,
      quantity: trade.quantity,
    });
    trade.unrealized_pnl = null;
  } else {
    trade.realized_pnl = null;
    if (trade.ltp != null) {
      trade.unrealized_pnl = computeUnrealizedPnl({
        direction: trade.direction,
        entry_price: trade.entry_price,
        ltp: trade.ltp,
        quantity: trade.quantity,
      });
    } else {
      trade.unrealized_pnl = null;
    }
  }

  // Profit percentage
  const pnlForPct = trade.status === 'Closed' ? trade.realized_pnl : trade.unrealized_pnl;
  trade.pnl_pct = computePnlPct({
    pnl: pnlForPct,
    investment_amount: trade.investment_amount,
  });

  // Result (WIN/LOSS/BREAKEVEN)
  trade.result = computeResult({
    status: trade.status,
    realized_pnl: trade.realized_pnl,
  });

  // Month label
  trade.month_label = formatMonthLabel(trade.entry_date);

  return trade;
}

module.exports = {
  directionSign,
  computeInvestmentAmount,
  computeHoldingDays,
  computeRealizedPnl,
  computeUnrealizedPnl,
  computePnlPct,
  computeStatus,
  computeResult,
  recomputeTradeFields,
};
