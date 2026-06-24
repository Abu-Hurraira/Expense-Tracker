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

  const row = items[0]?.payload as { tooltipDate?: string; tooltipRange?: string } | undefined;
  const tooltipLabel = row?.tooltipRange ?? row?.tooltipDate;
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : String(v));

  return (
    <div className="trend-chart-tooltip">
      {tooltipLabel && <p className="trend-chart-tooltip-date">{tooltipLabel}</p>}
      {items.map(entry => (
        <p key={String(entry.dataKey)} className="trend-chart-tooltip-value mb-1">
          <span className="trend-chart-tooltip-dot" style={{ background: entry.color }} />
          {entry.name}: {fmt(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
}
