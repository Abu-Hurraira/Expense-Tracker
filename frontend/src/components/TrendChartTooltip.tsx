import type { TooltipProps } from 'recharts';

type TrendChartTooltipProps = TooltipProps<number, string> & {
  valueFormatter?: (value: number) => string;
};

export default function TrendChartTooltip({
  active,
  payload,
  valueFormatter,
}: TrendChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const items = payload.filter(entry => entry.dataKey === 'spent');
  if (!items.length) return null;

  const row = items[0]?.payload as { tooltipDate?: string } | undefined;
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : String(v));

  return (
    <div className="trend-chart-tooltip">
      {row?.tooltipDate && <p className="trend-chart-tooltip-date">{row.tooltipDate}</p>}
      {items.map(entry => (
        <p key={String(entry.dataKey)} className="trend-chart-tooltip-value mb-1">
          <span className="trend-chart-tooltip-dot" style={{ background: entry.color }} />
          {entry.name}: {fmt(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
}
