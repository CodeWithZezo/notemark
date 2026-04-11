import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Map raw Supabase error strings → clean English messages
function friendlyError(raw = '') {
  if (raw.includes('Invalid login credentials'))    return 'Incorrect email or password.';
  if (raw.includes('Email not confirmed'))          return 'Please verify your email before signing in. Check your inbox.';
  if (raw.includes('User already registered'))      return 'This email is already registered. Please sign in instead.';
  if (raw.includes('Password should be at least'))  return 'Password must be at least 6 characters.';
  if (raw.includes('Unable to validate email'))     return 'Please enter a valid email address.';
  if (raw.includes('rate limit') || raw.includes('after') || raw.includes('429'))
                                                    return 'Too many attempts. Please wait a moment and try again.';
  if (raw.includes('popup_closed'))                return 'Sign-in popup was closed. Please try again.';
  if (raw.includes('provider is not enabled'))     return 'This sign-in method is not enabled. Contact support.';
  if (raw.includes('Network'))                     return 'Network error. Please check your connection and try again.';
  return raw || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [user, setUser]                                   = useState(null);
  const [loading, setLoading]                             = useState(true);
  const [pendingVerification, setPendingVerification]     = useState(null); // { email }
  const [oauthLoading, setOauthLoading]                   = useState(null); // 'google' | 'github' | null

  // ── Session sync ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setPendingVerification(null);
        setOauthLoading(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Email / Password Register ─────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    if (!username || username.trim().length < 3 || username.trim().length > 30) {
      throw new Error('Username must be between 3 and 30 characters.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw new Error(friendlyError(error.message));

    // session is null when email confirmation is required
    if (data.user && !data.session) {
      setPendingVerification({ email });
    }

    return data;
  }, []);

  // ── Email / Password Login ────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyError(error.message));
    return data;
  }, []);

  // ── Google OAuth ──────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    setOauthLoading('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }, // always show account picker
      },
    });
    if (error) {
      setOauthLoading(null);
      throw new Error(friendlyError(error.message));
    }
    // Browser will redirect — oauthLoading stays until redirect
  }, []);

  // ── GitHub OAuth ──────────────────────────────────────────────────────
  const signInWithGitHub = useCallback(async () => {
    setOauthLoading('github');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setOauthLoading(null);
      throw new Error(friendlyError(error.message));
    }
  }, []);

  // ── Resend verification email ─────────────────────────────────────────
  const resendVerification = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(friendlyError(error.message));
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setPendingVerification(null);
    setOauthLoading(null);
  }, []);

  const cancelVerification = useCallback(() => {
    setPendingVerification(null);
  }, []);

  const userShape = user
    ? {
        id:         user.id,
        email:      user.email,
        username:   user.user_metadata?.username
                    ?? user.user_metadata?.full_name
                    ?? user.user_metadata?.name
                    ?? user.email.split('@')[0],
        avatar:     user.user_metadata?.avatar_url ?? null,
      }
    : null;

  return (
    <AuthContext.Provider value={{
      user: userShape,
      loading,
      oauthLoading,
      pendingVerification,
      login,
      register,
      logout,
      signInWithGoogle,
      signInWithGitHub,
      resendVerification,
      cancelVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
