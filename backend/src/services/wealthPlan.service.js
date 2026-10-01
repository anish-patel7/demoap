const db = require('../db');
const { projectWealth, projectWealthExcel, projectScenarios } = require('../calc-engine/wealthProjection');

function buildParams(plan, overrideReturnPct) {
  return {
    startingLumpsum: plan.starting_lumpsum,
    monthlySip: plan.monthly_sip,
    expectedReturnPct: overrideReturnPct != null ? overrideReturnPct : plan.expected_return_pct,
    inflationPct: plan.inflation_pct,
    monthlyHomeExpenseToday: plan.monthly_home_expense_today,
    withdrawalStartYear: plan.withdrawal_start_year,
    currentYear: new Date().getFullYear(),
    currentAge: plan.my_age,
    sonAge: plan.son_age,
    daughterAge: plan.daughter_age,
    projectionEndAge: plan.projection_end_age,
  };
}

function getPlan() {
  let plan = db.get('SELECT * FROM wealth_plan WHERE id = 1', []);
  if (!plan) {
    // Create default if doesn't exist
    db.run(
      `INSERT INTO wealth_plan (
        id, my_age, son_age, daughter_age, starting_lumpsum, monthly_sip,
        expected_return_pct, inflation_pct, monthly_home_expense_today,
        yearly_added_fund, withdrawal_start_year, projection_end_age,
        alloc_large_cap_pct, alloc_mid_cap_pct, alloc_small_cap_pct, alloc_penny_pct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 35, 7, 2, 470000, 15000, 18, 6, 30000, 180000, 2038, 85, 50, 20, 20, 10]
    );
    plan = db.get('SELECT * FROM wealth_plan WHERE id = 1', []);
  }
  return plan;
}

function updatePlan(data) {
  const plan = getPlan();

  const fields = [
    'my_age',
    'son_age',
    'daughter_age',
    'starting_lumpsum',
    'monthly_sip',
    'expected_return_pct',
    'inflation_pct',
    'monthly_home_expense_today',
    'yearly_added_fund',
    'withdrawal_start_year',
    'projection_end_age',
    'alloc_large_cap_pct',
    'alloc_mid_cap_pct',
    'alloc_small_cap_pct',
    'alloc_penny_pct',
    'goal_year',
    'goal_opening_capital',
  ];

  const updates = [];
  const values = [];

  for (const field of fields) {
    if (field in data) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length > 0) {
    values.push(1);
    db.run(`UPDATE wealth_plan SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  db.saveDB();
  return getPlan();
}

const SCENARIO_RETURN = { conservative: 12, base: 15, aggressive: 18 };

function getProjection(scenario) {
  const plan = getPlan();
  // No scenario (or 'plan'/'actual') -> use the plan's own expected return (Excel = 18%).
  const overrideReturn = SCENARIO_RETURN[scenario];
  return projectWealthExcel(buildParams(plan, overrideReturn));
}

function getAllScenarios() {
  const plan = getPlan();
  return {
    conservative: projectWealthExcel(buildParams(plan, 12)),
    base: projectWealthExcel(buildParams(plan, 15)),
    aggressive: projectWealthExcel(buildParams(plan, 18)),
  };
}

/**
 * Projection using the plan's own params, with an actual/"live" capital series
 * overlaid from the investment tracker (wealth_actuals). Returns per-year rows
 * plus actualCorpus and pctDiff wherever actuals exist.
 */
function getProjectionWithActual() {
  const plan = getPlan();
  const rows = projectWealthExcel(buildParams(plan));

  // Net actual fund flow per year from the demat ledger (fund_transactions).
  const actualByYear = {};
  const flows = db.all(
    `SELECT substr(txn_date, 1, 4) AS yr,
            SUM(CASE WHEN type = 'Add' THEN amount ELSE -amount END) AS net
     FROM fund_transactions GROUP BY yr`,
    []
  );
  for (const f of flows) actualByYear[parseInt(f.yr)] = f.net || 0;

  const currentYear = new Date().getFullYear();
  let runningActual = plan.starting_lumpsum;
  let hasActual = false;

  const merged = rows.map((r) => {
    let actualCorpus = null;
    let pctDiff = null;
    // Only track the real curve up to the current year (past + present).
    if (r.year <= currentYear) {
      runningActual += actualByYear[r.year] || 0;
      // The very first year's actual baseline is the lumpsum itself.
      if (r.year === rows[0].year) runningActual = plan.starting_lumpsum + (actualByYear[r.year] || 0);
      actualCorpus = runningActual;
      hasActual = true;
      pctDiff = r.nominalCorpus > 0 ? (actualCorpus / r.nominalCorpus) * 100 : null;
    }
    return { ...r, actualCorpus, pctDiff };
  });

  return { rows: merged, hasActual, plan };
}

module.exports = {
  getPlan,
  updatePlan,
  getProjection,
  getAllScenarios,
  getProjectionWithActual,
};
