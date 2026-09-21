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
      <div className="auth-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-blob auth-blob-2" aria-hidden="true" />
      <div className="auth-blob auth-blob-3" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-card-glow" aria-hidden="true" />

        <div className="auth-logo" style={{ '--i': 0 }}>
          <Link to="/">🛍 ShopQA</Link>
        </div>

        <h1 className="auth-title" style={{ '--i': 1 }}>Sign In</h1>
        <p className="auth-subtitle" style={{ '--i': 2 }}>New here? <Link to="/register" className="auth-link" data-testid="link-register">Create an account</Link></p>

        {expired && (
          <div className="alert alert-warning" data-testid="session-expired-msg" style={{ marginBottom: 16 }}>
            ⚠️ Your session expired. Please log in again.
          </div>
        )}

        {errors.form && (
          <div className="alert alert-error auth-shake" data-testid="login-error" role="alert">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate data-testid="login-form">
          <div className="form-group auth-reveal" style={{ marginBottom: 16, '--i': 3 }}>
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

          <div className="form-group auth-reveal" style={{ marginBottom: 16, '--i': 4 }}>
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

          <div className="auth-row auth-reveal" style={{ '--i': 5 }}>
            <label className="checkbox-label" data-testid="remember-me">
              <input type="checkbox" checked={form.rememberMe} onChange={e => setForm(p => ({ ...p, rememberMe: e.target.checked }))} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="auth-link text-sm" data-testid="link-forgot">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-full btn-lg auth-submit auth-reveal"
            disabled={loading}
            data-testid="btn-login"
            style={{ marginTop: 24, '--i': 6 }}
          >
            {loading ? <><span className="spinner spinner-sm" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        {/* Test Credentials */}
        <details className="test-creds auth-reveal" style={{ '--i': 7 }} data-testid="test-credentials">
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
        .auth-page { position: relative; overflow: hidden; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; background: var(--bg); }
        .auth-page::before { content: ""; position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(color-mix(in srgb, var(--text-primary) 9%, transparent) 1px, transparent 1px); background-size: 26px 26px;
          -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%); mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%); }
        .auth-blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .5; pointer-events: none; will-change: transform; }
        .auth-blob-1 { width: 420px; height: 420px; background: #f97316; top: -120px; left: -100px; animation: authFloat1 16s ease-in-out infinite; }
        .auth-blob-2 { width: 380px; height: 380px; background: #38bdf8; bottom: -140px; right: -80px; animation: authFloat2 19s ease-in-out infinite; }
        .auth-blob-3 { width: 260px; height: 260px; background: #a78bfa; top: 40%; left: 62%; opacity: .32; animation: authFloat3 22s ease-in-out infinite; }

        .auth-card { position: relative; z-index: 1; width: 100%; max-width: 440px; padding: 44px 40px;
          background: color-mix(in srgb, var(--bg-card) 84%, transparent); backdrop-filter: blur(22px) saturate(140%); -webkit-backdrop-filter: blur(22px) saturate(140%);
          border: 1px solid color-mix(in srgb, var(--text-primary) 14%, transparent); border-radius: var(--radius-xl);
          box-shadow: 0 30px 80px -20px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08);
          animation: authCardIn .8s cubic-bezier(.2,.8,.2,1) both; }
        .auth-card-glow { position: absolute; inset: -1px; border-radius: inherit; padding: 1px; pointer-events: none;
          background: conic-gradient(from var(--auth-angle, 0deg), transparent 0 60%, #f97316 78%, #38bdf8 90%, transparent 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: .85; animation: authSpin 6s linear infinite; }
        @property --auth-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }

        .auth-reveal, .auth-logo, .auth-title, .auth-subtitle { animation: authUp .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 70ms + 200ms); }
        .auth-logo { text-align: center; margin-bottom: 22px; font-family: var(--font-display); font-size: 1.8rem; }
        .auth-logo a { display: inline-block; background: linear-gradient(90deg, var(--text-primary), var(--accent), var(--text-primary)); background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent; animation: authShine 5s linear infinite; }
        .auth-title { font-size: 1.9rem; text-align: center; margin-bottom: 4px; }
        .auth-subtitle { text-align: center; color: var(--text-muted); font-size: .92rem; margin-bottom: 26px; }
        .auth-link { color: var(--accent); font-weight: 600; position: relative; }
        .auth-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 1.5px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform .3s ease; }
        .auth-link:hover::after { transform: scaleX(1); }

        .auth-card .form-label { font-size: .8rem; font-weight: 600; letter-spacing: .02em; color: var(--text-muted); transition: color .2s; }
        .auth-card .form-group:focus-within .form-label { color: var(--accent); }
        .auth-card .form-input { height: 48px; padding: 0 14px; background: color-mix(in srgb, var(--bg-muted) 70%, transparent); border: 1px solid var(--border); border-radius: 12px; color: var(--text-primary);
          transition: border-color .2s, box-shadow .2s, background .2s, transform .2s; }
        .auth-card .form-input:hover { border-color: var(--border-dark); }
        .auth-card .form-input:focus { outline: none; border-color: var(--accent); background: var(--bg-card); transform: translateY(-1px);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent), 0 8px 20px -8px color-mix(in srgb, var(--accent) 60%, transparent); }
        .auth-card .form-input.error { border-color: var(--danger); }
        .auth-card .form-error { animation: authUp .25s ease both; }

        .auth-row { display: flex; align-items: center; justify-content: space-between; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: .875rem; cursor: pointer; color: var(--text-muted); }
        .checkbox-label input { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
        .password-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 10px; background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--text-muted); transition: background .2s, transform .2s; }
        .password-toggle:hover { background: var(--bg-muted); transform: translateY(-50%) scale(1.1); }

        .auth-submit { position: relative; overflow: hidden; border: 0; color: #fff; font-weight: 700; letter-spacing: .02em; border-radius: 12px;
          background: linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 100%); background-size: 160% 160%;
          box-shadow: 0 12px 28px -10px rgba(249,115,22,.7); transition: transform .2s, box-shadow .2s, background-position .5s; }
        .auth-submit::after { content: ""; position: absolute; top: 0; left: -75%; width: 50%; height: 100%; transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent); animation: authSheen 3.5s ease-in-out infinite; }
        .auth-submit:hover:not(:disabled) { transform: translateY(-2px); background-position: 100% 100%; box-shadow: 0 18px 34px -10px rgba(249,115,22,.85); }
        .auth-submit:active:not(:disabled) { transform: translateY(0) scale(.985); }
        .auth-submit:disabled { opacity: .75; }
        .auth-submit:disabled::after { display: none; }

        .auth-shake { animation: authShake .45s cubic-bezier(.36,.07,.19,.97) both; }

        .test-creds { margin-top: 24px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: color-mix(in srgb, var(--bg-muted) 45%, transparent); }
        .test-creds summary { padding: 12px 14px; cursor: pointer; font-size: .875rem; font-weight: 600; transition: background .2s; }
        .test-creds summary:hover { background: var(--bg-muted); }
        .test-creds[open] .creds-list { animation: authUp .3s ease both; }
        .creds-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
        .cred-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; text-align: left; transition: transform .2s, border-color .2s, box-shadow .2s; }
        .cred-item:hover { transform: translateX(4px); border-color: var(--accent); box-shadow: var(--shadow-sm); }
        .cred-role { font-size: .7rem; font-weight: 700; padding: 2px 9px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); border-radius: 100px; white-space: nowrap; }
        .cred-email { font-size: .8rem; color: var(--text-muted); }

        @keyframes authCardIn { from { opacity: 0; transform: translateY(28px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes authUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes authSpin { to { --auth-angle: 360deg; } }
        @keyframes authShine { to { background-position: -200% 0; } }
        @keyframes authSheen { 0%, 55% { left: -75%; } 100% { left: 130%; } }
        @keyframes authShake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-6px); } 40%, 60% { transform: translateX(6px); } }
        @keyframes authFloat1 { 50% { transform: translate(90px, 70px) scale(1.15); } }
        @keyframes authFloat2 { 50% { transform: translate(-100px, -60px) scale(1.1); } }
        @keyframes authFloat3 { 50% { transform: translate(-70px, 50px) scale(.9); } }

        @media (max-width: 480px) { .auth-card { padding: 32px 22px; } }
        @media (prefers-reduced-motion: reduce) { .auth-page *, .auth-blob { animation: none !important; } }
      `}</style>
    </div>
  );
}
