import type { TooltipContentProps } from 'recharts';

type RechartsTooltipProps = Partial<Pick<TooltipContentProps<number, string>, 'active' | 'payload' | 'label' | 'coordinate' | 'accessibilityLayer' | 'activeIndex'>>;

type CategoryBarTooltipProps = RechartsTooltipProps & {
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
};

export default function CategoryBarTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: CategoryBarTooltipProps) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as { categoryName?: string } | undefined;
  const name = row?.categoryName
    ?? (label != null
      ? labelFormatter
        ? labelFormatter(String(label))
        : String(label)
      : null);
  const value = Number(payload[0]?.value ?? 0);
  const formatted = valueFormatter ? valueFormatter(value) : String(value);

  return (
    <div className="report-bar-tooltip">
      {name && <span className="report-bar-tooltip-label">{name}</span>}
      <span className="report-bar-tooltip-value">{formatted}</span>
    </div>
  );
}
