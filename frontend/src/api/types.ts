export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  role: string;
  currency: string;
  theme: string;
  expiresAt: string;
}

export interface Transaction {
  transactionId: number;
  accountId: number;
  categoryId: number;
  type: string;
  amount: number;
  description?: string;
  notes?: string;
  transactionDate: string;
  accountName?: string;
  categoryName?: string;
  categoryColor?: string;
  transferToAccountId?: number;
  tags: string[];
  attachments: { attachmentId: number; filePath: string; fileName: string }[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Category {
  categoryId: number;
  name: string;
  type: string;
  color: string;
  icon: string;
}

export interface Account {
  accountId: number;
  name: string;
  type: string;
  balance: number;
}

export interface Budget {
  budgetId: number;
  categoryId?: number;
  categoryName?: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  remainingBudget: number;
  recentTransactions: Transaction[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
  categorySpending: { categoryName: string; color: string; amount: number; percentage: number }[];
}

export interface Report {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categoryBreakdown: { categoryName: string; color: string; amount: number; percentage: number }[];
  dailySpending: { date: string; amount: number }[];
}

export interface CalendarDay {
  date: string;
  totalSpending: number;
  transactionCount: number;
  intensity: string;
}

export interface Notification {
  notificationId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Goal {
  goalId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  percentComplete: number;
}

export interface Tag {
  tagId: number;
  name: string;
}

export interface TransactionFilter {
  search?: string;
  categoryId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}
