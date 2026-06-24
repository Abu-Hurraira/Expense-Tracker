import { useEffect, useState } from 'react';
import { reportApi } from '../api/client';
import type { Report } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';
import { reportPieColor, REPORT_PIE_PALETTE } from '../utils/colors';
import { useChartTheme } from '../utils/chartTheme';
import ChartTooltip from '../components/ChartTooltip';
import CategoryBarTooltip from '../components/CategoryBarTooltip';
import TrendChartTooltip from '../components/TrendChartTooltip';
import { CHART_UI } from '../utils/chartColors';
import {
  buildDailySpendingSeries,
  buildWeeklySpendingSeries,
  dailySpendingYMax,
  dailySpendingYTicks,
} from '../utils/dailySpendingChart';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

function pieSegmentLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {Math.round(percent * 100)}
    </text>
  );
}

export default function Reports() {
  const { currency } = useTheme();
  const chartTheme = useChartTheme();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    reportApi.getMonthly(month, year).then(r => setReport(r.data)).catch(console.error);
  }, [month, year]);

  const fmt = (n: number) => formatCurrency(n, currency);
  const pieTooltip = (
    <ChartTooltip
      valueFormatter={v => fmt(v)}
      labelFormatter={label => String(label)}
    />
  );

  if (!report) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading</span></div>
      </div>
    );
  }

  const categoryData = report.categoryBreakdown.map((c, i) => ({
    ...c,
    fill: `url(#reportPieGrad${i % REPORT_PIE_PALETTE.length})`,
    solid: reportPieColor(i),
  }));

  const barCount = categoryData.length;
  const weeklySeries = buildWeeklySpendingSeries(report.dailySpending, month, year);
  const weeklyYMax = dailySpendingYMax(weeklySeries);
  const weeklyYTicks = dailySpendingYTicks(weeklyYMax);
  const categoryBarSize = barCount <= 4 ? 36 : barCount <= 8 ? 28 : 22;
  const categoryBarGap = 16;
  const categoryXPadding =
    barCount <= 2 ? 120
      : barCount <= 4 ? 88
        : barCount <= 6 ? 56
          : 12;
  const categoryBarTooltip = (
    <CategoryBarTooltip
      valueFormatter={v => fmt(v)}
      labelFormatter={label => String(label)}
    />
  );
  const dailySeries = buildDailySpendingSeries(report.dailySpending, month, year);
  const dailyYMax = dailySpendingYMax(dailySeries);
  const dailyYTicks = dailySpendingYTicks(dailyYMax);
  const dailyTooltip = <TrendChartTooltip valueFormatter={v => fmt(v)} />;
  const xTickInterval = Math.max(0, Math.floor(dailySeries.length / 6) - 1);

  const remaining = report.netBalance - report.totalExpenses;

  const weeklyTooltip = <TrendChartTooltip valueFormatter={v => fmt(v)} />;

  return (
    <div className="reports-page animate-fade-up">
      <div className="d-flex justify-content-between align-items-center page-title-bar">
        <h4>Spending Reports</h4>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm combobox-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select className="form-select form-select-sm combobox-input" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4 d-flex animate-fade-up">
          <div className="fin-stat-bw dark w-100">
            <div className="fin-stat-label">Total Spent</div>
            <div className="fin-stat-value">{fmt(report.totalExpenses)}</div>
          </div>
        </div>
        <div className="col-md-4 d-flex animate-fade-up delay-1">
          <div className="fin-stat-bw gray w-100">
            <div className="fin-stat-label">Balance Left</div>
            <div className="fin-stat-value">{fmt(remaining)}</div>
          </div>
        </div>
        <div className="col-md-4 d-flex animate-fade-up delay-2">
          <div className="fin-stat-bw light w-100">
            <div className="fin-stat-label">Categories</div>
            <div className="fin-stat-value">{report.categoryBreakdown.length}</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4 align-items-stretch">
        <div className="col-lg-6 d-flex">
          <div className="fin-card reports-chart-card w-100">
            <div className="fin-card-title"><span>By Category</span></div>
            <div className="reports-chart-body reports-category-bar-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={categoryData}
                  barSize={categoryBarSize}
                  barCategoryGap={categoryBarGap}
                  margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartTheme.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="categoryName"
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    dy={8}
                    height={36}
                    padding={{ left: categoryXPadding, right: categoryXPadding }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={v => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <Tooltip content={categoryBarTooltip} cursor={false} />
                  <Bar
                    dataKey="amount"
                    fill={CHART_UI.fillMid}
                    activeBar={{ fill: CHART_UI.line, opacity: 0.95 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-6 d-flex">
          <div className="fin-card reports-chart-card w-100">
            <div className="fin-card-title"><span>Category Breakdown</span></div>
            <div className="row g-0 align-items-center report-pie-layout">
              <div className="col-sm-5 report-pie-copy">
                <p className="report-pie-eyebrow">Total spent by category</p>
                <h3 className="report-pie-total">{fmt(report.totalExpenses)}</h3>
                <ul className="report-pie-legend list-unstyled mb-0">
                  {categoryData.map((c, i) => (
                    <li key={c.categoryName} className="report-pie-legend-item">
                      <span className="report-pie-swatch" style={{ background: c.solid }} aria-hidden="true" />
                      <span className="report-pie-legend-name text-truncate">{c.categoryName}</span>
                      <span className="report-pie-legend-meta">{Math.round(c.percentage)}%</span>
                    </li>
                  ))}
                  {categoryData.length === 0 && (
                    <li className="text-muted small">No category data this month</li>
                  )}
                </ul>
              </div>
              <div className="col-sm-7 report-pie-chart-col">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {REPORT_PIE_PALETTE.map((p, i) => (
                          <linearGradient key={i} id={`reportPieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={p.light} />
                            <stop offset="100%" stopColor={p.base} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius="56%"
                        outerRadius="88%"
                        paddingAngle={5}
                        cornerRadius={10}
                        stroke="var(--fin-card)"
                        strokeWidth={3}
                        label={pieSegmentLabel}
                        labelLine={false}
                      >
                        {categoryData.map((c, i) => (
                          <Cell key={c.categoryName} fill={c.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={pieTooltip} cursor={false} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="report-pie-empty text-muted">No spending data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fin-card reports-chart-card reports-weekly-card mb-4">
        <div className="fin-card-title"><span>Weekly Spending</span></div>
        <div className="reports-chart-body reports-chart-body-tall reports-weekly-area-wrap">
          <ResponsiveContainer width="100%" height={300} initialDimension={{ width: 640, height: 300 }}>
            <AreaChart
              data={weeklySeries}
              margin={{ top: 20, right: 20, left: 4, bottom: 8 }}
            >
              <defs>
                <linearGradient id="reportWeeklyMountainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_UI.fillTop} stopOpacity={0.58} />
                  <stop offset="40%" stopColor={CHART_UI.fillMid} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART_UI.fillMid} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={chartTheme.grid}
                strokeDasharray="5 5"
                vertical={false}
                horizontal
              />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                axisLine={false}
                tickLine={false}
                interval={0}
                dy={8}
                height={36}
              />
              <YAxis
                domain={[0, weeklyYMax]}
                ticks={weeklyYTicks}
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={v => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip content={weeklyTooltip} cursor={false} />
              <Area
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke={CHART_UI.line}
                strokeWidth={2.5}
                fill="url(#reportWeeklyMountainGrad)"
                dot={false}
                isAnimationActive={false}
                activeDot={{
                  r: 6,
                  fill: '#fff',
                  stroke: CHART_UI.line,
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="fin-card reports-chart-card reports-daily-card">
        <div className="fin-card-title"><span>Daily Spending</span></div>
        <div className="reports-chart-body reports-chart-body-tall reports-daily-line-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={dailySeries}
              margin={{ top: 20, right: 20, left: 4, bottom: 8 }}
            >
              <defs>
                <linearGradient id="reportDailyMountainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_UI.fillTop} stopOpacity={0.62} />
                  <stop offset="35%" stopColor={CHART_UI.fillMid} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={CHART_UI.fillMid} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={chartTheme.grid}
                strokeDasharray="5 5"
                vertical={false}
                horizontal
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                axisLine={false}
                tickLine={false}
                interval={xTickInterval}
                dy={8}
              />
              <YAxis
                domain={[0, dailyYMax]}
                ticks={dailyYTicks}
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={v => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip content={dailyTooltip} cursor={false} />
              <Area
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke={CHART_UI.lineDark}
                strokeWidth={3}
                fill="url(#reportDailyMountainGrad)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#fff',
                  stroke: CHART_UI.lineDark,
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
