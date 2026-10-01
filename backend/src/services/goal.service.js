const db = require('../db');
const { getPlan, updatePlan } = require('./wealthPlan.service');
const accountsService = require('./accounts.service');

// Total live capital across all active accounts (today's actual value).
function currentTotalCapital() {
  return accountsService
    .getAllAccounts()
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + (a.current_capital || 0), 0);
}

// Net contributions (Add - Withdraw) per calendar year from the demat ledger —
// this is the "SIP" the Investment Tracker records. { 2024: 180000, ... }
function contributionsByYear() {
  const rows = db.all(
    `SELECT substr(txn_date, 1, 4) AS yr,
            SUM(CASE WHEN type = 'Add' THEN amount ELSE -amount END) AS net
       FROM fund_transactions
      GROUP BY yr`,
    []
  );
  const map = {};
  for (const r of rows) map[parseInt(r.yr, 10)] = r.net || 0;
  return map;
}

// Actual year-end corpus per year from the Investment Tracker (wealth_actuals):
// take the latest month in each year that has an actual_total_corpus. { 2024: 298000 }
function actualCorpusByYear() {
  const rows = db.all(
    `SELECT year, month, actual_total_corpus
       FROM wealth_actuals
      WHERE actual_total_corpus IS NOT NULL
      ORDER BY year, month`,
    []
  );
  const map = {};
  for (const r of rows) map[r.year] = r.actual_total_corpus; // later month overwrites earlier
  return map;
}

// Build the year-by-year goal series and the current-year summary.
//
// For each year N from the start year to the current year:
//   opening_N   = start year -> goal_opening_capital;
//                 otherwise the previous year's rolled target (plan basis).
//   sip_N       = actual contributions that year (ledger), else planned monthly_sip*12.
//   target_N    = opening_N * (1 + return%/100) + sip_N
//   actual_N    = current year -> live capital; past year -> tracker corpus (if any)
//   achieved%_N = actual_N / target_N * 100   (achieved when >= 100%)
function computeGoal() {
  const plan = getPlan();
  const returnPct = plan.expected_return_pct || 0;
  const monthlySip = plan.monthly_sip || 0;
  const plannedAnnualSip = monthlySip * 12;
  const currentYear = new Date().getFullYear();
  const liveCapital = currentTotalCapital();

  const configured = plan.goal_opening_capital > 0;
  const startYear = plan.goal_year > 0 ? plan.goal_year : currentYear;
  const startOpening = configured ? plan.goal_opening_capital : liveCapital;

  const contribs = contributionsByYear();
  const actuals = actualCorpusByYear();

  const years = [];
  let opening = startOpening;

  // Guard against a misconfigured future start year.
  const lastYear = Math.max(startYear, currentYear);
  for (let year = startYear; year <= lastYear; year++) {
    const isCurrent = year === currentYear;

    // SIP: prefer recorded contributions; fall back to the plan for the
    // current/future years that aren't fully logged yet.
    const recorded = contribs[year];
    const sip = recorded != null && recorded !== 0 ? recorded : plannedAnnualSip;

    const targetReturn = opening * (returnPct / 100);
    const target = opening + targetReturn + sip;

    // Actual capital reached this year.
    let actual = null;
    if (isCurrent) actual = liveCapital;
    else if (actuals[year] != null) actual = actuals[year];

    const achievedPct = actual != null && target > 0 ? (actual / target) * 100 : null;
    const achieved = achievedPct != null && achievedPct >= 100;

    years.push({
      year,
      opening,
      sip,
      targetReturn,
      target,
      actual,
      achievedPct,
      achieved,
      isCurrent,
    });

    // Roll forward on the plan/target basis (as per the goal definition).
    opening = target;
  }

  const current = years.find((y) => y.isCurrent) || years[years.length - 1];

  return {
    configured,
    startYear,
    currentYear,
    returnPct,
    monthlySip,
    // Flat summary for the current-year progress bar.
    current: {
      year: current.year,
      opening: current.opening,
      sip: current.sip,
      targetReturn: current.targetReturn,
      target: current.target,
      actual: current.actual,
      remaining: Math.max(0, current.target - (current.actual || 0)),
      progressPct: current.achievedPct || 0,
      achieved: current.achieved,
    },
    years,
  };
}

function updateGoal(data = {}) {
  const patch = {};
  if (data.goal_year !== undefined) {
    patch.goal_year = parseInt(data.goal_year, 10) || 0;
  }
  if (data.goal_opening_capital !== undefined) {
    const v = Number(data.goal_opening_capital);
    if (Number.isNaN(v) || v < 0) {
      const err = new Error('Opening capital must be a non-negative number.');
      err.status = 400;
      throw err;
    }
    patch.goal_opening_capital = v;
  }
  if (data.expected_return_pct !== undefined) {
    const v = Number(data.expected_return_pct);
    if (Number.isNaN(v) || v < 0 || v > 100) {
      const err = new Error('Return % must be between 0 and 100.');
      err.status = 400;
      throw err;
    }
    patch.expected_return_pct = v;
  }
  if (data.monthly_sip !== undefined) {
    const v = Number(data.monthly_sip);
    if (Number.isNaN(v) || v < 0) {
      const err = new Error('Monthly SIP must be a non-negative number.');
      err.status = 400;
      throw err;
    }
    patch.monthly_sip = v;
  }

  if (Object.keys(patch).length > 0) updatePlan(patch);
  return computeGoal();
}

module.exports = { computeGoal, updateGoal, currentTotalCapital };
