const { test } = require('node:test');
const assert = require('node:assert/strict');
const tc = require('../src/calc-engine/tradeCalculations');

test('directionSign', () => {
  assert.equal(tc.directionSign('Buy'), 1);
  assert.equal(tc.directionSign('Sell'), -1);
});

test('computeInvestmentAmount respects margin', () => {
  assert.equal(tc.computeInvestmentAmount({ quantity: 10, entry_price: 100, margin_pct: 100 }), 1000);
  assert.equal(tc.computeInvestmentAmount({ quantity: 10, entry_price: 100, margin_pct: 20 }), 200);
  assert.equal(tc.computeInvestmentAmount({ quantity: 0, entry_price: 100, margin_pct: 100 }), 0);
});

test('computeRealizedPnl for Buy and Sell', () => {
  assert.equal(tc.computeRealizedPnl({ direction: 'Buy', entry_price: 100, exit_price: 120, quantity: 10 }), 200);
  // Sell profits when price falls
  assert.equal(tc.computeRealizedPnl({ direction: 'Sell', entry_price: 100, exit_price: 80, quantity: 10 }), 200);
  // No exit price -> null (still open)
  assert.equal(tc.computeRealizedPnl({ direction: 'Buy', entry_price: 100, exit_price: null, quantity: 10 }), null);
});

test('computeUnrealizedPnl uses LTP, null when no LTP', () => {
  assert.equal(tc.computeUnrealizedPnl({ direction: 'Buy', entry_price: 100, ltp: 110, quantity: 5 }), 50);
  assert.equal(tc.computeUnrealizedPnl({ direction: 'Buy', entry_price: 100, ltp: null, quantity: 5 }), null);
});

test('computePnlPct guards divide-by-zero', () => {
  assert.equal(tc.computePnlPct({ pnl: 200, investment_amount: 1000 }), 20);
  assert.equal(tc.computePnlPct({ pnl: 200, investment_amount: 0 }), null);
  assert.equal(tc.computePnlPct({ pnl: null, investment_amount: 1000 }), null);
});

test('computeStatus / computeResult thresholds', () => {
  assert.equal(tc.computeStatus({ exit_price: 120 }), 'Closed');
  assert.equal(tc.computeStatus({ exit_price: null }), 'Open');

  assert.equal(tc.computeResult({ status: 'Closed', realized_pnl: 50 }), 'WIN');
  assert.equal(tc.computeResult({ status: 'Closed', realized_pnl: -50 }), 'LOSS');
  assert.equal(tc.computeResult({ status: 'Closed', realized_pnl: 0 }), 'BREAKEVEN');
  // Open trades have no result
  assert.equal(tc.computeResult({ status: 'Open', realized_pnl: null }), null);
});

test('recomputeTradeFields end-to-end (closed Buy)', () => {
  const t = tc.recomputeTradeFields({
    direction: 'Buy',
    entry_date: '2024-01-01',
    exit_date: '2024-01-11',
    entry_price: 100,
    exit_price: 120,
    quantity: 10,
    margin_pct: 100,
  });
  assert.equal(t.status, 'Closed');
  assert.equal(t.investment_amount, 1000);
  assert.equal(t.realized_pnl, 200);
  assert.equal(t.unrealized_pnl, null);
  assert.equal(t.pnl_pct, 20);
  assert.equal(t.result, 'WIN');
  assert.equal(t.holding_days, 10);
});
