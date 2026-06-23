const GREENS = ['#3d5349', '#4a6356', '#5f7d6b', '#6d8f7d', '#8aab99', '#a8c4b8'];

export const CHART_GRAYS = GREENS;

/** Dark sage palette for report donut (base + highlight for gradients) */
export const REPORT_PIE_PALETTE = [
  { base: '#4a6356', light: '#6d8f7b' },
  { base: '#3d5349', light: '#556b5f' },
  { base: '#354840', light: '#4d6358' },
  { base: '#5f7d6b', light: '#7a9a88' },
  { base: '#2f4238', light: '#465a50' },
  { base: '#6d8f7d', light: '#8aab99' },
];

export function grayForIndex(i: number) {
  return GREENS[i % GREENS.length];
}

export function reportPieColor(i: number) {
  return REPORT_PIE_PALETTE[i % REPORT_PIE_PALETTE.length].base;
}
