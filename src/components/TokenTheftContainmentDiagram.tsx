import React, { useState } from 'react';

type StepNumber = 1 | 2 | 3 | 4;

interface StepInfo {
  step: StepNumber;
  title: string;
  actor: string;
  action: string;
  dbState: string;
  tokenFamilyState: {
    rt1: { label: string; status: 'ACTIVE' | 'USED' | 'REVOKED'; color: string };
    rt2: { label: string; status: 'ACTIVE' | 'USED' | 'REVOKED'; color: string };
  };
  securityAlert: string | null;
}

const STEPS: StepInfo[] = [
  {
    step: 1,
    title: '1. Initial Login & Token Minting',
    actor: '👤 Legitimate User (Mobile Phone)',
    action: 'User logs in. Auth server creates Token Family "fam_100" and issues Refresh Token RT-1.',
    dbState: 'INSERT INTO user_sessions (session_id, family_id, token_hash, is_used) VALUES (\'sess_mob\', \'fam_100\', \'hash_RT1\', FALSE);',
    tokenFamilyState: {
      rt1: { label: 'RT-1 (Issued)', status: 'ACTIVE', color: '#34d399' },
      rt2: { label: 'RT-2 (Not Yet Created)', status: 'USED', color: 'var(--ifm-color-content-secondary)' }
    },
    securityAlert: null
  },
  {
    step: 2,
    title: '2. Normal Token Rotation (Legitimate Client)',
    actor: '👤 Legitimate User',
    action: 'Client exchanges RT-1 for RT-2. Auth server marks RT-1 as is_used = TRUE and issues active RT-2.',
    dbState: 'UPDATE user_sessions SET is_used = TRUE WHERE token_hash = \'hash_RT1\';\nINSERT INTO user_sessions (family_id, token_hash, is_used) VALUES (\'fam_100\', \'hash_RT2\', FALSE);',
    tokenFamilyState: {
      rt1: { label: 'RT-1 (Rotated)', status: 'USED', color: '#fbbf24' },
      rt2: { label: 'RT-2 (Active)', status: 'ACTIVE', color: '#34d399' }
    },
    securityAlert: null
  },
  {
    step: 3,
    title: '3. Hacker Replays Stolen Token (RT-1)',
    actor: '🕵️ Attacker (Malicious Network)',
    action: 'Attacker stole old token RT-1 via XSS/network sniff and attempts to exchange it at /auth/refresh.',
    dbState: 'SELECT * FROM user_sessions WHERE token_hash = \'hash_RT1\';\n-- ➔ RESULT: Found row with is_used = TRUE! 🚨 REUSE DETECTED!',
    tokenFamilyState: {
      rt1: { label: 'RT-1 (Replayed by Hacker)', status: 'REVOKED', color: '#f87171' },
      rt2: { label: 'RT-2 (Active on Victim)', status: 'ACTIVE', color: '#34d399' }
    },
    securityAlert: '🚨 TRIPWIRE TRIGGERED: Replayed Token RT-1 was already marked USED!'
  },
  {
    step: 4,
    title: '4. Automatic Token Family Invalidation & Lockdown',
    actor: '🛡️ Auth Server Security Engine',
    action: 'Auth server revokes ALL tokens under family_id = "fam_100". Attacker is blocked (403), victim is forced to re-login.',
    dbState: 'UPDATE user_sessions SET is_revoked = TRUE WHERE family_id = \'fam_100\';\nSET user:usr_404:compromised 1 EX 900;\n-- Security webhook dispatches MFA reset email to victim',
    tokenFamilyState: {
      rt1: { label: 'RT-1 (Revoked)', status: 'REVOKED', color: '#f87171' },
      rt2: { label: 'RT-2 (Auto-Revoked for Safety)', status: 'REVOKED', color: '#f87171' }
    },
    securityAlert: '🛡️ CONTAINMENT COMPLETE: Entire Token Family revoked. Attacker locked out. Incident contained.'
  }
];

export default function TokenTheftContainmentDiagram(): React.JSX.Element {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const current = STEPS[activeStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .theft-grid {
          display: grid;
          grid-template-columns: 42% 58%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .theft-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Refresh Token Rotation (RTR) Theft Detection & Family Invalidation
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', fontWeight: 600 }}>
          Theft Simulation
        </span>
      </div>

      {/* Main Body */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
          Under <strong>Refresh Token Rotation (RTR)</strong>, every token can be used exactly once. Step through the simulation below to see what happens when an attacker attempts to replay a stolen, already-rotated refresh token ($RT_1$):
        </div>

        <div className="theft-grid">
          {/* Left Column: Timeline Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setActiveStepIdx(idx)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${activeStepIdx === idx ? (s.step >= 3 ? '#f87171' : '#34d399') : 'var(--ifm-color-emphasis-300)'}`,
                  background: activeStepIdx === idx ? (s.step >= 3 ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)') : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: activeStepIdx === idx ? (s.step >= 3 ? '#f87171' : '#34d399') : 'var(--ifm-color-content)' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  {s.actor}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Active Simulation Panel */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: current.step >= 3 ? '#f8717120' : '#34d39920', color: current.step >= 3 ? '#f87171' : '#34d399' }}>
                STAGE {current.step} OF 4
              </span>
              <h4 style={{ margin: 0, fontSize: '14px', color: current.step >= 3 ? '#f87171' : 'var(--ifm-color-content)' }}>
                {current.title}
              </h4>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.action}
            </p>

            {/* Token Family Tree State */}
            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px' }}>
                Token Family Lineage (family_id: &quot;fam_100&quot;)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '8px' }}>
                <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: `1px solid ${current.tokenFamilyState.rt1.color}`, fontSize: '11px' }}>
                  <div style={{ fontWeight: 600 }}>{current.tokenFamilyState.rt1.label}</div>
                  <div style={{ color: current.tokenFamilyState.rt1.color, fontWeight: 700, fontSize: '10px', marginTop: '2px' }}>
                    STATUS: {current.tokenFamilyState.rt1.status}
                  </div>
                </div>
                <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: `1px solid ${current.tokenFamilyState.rt2.color}`, fontSize: '11px' }}>
                  <div style={{ fontWeight: 600 }}>{current.tokenFamilyState.rt2.label}</div>
                  <div style={{ color: current.tokenFamilyState.rt2.color, fontWeight: 700, fontSize: '10px', marginTop: '2px' }}>
                    STATUS: {current.tokenFamilyState.rt2.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Database & Redis Execution */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              Database / Security Execution:
            </div>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', border: '1px solid var(--ifm-color-emphasis-300)' }}>
              <code>{current.dbState}</code>
            </pre>

            {/* Security Alert Banner */}
            {current.securityAlert && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', background: 'rgba(248, 113, 113, 0.12)', border: '1px solid #f87171', fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                {current.securityAlert}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
