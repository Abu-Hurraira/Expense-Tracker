import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
};

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const transactionApi = {
  getAll: (filter: Record<string, unknown>) => api.get('/transactions', { params: filter }),
  getById: (id: number) => api.get(`/transactions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/transactions', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
};

export const categoryApi = {
  getAll: (type?: string) => api.get('/categories', { params: { type } }),
  create: (data: Record<string, unknown>) => api.post('/categories', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const accountApi = {
  getAll: () => api.get('/accounts'),
  create: (data: Record<string, unknown>) => api.post('/accounts', data),
  setBalance: (id: number, amount: number) => api.put(`/accounts/${id}/balance`, { amount }),
  transfer: (data: Record<string, unknown>) => api.post('/accounts/transfer', data),
};

export interface CreateBudgetPayload {
  categoryId: number | null;
  month: number;
  year: number;
  amount: number;
}

export const budgetApi = {
  getByMonth: (month: number, year: number) => api.get('/budgets', { params: { month, year } }),
  create: (data: CreateBudgetPayload) => api.post('/budgets', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/budgets/${id}`, data),
  delete: (id: number) => api.delete(`/budgets/${id}`),
};

export const reportApi = {
  getMonthly: (month: number, year: number) => api.get('/reports/monthly', { params: { month, year } }),
};

export const calendarApi = {
  getData: (month: number, year: number) => api.get('/calendar', { params: { month, year } }),
};

export const notificationApi = {
  getAll: (unreadOnly?: boolean) => api.get('/notifications', { params: { unreadOnly } }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const goalApi = {
  getAll: () => api.get('/goals'),
  create: (data: Record<string, unknown>) => api.post('/goals', data),
  contribute: (id: number, amount: number) => api.post(`/goals/${id}/contribute`, { amount }),
};

export const tagApi = {
  getAll: () => api.get('/tags'),
  create: (name: string) => api.post('/tags', JSON.stringify(name), { headers: { 'Content-Type': 'application/json' } }),
};

export const exportApi = {
  csv: (filter: Record<string, unknown>) => api.get('/export/transactions/csv', { params: filter, responseType: 'blob' }),
  excel: (filter: Record<string, unknown>) => api.get('/export/transactions/excel', { params: filter, responseType: 'blob' }),
  reportExcel: (month: number, year: number) => api.get('/export/report/excel', { params: { month, year }, responseType: 'blob' }),
};

export const settingsApi = {
  update: (currency: string, theme: string) => api.put('/settings', { currency, theme }),
  reset: () => api.delete('/settings/reset'),
};
