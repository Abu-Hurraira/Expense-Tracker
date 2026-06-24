import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import type { DashboardSummary } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';
import { CHART_GRAYS } from '../utils/colors';
import { useChartTheme } from '../utils/chartTheme';
import TrendChartTooltip from '../components/TrendChartTooltip';
import { CHART_UI } from '../utils/chartColors';
import {
  buildLast6MonthsTrend,
  expenseTrendYMax,
  expenseTrendYTicks,
} from '../utils/expenseTrendChart';
import {
  ComposedChart, Area, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const { currency } = useTheme();
  const chartTheme = useChartTheme();
  const location = useLocation();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    dashboardApi.getSummary()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, location.pathname]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading</span></div>
      </div>
    );
  }

  if (!data) return <div className="alert alert-dark">Failed to load dashboard</div>;

  const fmt = (n: number) => formatCurrency(n, currency);
  const trendTooltip = <TrendChartTooltip valueFormatter={v => fmt(v)} />;
  const spent = data.monthlyExpenses;
  const totalBalance = data.totalBalance;
  const remaining = totalBalance - spent;
  const totalFunds = totalBalance;

  const expenseTrend = buildLast6MonthsTrend(data.monthlyTrend);
  const trendYMax = expenseTrendYMax(expenseTrend);
  const trendYTicks = expenseTrendYTicks(trendYMax);

  const categoryData = data.categorySpending.map((c, i) => ({
    ...c,
    fill: CHART_GRAYS[i % CHART_GRAYS.length],
  }));

  const pctUsed = totalFunds > 0 ? Math.round((spent / totalFunds) * 100) : 0;
  const pctLeft = totalFunds > 0 ? Math.round((remaining / totalFunds) * 100) : 0;
  const trendMonths = data.monthlyTrend;
  const lastMonthSpend = trendMonths[trendMonths.length - 1]?.expenses ?? 0;
  const prevMonthSpend = trendMonths[trendMonths.length - 2]?.expenses ?? 0;
  const monthChange = prevMonthSpend > 0
    ? Math.round(((lastMonthSpend - prevMonthSpend) / prevMonthSpend) * 100)
    : null;
  return (
    <div className="dashboard-page">
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-4 animate-fade-up">
          <div className="card dash-hero-stat border-0 h-100">
            <div className="card-body">
              <div className="dash-hero-stat-icon"><i className="bi bi-wallet2"></i></div>
              <p className="dash-hero-label">Total Funds</p>
              <h2 className="dash-hero-value">{fmt(totalFunds)}</h2>
              {monthChange !== null && trendMonths.length >= 2 && (
                <span className={`dash-pill ${monthChange >= 0 ? 'dash-pill-mint' : 'dash-pill-amber-soft'}`}>
                  <i className={`bi bi-arrow-${monthChange >= 0 ? 'up' : 'down'}-short`}></i>
                  {Math.abs(monthChange)}% from last month
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-4 animate-fade-up delay-1">
          <div className="card dash-glass-stat border-0 h-100">
            <div className="card-body">
              <div className="d-flex gap-3">
                <div className="dash-glass-icon dash-glass-icon-green"><i className="bi bi-cart3"></i></div>
                <div className="flex-grow-1 min-w-0">
                  <p className="dash-glass-label">Spent This Month</p>
                  <h3 className="dash-glass-value">{fmt(spent)}</h3>
                  <span className="dash-pill dash-pill-mint-soft">{pctUsed}% used</span>
                  <div className="dash-bar-track mt-3">
                    <div className="dash-bar-fill dash-bar-green" style={{ width: `${pctUsed}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-4 animate-fade-up delay-2">
          <div className="card dash-glass-stat border-0 h-100">
            <div className="card-body">
              <div className="d-flex gap-3">
                <div className="dash-glass-icon dash-glass-icon-amber"><i className="bi bi-piggy-bank"></i></div>
                <div className="flex-grow-1 min-w-0">
                  <p className="dash-glass-label">Remaining</p>
                  <h3 className="dash-glass-value">{fmt(remaining)}</h3>
                  <span className="dash-pill dash-pill-amber-soft">{pctLeft}% left</span>
                  <div className="dash-bar-track mt-3">
                    <div className="dash-bar-fill dash-bar-amber" style={{ width: `${pctLeft}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7 animate-fade-up delay-2">
          <div className="card border-0 rounded-4 dash-glass-stat dash-chart-card h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                  Daily Spending Trend
                </h6>
                <span className="dash-period-pill">Last 6 months</span>
              </div>
            </div>
            <div className="card-body px-2 px-sm-4 pb-4 pt-2">
              <div className="dash-trend-chart-wrap">
                <ResponsiveContainer width="100%" height={300} initialDimension={{ width: 640, height: 300 }}>
                  <ComposedChart data={expenseTrend} margin={{ top: 16, right: 20, left: 8, bottom: 24 }}>
                    <defs>
                      <linearGradient id="dashSpentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_UI.fillTop} stopOpacity={0.45} />
                        <stop offset="50%" stopColor={CHART_UI.fillMid} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={CHART_UI.fillMid} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke={chartTheme.grid}
                      strokeDasharray="0"
                      vertical
                      horizontal={false}
                    />
                    <CartesianGrid
                      stroke={chartTheme.grid}
                      strokeDasharray="6 6"
                      vertical={false}
                      horizontal
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: chartTheme.tick }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      height={44}
                    />
                    <YAxis
                      domain={[0, trendYMax]}
                      ticks={trendYTicks}
                      tick={{ fontSize: 12, fill: chartTheme.tick }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip content={trendTooltip} cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      name="Expenses"
                      stroke={CHART_UI.line}
                      strokeWidth={2.5}
                      fill="url(#dashSpentGrad)"
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{
                        r: 7,
                        fill: '#fff',
                        stroke: CHART_UI.line,
                        strokeWidth: 2.5,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#b0b8b4"
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{
                        r: 6,
                        fill: '#fff',
                        stroke: '#9aa89f',
                        strokeWidth: 2,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-chart-legend-row">
                <span className="dash-chart-legend-item">
                  <span className="dash-chart-legend-line spent" /> Expenses
                </span>
                <span className="dash-chart-legend-item">
                  <span className="dash-chart-legend-line income" /> Income
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5 animate-fade-up delay-3">
          <div className="card border-0 rounded-4 dash-glass-stat dash-chart-card h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-pie-chart me-2 text-success"></i>
                By Category
              </h6>
            </div>
            <div className="card-body px-4 pb-4 d-flex flex-column">
              <div className="row align-items-center g-3 flex-grow-1">
                <div className="col-6 position-relative" style={{ minHeight: 200 }}>
                  <ResponsiveContainer width="100%" height={200} initialDimension={{ width: 280, height: 200 }}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        strokeWidth={0}
                        isAnimationActive={false}
                      >
                        {categoryData.map((_, i) => <Cell key={i} fill={CHART_GRAYS[i % CHART_GRAYS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <div className="amount">{fmt(spent)}</div>
                    <div className="label">Spent</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="dash-legend">
                    {categoryData.map((c, i) => (
                      <div key={c.categoryName} className="dash-legend-item">
                        <span className="d-flex align-items-center gap-2 text-truncate">
                          <span className="dash-legend-dot" style={{ background: CHART_GRAYS[i % CHART_GRAYS.length] }}></span>
                          <span className="small fw-medium">{c.categoryName}</span>
                        </span>
                        <div className="text-end">
                          <div className="small fw-bold">{Math.round(c.percentage)}%</div>
                          <div className="small text-muted">{fmt(c.amount)}</div>
                        </div>
                      </div>
                    ))}
                    {categoryData.length === 0 && <p className="text-muted small mb-0">No expenses yet</p>}
                  </div>
                </div>
              </div>
              <Link to="/app/categories" className="btn btn-outline-secondary w-100 mt-3 dash-view-all-btn">
                View All Categories
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8 animate-fade-up delay-3">
          <div className="card border-0 shadow-sm rounded-4 dash-card h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <h6 className="fw-bold mb-0"><i className="bi bi-receipt me-2 text-secondary"></i>Recent Expenses</h6>
                <Link to="/app/transactions" className="btn btn-sm btn-outline-secondary">View All</Link>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="table-responsive rounded-3 border">
                <table className="table table-hover align-middle fin-table expense-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col" className="expense-col-category">Category</th>
                      <th scope="col" className="expense-col-date">Date</th>
                      <th scope="col" className="text-end expense-col-amount">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.filter(t => t.type === 'Expense').map((t) => (
                      <tr key={t.transactionId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="receiver-avatar flex-shrink-0">{(t.description || t.categoryName || '?')[0].toUpperCase()}</div>
                            <span className="fw-semibold text-truncate">{t.description || t.categoryName}</span>
                          </div>
                        </td>
                        <td><span className="badge rounded-pill text-bg-light border cat-pill">{t.categoryName}</span></td>
                        <td className="text-muted small text-nowrap">{format(new Date(t.transactionDate), 'MMM dd, yyyy')}</td>
                        <td className="text-end fw-bold text-nowrap">-{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    {data.recentTransactions.filter(t => t.type === 'Expense').length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted py-5">No expenses yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 animate-fade-up delay-4">
          <div className="card border-0 shadow-sm rounded-4 dash-card h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h6 className="fw-bold mb-0"><i className="bi bi-lightning-charge me-2 text-secondary"></i>Quick Actions</h6>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-2">
                <Link to="/app/accounts" className="btn btn-secondary d-flex align-items-center justify-content-center gap-2">
                  <i className="bi bi-wallet2"></i> Set Total Balance
                </Link>
                <Link to="/app/transactions" className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
                  <i className="bi bi-plus-circle"></i> Add Daily Expense
                </Link>
                <Link to="/app/categories" className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
                  <i className="bi bi-tags"></i> Manage Categories
                </Link>
              </div>
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Budget used</span>
                  <span className="small fw-semibold">{totalFunds > 0 ? Math.round((spent / totalFunds) * 100) : 0}%</span>
                </div>
                <div className="progress rounded-pill" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-secondary"
                    role="progressbar"
                    style={{ width: `${totalFunds > 0 ? Math.min((spent / totalFunds) * 100, 100) : 0}%` }}
                    aria-valuenow={totalFunds > 0 ? (spent / totalFunds) * 100 : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="row g-2 mt-3">
                  <div className="col-4">
                    <div className="dash-mini-stat">
                      <span className="text-muted">Total</span>
                      <strong>{fmt(totalFunds)}</strong>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="dash-mini-stat">
                      <span className="text-muted">Spent</span>
                      <strong>{fmt(spent)}</strong>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="dash-mini-stat">
                      <span className="text-muted">Left</span>
                      <strong>{fmt(remaining)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
