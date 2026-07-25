import React, { useState, useEffect } from 'react';

type MethodId = 'token_version' | 'revoked_before' | 'jti_blacklist';

interface Method {
  id: MethodId;
  label: string;
  color: string;
  tagline: string;
  latency: string;
  overhead: string;
  steps: { actor: string; action: string; code?: string }[];
}

const METHODS: Method[] = [
  {
    id: 'token_version',
    label: 'token_version claim',
    color: '#a78bfa',
    tagline: 'Increment a version counter — all older access tokens are rejected instantly.',
    latency: 'Zero (Redis cached)',
    overhead: 'One int column on users table',
    steps: [
      { actor: 'Security Team', action: 'Detect breach / user reports hack' },
      { actor: 'Auth Service', action: 'Revoke all refresh tokens in DB for user', code: 'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :uid;' },
      { actor: 'Auth Service', action: 'Increment token_version in users table', code: 'UPDATE users SET token_version = token_version + 1 WHERE id = :uid;' },
      { actor: 'Redis Cache', action: 'Optionally push new version to Redis', code: 'SET user:token_ver:<uid> <new_ver> EX 900' },
      { actor: 'API Gateway', action: 'On next API call, verify jwt.ver == cached_version; reject if stale' },
    ],
  },
  {
    id: 'revoked_before',
    label: 'revoked_before timestamp',
    color: '#f59e0b',
    tagline: 'Push a "revoked before" timestamp to Redis — any token issued before this time is rejected.',
    latency: 'Zero (Redis cached)',
    overhead: 'One Redis key per user, TTL = access token max lifespan',
    steps: [
      { actor: 'Security Team', action: 'Detect breach / user triggers "Log out everywhere"' },
      { actor: 'Auth Service', action: 'Wipe all refresh tokens from DB', code: 'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :uid;' },
      { actor: 'Auth Service', action: 'Update pwd_updated_at & push revocation timestamp to Redis', code: 'UPDATE users SET pwd_updated_at = NOW() WHERE id = :uid;\nSET user:revoked_before:<uid> <epoch_now> EX 900' },
      { actor: 'API Gateway', action: 'Check: jwt.iat < redis["user:revoked_before:<uid>"] → 401 Unauthorized' },
      { actor: 'Redis Cache', action: 'Key auto-expires after 15 min (max access token lifespan). No cleanup needed.' },
    ],
  },
  {
    id: 'jti_blacklist',
    label: 'jti Redis Blacklist',
    color: '#f87171',
    tagline: 'Blacklist specific JWT IDs — surgical per-token revocation without affecting other sessions.',
    latency: 'Zero (Redis EXISTS check)',
    overhead: 'Redis memory for each revoked jti (TTL = remaining token lifetime)',
    steps: [
      { actor: 'Security Team', action: 'Identify specific access tokens to revoke (by jti claim)' },
      { actor: 'Auth Service', action: 'Push each jti to Redis with TTL = remaining token lifetime', code: 'SETEX blacklist:jti:8a3f91b2 600 "revoked_hacked_account"' },
      { actor: 'API Gateway', action: 'On every API request: EXISTS blacklist:jti:<jti> → 401 if found' },
      { actor: 'Redis Cache', action: 'Each key auto-expires when the original token would have expired anyway.' },
    ],
  },
];

const INCIDENT_STEPS = [
  { id: 0, label: 'Breach Detected', detail: 'User reports hack, anomaly detection fires, or credential stuffing alert triggers. Security escalation begins.', color: '#f87171', layer: 'Trigger' },
  { id: 1, label: 'Hard Revoke Refresh Tokens', detail: 'Delete or mark ALL refresh tokens for the user as revoked in the database and clear Redis refresh token cache. This prevents new access tokens from being minted.', color: '#f97316', layer: 'Layer 1: Hard Revocation', code: 'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = :uid;' },
  { id: 2, label: 'The Access Token Gap', detail: 'WARNING: Revoking refresh tokens does NOT immediately invalidate active stateless JWTs! Existing access tokens remain valid for up to 15 minutes after their last issue.', color: '#fbbf24', layer: 'Layer 2: Gap Problem' },
  { id: 3, label: 'Push Revocation Signal', detail: 'Immediately push a revocation signal to Redis. All API Gateways will reject access tokens issued before this timestamp.', color: '#a78bfa', layer: 'Layer 3: Close the Gap', code: 'SET user:revoked_before:<uid> <now_epoch> EX 900' },
  { id: 4, label: 'Gateway Enforces Check', detail: 'Every API request now passes through the Gateway\'s iat-check filter. Tokens issued before the revocation timestamp are rejected with 401 Unauthorized.', color: '#34d399', layer: 'Layer 4: Enforcement' },
  { id: 5, label: 'Attacker Session Terminated', detail: 'All hacker sessions are closed. The legitimate user is forced to re-authenticate with a new password or MFA. Security event is logged.', color: '#38bdf8', layer: 'Resolution' },
];

export default function AccountHackedResponseDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('token_version');

  const currentMethod = METHODS.find((m) => m.id === selectedMethod) || METHODS[0];
  const currentStepData = activeStep !== null ? INCIDENT_STEPS[activeStep] : null;

  useEffect(() => {
    if (!playing || animStep >= INCIDENT_STEPS.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(animStep);
      setAnimStep((s) => s + 1);
    }, 800);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => {
    setActiveStep(null);
    setAnimStep(0);
    setPlaying(true);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ifm-color-content)', flex: 1 }}>
          Incident Response: Account Compromise Containment
        </span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            padding: '5px 14px', borderRadius: '7px', border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(248,113,113,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#f87171',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(248,113,113,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {playing ? 'Running…' : '▶ Animate Response'}
        </button>
      </div>

      {/* Main grid: steps + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 0, minHeight: '320px' }}>
        <style>{`
          @media (max-width: 768px) {
            .acct-hacked-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Left: step timeline */}
        <div className="acct-hacked-grid" style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Response Timeline — click a step to inspect
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {INCIDENT_STEPS.map((step, i) => {
              const isActive = activeStep !== null && i <= activeStep;
              const isSelected = activeStep === i;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(isSelected ? null : i)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? `${step.color}18` : 'transparent',
                    border: `1px solid ${isSelected ? step.color + '60' : 'rgba(255,255,255,0.04)'}`,
                    opacity: activeStep !== null && !isActive ? 0.3 : 1,
                    transition: 'all 0.4s ease',
                    transform: isActive ? 'translateX(0)' : 'translateX(-6px)'
                  }}
                >
                  {/* Step number circle */}
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: isActive ? step.color : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800,
                    color: isActive ? '#000' : 'var(--ifm-color-content-secondary)',
                    transition: 'all 0.4s ease'
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isActive ? step.color : 'var(--ifm-color-content)', transition: 'color 0.3s' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ifm-color-content-secondary)', marginTop: '1px' }}>
                      {step.layer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          {currentStepData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: currentStepData.color,
                  boxShadow: `0 0 8px ${currentStepData.color}80`
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: currentStepData.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {currentStepData.layer}
                </span>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--ifm-color-content)' }}>
                {currentStepData.label}
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
                {currentStepData.detail}
              </p>
              {currentStepData.code && (
                <pre style={{
                  margin: 0, padding: '10px 12px',
                  background: '#040711', borderRadius: '6px',
                  fontSize: '0.72rem', color: '#e2e8f0',
                  border: `1px solid ${currentStepData.color}30`,
                  overflowX: 'auto', lineHeight: 1.5
                }}>
                  <code>{currentStepData.code}</code>
                </pre>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', opacity: 0.4 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ fontSize: '0.78rem', color: 'var(--ifm-color-content-secondary)' }}>Click a step or press Animate</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: 3 revocation methods tabs */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Closing the Access Token Gap — Choose a Method
        </div>

        {/* Method tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {METHODS.map((m) => {
            const isActive = m.id === selectedMethod;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: `1px solid ${isActive ? m.color + '60' : 'rgba(255,255,255,0.1)'}`,
                  background: isActive ? `${m.color}18` : 'rgba(255,255,255,0.03)',
                  color: isActive ? m.color : 'var(--ifm-color-content-secondary)',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Method details */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${currentMethod.color}20`, borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, flex: 1 }}>
              {currentMethod.tagline}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: `${currentMethod.color}18`, color: currentMethod.color, fontWeight: 700 }}>
                Latency: {currentMethod.latency}
              </span>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
                {currentMethod.overhead}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {currentMethod.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: `${currentMethod.color}25`, border: `1px solid ${currentMethod.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 800, color: currentMethod.color
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '0.73rem', fontWeight: 600, color: currentMethod.color }}>{step.actor}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>{step.action}</div>
                  {step.code && (
                    <pre style={{ margin: '4px 0 0 0', padding: '5px 8px', background: '#040711', borderRadius: '4px', fontSize: '0.67rem', color: '#e2e8f0', overflowX: 'auto' }}>
                      <code>{step.code}</code>
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
