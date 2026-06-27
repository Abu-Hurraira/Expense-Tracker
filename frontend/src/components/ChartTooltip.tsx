import type { TooltipContentProps } from 'recharts';

type RechartsTooltipProps = Partial<Pick<TooltipContentProps<number, string>, 'active' | 'payload' | 'label' | 'coordinate' | 'accessibilityLayer' | 'activeIndex'>>;

type ChartTooltipProps = RechartsTooltipProps & {
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  showValueDot?: boolean;
};

export default function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  showValueDot,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as { tooltipDate?: string } | undefined;
  const displayLabel = row?.tooltipDate
    ?? (label != null
      ? labelFormatter
        ? labelFormatter(String(label))
        : String(label)
      : null);

  return (
    <div className="chart-tooltip">
      {displayLabel && <p className="chart-tooltip-label">{displayLabel}</p>}
      {payload.map((entry, i) => {
        const value = Number(entry.value ?? 0);
        const formatted = valueFormatter ? valueFormatter(value) : String(value);
        return (
          <p key={i} className={`chart-tooltip-value${showValueDot ? ' chart-tooltip-value-row' : ''}`}>
            {showValueDot && <span className="chart-tooltip-dot" aria-hidden="true" />}
            {formatted}
          </p>
        );
      })}
    </div>
  );
}
