import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionApi, categoryApi, accountApi } from '../api/client';
import type { Transaction, Category, Account, PagedResult } from '../api/types';
import { useTheme, formatCurrency } from '../context/ThemeContext';
import { resolveCategoryId } from '../utils/categoryUtils';
import ComboboxInput from '../components/ComboboxInput';
import { format } from 'date-fns';

export default function Transactions() {
  const { currency } = useTheme();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<PagedResult<Transaction> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryFilter: '',
    page: 1,
    pageSize: 15,
  });
  const [form, setForm] = useState({
    categoryName: '',
    amount: 0,
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const load = () => {
    const params: Record<string, unknown> = { page: filters.page, pageSize: filters.pageSize, type: 'Expense' };
    if (filters.search) params.search = filters.search;
    if (filters.categoryFilter) {
      const cat = categories.find(c => c.name.toLowerCase() === filters.categoryFilter.toLowerCase());
      if (cat) params.categoryId = cat.categoryId;
    }
    transactionApi.getAll(params).then(r => setTransactions(r.data));
  };

  useEffect(() => {
    categoryApi.getAll('Expense').then(r => setCategories(r.data));
    accountApi.getAll().then(r => setAccounts(r.data));
  }, []);

  useEffect(() => { load(); }, [filters, categories]);

  const getWalletAccountId = async (): Promise<number> => {
    let wallet = accounts.find(a => a.name.toLowerCase() === 'wallet' || a.type === 'Cash') || accounts[0];
    if (!wallet) {
      const { data } = await accountApi.create({ name: 'Wallet', type: 'Cash', balance: 0 });
      setAccounts([data]);
      return data.accountId;
    }
    return wallet.accountId;
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      categoryName: categories[0]?.name || '',
      amount: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({
      categoryName: t.categoryName || '',
      amount: t.amount,
      description: t.description || '',
      transactionDate: t.transactionDate.split('T')[0],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id: categoryId, categories: updatedCats } = await resolveCategoryId(form.categoryName, categories, 'Expense');
      setCategories(updatedCats);
      const accountId = editing ? editing.accountId : await getWalletAccountId();
      const payload = {
        accountId,
        categoryId,
        type: 'Expense',
        amount: Number(form.amount),
        description: form.description,
        transactionDate: form.transactionDate,
      };
      if (editing) await transactionApi.update(editing.transactionId, payload);
      else await transactionApi.create(payload);
      closeForm();
      load();
      accountApi.getAll().then(r => setAccounts(r.data));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    await transactionApi.delete(id);
    load();
    accountApi.getAll().then(r => setAccounts(r.data));
  };

  const fmt = (n: number) => formatCurrency(n, currency);
  const catOptions = categories.map(c => c.name);

  return (
    <div className="animate-fade-up">
      <div className="card border-0 shadow-sm rounded-4 section-card mb-4">
        <div className="card-header py-3 px-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <h4 className="fw-bold mb-0">Daily Expenses</h4>
            <button className="btn btn-fin-primary btn-fin-sm" onClick={() => showForm ? closeForm() : openCreate()}>
              <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'} me-1`}></i>
              {showForm ? 'Close' : 'Add Expense'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card-body p-4 border-bottom animate-fade-up">
            <h5 className="fw-semibold mb-3">{editing ? 'Edit Expense' : 'Add Expense'}</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Expense Name</label>
                <input className="form-control combobox-input" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required placeholder="e.g. Lunch, Bus fare, Groceries" />
              </div>
              <ComboboxInput
                label="Category"
                value={form.categoryName}
                onChange={v => setForm(f => ({ ...f, categoryName: v }))}
                options={catOptions}
                placeholder="Type or select category..."
                required
                hint="Type a new category or pick from list"
              />
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label fw-semibold">Amount</label>
                  <input type="number" step="0.01" min="0.01" className="form-control combobox-input" value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-semibold">Date</label>
                  <input type="date" className="form-control combobox-input" value={form.transactionDate}
                    onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))} />
                </div>
              </div>
              <p className="text-muted small mb-3">Amount will be deducted from your total balance automatically.</p>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-fin-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Expense' : 'Save Expense'}
                </button>
                <button type="button" className="btn btn-fin-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card-body p-4">
          <div className="row g-2 mb-3">
            <div className="col-sm-6 col-lg-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input className="form-control" placeholder="Search by name..." value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
              </div>
            </div>
            <div className="col-sm-6 col-lg-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white"><i className="bi bi-funnel text-muted"></i></span>
                <input className="form-control" list="filter-cats" placeholder="Filter category..."
                  value={filters.categoryFilter} onChange={e => setFilters(f => ({ ...f, categoryFilter: e.target.value, page: 1 }))} />
                <datalist id="filter-cats">{categories.map(c => <option key={c.categoryId} value={c.name} />)}</datalist>
              </div>
            </div>
          </div>

          <div className="table-responsive rounded-3 border">
            <table className="table table-hover align-middle fin-table expense-table mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="expense-col-date">Date</th>
                  <th scope="col">Name</th>
                  <th scope="col" className="expense-col-category">Category</th>
                  <th scope="col" className="text-end expense-col-amount">Amount</th>
                  <th scope="col" className="text-end expense-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.items.map(t => (
                  <tr key={t.transactionId}>
                    <td className="text-nowrap text-muted small">{format(new Date(t.transactionDate), 'MMM dd, yyyy')}</td>
                    <td className="fw-semibold text-truncate" style={{ maxWidth: 0 }}>{t.description || '-'}</td>
                    <td><span className="badge rounded-pill text-bg-light border cat-pill">{t.categoryName}</span></td>
                    <td className="text-end fw-bold text-nowrap">-{fmt(t.amount)}</td>
                    <td className="text-end text-nowrap">
                      <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => openEdit(t)} title="Edit">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => handleDelete(t.transactionId)} title="Delete">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions?.items.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-5">No expenses recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {transactions && transactions.totalPages > 1 && (
            <div className="d-flex justify-content-center gap-3 pt-3">
              <button className="btn btn-fin-outline btn-fin-sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Prev</button>
              <span className="small text-muted">Page {filters.page} of {transactions.totalPages}</span>
              <button className="btn btn-fin-outline btn-fin-sm" disabled={filters.page >= transactions.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
