import React, { useState } from 'react';

type Mode = 'flow' | 'confused_deputy';

export default function AwsIamCrossAccountRoleDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('flow');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          AWS IAM: Cross-Account Role Assumption &amp; STS Delegation
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setMode('flow')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${mode === 'flow' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
              background: mode === 'flow' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.04)',
              color: mode === 'flow' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              fontWeight: mode === 'flow' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🔄 1. Cross-Account AssumeRole Flow
          </button>
          <button
            onClick={() => setMode('confused_deputy')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${mode === 'confused_deputy' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
              background: mode === 'confused_deputy' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
              color: mode === 'confused_deputy' ? '#f59e0b' : 'var(--ifm-color-content-secondary)',
              fontWeight: mode === 'confused_deputy' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🛡️ 2. Confused Deputy (ExternalId)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          {mode === 'flow' ? (
            <svg viewBox="0 0 760 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="iam-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                <marker id="iam-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#a78bfa" /></marker>
                <marker id="iam-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              {/* Account A */}
              <g transform="translate(30, 30)">
                <rect width="210" height="155" rx="8" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="105" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">Account A (Source: 111111111111)</text>

                <g transform="translate(15, 45)">
                  <rect width="180" height="90" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="90" y="22" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">EC2 Workload</text>
                  <text x="90" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="9">Attached: Role A</text>
                  <text x="90" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8.5">Calls sts:AssumeRole</text>
                  <text x="90" y="74" textAnchor="middle" fill="#86efac" fontSize="8">Receives Temp Creds (1hr)</text>
                </g>
              </g>

              {/* AWS STS */}
              <g transform="translate(290, 50)">
                <rect width="170" height="110" rx="8" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="85" y="26" textAnchor="middle" fill="#a78bfa" fontSize="11.5" fontWeight="800">AWS STS Service</text>
                <text x="85" y="48" textAnchor="middle" fill="#c4b5fd" fontSize="9">Validates Trust Policy</text>
                <text x="85" y="66" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">Checks ExternalId</text>
                <text x="85" y="86" textAnchor="middle" fill="#86efac" fontSize="8.5">Mints SessionToken</text>
              </g>

              {/* Account B */}
              <g transform="translate(510, 30)">
                <rect width="220" height="155" rx="8" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="1.5" />
                <text x="110" y="24" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">Account B (Target: 222222222222)</text>

                <g transform="translate(15, 45)">
                  <rect width="190" height="90" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="#34d399" strokeWidth="1" />
                  <text x="95" y="20" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">CrossAccountRole</text>
                  <text x="95" y="38" textAnchor="middle" fill="#86efac" fontSize="8.5">Trust: Principal = Acct A</text>
                  <text x="95" y="54" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">Permissions Policy:</text>
                  <text x="95" y="72" textAnchor="middle" fill="#fcd34d" fontSize="8.5">s3:GetObject on Bucket B</text>
                </g>
              </g>

              {/* Arrows */}
              <path d="M 225 90 L 285 90" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#iam-blue)" className="interactive-diagram-flowing-path" />
              <path d="M 460 90 L 505 90" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#iam-purple)" />
              <path d="M 285 125 L 225 125" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#iam-green)" />
            </svg>
          ) : (
            <svg viewBox="0 0 760 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="cd-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f87171" /></marker>
                <marker id="cd-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              <g transform="translate(40, 40)">
                <rect width="200" height="130" rx="8" fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" strokeWidth="1.5" />
                <text x="100" y="24" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Attacker Account C</text>
                <text x="100" y="48" textAnchor="middle" fill="#fca5a5" fontSize="9">Knows Role ARN of Acct B</text>
                <text x="100" y="70" textAnchor="middle" fill="#94a3b8" fontSize="8.5">Tricks 3rd-party SaaS</text>
                <text x="100" y="86" textAnchor="middle" fill="#ef4444" fontSize="8.5">to assume Victim's Role</text>
              </g>

              <g transform="translate(290, 40)">
                <rect width="180" height="130" rx="8" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="90" y="24" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">3rd-Party SaaS Service</text>
                <text x="90" y="48" textAnchor="middle" fill="#fcd34d" fontSize="9">The "Deputy" (AWS Account)</text>
                <text x="90" y="75" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">Requires Secret ExternalId</text>
                <text x="90" y="92" textAnchor="middle" fill="#86efac" fontSize="8.5">"ExternalId": "cust-abc-789"</text>
              </g>

              <g transform="translate(520, 40)">
                <rect width="200" height="130" rx="8" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" strokeWidth="1.5" />
                <text x="100" y="24" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Victim Account B</text>
                <text x="100" y="48" textAnchor="middle" fill="#86efac" fontSize="9">Trust Policy Condition:</text>
                <text x="100" y="72" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">sts:ExternalId == "cust-abc-789"</text>
                <text x="100" y="92" textAnchor="middle" fill="#34d399" fontSize="8.5">Attack Blocked! 🛡️</text>
              </g>

              <path d="M 240 85 L 285 85" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#cd-red)" />
              <path d="M 470 85 L 515 85" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#cd-green)" className="interactive-diagram-flowing-path" />
            </svg>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '6px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <strong style={{ color: '#a78bfa', fontSize: '11px' }}>Trust Policy vs Permission Policy:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              The <strong>Trust Policy</strong> defines <em>who</em> can assume the role (e.g. Account A). The <strong>Permission Policy</strong> defines <em>what</em> actions the assumed role can perform in Account B.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <strong style={{ color: '#f59e0b', fontSize: '11px' }}>ExternalId Prevents Confused Deputy:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              When letting a multi-tenant SaaS access your AWS resources, always require an <code>sts:ExternalId</code> in the trust policy condition. This ensures third-party accounts cannot spoof your role ARN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
