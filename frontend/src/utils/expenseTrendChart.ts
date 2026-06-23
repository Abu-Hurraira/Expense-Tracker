import { format, endOfMonth, subMonths, startOfMonth } from 'date-fns';

type MonthlyTrendRow = { month: string; income: number; expenses: number };

export type ExpenseTrendPoint = {
  name: string;
  monthKey: string;
  spent: number;
  income: number;
  tooltipDate: string;
};

export function buildLast6MonthsTrend(trend: MonthlyTrendRow[]): ExpenseTrendPoint[] {
  const byMonth = Object.fromEntries(
    trend.map(t => [t.month, { income: t.income, expenses: t.expenses }]),
  );
  const now = new Date();

  return Array.from({ length: 6 }, (_, i) => {
    const date = startOfMonth(subMonths(now, 5 - i));
    const monthKey = format(date, 'yyyy-MM');
    const row = byMonth[monthKey];
    const isCurrentMonth =
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    const tooltipDate = isCurrentMonth
      ? format(now, 'MMM dd, yyyy, h:mm a')
      : format(endOfMonth(date), 'MMM dd, yyyy');

    return {
      name: format(date, 'MMM'),
      monthKey,
      spent: Number(row?.expenses ?? 0),
      income: Number(row?.income ?? 0),
      tooltipDate,
    };
  });
}

/** @deprecated use buildLast6MonthsTrend */
export function buildLast6MonthsExpenseTrend(trend: MonthlyTrendRow[]): ExpenseTrendPoint[] {
  return buildLast6MonthsTrend(trend);
}

export function expenseTrendYMax(points: ExpenseTrendPoint[]): number {
  const max = Math.max(...points.map(p => Math.max(p.spent, p.income)), 0);
  if (max <= 600) return 600;
  return Math.ceil(max / 150) * 150;
}

export function expenseTrendYTicks(yMax: number): number[] {
  const step = yMax <= 600 ? 150 : Math.ceil(yMax / 4 / 150) * 150;
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);
  return ticks;
}
