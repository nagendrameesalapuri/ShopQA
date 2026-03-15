import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const expired = searchParams.get('expired') === 'true';

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.firstName}! 👋`);
      const redirect = searchParams.get('redirect') || (data.user.role === 'admin' ? '/admin' : '/');
      navigate(redirect, { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      const msg  = err.response?.data?.error;
      const remaining = err.response?.data?.attemptsRemaining;

      if (code === 'ACCOUNT_LOCKED') {
        toast.error(msg, { autoClose: 8000 });
        setErrors({ form: msg });
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        toast.warning(msg);
        setErrors({ form: msg });
      } else {
        const errorMsg = remaining ? `${msg} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)` : (msg || 'Login failed');
        setErrors({ form: errorMsg });
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setForm(p => ({ ...p, email, password }));
  };

  return (
    <div className="auth-page" data-testid="login-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link to="/">🛍 ShopQA</Link>
        </div>

        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">New here? <Link to="/register" className="auth-link" data-testid="link-register">Create an account</Link></p>

        {expired && (
          <div className="alert alert-warning" data-testid="session-expired-msg" style={{ marginBottom: 16 }}>
            ⚠️ Your session expired. Please log in again.
          </div>
        )}

        {errors.form && (
          <div className="alert alert-error" data-testid="login-error" role="alert">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate data-testid="login-form">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
              placeholder="you@example.com"
              autoComplete="email"
              data-testid="input-email"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <p className="form-error" id="email-error" data-testid="email-error">{errors.email}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                placeholder="••••••••"
                autoComplete="current-password"
                data-testid="input-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-testid="toggle-password"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <p className="form-error" data-testid="password-error">{errors.password}</p>}
          </div>

          <div className="auth-row">
            <label className="checkbox-label" data-testid="remember-me">
              <input type="checkbox" checked={form.rememberMe} onChange={e => setForm(p => ({ ...p, rememberMe: e.target.checked }))} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="auth-link text-sm" data-testid="link-forgot">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            data-testid="btn-login"
            style={{ marginTop: 24 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        {/* Social Login */}
        <div className="social-divider"><span>or continue with</span></div>
        <div className="social-buttons">
          <button className="btn btn-outline social-btn" data-testid="btn-google-login" onClick={() => toast.info('Google OAuth simulation')}>
            <span>G</span> Google
          </button>
          <button className="btn btn-outline social-btn" data-testid="btn-github-login" onClick={() => toast.info('GitHub OAuth simulation')}>
            <span>⌘</span> GitHub
          </button>
        </div>

        {/* Test Credentials */}
        <details className="test-creds" data-testid="test-credentials">
          <summary>🧪 Test Credentials</summary>
          <div className="creds-list">
            {[
              { email: 'admin@shopqa.com', password: 'Password123!', role: 'Admin' },
              { email: 'john@test.com', password: 'Password123!', role: 'Customer' },
              { email: 'jane@test.com', password: 'Password123!', role: 'Customer' },
            ].map(c => (
              <button key={c.email} className="cred-item" onClick={() => quickLogin(c.email, c.password)} data-testid={`quick-login-${c.role.toLowerCase()}`}>
                <span className="cred-role">{c.role}</span>
                <span className="cred-email">{c.email}</span>
              </button>
            ))}
          </div>
        </details>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; background: linear-gradient(135deg, #f0f9ff 0%, #fff7ed 100%); }
        .auth-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); }
        .auth-logo { text-align: center; margin-bottom: 24px; font-family: var(--font-display); font-size: 1.6rem; }
        .auth-title { font-size: 1.75rem; text-align: center; margin-bottom: 4px; }
        .auth-subtitle { text-align: center; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
        .auth-link { color: var(--accent); font-weight: 600; }
        .auth-row { display: flex; align-items: center; justify-content: space-between; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; cursor: pointer; }
        .password-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--text-muted); }
        .social-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; color: var(--text-muted); font-size: 0.85rem; }
        .social-divider::before, .social-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .social-buttons { display: flex; gap: 12px; }
        .social-btn { flex: 1; gap: 8px; }
        .test-creds { margin-top: 24px; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .test-creds summary { padding: 10px 14px; cursor: pointer; font-size: 0.875rem; font-weight: 600; background: var(--bg-muted); }
        .creds-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
        .cred-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; text-align: left; transition: background var(--transition); }
        .cred-item:hover { background: var(--bg-muted); }
        .cred-role { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; background: var(--accent-light); color: var(--accent-dark); border-radius: 100px; white-space: nowrap; }
        .cred-email { font-size: 0.8rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
