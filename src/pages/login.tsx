import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';

// @ts-ignore
export default function Login(): React.ReactNode {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInState, setLoggedInState] = useState<'checking' | 'logged_in' | 'logged_out'>('checking');
  const [returnTo, setReturnTo] = useState('/docs/premium/intro');
  const location = useLocation();

  useEffect(() => {
    // Extract the returnTo parameter if present (e.g., ?returnTo=/docs/premium/advanced-guide)
    const params = new URLSearchParams(location.search);
    const redirectUrl = params.get('returnTo');
    if (redirectUrl) {
      setReturnTo(redirectUrl);
    }

    // Check if the user is already perfectly authenticated dynamically on page load!
    // This hits the Cloudflare Worker /api/me endpoint
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setLoggedInState('logged_in');
        } else {
          setLoggedInState('logged_out');
        }
      })
      .catch(() => setLoggedInState('logged_out'));
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Successful login! Force full page reload to trigger Cloudflare Proxy cookie validation
        window.location.href = returnTo;
      } else {
        setError('Invalid access code. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
       await fetch('/api/logout', { method: 'POST' });
       setLoggedInState('logged_out');
       window.location.reload();
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  // 1. Loading State
  if (loggedInState === 'checking') {
     return (
       // @ts-ignore
       <Layout title="Premium Login">
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <p style={{ color: 'var(--ifm-color-emphasis-600)', fontWeight: 600 }}>Verifying secure session...</p>
         </div>
       </Layout>
     );
  }

  // 2. Already Logged In State
  if (loggedInState === 'logged_in') {
     return (
       // @ts-ignore
       <Layout title="Dashboard">
         <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
           <div style={{ padding: '2.5rem', border: '1px solid var(--ifm-color-success-dark)', borderRadius: '12px', maxWidth: '400px', width: '100%', textAlign: 'center', backgroundColor: 'var(--ifm-background-surface-color)' }}>
             <h2 style={{ marginBottom: '1rem' }}>💎 You are Authenticated!</h2>
             <p style={{ color: 'var(--ifm-color-emphasis-700)', marginBottom: '2rem' }}>Your session is active and safely verified by Cloudflare KV.</p>
             <a href="/docs/premium/intro" className="button button--primary button--block" style={{ marginBottom: '1rem' }}>Browse Premium Content</a>
             <button onClick={handleLogout} className="button button--danger button--outline button--block" disabled={loading}>
               {loading ? 'Logging out...' : 'Logout Securely'}
             </button>
           </div>
         </div>
       </Layout>
     );
  }

  // 3. Logged Out State (Standard Login Form)
  return (
    // @ts-ignore
    <Layout title="Premium Login" description="Login to access premium engineering guides">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
        <div style={{ padding: '2.5rem', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '12px', maxWidth: '400px', width: '100%', backgroundColor: 'var(--ifm-background-surface-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Premium Access 💎</h1>
          <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '2rem' }}>Please log in to read this locked article.</p>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  backgroundColor: 'var(--ifm-color-emphasis-100)',
                  color: 'var(--ifm-font-color-base)'
                }}
                placeholder="Enter VIP pass code"
                required
              />
            </div>
            
            {error && (
              <div style={{ backgroundColor: 'var(--ifm-color-danger-contrast-background)', color: 'var(--ifm-color-danger-contrast-foreground)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
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
                transition: 'background-color 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Verifying...' : 'Unlock Content'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
