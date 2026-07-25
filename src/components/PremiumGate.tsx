import React, { useEffect, useState } from 'react';
import { useUserProgress } from '../context/UserProgressContext';
import { triggerFireworks } from '../utils/fireworks';

// ── Inline spinner shown while Firebase is resolving ──────────────────────────
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '40vh', gap: '20px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        border: '3px solid rgba(245, 158, 11, 0.15)',
        borderTopColor: '#f59e0b',
        animation: 'premiumSpin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: '0.88rem', color: 'var(--ifm-color-content-secondary)' }}>
        Checking access…
      </div>
      <style>{`@keyframes premiumSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Modal dialog shown when user does not have premium ─────────────────────────
function PremiumModal() {
  const { unlockPremium, currentUser } = useUserProgress();
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

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
      // isPremium becomes true → PremiumGate will unmount this modal and show content
    } else {
      setError('Invalid activation key. Please check and try again.');
    }
  };

  return (
    // Page-flow centred section — no overlay needed since no content is rendered behind it
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem 1.5rem',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      {/* Dialog card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'linear-gradient(160deg, #0f1120 0%, #0c0e1c 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(245, 158, 11, 0.28)',
        boxShadow: '0 0 0 1px rgba(245,158,11,0.08), 0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(245,158,11,0.08)',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
      }}>
        {/* Amber glow strip at top */}
        <div style={{
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #f59e0b 40%, #fbbf24 60%, transparent 100%)',
        }} />

        <div style={{ padding: '2rem 2rem 1.75rem' }}>
          {/* Icon + title */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '1.75rem', marginBottom: '0.85rem',
            }}>
              👑
            </div>
            <h2 style={{
              margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: 700,
              color: '#f59e0b',
            }}>
              Premium Content
            </h2>
            <p style={{
              margin: 0, fontSize: '0.875rem',
              color: 'var(--ifm-color-content-secondary)',
              lineHeight: 1.55,
            }}>
              {currentUser
                ? 'Enter your activation key to unlock company-wise LeetCode question lists.'
                : 'Please log in first, then enter your activation key below.'}
            </p>
          </div>

          {/* What's included */}
          <div style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.14)',
            borderRadius: '10px', padding: '0.8rem 1rem',
            marginBottom: '1.25rem',
          }}>
            {['Company-wise LeetCode lists (Google, Meta, Amazon…)', 'Sorted by frequency & difficulty', 'Regularly updated from live interview data'].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.82rem', color: 'var(--ifm-color-content-secondary)',
                marginBottom: i < 2 ? '5px' : 0,
              }}>
                <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>✦</span>
                {item}
              </div>
            ))}
          </div>

          {/* Unlock form */}
          {currentUser ? (
            <form onSubmit={handleUnlock}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setError(''); }}
                  placeholder="Enter activation key…"
                  autoFocus
                  style={{
                    flex: 1, padding: '0.65rem 0.9rem', borderRadius: '9px',
                    border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.10)'}`,
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--ifm-color-content)', fontSize: '0.88rem', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.65rem 1.2rem', borderRadius: '9px',
                    background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.88rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 2px 12px rgba(245,158,11,0.35)',
                    transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? '…' : 'Unlock'}
                </button>
              </div>
              {error && (
                <div style={{
                  fontSize: '0.8rem', color: '#f87171', marginTop: '4px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <span>✕</span> {error}
                </div>
              )}
            </form>
          ) : (
            <a
              href="/login"
              style={{
                display: 'block', textAlign: 'center',
                padding: '0.7rem 1.2rem', borderRadius: '9px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 2px 12px rgba(245,158,11,0.35)',
              }}
            >
              Log in to continue →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Public gate wrapper ────────────────────────────────────────────────────────
interface PremiumGateProps {
  children: React.ReactNode;
}

/**
 * Premium gate behaviour:
 *  1. Firebase check in progress    → loading spinner only (no content rendered)
 *  2. isPremium === true (Firestore) → render children normally
 *  3. isPremium === false / revoked  → show modal dialog only, NO content rendered
 */
export default function PremiumGate({ children }: PremiumGateProps) {
  const { isPremium, isLoading } = useUserProgress();

  // Still resolving from Firebase — show spinner, no content
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Premium confirmed from Firestore → full access
  if (isPremium) {
    return <>{children}</>;
  }

  // Not premium (or revoked): do NOT render content at all — show modal only
  return <PremiumModal />;
}

