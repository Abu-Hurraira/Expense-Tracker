import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { notificationApi } from '../api/client';
import type { Notification } from '../api/types';
import { format } from 'date-fns';
import AppLogo from './AppLogo';
import { APP_NAME } from '../constants/brand';

const mainNav = [
  { to: '/app', icon: 'bi-grid-1x2', label: 'Dashboard', end: true },
  { to: '/app/transactions', icon: 'bi-receipt', label: 'Daily Expenses' },
  { to: '/app/accounts', icon: 'bi-wallet2', label: 'My Balance' },
  { to: '/app/categories', icon: 'bi-tags', label: 'Categories' },
  { to: '/app/reports', icon: 'bi-bar-chart-line', label: 'Reports' },
  { to: '/app/calendar', icon: 'bi-calendar3', label: 'Calendar' },
];

const bottomNav = [
  { to: '/app/budgets', icon: 'bi-pie-chart', label: 'Budget' },
  { to: '/app/settings', icon: 'bi-gear', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');
  const now = new Date();

  useEffect(() => {
    notificationApi.getAll(true).then(r => setNotifications(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/app/transactions?search=${encodeURIComponent(search)}`);
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="app-shell">
      <aside className="fin-sidebar">
        <div className="fin-brand">
          <div className="fin-brand-icon"><AppLogo size={40} /></div>
          <span>{APP_NAME}</span>
        </div>
        <nav className="fin-nav">
          {mainNav.map((item, i) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `fin-nav-link animate-fade-left delay-${Math.min(i + 1, 4)} ${isActive ? 'active' : ''}`}>
              <i className={`bi ${item.icon}`}></i><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="fin-sidebar-bottom">
          {bottomNav.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `fin-nav-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${item.icon}`}></i><span>{item.label}</span>
            </NavLink>
          ))}
          <button className="fin-nav-link" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i><span>Log-out</span>
          </button>
        </div>
      </aside>

      <div className="fin-main">
        <header className="fin-header">
          <div className="fin-greeting">
            <h2>Hi {user?.username}, <span className="welcome">track your daily spending</span></h2>
          </div>
          <div className="fin-header-tools">
            <div className="fin-date-pill"><i className="bi bi-calendar3"></i>{format(now, 'MMM dd, yyyy')}</div>
            <form className="fin-search" onSubmit={handleSearch}>
              <i className="bi bi-search"></i>
              <input type="text" placeholder="Type to search" value={search} onChange={e => setSearch(e.target.value)} />
            </form>
            <div className="position-relative">
              <button className="fin-icon-btn" onClick={() => setShowNotifs(!showNotifs)}>
                <i className="bi bi-bell"></i>
                {notifications.length > 0 && <span className="fin-badge">{notifications.length}</span>}
              </button>
              {showNotifs && (
                <div className="notif-dropdown">
                  {notifications.length === 0 ? <p className="text-center text-muted p-3 mb-0">No notifications</p>
                    : notifications.map(n => (
                      <div key={n.notificationId} className="notif-item">
                        <strong>{n.title}</strong><p className="mb-0 text-muted small">{n.message}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="fin-profile">
              <div className="fin-avatar">{initials}</div>
              <span>{user?.username}</span>
              <i className="bi bi-chevron-down small text-muted"></i>
            </div>
          </div>
        </header>
        <main className="fin-content"><Outlet /></main>
      </div>
    </div>
  );
}
