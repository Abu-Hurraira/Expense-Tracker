import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Landing from './pages/Landing';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" /> : <>{children}</>;
}

function LandingRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" replace /> : <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<LandingRoute />} />
            <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="categories" element={<Categories />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="goals" element={<Goals />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
