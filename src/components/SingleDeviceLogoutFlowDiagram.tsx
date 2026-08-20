import React, { useState } from 'react';

interface Step {
  num: number;
  title: string;
  from: string;
  to: string;
  action: string;
  code: string;
  color: string;
}

const STEPS: Step[] = [
  {
    num: 1,
    title: '1. Mobile Client Submits Logout',
    from: '📱 Mobile Phone (Device A)',
    to: '🛡️ Auth Service / Gateway',
    action: 'Sends POST /auth/logout carrying refresh_token cookie and session_id = "sess_mob_101".',
    code: 'POST /api/v1/auth/logout\nHeaders: { Authorization: "Bearer <jwt>", Cookie: "refresh_token=rt_mob_..." }\nBody: { sessionId: "sess_mob_101", deviceId: "dev_mob_91a" }',
    color: '#38bdf8'
  },
  {
    num: 2,
    title: '2. Scoped Session Registry Deletion',
    from: '🛡️ Auth Service',
    to: '🗄️ Database & Redis Session Map',
    action: 'Deletes only sess_mob_101 from Redis and marks is_revoked = true in DB. Does NOT touch other devices.',
    code: '// Redis: Delete mobile session key\nawait redis.hDel("user:usr_404:sessions", "sess_mob_101");\n\n// PostgreSQL: Revoke single record\nUPDATE user_sessions SET is_revoked = TRUE\nWHERE user_id = \'usr_404\' AND session_id = \'sess_mob_101\';',
    color: '#34d399'
  },
  {
    num: 3,
    title: '3. Optional Access Token Blacklist',
    from: '🛡️ Auth Service',
    to: '⚡ Redis Fast Blacklist',
    action: 'Pushes mobile access token JTI to Redis blacklist with TTL equal to remaining access token lifespan (e.g., 600s).',
    code: 'if (token.jti) {\n  await redis.setEx(`blacklist:jti:${token.jti}`, 600, "logged_out");\n}',
    color: '#fbbf24'
  },
  {
    num: 4,
    title: '4. Clear Client Cookies & Confirm',
    from: '🛡️ Auth Service',
    to: '📱 Mobile Phone (Device A)',
    action: 'Returns HTTP 200 with Set-Cookie: refresh_token=; Max-Age=0. Mobile is cleanly logged out.',
    code: 'HTTP/1.1 200 OK\nSet-Cookie: refresh_token=; Path=/api/v1/auth/refresh; Max-Age=0; HttpOnly; Secure\n\n{ "success": true, "message": "Logged out of this device" }',
    color: '#38bdf8'
  },
  {
    num: 5,
    title: '5. Laptop & Tablet Status Check',
    from: '💻 Laptop & 📱 Tablet',
    to: '🛡️ API Gateway',
    action: 'Laptop and Tablet make subsequent API and refresh calls without any disruption. Their sessions remain 100% active!',
    code: '// Laptop request: Authorization: Bearer <laptop_jwt>\n// Gateway checks: session sess_lap_202 exists in Redis ➔ 200 OK ✅\n// Refresh cycle: rt_lap_v1 rotates to rt_lap_v2 cleanly ✅',
    color: '#a78bfa'
  }
];

export default function SingleDeviceLogoutFlowDiagram(): React.JSX.Element {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const step = STEPS[activeStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .logout-grid {
          display: grid;
          grid-template-columns: 42% 58%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .logout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Single-Device Isolated Logout Execution Flow
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: 600 }}>
          Step-by-Step Sequence
        </span>
      </div>

      {/* Main Body */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
          Step through the sequence below to see how logging out on <strong>Mobile Phone</strong> cleanly purges its session without affecting <strong>Laptop</strong> or <strong>Tablet</strong>:
        </div>

        <div className="logout-grid">
          {/* Left Column: Step Sequence Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STEPS.map((s, idx) => (
              <button
                key={s.num}
                onClick={() => setActiveStepIdx(idx)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${activeStepIdx === idx ? s.color : 'var(--ifm-color-emphasis-300)'}`,
                  background: activeStepIdx === idx ? `${s.color}15` : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: activeStepIdx === idx ? s.color : 'var(--ifm-color-content)' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  {s.from} ➔ {s.to}
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Active Step Details & Code Inspector */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${step.color}20`, color: step.color }}>
                STEP {step.num} OF 5
              </span>
              <h4 style={{ margin: 0, fontSize: '14px', color: step.color }}>
                {step.title}
              </h4>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {step.action}
            </p>

            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              Payload / Database Execution:
            </div>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', border: '1px solid var(--ifm-color-emphasis-300)' }}>
              <code>{step.code}</code>
            </pre>

            {/* Live State Summary */}
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid #34d399', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong style={{ color: '#34d399' }}>Device Status:</strong> Mobile Phone = <strong>LOGGED OUT 🚪</strong> | Laptop = <strong>ACTIVE ✅</strong> | Tablet = <strong>ACTIVE ✅</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
