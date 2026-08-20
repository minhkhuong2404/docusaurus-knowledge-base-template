import React, { useState } from 'react';

type ScenarioType = 'multi-login' | 'single-logout' | 'global-logout' | 'account-locked' | 'compromise-theft';

interface DeviceState {
  id: string;
  name: string;
  icon: string;
  deviceId: string;
  sessionId: string;
  tokenVersion: number;
  status: 'ACTIVE' | 'LOGGED_OUT' | 'LOCKED' | 'COMPROMISED';
  refreshToken: string;
  color: string;
}

const INITIAL_DEVICES: DeviceState[] = [
  {
    id: 'mobile',
    name: 'iPhone 15 Pro (Safari Mobile)',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    deviceId: 'dev_mobile_91a',
    sessionId: 'sess_mob_101',
    tokenVersion: 1,
    status: 'ACTIVE',
    refreshToken: 'rt_mob_v1_...hash',
    color: '#38bdf8'
  },
  {
    id: 'laptop',
    name: 'MacBook Pro (Chrome Desktop)',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    deviceId: 'dev_laptop_44b',
    sessionId: 'sess_lap_202',
    tokenVersion: 1,
    status: 'ACTIVE',
    refreshToken: 'rt_lap_v1_...hash',
    color: '#34d399'
  },
  {
    id: 'tablet',
    name: 'iPad Air (Native App)',
    icon: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    deviceId: 'dev_tablet_87c',
    sessionId: 'sess_tab_303',
    tokenVersion: 1,
    status: 'ACTIVE',
    refreshToken: 'rt_tab_v1_...hash',
    color: '#a78bfa'
  }
];

export default function JwtMultiDeviceSessionDiagram(): React.JSX.Element {
  const [scenario, setScenario] = useState<ScenarioType>('single-logout');
  const [activeStep, setActiveStep] = useState<number>(1);

  // Compute dynamic device states based on active scenario
  const getDeviceStatus = (dev: DeviceState) => {
    if (scenario === 'multi-login') {
      return { status: 'ACTIVE', badge: 'ACTIVE', badgeColor: '#34d399', desc: 'Independent session & refresh token' };
    }
    if (scenario === 'single-logout') {
      if (dev.id === 'mobile') {
        return { status: 'LOGGED_OUT', badge: 'LOGGED OUT', badgeColor: '#f87171', desc: 'Session sess_mob_101 deleted. Token revoked.' };
      }
      return { status: 'ACTIVE', badge: 'STILL ACTIVE', badgeColor: '#34d399', desc: 'Unaffected! User remains logged in.' };
    }
    if (scenario === 'global-logout') {
      return { status: 'LOGGED_OUT', badge: 'FORCE LOGGED OUT', badgeColor: '#f87171', desc: 'token_version bumped to v2. All sessions wiped.' };
    }
    if (scenario === 'account-locked') {
      return { status: 'LOCKED', badge: 'ACCOUNT LOCKED', badgeColor: '#fbbf24', desc: 'Redis lock flag active: All requests blocked with 403.' };
    }
    if (scenario === 'compromise-theft') {
      if (dev.id === 'mobile') {
        return { status: 'COMPROMISED', badge: 'THEFT DETECTED', badgeColor: '#f87171', desc: 'Stolen refresh token reused! Family auto-revoked.' };
      }
      return { status: 'LOGGED_OUT', badge: 'EMERGENCY QUARANTINE', badgeColor: '#f87171', desc: 'Emergency lockout triggered to protect account.' };
    }
    return { status: 'ACTIVE', badge: 'ACTIVE', badgeColor: '#34d399', desc: '' };
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .jwt-scenario-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .jwt-scenario-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .jwt-tab-pill {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Multi-Device JWT Lifecycle & Session Invalidation Engine
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
          Interactive Simulator
        </span>
      </div>

      {/* Scenario Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {[
          { id: 'single-logout', label: '1. Single-Device Logout (Isolated)', icon: '🚪' },
          { id: 'global-logout', label: '2. Global Logout / Password Change', icon: '🌐' },
          { id: 'account-locked', label: '3. Account Locked / Suspended', icon: '🔒' },
          { id: 'compromise-theft', label: '4. Token Theft & Compromise', icon: '🚨' },
          { id: 'multi-login', label: '5. Multi-Device Topology', icon: '📱' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setScenario(tab.id as ScenarioType);
              setActiveStep(1);
            }}
            className="jwt-tab-pill"
            style={{
              background: scenario === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              color: scenario === tab.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              borderColor: scenario === tab.id ? '#38bdf8' : 'var(--ifm-color-emphasis-300)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scenario Interactive Body */}
      <div style={{ padding: '18px' }}>
        <div className="jwt-scenario-grid">
          {/* Left Column: Device Cluster State */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
                User Devices (User ID: usr_404)
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>
                Active Sessions: {scenario === 'multi-login' ? 3 : scenario === 'single-logout' ? 2 : 0}
              </span>
            </div>

            {/* Devices Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {INITIAL_DEVICES.map((dev) => {
                const st = getDeviceStatus(dev);
                return (
                  <div
                    key={dev.id}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: 'var(--ifm-background-surface-color)',
                      border: `1px solid ${st.status === 'ACTIVE' ? '#34d399' : st.status === 'LOCKED' ? '#fbbf24' : '#f87171'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dev.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={dev.icon} />
                      </svg>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                        {dev.name}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${st.badgeColor}20`, color: st.badgeColor }}>
                        {st.badge}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '4px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                      <div>Device ID: <span style={{ color: 'var(--ifm-color-content)' }}>{dev.deviceId}</span></div>
                      <div>Session: <span style={{ color: 'var(--ifm-color-content)' }}>{dev.sessionId}</span></div>
                    </div>

                    <div style={{ fontSize: '11px', color: st.status === 'ACTIVE' ? '#34d399' : st.status === 'LOCKED' ? '#fbbf24' : '#f87171', marginTop: '4px' }}>
                      {st.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Redis / DB State Box */}
            <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '6px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px', fontFamily: 'monospace' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                SERVER-SIDE STATE (Redis & PostgreSQL):
              </div>
              {scenario === 'single-logout' && (
                <div>
                  <div style={{ color: '#f87171' }}>• DEL user:usr_404:session:sess_mob_101 ➔ OK</div>
                  <div style={{ color: '#34d399' }}>• user:usr_404:session:sess_lap_202 ➔ Active ✅</div>
                  <div style={{ color: '#34d399' }}>• user:usr_404:session:sess_tab_303 ➔ Active ✅</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>• user.token_version = 1 (Unchanged — other devices keep working!)</div>
                </div>
              )}
              {scenario === 'global-logout' && (
                <div>
                  <div style={{ color: '#f87171' }}>• DEL user:usr_404:session:* ➔ 3 keys deleted</div>
                  <div style={{ color: '#fbbf24' }}>• SET user:usr_404:revoked_before 1700000000 EX 900</div>
                  <div style={{ color: '#38bdf8' }}>• UPDATE users SET token_version = 2 WHERE id = &apos;usr_404&apos;</div>
                  <div style={{ color: '#f87171', marginTop: '4px' }}>• All existing access & refresh tokens immediately invalidated ❌</div>
                </div>
              )}
              {scenario === 'account-locked' && (
                <div>
                  <div style={{ color: '#fbbf24' }}>• SET user:usr_404:is_locked 1 EX 86400 (Redis instant flag)</div>
                  <div style={{ color: '#fbbf24' }}>• UPDATE users SET status = &apos;LOCKED&apos; WHERE id = &apos;usr_404&apos;</div>
                  <div style={{ color: '#f87171', marginTop: '4px' }}>• Gateway checks is_locked on EVERY API call ➔ Returns 403 Forbidden</div>
                </div>
              )}
              {scenario === 'compromise-theft' && (
                <div>
                  <div style={{ color: '#f87171' }}>• 🚨 REUSE DETECTED: Refresh token rt_mob_v1 reused!</div>
                  <div style={{ color: '#f87171' }}>• UPDATE refresh_tokens SET is_revoked = true WHERE family_id = &apos;fam_100&apos;</div>
                  <div style={{ color: '#fbbf24' }}>• SET user:usr_404:compromised 1 EX 900</div>
                  <div style={{ color: '#f87171', marginTop: '4px' }}>• Emergency lockout triggered + email security alert dispatched</div>
                </div>
              )}
              {scenario === 'multi-login' && (
                <div>
                  <div style={{ color: '#34d399' }}>• 3 independent sessions in refresh_tokens table</div>
                  <div style={{ color: '#34d399' }}>• Each session tracks device_id, token_hash, and family_id</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>• Access tokens carry (uid, deviceId, tokenVersion)</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Step-by-Step Sequence & Architectural Breakdown */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#38bdf8' }}>
              {scenario === 'single-logout' && 'Single-Device Logout Mechanics'}
              {scenario === 'global-logout' && 'Global Logout & Password Reset Flow'}
              {scenario === 'account-locked' && 'Zero-Latency Account Lock Engine'}
              {scenario === 'compromise-theft' && 'Token Family Theft Containment'}
              {scenario === 'multi-login' && 'Multi-Device Session Architecture'}
            </h4>

            {/* Explanation text */}
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              {scenario === 'single-logout' && 'When a user clicks "Logout" on their phone, only the phone session is terminated. Because tokens are scoped with a unique session_id / device_id in the database or Redis session registry, the laptop and tablet sessions continue operating without interruption.'}
              {scenario === 'global-logout' && 'When a user changes their password or clicks "Log out of all devices", the auth server increments token_version and sets a revoked_before timestamp in Redis. The API Gateway validates these claims on every request, closing the 15-minute access token gap.'}
              {scenario === 'account-locked' && 'When an admin locks an account or fraud algorithms detect suspicious activity, a Redis lock key is created. Even if access tokens are still within their 15-minute TTL, the API Gateway immediately rejects all requests from all devices with HTTP 403.'}
              {scenario === 'compromise-theft' && 'If an attacker steals an old refresh token and attempts to rotate it, the server detects that the token was ALREADY USED. The entire Token Family is revoked instantly, containing the attacker and logging out the victim for safety.'}
              {scenario === 'multi-login' && 'Modern multi-device authentication uses independent token pairs per device. Each device submits its device_id during login, and the backend maintains a 1-to-many relationship: 1 User ➔ N Devices ➔ N Token Families.'}
            </p>

            {/* Step Sequence Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scenario === 'single-logout' && [
                { step: '1. Client Request', desc: 'Mobile app sends POST /auth/logout with Refresh Token or session_id = "sess_mob_101".' },
                { step: '2. Scoped Revocation', desc: 'Auth service deletes only sess_mob_101 from Redis/DB. Does NOT touch other session records.' },
                { step: '3. Access Token Blacklisting', desc: 'Optional: Mobile access token jti is pushed to Redis blacklist with remaining 10m TTL.' },
                { step: '4. Laptop & Tablet Status', desc: 'Laptop and tablet access tokens remain valid; their refresh tokens continue rotating cleanly.' }
              ].map((s, idx) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '3px solid #34d399', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>{s.step}:</strong>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', marginTop: '2px' }}>{s.desc}</div>
                </div>
              ))}

              {scenario === 'global-logout' && [
                { step: '1. Password Reset Action', desc: 'User submits new password and selects "Log out of all devices".' },
                { step: '2. DB Version Increment', desc: 'UPDATE users SET password_hash = :newHash, token_version = token_version + 1 WHERE id = :uid;' },
                { step: '3. Redis Timestamp Cache', desc: 'SET user:revoked_before:usr_404 <now_epoch> EX 900 (matches 15-min JWT lifespan).' },
                { step: '4. Bulk Session Wipe', desc: 'DELETE FROM refresh_tokens WHERE user_id = :uid; (all devices must re-login).' }
              ].map((s, idx) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '3px solid #38bdf8', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>{s.step}:</strong>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', marginTop: '2px' }}>{s.desc}</div>
                </div>
              ))}

              {scenario === 'account-locked' && [
                { step: '1. Lock Event Triggered', desc: 'Risk scoring threshold breached or customer support freezes account.' },
                { step: '2. Fast-Path Redis Key', desc: 'SET user:locked:usr_404 1 EX 86400 (instant distributed cache propagation).' },
                { step: '3. Gateway Interception', desc: 'Gateway checks EXISTS user:locked:{uid}. If true, aborts immediately with 403 Forbidden.' },
                { step: '4. DB Audit Log', desc: 'Account status set to LOCKED; all refresh tokens marked is_revoked = true.' }
              ].map((s, idx) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '3px solid #fbbf24', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>{s.step}:</strong>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', marginTop: '2px' }}>{s.desc}</div>
                </div>
              ))}

              {scenario === 'compromise-theft' && [
                { step: '1. Hacker Uses Stolen Token', desc: 'Attacker submits already rotated refresh token rt_mob_v1 to /auth/refresh.' },
                { step: '2. Reuse Detection Tripwire', desc: 'Server checks DB: is_used == true for rt_mob_v1! This indicates token theft.' },
                { step: '3. Token Family Revocation', desc: 'Server instantly revokes ALL refresh tokens under family_id = "fam_100".' },
                { step: '4. Security Lockdown', desc: 'Security webhook alerts user via SMS/Email to reset password and verify active sessions.' }
              ].map((s, idx) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '3px solid #f87171', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>{s.step}:</strong>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', marginTop: '2px' }}>{s.desc}</div>
                </div>
              ))}

              {scenario === 'multi-login' && [
                { step: '1. Device Fingerprinting', desc: 'Client provides device_id, device_name, and client_type during /auth/login.' },
                { step: '2. Token Scoping', desc: 'Auth server generates unique session_id and signs access token with { sub, device_id, ver }.' },
                { step: '3. Session Registry', desc: 'Session saved to DB/Redis: refresh_tokens(id, user_id, device_id, family_id, token_hash).' },
                { step: '4. Independent Refresh Cycles', desc: 'Each device rotates its own refresh token without affecting other active devices.' }
              ].map((s, idx) => (
                <div key={idx} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '3px solid #a78bfa', fontSize: '12px' }}>
                  <strong style={{ color: 'var(--ifm-color-content)' }}>{s.step}:</strong>
                  <div style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', marginTop: '2px' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
