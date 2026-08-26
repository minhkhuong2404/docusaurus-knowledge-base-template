import React, { useState } from 'react';

type ApproachId = 'client-only' | 'global-bump' | 'blind-blacklist' | 'device-scoped';

interface Approach {
  id: ApproachId;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  mechanism: string;
  securityVerdict: 'CRITICAL_VULNERABILITY' | 'TERRIBLE_UX' | 'PERFECT_HYBRID';
  userExperience: string;
  simulation: {
    mobileStatus: string;
    mobileColor: string;
    laptopStatus: string;
    laptopColor: string;
    hackerStatus: string;
    hackerColor: string;
  };
}

const APPROACHES: Approach[] = [
  {
    id: 'client-only',
    title: '1. Client-Side Only Logout (Naive)',
    badge: 'HIGH RISK ❌',
    badgeColor: '#f87171',
    description: 'Client simply deletes the JWT from localStorage or client cookie. Server is never notified.',
    mechanism: 'No backend API call. Zero server-side state.',
    securityVerdict: 'CRITICAL_VULNERABILITY',
    userExperience: 'User appears logged out on phone, but token remains fully valid on disk/network.',
    simulation: {
      mobileStatus: 'Cookie Cleared (Fake Logout)',
      mobileColor: '#fbbf24',
      laptopStatus: 'Still Logged In',
      laptopColor: '#34d399',
      hackerStatus: 'Attacker STILL has full API access! 🚨',
      hackerColor: '#f87171'
    }
  },
  {
    id: 'global-bump',
    title: '2. Global User Version Bump (token_version + 1)',
    badge: 'TERRIBLE UX ❌',
    badgeColor: '#fbbf24',
    description: 'Backend increments user.token_version in database to invalidate the token.',
    mechanism: 'UPDATE users SET token_version = token_version + 1 WHERE id = :uid;',
    securityVerdict: 'TERRIBLE_UX',
    userExperience: 'Logging out of Mobile immediately logs user out of Laptop, Tablet, and Work Desktop!',
    simulation: {
      mobileStatus: 'Logged Out',
      mobileColor: '#f87171',
      laptopStatus: 'FORCE LOGGED OUT (Collateral Damage) ❌',
      laptopColor: '#f87171',
      hackerStatus: 'Attacker Blocked',
      hackerColor: '#34d399'
    }
  },
  {
    id: 'blind-blacklist',
    title: '3. Blind User Blacklist (user_id in Redis)',
    badge: 'COLLATERAL DAMAGE ❌',
    badgeColor: '#fbbf24',
    description: 'API Gateway blacklists the raw user_id in Redis without device scoping.',
    mechanism: 'SETEX blacklist:user:usr_404 900 "logged_out"',
    securityVerdict: 'TERRIBLE_UX',
    userExperience: 'All devices belonging to the user are blocked at the gateway simultaneously.',
    simulation: {
      mobileStatus: 'Logged Out',
      mobileColor: '#f87171',
      laptopStatus: 'BLOCKED AT GATEWAY (401 Unauthorized) ❌',
      laptopColor: '#f87171',
      hackerStatus: 'Attacker Blocked',
      hackerColor: '#34d399'
    }
  },
  {
    id: 'device-scoped',
    title: '4. Device-Scoped Session Registry (Production Standard)',
    badge: 'RECOMMENDED ✅',
    badgeColor: '#34d399',
    description: 'Each device gets its own device_id / session_id. Logout revokes only the targeted session.',
    mechanism: 'HDEL user:usr_404:sessions sess_mob_101; and mark session is_revoked in DB.',
    securityVerdict: 'PERFECT_HYBRID',
    userExperience: 'Mobile is cleanly logged out. Laptop and Tablet remain 100% active and uninterrupted!',
    simulation: {
      mobileStatus: 'Cleanly Logged Out ✅',
      mobileColor: '#34d399',
      laptopStatus: 'STILL ACTIVE & UNINTERRUPTED ✅',
      laptopColor: '#34d399',
      hackerStatus: 'Attacker on Mobile session BLOCKED ✅',
      hackerColor: '#34d399'
    }
  }
];

export default function JwtCoreDilemmaDiagram(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<ApproachId>('device-scoped');

  const current = APPROACHES.find((a) => a.id === selectedId) ?? APPROACHES[3];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .dilemma-grid {
          display: grid;
          grid-template-columns: 48% 52%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dilemma-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Stateless JWT vs Multi-Device Control Dilemma
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
          Interactive Comparison
        </span>
      </div>

      {/* Main Body */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
          Click an approach below to simulate what happens when a user logs out of their <strong>Mobile Phone</strong> while also having an active session on their <strong>Laptop</strong>:
        </div>

        <div className="dilemma-grid">
          {/* Left Column: Approach Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {APPROACHES.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedId(app.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${selectedId === app.id ? app.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
                  background: selectedId === app.id ? `${app.badgeColor}15` : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: selectedId === app.id ? app.badgeColor : 'var(--ifm-color-content)' }}>
                    {app.title}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${app.badgeColor}25`, color: app.badgeColor }}>
                    {app.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  {app.description}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Live Simulation Outcome */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: current.badgeColor }} />
              <h4 style={{ margin: 0, fontSize: '14px', color: current.badgeColor }}>
                Simulation: Logout Triggered on Mobile Phone
              </h4>
            </div>

            {/* Device Impact Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {/* Mobile Card */}
              <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: `3px solid ${current.simulation.mobileColor}`, fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong>📱 User&apos;s Mobile Phone (Initiator):</strong>
                  <span style={{ fontWeight: 700, color: current.simulation.mobileColor }}>{current.simulation.mobileStatus}</span>
                </div>
              </div>

              {/* Laptop Card */}
              <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: `3px solid ${current.simulation.laptopColor}`, fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong>💻 User&apos;s Laptop Session:</strong>
                  <span style={{ fontWeight: 700, color: current.simulation.laptopColor }}>{current.simulation.laptopStatus}</span>
                </div>
              </div>

              {/* Hacker Card */}
              <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: `3px solid ${current.simulation.hackerColor}`, fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong>🕵️ Attacker (Holding Stolen Token):</strong>
                  <span style={{ fontWeight: 700, color: current.simulation.hackerColor }}>{current.simulation.hackerStatus}</span>
                </div>
              </div>
            </div>

            {/* Backend Mechanism Box */}
            <div style={{ padding: '10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px', fontFamily: 'monospace', color: 'var(--ifm-color-content)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>Under-the-Hood Mechanism:</div>
              <code>{current.mechanism}</code>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              <strong>Verdict:</strong> {current.userExperience}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
