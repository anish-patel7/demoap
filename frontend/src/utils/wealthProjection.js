// Browser copy of the backend's Excel-accurate wealth projection
// (backend/src/calc-engine/wealthProjection.js → projectWealthExcel), used by the
// Wealth Planner when the server can't be reached. Keep the two in sync;
// backend/tests/frontendProjectionParity.test.js fails if they diverge.

function realValue(nominalAmount, inflationPct, yearsElapsed) {
  if (!nominalAmount || !inflationPct || yearsElapsed == null) return 0;
  const rate = inflationPct / 100;
  return nominalAmount / Math.pow(1 + rate, yearsElapsed);
}

export function projectWealthExcel(params) {
  const {
    startingLumpsum,
    monthlySip,
    expectedReturnPct,
    inflationPct,
    monthlyHomeExpenseToday,
    withdrawalStartYear,
    currentYear = new Date().getFullYear(),
    currentAge,
    sonAge,
    daughterAge,
    projectionEndAge,
  } = params;

  const rate = expectedReturnPct / 100;
  const inflation = inflationPct / 100;
  const annualSip = monthlySip * 12;
  const totalYears = projectionEndAge - currentAge;

  const rows = [];
  let prevCapital = 0;
  let prevReturn = 0;
  let prevWithdrawal = 0;

  for (let yearOffset = 0; yearOffset <= totalYears; yearOffset++) {
    const year = currentYear + yearOffset;
    const isFirstYear = yearOffset === 0;
    const isWithdrawalPhase = year >= withdrawalStartYear;

    const yearReturn = isFirstYear ? 0 : prevCapital * rate;

    let addedFund = 0;
    let withdrawal = 0;
    let capital;

    if (!isWithdrawalPhase) {
      addedFund = isFirstYear ? startingLumpsum + annualSip : annualSip;
      capital = isFirstYear ? addedFund : prevCapital + prevReturn + addedFund;
    } else {
      const firstWithdrawalYear = prevWithdrawal === 0;
      withdrawal = firstWithdrawalYear
        ? monthlyHomeExpenseToday * 2 * 12
        : prevWithdrawal + prevWithdrawal * inflation;
      capital = prevCapital + prevReturn - withdrawal;
      capital = Math.max(capital, 0);
      prevWithdrawal = withdrawal;
    }

    const nominalCorpus = capital;
    const realCorpus = realValue(nominalCorpus, inflationPct, yearOffset) || nominalCorpus;

    rows.push({
      year,
      sr: yearOffset + 1,
      myAge: currentAge + yearOffset,
      sonAge: sonAge + yearOffset,
      daughterAge: daughterAge + yearOffset,
      phase: isWithdrawalPhase ? 'withdrawal' : 'accumulation',
      addedFund,
      withdrawal,
      returnEarned: yearReturn,
      contribution: addedFund,
      nominalCorpus,
      realCorpus,
      corpusDepleted: nominalCorpus <= 0,
    });

    prevCapital = capital;
    prevReturn = yearReturn;
  }

  return rows;
}
