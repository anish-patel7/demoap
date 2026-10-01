function inflateAmount(amountToday, inflationPct, yearsFromNow) {
  if (!amountToday || !inflationPct || yearsFromNow == null) return 0;
  const rate = inflationPct / 100;
  return amountToday * Math.pow(1 + rate, yearsFromNow);
}

function realValue(nominalAmount, inflationPct, yearsElapsed) {
  if (!nominalAmount || !inflationPct || yearsElapsed == null) return 0;
  const rate = inflationPct / 100;
  return nominalAmount / Math.pow(1 + rate, yearsElapsed);
}

module.exports = {
  inflateAmount,
  realValue,
};
