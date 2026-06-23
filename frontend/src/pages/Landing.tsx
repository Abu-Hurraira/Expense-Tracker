import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import AppLogo from '../components/AppLogo';
import { APP_NAME } from '../constants/brand';
import { CHART_UI } from '../utils/chartColors';

const weekData = [
  { day: 'Mon', spent: 420 },
  { day: 'Tue', spent: 380 },
  { day: 'Wed', spent: 510 },
  { day: 'Thu', spent: 460 },
  { day: 'Fri', spent: 620 },
  { day: 'Sat', spent: 540 },
  { day: 'Sun', spent: 530 },
];

const navLinks = ['Features', 'Use Cases', 'Integrations', 'Pricing', 'Docs', 'Blogs'];

function PhoneMockup() {
  return (
    <div className="landing-phone">
      <div className="landing-phone-notch" />
      <div className="landing-phone-screen">
        <div className="landing-phone-header">
          <i className="bi bi-list" />
          <span>Home</span>
          <i className="bi bi-person-circle" />
        </div>
        <p className="landing-phone-label">Total balance</p>
        <div className="landing-phone-balance">
          <span>Rs 14,470</span>
          <span className="landing-phone-badge">+2.8%</span>
        </div>
        <p className="landing-phone-hint">
          You&apos;ve tracked Rs 530 in spending this month. Great job!
        </p>
        <div className="landing-phone-tabs">
          <span>Week</span>
          <span className="active">Month</span>
          <span>Year</span>
        </div>
        <div className="landing-phone-chart">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weekData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="landingChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_UI.fillTop} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_UI.fillMid} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9aa89f' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[300, 700]} />
              <Tooltip
                contentStyle={{
                  background: CHART_UI.tooltipBg,
                  border: `1px solid ${CHART_UI.tooltipBorder}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#fff',
                }}
                formatter={(v) => [`Rs ${v}`, '']}
                labelFormatter={l => l}
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke={CHART_UI.line}
                strokeWidth={2}
                fill="url(#landingChartGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#fff', stroke: CHART_UI.line, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="landing-phone-actions">
          <button type="button" className="landing-phone-btn muted">Add Expense</button>
          <button type="button" className="landing-phone-btn primary">View Reports</button>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing-page">
      <div className="landing-glow landing-glow-1" aria-hidden="true" />
      <div className="landing-glow landing-glow-2" aria-hidden="true" />

      <header className="landing-nav container-fluid px-4 px-lg-5">
        <Link to="/" className="landing-brand text-decoration-none">
          <AppLogo size={36} />
          <span>{APP_NAME}</span>
        </Link>
        <nav className="landing-links d-none d-lg-flex">
          {navLinks.map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}>{link}</a>
          ))}
        </nav>
        <Link to="/register" className="btn landing-btn-outline">Get Started Free</Link>
      </header>

      <section className="landing-hero container-fluid px-4 px-lg-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 landing-hero-copy animate-fade-up">
            <h1>Track Your Spending Effortlessly</h1>
            <p className="landing-subtitle">
              Manage your daily expenses with ease using our intuitive, real-time tracker built for clarity and control.
            </p>
            <div className="landing-cta d-flex flex-wrap gap-3">
              <Link to="/register" className="btn landing-btn-primary">Start Tracking Now</Link>
              <Link to="/login" className="btn landing-btn-ghost">Sign In</Link>
            </div>
            <div className="landing-stats row g-3">
              <div className="col-4">
                <strong>200k+</strong>
                <span>Total Users</span>
              </div>
              <div className="col-4">
                <strong>2.5M+</strong>
                <span>Total Downloads</span>
              </div>
              <div className="col-4">
                <strong>53%</strong>
                <span>Average Savings</span>
              </div>
            </div>
          </div>
          <div className="col-lg-6 d-flex justify-content-center justify-content-lg-end animate-fade-up delay-2">
            <PhoneMockup />
          </div>
        </div>
      </section>
    </div>
  );
}
