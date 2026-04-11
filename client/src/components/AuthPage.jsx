import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ── SVG Icons ─────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

// ── Email Verify Screen ───────────────────────────────────────────────────
function VerifyScreen({ email, onResend, onCancel }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await onResend(email);
      setResent(true);
      setCountdown(60);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card verify-card">
        <div className="auth-logo">note<span>■</span>mark</div>

        <div className="verify-icon-wrap" aria-hidden="true">
          <div className="verify-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="10" width="40" height="28" rx="4"
                stroke="var(--accent)" strokeWidth="2" fill="none"/>
              <path d="M4 14l20 13 20-13"
                stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
              <circle className="verify-dot" cx="38" cy="12" r="5" fill="var(--green)"/>
              <path d="M35.5 12l2 2 3-3"
                stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="verify-rings" aria-hidden="true">
            <span/><span/><span/>
          </div>
        </div>

        <h2 className="verify-title">Check your email!</h2>
        <p className="verify-sub">We sent a verification link to:</p>
        <div className="verify-email-badge">{email}</div>
        <p className="verify-hint">
          Click <strong>"Confirm your email"</strong> in the email —
          the app will open and sign you in automatically. 🎉
        </p>

        <div className="verify-spam-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Can't find it? Check your <strong>Spam / Junk</strong> folder.
        </div>

        {error  && <div className="auth-error"  role="alert">{error}</div>}
        {resent && <div className="verify-success" role="status">✅ Email resent successfully!</div>}

        <button
          className="auth-btn verify-resend-btn"
          onClick={handleResend}
          disabled={resending || countdown > 0}
        >
          {resending ? 'Sending…' : countdown > 0 ? `Resend email (${countdown}s)` : '📨 Resend verification email'}
        </button>

        <div className="auth-switch verify-back">
          Wrong email?{' '}
          <button type="button" onClick={onCancel}>Go back</button>
        </div>
      </div>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="auth-divider" aria-hidden="true">
      <span/>
      <span className="auth-divider-text">or</span>
      <span/>
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────
export default function AuthPage() {
  const {
    login, register,
    signInWithGoogle, signInWithGitHub,
    oauthLoading,
    pendingVerification, resendVerification, cancelVerification,
  } = useAuth();

  const [mode, setMode]         = useState('login');
  const [form, setForm]         = useState({ username: '', email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const anyLoading = loading || !!oauthLoading;

  if (pendingVerification) {
    return (
      <VerifyScreen
        email={pendingVerification.email}
        onResend={resendVerification}
        onCancel={cancelVerification}
      />
    );
  }

  // ── OAuth handlers ──────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError('');
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); }
  };

  const handleGitHub = async () => {
    setError('');
    try { await signInWithGitHub(); }
    catch (err) { setError(err.message); }
  };

  // ── Email form submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!form.username.trim() || form.username.trim().length < 3)
        return setError('Username must be at least 3 characters.');
      if (form.username.trim().length > 30)
        return setError('Username cannot exceed 30 characters.');
    }
    if (!form.email || !form.password)
      return setError('All fields are required.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else                  await register(form.username.trim(), form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
    setForm({ username: '', email: '', password: '' });
    setShowPass(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">note<span>■</span>mark</div>
        <h2>{mode === 'login' ? 'Sign in to your notes' : 'Create an account'}</h2>

        {error && <div className="auth-error" role="alert">{error}</div>}

        {/* ── OAuth buttons ────────────────────────────────────────── */}
        <div className="oauth-btns">
          <button
            className="oauth-btn oauth-google"
            type="button"
            onClick={handleGoogle}
            disabled={anyLoading}
            aria-busy={oauthLoading === 'google'}
          >
            {oauthLoading === 'google'
              ? <span className="oauth-spinner" aria-hidden="true"/>
              : <GoogleIcon />}
            <span>Continue with Google</span>
          </button>

          <button
            className="oauth-btn oauth-github"
            type="button"
            onClick={handleGitHub}
            disabled={anyLoading}
            aria-busy={oauthLoading === 'github'}
          >
            {oauthLoading === 'github'
              ? <span className="oauth-spinner" aria-hidden="true"/>
              : <GitHubIcon />}
            <span>Continue with GitHub</span>
          </button>
        </div>

        <OrDivider />

        {/* ── Email / Password form ─────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-username">USERNAME</label>
              <input
                id="auth-username"
                type="text"
                placeholder="your_username"
                value={form.username}
                onChange={set('username')}
                autoComplete="username"
                spellCheck={false}
                disabled={anyLoading}
                minLength={3}
                maxLength={30}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">EMAIL</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              disabled={anyLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">PASSWORD</label>
            <div className="auth-pass-wrap">
              <input
                id="auth-password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                disabled={anyLoading}
                minLength={6}
              />
              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="auth-btn"
            type="submit"
            disabled={anyLoading}
            aria-busy={loading}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login' ? 'Sign in with email' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={switchMode} disabled={anyLoading}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
