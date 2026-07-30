import React, { useState } from 'react';
import { useUserProgress } from '../context/UserProgressContext';
import { triggerFireworks } from '../utils/fireworks';

export default function PremiumUnlockCard() {
  const { isPremium, unlockPremium, currentUser } = useUserProgress();
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setError('Please enter your Premium Activation Key.');
      return;
    }
    setLoading(true);
    setError('');

    const success = await unlockPremium(keyInput);
    setLoading(false);

    if (success) {
      triggerFireworks();
    } else {
      setError('Invalid activation key. Please check and try again.');
    }
  };

  if (isPremium) {
    return (
      <div
        style={{
          margin: '2rem 0',
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 20px rgba(234, 179, 8, 0.15)',
        }}
      >
        <div style={{ fontSize: '2rem' }}>👑</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f59e0b' }}>
            Premium Access Unlocked! ✨
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)', marginTop: '2px' }}>
            {currentUser
              ? `Logged in as ${currentUser.displayName || currentUser.email} (Synced to Cloud Firestore)`
              : 'Premium privileges active on this device'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '2.5rem 0',
        padding: '2rem',
        borderRadius: '16px',
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-300)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: 'var(--ifm-font-color-base)' }}>
        Unlock Premium Content
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
        Enter your activation key to access senior-level architectural deep-dives, system designs, and production interview guides.
      </p>

      <form onSubmit={handleUnlock} style={{ maxWidth: '380px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter activation key..."
            style={{
              flex: 1,
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300)',
              backgroundColor: 'var(--ifm-color-emphasis-100)',
              color: 'var(--ifm-font-color-base)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
            }}
          >
            {loading ? 'Validating...' : 'Unlock 🔓'}
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--ifm-color-danger)', fontSize: '0.825rem', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
