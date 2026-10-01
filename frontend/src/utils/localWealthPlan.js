// Offline (server-unreachable) support for the Wealth Planner: the plan is kept
// in this browser's localStorage and projections are computed locally, mirroring
// backend/src/services/wealthPlan.service.js.
import { projectWealthExcel } from './wealthProjection';

const STORAGE_KEY = 'wealthtrack-wealth-plan';

// Same defaults the backend creates for a new wealth plan.
export const DEFAULT_PLAN = {
  my_age: 35,
  son_age: 7,
  daughter_age: 2,
  starting_lumpsum: 470000,
  monthly_sip: 15000,
  expected_return_pct: 18,
  inflation_pct: 6,
  monthly_home_expense_today: 30000,
  withdrawal_start_year: 2038,
  projection_end_age: 85,
};

const SCENARIO_RETURN = { conservative: 12, base: 15, aggressive: 18 };

export function loadLocalPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return { ...DEFAULT_PLAN, ...(saved || {}) };
  } catch {
    return { ...DEFAULT_PLAN };
  }
}

export function saveLocalPlan(values) {
  const plan = { ...loadLocalPlan(), ...values };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    /* storage unavailable (private mode) — keep for this session only */
  }
  return plan;
}

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

// Same shape as GET /wealth-plan/projection-actual. Actual capital comes from the
// server's fund ledger, so it is unavailable offline.
export function localProjection(plan) {
  const rows = projectWealthExcel(buildParams(plan)).map((r) => ({ ...r, actualCorpus: null, pctDiff: null }));
  return { rows, hasActual: false, plan };
}

// Same shape as GET /wealth-plan/scenarios/all.
export function localScenarios(plan) {
  return Object.fromEntries(
    Object.entries(SCENARIO_RETURN).map(([key, pct]) => [key, projectWealthExcel(buildParams(plan, pct))])
  );
}
