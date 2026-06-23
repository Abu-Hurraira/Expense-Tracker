import { useEffect, useState } from 'react';
import { goalApi } from '../api/client';
import type { Goal } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';
import { grayForIndex } from '../utils/colors';

const GOAL_ICONS = ['✈️', '🚗', '🏠', '💻', '🎓', '💍'];

export default function Goals() {
  const { currency } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  const [contribAmount, setContribAmount] = useState(0);
  const [form, setForm] = useState({ name: '', targetAmount: 0, targetDate: '' });

  const load = () => goalApi.getAll().then(r => setGoals(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await goalApi.create({ name: form.name, targetAmount: Number(form.targetAmount), targetDate: form.targetDate || null });
    setShowForm(false);
    setForm({ name: '', targetAmount: 0, targetDate: '' });
    load();
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribGoal) return;
    await goalApi.contribute(contribGoal.goalId, Number(contribAmount));
    setContribGoal(null);
    setContribAmount(0);
    load();
  };

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="animate-fade-up">
      <div className="card border-0 shadow-sm rounded-4 section-card mb-4">
        <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">My Goals</h4>
          <button className="btn btn-fin-primary btn-fin-sm" onClick={() => setShowForm(!showForm)}>
            <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'} me-1`}></i>
            {showForm ? 'Close' : 'Add Goal'}
          </button>
        </div>

        {showForm && (
          <div className="card-body p-4 border-bottom animate-fade-up">
            <h5 className="fw-semibold mb-3">New Savings Goal</h5>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Goal Name</label>
                <input className="form-control combobox-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Travel, Car" />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label fw-semibold">Target Amount</label>
                  <input type="number" step="0.01" min="0.01" className="form-control combobox-input" value={form.targetAmount || ''} onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} required />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-semibold">Target Date (optional)</label>
                  <input type="date" className="form-control combobox-input" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-fin-primary">Create Goal</button>
                <button type="button" className="btn btn-fin-outline" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {contribGoal && (
          <div className="card-body p-4 border-bottom bg-light animate-fade-up">
            <h5 className="fw-semibold mb-3">Contribute to {contribGoal.name}</h5>
            <form onSubmit={handleContribute} className="d-flex flex-wrap gap-2 align-items-end">
              <div style={{ minWidth: 200 }}>
                <label className="form-label fw-semibold">Amount</label>
                <input type="number" step="0.01" min="0.01" className="form-control combobox-input" value={contribAmount || ''} onChange={e => setContribAmount(Number(e.target.value))} required />
              </div>
              <button type="submit" className="btn btn-fin-primary">Contribute</button>
              <button type="button" className="btn btn-fin-outline" onClick={() => setContribGoal(null)}>Cancel</button>
            </form>
          </div>
        )}
      </div>

      <div className="row g-3">
        {goals.map((g, i) => {
          const pct = Math.min(g.percentComplete, 100);
          const color = grayForIndex(i);
          return (
            <div key={g.goalId} className={`col-md-6 animate-fade-up delay-${Math.min(i + 1, 4)}`}>
              <div className="list-card h-100">
                <div className="list-card-body flex-column align-items-stretch">
                  <div className="fin-goal-header">
                    <div className="d-flex align-items-center gap-2">
                      <div className="fin-goal-icon">{GOAL_ICONS[i % GOAL_ICONS.length]}</div>
                      <div>
                        <h6 className="fw-bold mb-0">{g.name}</h6>
                        {g.targetDate && <span className="text-muted small">Target: {new Date(g.targetDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <span className="fw-semibold small">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mb-2">
                    <span>{fmt(g.currentAmount)}</span>
                    <span>{fmt(g.targetAmount)}</span>
                  </div>
                  <div className="fin-goal-progress">
                    <div className="fin-goal-segment" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <button className="btn btn-fin-outline btn-fin-sm mt-3 align-self-start" onClick={() => { setContribGoal(g); setContribAmount(0); setShowForm(false); }}>
                    <i className="bi bi-plus-lg me-1"></i> Contribute
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-12">
            <div className="empty-state">
              <div className="empty-state-icon"><i className="bi bi-bullseye"></i></div>
              <p>No savings goals yet</p>
              <span className="empty-hint">Click Add Goal above to create one.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
