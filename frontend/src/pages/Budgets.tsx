import { useEffect, useState } from 'react';
import { budgetApi, categoryApi } from '../api/client';
import type { Budget, Category } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';
import { resolveCategoryIdOptional } from '../utils/categoryUtils';
import ComboboxInput from '../components/ComboboxInput';

export default function Budgets() {
  const { currency } = useTheme();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ categoryName: '', amount: 0 });

  const load = () => {
    budgetApi.getByMonth(month, year)
      .then(r => setBudgets(r.data))
      .catch(() => setError('Could not load budgets. Is the API running?'));
  };

  useEffect(() => { categoryApi.getAll('Expense').then(r => setCategories(r.data)); }, []);
  useEffect(() => { load(); }, [month, year]);

  const closeForm = () => {
    setShowForm(false);
    setError('');
  };

  const openForm = () => {
    setError('');
    setForm({ categoryName: '', amount: 0 });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      setError('Please enter a budget amount greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { id: categoryId } = await resolveCategoryIdOptional(form.categoryName, categories);
      await budgetApi.create({
        categoryId: categoryId ?? null,
        month,
        year,
        amount: Number(form.amount),
      });
      closeForm();
      setForm({ categoryName: '', amount: 0 });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await budgetApi.delete(id);
      load();
    } catch {
      setError('Failed to delete budget.');
    }
  };

  const fmt = (n: number) => formatCurrency(n, currency);
  const overBudget = budgets.filter(b => b.percentUsed > 100);
  const catOptions = categories.map(c => c.name);

  return (
    <div className="animate-fade-up">
      {error && !showForm && (
        <div className="alert alert-secondary animate-slide-down mb-3" role="alert">{error}</div>
      )}

      {overBudget.length > 0 && (
        <div className="alert alert-secondary d-flex align-items-center gap-2 animate-slide-down mb-3">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {overBudget.length} budget(s) exceeded. Review your spending.
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 section-card">
        <div className="card-header py-3 px-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h4 className="fw-bold mb-1">Monthly Budget</h4>
              <p className="text-muted mb-0 small">Set spending limits for categories or track an overall monthly budget.</p>
            </div>
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <span className="fw-semibold text-secondary">
              <i className="bi bi-calendar3 me-2"></i>
              {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <select className="form-select form-select-sm combobox-input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select className="form-select form-select-sm combobox-input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
                {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn btn-fin-primary btn-fin-sm" onClick={() => showForm ? closeForm() : openForm()}>
                <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'} me-1`}></i>
                {showForm ? 'Close' : 'Add Budget'}
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="card-body p-4 border-bottom animate-fade-up">
            <h5 className="fw-semibold mb-3">Add Budget</h5>
            {error && <div className="alert alert-secondary py-2 mb-3 animate-shake">{error}</div>}
            <p className="text-muted small mb-3">Saving for <strong>{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</strong></p>
            <form onSubmit={handleSubmit}>
              <ComboboxInput
                label="Category"
                value={form.categoryName}
                onChange={v => setForm(f => ({ ...f, categoryName: v }))}
                options={catOptions}
                placeholder="Type category or leave empty for overall..."
                hint="Leave empty for overall budget, or type a new category name"
              />
              <div className="mb-3">
                <label className="form-label fw-semibold">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control combobox-input"
                  value={form.amount || ''}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  required
                  placeholder="Enter budget amount"
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-fin-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
                <button type="button" className="btn btn-fin-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card-body p-4">
          {budgets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-pie-chart"></i>
              </div>
              <p>No budgets for this month</p>
              <span className="empty-hint">Use the Add Budget button above to set a spending limit for this month.</span>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
              {budgets.map((b, i) => (
                <div key={b.budgetId} className="col">
                  <div className={`list-card h-100 budget-card animate-fade-up delay-${Math.min((i % 4) + 1, 4)} ${b.percentUsed > 100 ? 'over-budget' : ''}`}>
                    <div className="list-card-body flex-column align-items-stretch">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="fw-semibold mb-1">{b.categoryName || 'Overall Budget'}</h6>
                          <span className="text-muted small">{b.percentUsed.toFixed(0)}% used</span>
                        </div>
                        <button type="button" className="btn btn-sm btn-fin-outline" onClick={() => handleDelete(b.budgetId)} aria-label="Delete">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                      <div className="d-flex justify-content-between small mb-2">
                        <span className="text-muted">Spent</span>
                        <span className="fw-semibold">{fmt(b.spent)} / {fmt(b.amount)}</span>
                      </div>
                      <div className="fin-progress mb-2">
                        <div
                          className={`fin-progress-bar ${b.percentUsed > 100 ? 'over' : ''}`}
                          style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                        />
                      </div>
                      <div className="d-flex justify-content-between small">
                        <span className="text-muted">Remaining</span>
                        <span className={`fw-semibold ${b.remaining < 0 ? 'text-danger' : ''}`}>{fmt(b.remaining)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
