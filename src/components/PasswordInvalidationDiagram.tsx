import React, { useState } from 'react';

type Option = 'single' | 'multi';

interface DeviceStep {
  actor: string;
  action: string;
  code?: string;
  result?: string;
  highlight?: boolean;
}

const SINGLE_DEVICE_STEPS: DeviceStep[] = [
  { actor: 'User on Device A', action: 'Submits current password + new password', result: 'Request: POST /auth/password {old_password, new_password, session_id: "sess_101"}' },
  { actor: 'Auth Service', action: 'Validates current password hash against DB', result: 'bcrypt.verify(old_password, stored_hash) → OK' },
  { actor: 'Auth Service', action: 'Updates password hash in users table', code: "UPDATE users SET password_hash = bcrypt(new_password) WHERE id = :uid;" },
  {
    actor: 'Auth Service',
    action: 'Selective Revocation — keep Device A session, revoke all others',
    code: "UPDATE refresh_tokens\nSET is_revoked = TRUE\nWHERE user_id = :uid\n  AND session_id != 'sess_101';",
    highlight: true
  },
  { actor: 'Auth Service', action: 'Rotates fresh token pair for Device A', result: 'New Access Token + New Refresh Token → Device A stays logged in ✅' },
  { actor: 'Device B / C', action: 'Next refresh attempt fails with 401 — session deleted', result: 'HTTP 401: refresh token revoked. Re-login required. ❌', highlight: true },
];

const MULTI_DEVICE_STEPS: DeviceStep[] = [
  { actor: 'User / Security System', action: '"Log out everywhere" triggered or account hacked detected', result: 'Trigger: POST /auth/emergency-reset or /auth/password-reset?token=<email_link>' },
  { actor: 'Auth Service', action: 'Updates password hash and increments token_version', code: "UPDATE users\nSET password_hash = bcrypt(new_password),\n    token_version = token_version + 1,\n    pwd_updated_at = NOW()\nWHERE id = :uid;" },
  {
    actor: 'Auth Service',
    action: 'Wipes ALL refresh tokens for the user',
    code: "UPDATE refresh_tokens\nSET is_revoked = TRUE\nWHERE user_id = :uid;",
    highlight: true
  },
  {
    actor: 'Auth Service → Redis',
    action: 'Pushes revocation timestamp so active JWTs are instantly rejected',
    code: "SET user:revoked_before:usr_9988 <now_epoch> EX 900",
    highlight: true
  },
  { actor: 'API Gateway', action: 'Rejects any access token with iat < revoked_before on every API call', result: 'if (jwt.iat < redis.get("user:revoked_before:usr_9988")) → HTTP 401 Unauthorized ❌' },
  { actor: 'Device A / B / C', action: 'All sessions terminated. User must re-login with new password.', result: 'Even Device A (where user initiated the reset) is logged out. Full clean state. ✅' },
];

const COMPARISON_ROWS = [
  { dimension: 'Device A (initiating)', single: 'Stays logged in ✅', multi: 'Logged out ❌' },
  { dimension: 'Device B, C (other sessions)', single: 'Revoked ❌', multi: 'Revoked ❌' },
  { dimension: 'Active Access Tokens', single: 'Device A re-issued a fresh one', multi: 'All revoked via Redis timestamp' },
  { dimension: 'token_version bump', single: 'No', multi: 'Yes — immediately invalidates all JWTs' },
  { dimension: 'Redis revoked_before', single: 'No', multi: 'Yes — 15-min TTL to close access token gap' },
  { dimension: 'UX Experience', single: 'Seamless on Device A', multi: 'Full re-login everywhere' },
  { dimension: 'Best for', single: 'Routine password rotation', multi: 'Account compromise, "Log out all"' },
];

export default function PasswordInvalidationDiagram(): React.JSX.Element {
  const [option, setOption] = useState<Option>('single');
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const steps = option === 'single' ? SINGLE_DEVICE_STEPS : MULTI_DEVICE_STEPS;
  const themeColor = option === 'single' ? '#34d399' : '#f87171';
  const activeStep = activeStepIdx !== null ? steps[activeStepIdx] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header */}
      <div
        className="interactive-diagram-header"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ifm-color-content)', flex: 1 }}>
          Password Update Session Invalidation
        </span>
        <button
          onClick={() => setShowComparison((v) => !v)}
          style={{
            padding: '5px 12px', borderRadius: '7px',
            border: '1px solid rgba(56,189,248,0.4)',
            background: showComparison ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
            color: showComparison ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          {showComparison ? 'Hide' : 'Show'} Comparison Table
        </button>
      </div>

      {/* Option toggle */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {(['single', 'multi'] as Option[]).map((opt) => {
          const isActive = opt === option;
          const color = opt === 'single' ? '#34d399' : '#f87171';
          const labelText = opt === 'single' ? '📱 Option A — Single Device (Selective)' : '🌐 Option B — All Devices (Global / Emergency)';
          return (
            <button
              key={opt}
              onClick={() => { setOption(opt); setActiveStepIdx(null); }}
              style={{
                flex: 1, padding: '10px 16px',
                background: isActive ? `${color}12` : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? color : 'transparent'}`,
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
              }}
            >
              {labelText}
            </button>
          );
        })}
      </div>

      {/* Comparison table (conditional) */}
      {showComparison && (
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Dimension</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: '#34d399', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Single Device</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: '#f87171', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Multi-Device</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '6px 10px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>{row.dimension}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--ifm-color-content-secondary)' }}>{row.single}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--ifm-color-content-secondary)' }}>{row.multi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Steps + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', minHeight: '300px' }}>
        <style>{`
          @media (max-width: 768px) {
            .pwd-invalid-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Left: step list */}
        <div className="pwd-invalid-grid" style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            {option === 'single' ? 'Selective Session Invalidation — Device A Stays' : 'Global Session Wipe — All Devices Evicted'}
          </div>

          {/* Device indicators */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
              Device A (sess_101) — Active
            </div>
            <div style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: option === 'single' ? 'rgba(248,113,113,0.12)' : 'rgba(248,113,113,0.18)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
              Device B (sess_202) — {option === 'single' ? 'Revoked' : 'Revoked'}
            </div>
            <div style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
              Device C (sess_303) — Revoked
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {steps.map((step, i) => {
              const isSelected = activeStepIdx === i;
              return (
                <div
                  key={i}
                  onClick={() => setActiveStepIdx(isSelected ? null : i)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? `${themeColor}15` : step.highlight ? 'rgba(255,255,255,0.025)' : 'transparent',
                    border: `1px solid ${isSelected ? themeColor + '50' : step.highlight ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? themeColor : step.highlight ? `${themeColor}30` : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 800,
                    color: isSelected ? '#000' : step.highlight ? themeColor : 'var(--ifm-color-content-secondary)',
                    transition: 'all 0.2s ease'
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: isSelected ? themeColor : step.highlight ? themeColor : 'var(--ifm-color-content)' }}>
                      {step.actor}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                      {step.action}
                    </div>
                  </div>
                  {step.highlight && (
                    <div style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '3px', background: `${themeColor}25`, color: themeColor, fontWeight: 700, flexShrink: 0, alignSelf: 'center' }}>
                      KEY
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel */}
        <div style={{ padding: '1rem' }}>
          {activeStep ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: themeColor, boxShadow: `0 0 8px ${themeColor}80` }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {activeStep.actor}
                </span>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: 'var(--ifm-color-content)' }}>
                {activeStep.action}
              </h4>
              {activeStep.result && (
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>Result</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{activeStep.result}</div>
                </div>
              )}
              {activeStep.code && (
                <pre style={{
                  margin: 0, padding: '10px 12px',
                  background: '#040711', borderRadius: '6px',
                  fontSize: '0.71rem', color: '#e2e8f0',
                  border: `1px solid ${themeColor}30`,
                  overflowX: 'auto', lineHeight: 1.55
                }}>
                  <code>{activeStep.code}</code>
                </pre>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
              {/* Summary card */}
              <div style={{
                width: '100%', padding: '12px',
                background: `${themeColor}0a`, border: `1px solid ${themeColor}25`,
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: themeColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {option === 'single' ? 'Option A Summary' : 'Option B Summary'}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
                  {option === 'single'
                    ? 'Device A keeps its session active. All other sessions are selectively revoked via a targeted SQL update. Device A receives a fresh rotated token pair bound to the new credentials.'
                    : 'All sessions are globally terminated. token_version is incremented and a revoked_before timestamp is pushed to Redis, closing the stateless access token revocation gap immediately.'}
                </p>
              </div>
              <div style={{ opacity: 0.4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span style={{ fontSize: '0.72rem', color: 'var(--ifm-color-content-secondary)' }}>Click a step to inspect details</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
