import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState('login');
  const [form, setForm]     = useState({ username: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side quick validation
    if (mode === 'register') {
      if (!form.username.trim() || form.username.trim().length < 3) {
        return setError('Username must be at least 3 characters.');
      }
    }
    if (!form.email || !form.password) return setError('All fields are required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username.trim(), form.email, form.password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
    setForm({ username: '', email: '', password: '' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">note<span>■</span>mark</div>
        <h2>{mode === 'login' ? 'Sign in to your notes' : 'Create an account'}</h2>

        {error && <div className="auth-error" role="alert">{error}</div>}

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
                disabled={loading}
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
              disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">PASSWORD</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
              minLength={6}
            />
          </div>
          <button className="auth-btn" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={switchMode} disabled={loading}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
