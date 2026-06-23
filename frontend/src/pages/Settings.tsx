import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { settingsApi, exportApi } from '../api/client';

const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED'];

export default function Settings() {
  const { theme, toggleTheme, currency, setCurrency } = useTheme();
  const { logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(currency, theme);
      setMessage('Settings saved successfully');
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const downloadBlob = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    const { data } = await exportApi.csv({});
    downloadBlob(data, 'transactions.csv');
  };

  const handleExportExcel = async () => {
    const { data } = await exportApi.excel({});
    downloadBlob(data, 'transactions.xlsx');
  };

  const handleExportReport = async () => {
    const now = new Date();
    const { data } = await exportApi.reportExcel(now.getMonth() + 1, now.getFullYear());
    downloadBlob(data, `report_${now.getFullYear()}_${now.getMonth() + 1}.xlsx`);
  };

  const handleReset = async () => {
    if (!confirm('This will delete ALL your data. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Proceed?')) return;
    await settingsApi.reset();
    logout();
  };

  return (
    <div className="animate-fade-up" style={{ maxWidth: 640 }}>
      <div className="page-title-bar"><h4>Settings</h4></div>
      {message && <div className="alert alert-success">{message}</div>}

      <div className="fin-card mb-3">
        <div className="fin-card-title"><span><i className="bi bi-palette me-2"></i>Appearance</span></div>
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted">Theme</span>
          <button className="btn btn-fin-outline btn-fin-sm" onClick={toggleTheme}>
            <i className={`bi bi-${theme === 'light' ? 'moon' : 'sun'} me-1`}></i>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>

      <div className="fin-card mb-3">
        <div className="fin-card-title"><span><i className="bi bi-currency-exchange me-2"></i>Currency</span></div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">Default Currency</span>
          <input className="form-control combobox-input w-auto" list="currencies" value={currency} onChange={e => setCurrency(e.target.value)} />
          <datalist id="currencies">{CURRENCIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <button className="btn btn-fin-primary btn-fin-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="fin-card mb-3">
        <div className="fin-card-title"><span><i className="bi bi-download me-2"></i>Export Data</span></div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-fin-outline btn-fin-sm" onClick={handleExportCsv}><i className="bi bi-filetype-csv me-1"></i> CSV</button>
          <button className="btn btn-fin-outline btn-fin-sm" onClick={handleExportExcel}><i className="bi bi-file-earmark-excel me-1"></i> Excel</button>
          <button className="btn btn-fin-outline btn-fin-sm" onClick={handleExportReport}><i className="bi bi-bar-chart me-1"></i> Report</button>
        </div>
      </div>

      <div className="fin-card border-danger">
        <div className="fin-card-title"><span className="text-danger"><i className="bi bi-exclamation-triangle me-2"></i>Danger Zone</span></div>
        <p className="text-muted small">Reset all your data including transactions, budgets, categories, and accounts.</p>
        <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset All Data</button>
      </div>
    </div>
  );
}
