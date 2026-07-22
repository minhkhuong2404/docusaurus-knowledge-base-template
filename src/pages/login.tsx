import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, firebaseConfig } from '../config/firebase';
import FirebaseGoogleLoginButton from '../components/FirebaseGoogleLoginButton';

function formatFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    default:
      return 'Authentication failed. Please check your details and try again.';
  }
}

// @ts-ignore
export default function Login(): React.ReactNode {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInState, setLoggedInState] = useState<'checking' | 'logged_in' | 'logged_out'>('checking');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [returnTo, setReturnTo] = useState('/');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectUrl = params.get('returnTo');
    if (redirectUrl) {
      setReturnTo(redirectUrl);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setLoggedInState('logged_in');
        sessionStorage.setItem('premium_session_state', 'logged_in');
      } else {
        const localSession = sessionStorage.getItem('premium_session_state');
        if (localSession === 'logged_in') {
          setLoggedInState('logged_in');
        } else {
          setLoggedInState('logged_out');
        }
      }
    });

    return () => unsubscribe();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim() && userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      sessionStorage.setItem('premium_session_state', 'logged_in');
      window.location.href = returnTo;
    } catch (err: any) {
      setError(formatFirebaseError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (_user: User) => {
    sessionStorage.setItem('premium_session_state', 'logged_in');
    window.location.href = returnTo;
  };

  const handleGoogleError = (err: any) => {
    console.error('Google Sign-In Error:', err);
    if (err?.code === 'auth/api-key-not-valid' || err?.code === 'auth/invalid-api-key' || firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY') {
      setError('Firebase API Key is missing or invalid. Please add your real Firebase Config keys to src/config/firebase.ts or .env.');
    } else if (err?.code === 'auth/unauthorized-domain') {
      setError('Domain not authorized! Please add localhost / your website domain to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
    } else if (err?.code === 'auth/popup-closed-by-user') {
      setError('Google sign-in popup was closed before completing sign-in.');
    } else if (err?.code === 'auth/operation-not-allowed') {
      setError('Google sign-in is disabled in your Firebase Console. Please turn ON "Google" under Firebase Console -> Authentication -> Sign-in method.');
    } else {
      setError(`Google login failed (${err?.code || 'error'}): ${err?.message || 'Please try again.'}`);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth).catch(() => {});
      await fetch('/api/logout', { method: 'POST' }).catch(() => {});
      sessionStorage.removeItem('premium_session_state');
      setCurrentUser(null);
      setLoggedInState('logged_out');
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loggedInState === 'checking') {
    return (
      // @ts-ignore
      <Layout title="Sign In">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <p style={{ color: 'var(--ifm-color-emphasis-600)', fontWeight: 600 }}>Verifying session...</p>
        </div>
      </Layout>
    );
  }

  if (loggedInState === 'logged_in') {
    return (
      // @ts-ignore
      <Layout title="Account Dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
          <div style={{ padding: '2.5rem', border: '1px solid var(--ifm-color-success-dark)', borderRadius: '12px', maxWidth: '420px', width: '100%', textAlign: 'center', backgroundColor: 'var(--ifm-background-surface-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Welcome Back! 👋</h2>
            {currentUser ? (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--ifm-color-emphasis-100)', borderRadius: '8px' }}>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '0.5rem', border: '2px solid var(--ifm-color-primary)' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--ifm-color-primary)', color: '#fff', fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto' }}>
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{currentUser.displayName || 'Learner'}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>{currentUser.email}</p>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.75rem', padding: '2px 8px', background: '#FFCA28', color: '#000', borderRadius: '12px', fontWeight: 600 }}>
                  Syncing Progress Active ⚡
                </span>
              </div>
            ) : (
              <p style={{ color: 'var(--ifm-color-emphasis-700)', marginBottom: '2rem' }}>Your reading progress is being synced.</p>
            )}
            <a href="/" className="button button--primary button--block" style={{ marginBottom: '1rem' }}>Explore Knowledge Base</a>
            <button onClick={handleLogout} className="button button--danger button--outline button--block" disabled={loading}>
              {loading ? 'Logging out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    // @ts-ignore
    <Layout title={mode === 'signin' ? 'Sign In' : 'Create Account'} description="Sign in or register to sync your reading progress">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh', padding: '1.5rem 1rem' }}>
        <div style={{ padding: '2.5rem', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '16px', maxWidth: '420px', width: '100%', backgroundColor: 'var(--ifm-background-surface-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          
          {/* Segmented Mode Selector */}
          <div style={{ display: 'flex', background: 'var(--ifm-color-emphasis-100)', borderRadius: '8px', padding: '4px', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: mode === 'signin' ? 'var(--ifm-background-surface-color)' : 'transparent',
                color: mode === 'signin' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                boxShadow: mode === 'signin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: mode === 'register' ? 'var(--ifm-background-surface-color)' : 'transparent',
                color: mode === 'register' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>

          <h1 style={{ textAlign: 'center', marginBottom: '0.35rem', fontSize: '1.6rem' }}>
            {mode === 'signin' ? 'Welcome Back 🚀' : 'Join Knowledge Base 🚀'}
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {mode === 'signin'
              ? 'Sign in to sync your progress and quiz scores.'
              : 'Create an account to track completed articles and stats.'}
          </p>

          {/* Firebase Google Sign-In */}
          <div style={{ marginBottom: '1.25rem' }}>
            <FirebaseGoogleLoginButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--ifm-color-emphasis-500)', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--ifm-color-emphasis-300)' }} />
            <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>OR EMAIL</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--ifm-color-emphasis-300)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '6px',
                    border: '1px solid var(--ifm-color-emphasis-300)',
                    backgroundColor: 'var(--ifm-color-emphasis-100)',
                    color: 'var(--ifm-font-color-base)'
                  }}
                  placeholder="John Doe"
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '6px',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  backgroundColor: 'var(--ifm-color-emphasis-100)',
                  color: 'var(--ifm-font-color-base)'
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '6px',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  backgroundColor: 'var(--ifm-color-emphasis-100)',
                  color: 'var(--ifm-font-color-base)'
                }}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                required
              />
            </div>

            {error && (
              <div style={{ backgroundColor: 'var(--ifm-color-danger-contrast-background)', color: 'var(--ifm-color-danger-contrast-foreground)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--ifm-color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (mode === 'register' ? 'Creating Account...' : 'Signing In...') : (mode === 'register' ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
