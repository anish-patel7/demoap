const { inflateAmount, realValue } = require('./inflation');

/**
 * Excel-accurate wealth projection matching the "Wealth Creation" sheet.
 *
 * Model (annual, with a one-year return lag):
 *   return[y]  = capital[y-1] * rate           (RETURN column; return[firstYear] = 0)
 *   capital[y] = capital[y-1] + return[y-1] + addedFund[y]      (accumulation)
 *   capital[y] = capital[y-1] + return[y-1] - withdrawal[y]     (withdrawal phase)
 *
 *   addedFund (accumulation): year 1 = lumpsum + sip*12; later years = sip*12
 *   withdrawal (from withdrawalStartYear):
 *     first year   = monthlyHomeExpense * 2 * 12
 *     later years  = prevWithdrawal + prevWithdrawal * inflation   (grows at inflation)
 */
function projectWealthExcel(params) {
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

    // RETURN[y] = capital[y-1] * rate  (0 in the first year)
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

    const myAgeThisYear = currentAge + yearOffset;
    const sonAgeThisYear = sonAge + yearOffset;
    const daughterAgeThisYear = daughterAge + yearOffset;

    rows.push({
      year,
      sr: yearOffset + 1,
      myAge: myAgeThisYear,
      sonAge: sonAgeThisYear,
      daughterAge: daughterAgeThisYear,
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

function projectWealth(params) {
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

  const monthlyReturnRate = expectedReturnPct / 100 / 12;
  const totalYears = projectionEndAge - currentAge;
  const rows = [];

  let corpus = startingLumpsum;

  for (let yearOffset = 0; yearOffset <= totalYears; yearOffset++) {
    const year = currentYear + yearOffset;
    const isWithdrawalPhase = year >= withdrawalStartYear;
    let yearContribution = 0;
    let yearWithdrawal = 0;

    let monthlyWithdrawal = 0;
    if (isWithdrawalPhase) {
      const inflatedAnnualExpense = inflateAmount(
        monthlyHomeExpenseToday * 12,
        inflationPct,
        yearOffset
      );
      monthlyWithdrawal = inflatedAnnualExpense / 12;
    }

    // Simulate 12 months of the year
    for (let month = 0; month < 12; month++) {
      corpus = corpus * (1 + monthlyReturnRate);

      if (!isWithdrawalPhase) {
        corpus += monthlySip;
        yearContribution += monthlySip;
      } else {
        corpus -= monthlyWithdrawal;
        yearWithdrawal += monthlyWithdrawal;
      }

      corpus = Math.max(corpus, 0);
    }

    const nominalCorpus = corpus;
    const realCorpus = realValue(nominalCorpus, inflationPct, yearOffset);

    const myAge = currentAge + yearOffset;
    const sonAgeThisYear = sonAge + yearOffset;
    const daughterAgeThisYear = daughterAge + yearOffset;

    rows.push({
      year,
      myAge,
      sonAge: sonAgeThisYear,
      daughterAge: daughterAgeThisYear,
      phase: isWithdrawalPhase ? 'withdrawal' : 'accumulation',
      contribution: yearContribution,
      withdrawal: yearWithdrawal,
      nominalCorpus,
      realCorpus,
      sonMilestone: sonAgeThisYear === 18 ? '18th' : sonAgeThisYear === 25 ? '25th' : null,
      daughterMilestone:
        daughterAgeThisYear === 18 ? '18th' : daughterAgeThisYear === 25 ? '25th' : null,
      corpusDepleted: nominalCorpus <= 0,
    });
  }

  return rows;
}

function projectScenarios(params) {
  return {
    conservative: projectWealth({ ...params, expectedReturnPct: 12 }),
    base: projectWealth({ ...params, expectedReturnPct: 15 }),
    aggressive: projectWealth({ ...params, expectedReturnPct: 18 }),
  };
}

function findYearReachingTarget(rows, targetNominalCorpus) {
  const found = rows.find(r => r.nominalCorpus >= targetNominalCorpus);
  return found ? found.year : null;
}

module.exports = {
  projectWealth,
  projectWealthExcel,
  projectScenarios,
  findYearReachingTarget,
};
