import { useEffect, useState } from 'react';
import { accountApi } from '../api/client';
import type { Account } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';

export default function Accounts() {
  const { currency } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balance, setBalance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [balancePulse, setBalancePulse] = useState(false);

  const load = () => accountApi.getAll().then(r => {
    setAccounts(r.data);
    const wallet = r.data.find((a: Account) => a.name.toLowerCase() === 'wallet')
      || r.data.find((a: Account) => a.type === 'Cash')
      || r.data[0];
    if (wallet) setBalance(wallet.balance);
  }).catch(() => {
    setMessage('Could not load accounts. Is the API running?');
    setIsError(true);
  });

  useEffect(() => { load(); }, []);

  const wallet = accounts.find(a => a.name.toLowerCase() === 'wallet')
    || accounts.find(a => a.type === 'Cash')
    || accounts[0];

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setIsError(false);
    try {
      if (wallet) {
        await accountApi.setBalance(wallet.accountId, Number(balance));
        setMessage('Balance saved successfully!');
        setBalancePulse(true);
        setTimeout(() => setBalancePulse(false), 700);
      } else {
        await accountApi.create({ name: 'Wallet', type: 'Cash', balance: Number(balance) });
        setMessage('Wallet created with your balance!');
        setBalancePulse(true);
        setTimeout(() => setBalancePulse(false), 700);
      }
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(msg || 'Failed to save balance. Please try again.');
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="animate-fade-up" style={{ maxWidth: 540 }}>
      <div className="page-title-bar">
        <h4>My Balance</h4>
      </div>
      <p className="text-muted mb-4">Set how much money you have. Daily expenses will be deducted from this amount.</p>

      {message && (
        <div className={`alert ${isError ? 'alert-secondary animate-shake' : 'alert-success animate-slide-down'} py-2 mb-3`} role="alert">
          {message}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4 animate-fade-up delay-1">
        <div className="card-body p-4">
          <div className={`fin-stat-bw dark mb-4 ${balancePulse ? 'animate-pulse-soft' : ''}`} style={{ minHeight: 100 }}>
            <div className="fin-stat-icon"><i className="bi bi-wallet2"></i></div>
            <div className="fin-stat-label">Current Balance</div>
            <div className="fin-stat-value">{fmt(wallet?.balance ?? 0)}</div>
          </div>

          <form onSubmit={handleSaveBalance}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary">Set Total Balance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-lg combobox-input"
                value={balance || ''}
                onChange={e => setBalance(Number(e.target.value))}
                required
                placeholder="Enter your total money"
              />
              <div className="form-text">This is your starting amount for tracking daily expenses.</div>
            </div>
            <button type="submit" className="btn btn-fin-primary w-100 py-2" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : 'Save Balance'}
            </button>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 animate-fade-up delay-2">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">How it works</h6>
          <ol className="text-muted small mb-0 ps-3">
            <li className="mb-2">Set your total balance above</li>
            <li className="mb-2">Add daily expenses with a name and category</li>
            <li className="mb-2">Each expense is automatically deducted</li>
            <li>View remaining balance and spending graphs on Dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
