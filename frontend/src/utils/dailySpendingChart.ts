import { eachDayOfInterval, endOfMonth, format, startOfMonth, eachWeekOfInterval, endOfWeek, min } from 'date-fns';

export type DailySpendingPoint = {
  date: string;
  label: string;
  spent: number;
  tooltipDate: string;
};

export type WeeklySpendingPoint = {
  weekStart: string;
  label: string;
  shortLabel: string;
  spent: number;
  tooltipRange: string;
};

export function buildDailySpendingSeries(
  daily: { date: string; amount: number }[],
  month: number,
  year: number,
): DailySpendingPoint[] {
  const byDate = Object.fromEntries(
    daily.map(d => [d.date.slice(0, 10), Number(d.amount)]),
  );
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(start);

  return eachDayOfInterval({ start, end }).map(day => {
    const key = format(day, 'yyyy-MM-dd');
    return {
      date: key,
      label: format(day, 'd MMM'),
      spent: Number(byDate[key] ?? 0),
      tooltipDate: format(day, 'MMM dd, yyyy'),
    };
  });
}

export function buildWeeklySpendingSeries(
  daily: { date: string; amount: number }[],
  month: number,
  year: number,
): WeeklySpendingPoint[] {
  const byDate = Object.fromEntries(
    daily.map(d => [d.date.slice(0, 10), Number(d.amount)]),
  );
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

  return weekStarts.map(start => {
    const end = min([endOfWeek(start, { weekStartsOn: 1 }), monthEnd]);
    const days = eachDayOfInterval({ start, end });
    const total = days.reduce((sum, day) => {
      const key = format(day, 'yyyy-MM-dd');
      return sum + Number(byDate[key] ?? 0);
    }, 0);

    return {
      weekStart: format(start, 'yyyy-MM-dd'),
      label: `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`,
      shortLabel: format(start, 'd MMM'),
      spent: total,
      tooltipRange: `${format(start, 'MMM dd')} – ${format(end, 'MMM dd')}`,
    };
  });
}

export function dailySpendingYMax(points: { spent: number }[]): number {
  const max = Math.max(...points.map(p => p.spent), 0);
  if (max <= 0) return 100;
  if (max <= 300) return 300;
  if (max <= 600) return Math.ceil(max / 150) * 150;
  return Math.ceil(max / 300) * 300;
}

export function dailySpendingYTicks(yMax: number): number[] {
  const step = yMax <= 300 ? 75 : yMax <= 600 ? 150 : Math.ceil(yMax / 4 / 150) * 150;
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);
  return ticks;
}
