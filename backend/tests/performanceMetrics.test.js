const { test } = require('node:test');
const assert = require('node:assert/strict');
const pm = require('../src/calc-engine/performanceMetrics');

test('winRate counts wins/losses/breakeven', () => {
  const trades = [
    { result: 'WIN' },
    { result: 'WIN' },
    { result: 'LOSS' },
    { result: 'BREAKEVEN' },
  ];
  const r = pm.winRate(trades);
  assert.equal(r.wins, 2);
  assert.equal(r.losses, 1);
  assert.equal(r.breakeven, 1);
  assert.ok(Math.abs(r.winPct - 66.6667) < 0.01);
});

test('winRate with no decisive trades returns null pct', () => {
  assert.equal(pm.winRate([]).winPct, null);
});

test('profitFactor = gross profit / gross loss, Infinity when no losses', () => {
  const trades = [{ realized_pnl: 100 }, { realized_pnl: -40 }, { realized_pnl: 60 }];
  assert.equal(pm.profitFactor(trades), 4); // 160 / 40
  assert.equal(pm.profitFactor([{ realized_pnl: 100 }]), 'Infinity');
});

test('avgWin / avgLoss', () => {
  const trades = [
    { result: 'WIN', realized_pnl: 100 },
    { result: 'WIN', realized_pnl: 200 },
    { result: 'LOSS', realized_pnl: -60 },
  ];
  assert.equal(pm.avgWin(trades), 150);
  assert.equal(pm.avgLoss(trades), -60);
  assert.equal(pm.avgWin([]), null);
});

test('buildEquityCurve accumulates realized P&L', () => {
  const curve = pm.buildEquityCurve([
    { exit_date: '2024-01-02', realized_pnl: 100 },
    { exit_date: '2024-01-03', realized_pnl: -40 },
    { exit_date: '2024-01-04', realized_pnl: 60 },
  ]);
  assert.deepEqual(curve.map((p) => p.cumulativePnl), [100, 60, 120]);
});

test('maxDrawdown finds largest peak-to-trough drop', () => {
  const curve = [
    { cumulativePnl: 100 },
    { cumulativePnl: 50 },
    { cumulativePnl: 150 },
    { cumulativePnl: 80 },
  ];
  const dd = pm.maxDrawdown(curve);
  assert.equal(dd.amount, 70); // 150 -> 80
  assert.equal(pm.maxDrawdown([]).amount, 0);
});

test('openRisk sums stop-loss distance, ignores trades without a stop', () => {
  const open = [
    { entry_price: 100, stoploss: 95, quantity: 10 }, // 50
    { entry_price: 200, stoploss: null, quantity: 5 }, // ignored
  ];
  assert.equal(pm.openRisk(open), 50);
});

test('marginUsed sums invested capital', () => {
  assert.equal(pm.marginUsed([{ investment_amount: 1000 }, { investment_amount: 500 }]), 1500);
});
