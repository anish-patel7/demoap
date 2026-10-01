const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inflateAmount, realValue } = require('../src/calc-engine/inflation');
const { daysBetween, toISODate, parseDDMMYYYY, formatMonthLabel } = require('../src/calc-engine/dateUtils');

test('inflateAmount grows by compound inflation', () => {
  assert.ok(Math.abs(inflateAmount(100, 6, 1) - 106) < 1e-9);
  assert.ok(Math.abs(inflateAmount(100, 6, 2) - 112.36) < 1e-9);
});

test('realValue is the inverse of inflation', () => {
  const nominal = inflateAmount(1000, 6, 5);
  assert.ok(Math.abs(realValue(nominal, 6, 5) - 1000) < 1e-6);
});

test('daysBetween counts calendar days and clamps negatives to 0', () => {
  assert.equal(daysBetween('2024-01-01', '2024-01-11'), 10);
  assert.equal(daysBetween('2024-01-11', '2024-01-01'), 0);
  assert.equal(daysBetween('2024-01-01', null), null);
});

test('toISODate formats YYYY-MM-DD', () => {
  assert.equal(toISODate(new Date(2024, 2, 5)), '2024-03-05');
});

test('parseDDMMYYYY parses DD-MM-YYYY', () => {
  const d = parseDDMMYYYY('05-03-2024');
  assert.equal(d.getFullYear(), 2024);
  assert.equal(d.getMonth(), 2); // March (0-indexed)
  assert.equal(d.getDate(), 5);
});

test('formatMonthLabel returns "Mon-YYYY"', () => {
  assert.match(formatMonthLabel('2024-03-15'), /^[A-Za-z]{3,}-2024$/);
});
