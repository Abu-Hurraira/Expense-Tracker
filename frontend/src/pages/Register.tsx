import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import { APP_NAME } from '../constants/brand';

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-glow auth-page-glow-1" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-2" aria-hidden="true" />

      <div className="card auth-card border-0 rounded-4 shadow-lg w-100 animate-fade-up">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4 mb-sm-5">
            <div className="auth-logo-ring mx-auto mb-3 animate-scale-in">
              <AppLogo size={44} />
            </div>
            <h1 className="auth-title fw-bold mb-2">{APP_NAME}</h1>
            <p className="auth-subtitle text-muted mb-0">Start tracking your daily expenses</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && (
              <div className="alert alert-danger border-0 rounded-3 py-2 px-3 mb-4 auth-error animate-scale-in" role="alert">
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </div>
            )}

            <div className="mb-3 auth-field animate-fade-up delay-1">
              <label htmlFor="reg-username" className="form-label auth-label">Username</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><i className="bi bi-person" aria-hidden="true"></i></span>
                <input
                  id="reg-username"
                  type="text"
                  className="form-control auth-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Choose a username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="mb-3 auth-field animate-fade-up delay-2">
              <label htmlFor="reg-email" className="form-label auth-label">Email</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><i className="bi bi-envelope" aria-hidden="true"></i></span>
                <input
                  id="reg-email"
                  type="email"
                  className="form-control auth-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="mb-4 auth-field animate-fade-up delay-3">
              <label htmlFor="reg-password" className="form-label auth-label">Password</label>
              <div className="input-group auth-input-group">
                <span className="input-group-text"><i className="bi bi-lock" aria-hidden="true"></i></span>
                <input
                  id="reg-password"
                  type="password"
                  className="form-control auth-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-fin-primary w-100 py-3 rounded-pill auth-submit animate-fade-up delay-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted mt-4 pt-4 mb-0 auth-footer border-top">
            Already have an account?{' '}
            <Link to="/login" className="auth-link fw-semibold">Sign In</Link>
          </p>
          <p className="text-center mt-3 mb-0">
            <Link to="/" className="auth-back-link small">
              <i className="bi bi-arrow-left me-1"></i>Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
