export const chartColors = {
  light: {
    diverging: { loss: '#ffb2b7', breakeven: '#86948a', gain: '#4edea3' },
    categories: ['#adc6ff', '#ffb2b7', '#4edea3', '#71a1ff', '#10b981', '#6ffbbe'],
    scenarios: { conservative: '#71a1ff', base: '#adc6ff', aggressive: '#ffb2b7' },
    allocation: { largeCap: '#adc6ff', midCap: '#71a1ff', smallCap: '#4edea3', penny: '#ffb2b7' },
    status: { good: '#4edea3', warning: '#86948a', critical: '#ffb2b7' },
    text: '#dae2fd',
    textSecondary: '#bbcabf',
    gridLine: '#3c4a42',
    surface: '#131b2e',
  },
  dark: {
    diverging: { loss: '#ffb2b7', breakeven: '#86948a', gain: '#4edea3' },
    categories: ['#adc6ff', '#ffb2b7', '#4edea3', '#71a1ff', '#10b981', '#6ffbbe'],
    scenarios: { conservative: '#71a1ff', base: '#adc6ff', aggressive: '#ffb2b7' },
    allocation: { largeCap: '#adc6ff', midCap: '#71a1ff', smallCap: '#4edea3', penny: '#ffb2b7' },
    status: { good: '#4edea3', warning: '#86948a', critical: '#ffb2b7' },
    text: '#dae2fd',
    textSecondary: '#bbcabf',
    gridLine: '#3c4a42',
    surface: '#171f33',
  },
};

export function getChartColors(isDark = true) {
  return isDark ? chartColors.dark : chartColors.light;
}

export const chartConfig = {
  strokeWidth: 2,
  barRadius: [4, 4, 0, 0],
  margin: { top: 20, right: 30, bottom: 20, left: 60 },
  tooltipStyle: {
    contentStyle: {
      backgroundColor: 'rgba(0,0,0,0.85)',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 12px',
    },
    labelStyle: { color: '#fff' },
  },
};
