import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

// ═══════════════════ REGISTER ════════════════════
export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const [showPass, setShowPass] = useState(false);

  const checkStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  };

  const getStrengthLabel = () => ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const getStrengthColor = () => ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][strength];

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim())  errs.lastName  = 'Required';
    if (!form.email) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) errs.password = 'Must contain uppercase, lowercase, and number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      toast.success('Registration successful! Please verify your email.');
      if (data.verificationUrl) {
        toast.info(`Dev mode: ${data.verificationUrl}`, { autoClose: 10000 });
      }
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      if (err.response?.data?.code === 'EMAIL_TAKEN') setErrors(p => ({ ...p, email: 'Email already registered' }));
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page" data-testid="register-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo"><Link to="/">🛍 ShopQA</Link></div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Already have an account? <Link to="/login" className="auth-link" data-testid="link-login">Sign in</Link></p>

        <form onSubmit={handleSubmit} noValidate data-testid="register-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className={`form-input ${errors.firstName ? 'error' : ''}`} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="John" data-testid="input-reg-first-name" />
              {errors.firstName && <p className="form-error">{errors.firstName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className={`form-input ${errors.lastName ? 'error' : ''}`} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" data-testid="input-reg-last-name" />
              {errors.lastName && <p className="form-error">{errors.lastName}</p>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Email Address *</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" data-testid="input-reg-email" />
            {errors.email && <p className="form-error" data-testid="reg-email-error">{errors.email}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: 6 }}>
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input className={`form-input ${errors.password ? 'error' : ''}`} type={showPass ? 'text' : 'password'} value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); checkStrength(e.target.value); }} placeholder="Min 8 characters" data-testid="input-reg-password" />
              <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowPass(s => !s)} data-testid="toggle-reg-password">{showPass ? '🙈' : '👁'}</button>
            </div>
            {errors.password && <p className="form-error" data-testid="reg-password-error">{errors.password}</p>}
          </div>

          {/* Password Strength */}
          {form.password && (
            <div style={{ marginBottom: 14 }} data-testid="password-strength">
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? getStrengthColor() : 'var(--border)', transition: 'background 0.3s' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: getStrengthColor(), fontWeight: 600 }}>{getStrengthLabel()}</p>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Confirm Password *</label>
            <input className={`form-input ${errors.confirmPassword ? 'error' : ''}`} type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat password" data-testid="input-reg-confirm-password" />
            {errors.confirmPassword && <p className="form-error" data-testid="confirm-password-error">{errors.confirmPassword}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" data-testid="input-reg-phone" />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} data-testid="btn-register">
            {loading ? <><span className="spinner spinner-sm" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 16 }}>
          By registering, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; background: linear-gradient(135deg, #f0f9ff 0%, #fff7ed 100%); }
        .auth-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 40px; width: 100%; box-shadow: var(--shadow-lg); }
        .auth-logo { text-align: center; margin-bottom: 24px; font-family: var(--font-display); font-size: 1.6rem; }
        .auth-title { font-size: 1.75rem; text-align: center; margin-bottom: 4px; }
        .auth-subtitle { text-align: center; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
        .auth-link { color: var(--accent); font-weight: 600; }
      `}</style>
    </div>
  );
}

// ═══════════════════ FORGOT PASSWORD ════════════════════
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="auth-page" data-testid="forgot-password-page">
      <div className="auth-card">
        <div className="auth-logo"><Link to="/">🛍 ShopQA</Link></div>
        {sent ? (
          <div style={{ textAlign: 'center' }} data-testid="reset-sent-message">
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
            <h2 style={{ marginBottom: 8 }}>Check Your Email</h2>
            <p className="text-muted" style={{ marginBottom: 16 }}>If <strong>{email}</strong> exists in our system, a reset link has been sent.</p>
            {resetUrl && (
              <div className="alert alert-info" style={{ textAlign: 'left', marginBottom: 16 }}>
                <p className="text-sm" style={{ marginBottom: 4 }}>🧪 Dev Mode — Reset Link:</p>
                <a href={resetUrl} className="text-sm" style={{ wordBreak: 'break-all', color: 'var(--info)' }} data-testid="reset-link">{resetUrl}</a>
              </div>
            )}
            <Link to="/login" className="btn btn-accent btn-full">Back to Login</Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle" style={{ marginBottom: 24 }}>Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit} data-testid="forgot-password-form">
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" data-testid="input-forgot-email" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !email} data-testid="btn-forgot-submit">
                {loading ? <><span className="spinner spinner-sm" /> Sending…</> : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
              Remembered? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </>
        )}
      </div>
      <style>{`.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; background: linear-gradient(135deg, #f0f9ff 0%, #fff7ed 100%); } .auth-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); } .auth-logo { text-align: center; margin-bottom: 24px; font-family: var(--font-display); font-size: 1.6rem; } .auth-title { font-size: 1.75rem; text-align: center; margin-bottom: 4px; } .auth-subtitle { text-align: center; color: var(--text-muted); font-size: 0.9rem; } .auth-link { color: var(--accent); font-weight: 600; }`}</style>
    </div>
  );
}

// ═══════════════════ RESET PASSWORD ════════════════════
export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setErrors({ confirm: 'Passwords do not match' }); return; }
    if (form.password.length < 8) { setErrors({ password: 'At least 8 characters required' }); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired reset token');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page" data-testid="reset-password-page">
      <div className="auth-card">
        <div className="auth-logo"><Link to="/">🛍 ShopQA</Link></div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>
        <form onSubmit={handleSubmit} data-testid="reset-password-form" style={{ marginTop: 24 }}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">New Password *</label>
            <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" data-testid="input-new-password" />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Confirm Password *</label>
            <input className={`form-input ${errors.confirm ? 'error' : ''}`} type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" data-testid="input-confirm-new-password" />
            {errors.confirm && <p className="form-error">{errors.confirm}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} data-testid="btn-reset-submit">
            {loading ? <><span className="spinner spinner-sm" /> Resetting…</> : 'Reset Password'}
          </button>
        </form>
      </div>
      <style>{`.auth-page { min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;background:linear-gradient(135deg,#f0f9ff,#fff7ed); } .auth-card { background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-xl);padding:40px;width:100%;max-width:420px;box-shadow:var(--shadow-lg); } .auth-logo { text-align:center;margin-bottom:24px;font-family:var(--font-display);font-size:1.6rem; } .auth-title { font-size:1.75rem;text-align:center;margin-bottom:4px; } .auth-subtitle { text-align:center;color:var(--text-muted);font-size:0.9rem;margin-bottom:0; }`}</style>
    </div>
  );
}

// ═══════════════════ VERIFY EMAIL ════════════════════
export function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div style={{ textAlign: 'center', padding: '100px 24px' }} data-testid="verify-email-page">
      {status === 'loading' && <><span className="spinner spinner-lg" /><p style={{ marginTop: 16 }}>Verifying your email…</p></>}
      {status === 'success' && (
        <div data-testid="verify-success">
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h2>Email Verified!</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>Your email has been verified. You can now log in.</p>
          <Link to="/login" className="btn btn-accent btn-lg">Sign In</Link>
        </div>
      )}
      {status === 'error' && (
        <div data-testid="verify-error">
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
          <h2>Verification Failed</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>The verification link is invalid or has expired.</p>
          <Link to="/register" className="btn btn-outline">Register Again</Link>
        </div>
      )}
    </div>
  );
}

export default Register;
