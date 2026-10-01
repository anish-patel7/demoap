// The Wealth Planner's offline mode runs a browser copy of projectWealthExcel
// (frontend/src/utils/wealthProjection.js). This keeps it identical to the backend.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { projectWealthExcel } = require('../src/calc-engine/wealthProjection');

const frontendFile = pathToFileURL(
  path.join(__dirname, '../../frontend/src/utils/wealthProjection.js')
).href;

const cases = [
  { startingLumpsum: 470000, monthlySip: 15000, expectedReturnPct: 18, inflationPct: 6, monthlyHomeExpenseToday: 30000, withdrawalStartYear: 2038, currentYear: 2026, currentAge: 35, sonAge: 7, daughterAge: 2, projectionEndAge: 85 },
  { startingLumpsum: 0, monthlySip: 50000, expectedReturnPct: 12, inflationPct: 7, monthlyHomeExpenseToday: 80000, withdrawalStartYear: 2030, currentYear: 2026, currentAge: 50, sonAge: 20, daughterAge: 15, projectionEndAge: 90 },
  { startingLumpsum: 1000000, monthlySip: 0, expectedReturnPct: 0, inflationPct: 0, monthlyHomeExpenseToday: 10000, withdrawalStartYear: 2026, currentYear: 2026, currentAge: 60, sonAge: 30, daughterAge: 28, projectionEndAge: 70 },
];

test('frontend projectWealthExcel matches the backend', async () => {
  const frontend = await import(frontendFile);
  for (const params of cases) {
    assert.deepStrictEqual(frontend.projectWealthExcel(params), projectWealthExcel(params));
  }
});
