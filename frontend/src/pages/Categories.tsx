import { useEffect, useState } from 'react';
import { categoryApi } from '../api/client';
import type { Category } from '../api/types';
import { grayForIndex } from '../utils/colors';

const ICONS = ['fa-utensils', 'fa-car', 'fa-file-invoice', 'fa-film', 'fa-shopping-cart', 'fa-home', 'fa-heart', 'fa-graduation-cap', 'fa-tag'];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', type: 'Expense', color: '#333333', icon: 'fa-tag' });

  const load = () => categoryApi.getAll('Expense').then(r => setCategories(r.data));
  useEffect(() => { load(); }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'Expense', color: grayForIndex(categories.length), icon: 'fa-tag' });
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, color: c.color, icon: c.icon });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, type: 'Expense' };
    if (editing) await categoryApi.update(editing.categoryId, payload);
    else await categoryApi.create(payload);
    closeForm();
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await categoryApi.delete(id);
    load();
  };

  return (
    <div className="animate-fade-up">
      <div className="card border-0 shadow-sm rounded-4 section-card">
        <div className="card-header py-3 px-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h4 className="fw-bold mb-1">Expense Categories</h4>
              <p className="text-muted mb-0 small">Organize your daily expenses. You can also type new categories when adding an expense.</p>
            </div>
            <button className="btn btn-fin-primary btn-fin-sm" onClick={() => showForm ? closeForm() : openCreate()}>
              <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'} me-1`}></i>
              {showForm ? 'Close' : 'Add Category'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card-body p-4 border-bottom animate-fade-up">
            <h5 className="fw-semibold mb-3">{editing ? 'Edit Category' : 'Add Category'}</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Name</label>
                <input className="form-control combobox-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Food, Transport, Bills" />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Icon</label>
                <div className="icon-picker-grid">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      className={`icon-picker-btn ${form.icon === ic ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      aria-label={ic}
                    >
                      <i className={`fas ${ic}`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-fin-primary">{editing ? 'Update' : 'Save'}</button>
                <button type="button" className="btn btn-fin-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card-body p-4">
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-tags"></i>
              </div>
              <p>No categories yet</p>
              <span className="empty-hint">Add a category here, or type a new name when logging a daily expense.</span>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
              {categories.map((c, i) => (
                <div key={c.categoryId} className="col">
                  <div className={`list-card h-100 animate-fade-up delay-${Math.min((i % 4) + 1, 4)}`}>
                    <div className="list-card-accent" style={{ background: grayForIndex(i) }} />
                    <div className="list-card-body">
                      <div className="list-card-icon">
                        <i className={`fas ${c.icon}`}></i>
                      </div>
                      <div className="list-card-content">
                        <h6 className="fw-semibold mb-0 text-truncate">{c.name}</h6>
                      </div>
                      <div className="list-card-actions">
                        <button type="button" className="btn btn-sm btn-fin-outline" onClick={() => openEdit(c)} aria-label="Edit">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-fin-outline" onClick={() => handleDelete(c.categoryId)} aria-label="Delete">
                          <i className="bi bi-trash"></i>
                        </button>
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
