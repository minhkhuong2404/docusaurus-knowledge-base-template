import React, { useState } from 'react';

type Scenario = 'explicit_deny' | 'boundary_limit' | 'full_allow';

interface Step {
  num: number;
  title: string;
  desc: string;
  result: 'pass' | 'deny' | 'skip' | 'final_allow';
}

export default function AwsIamPolicyEvaluationDiagram(): React.JSX.Element {
  const [scenario, setScenario] = useState<Scenario>('full_allow');

  const getSteps = (): Step[] => {
    switch (scenario) {
      case 'explicit_deny':
        return [
          { num: 1, title: 'Default State', desc: 'Request begins in Implicit Deny status', result: 'pass' },
          { num: 2, title: 'Explicit Deny Check', desc: 'Policy contains explicit "Effect": "Deny" ➔ HALT', result: 'deny' },
          { num: 3, title: 'SCP Check', desc: 'Skipped due to prior explicit deny', result: 'skip' },
          { num: 4, title: 'Resource Policy', desc: 'Skipped', result: 'skip' },
          { num: 5, title: 'Permissions Boundary', desc: 'Skipped', result: 'skip' },
          { num: 6, title: 'Session Policy', desc: 'Skipped', result: 'skip' },
          { num: 7, title: 'Identity Policy', desc: 'Skipped', result: 'skip' }
        ];
      case 'boundary_limit':
        return [
          { num: 1, title: 'Default State', desc: 'Request begins in Implicit Deny status', result: 'pass' },
          { num: 2, title: 'Explicit Deny Check', desc: 'No explicit denies found across any attached policies', result: 'pass' },
          { num: 3, title: 'SCP Check', desc: 'Organization SCP allows requested action', result: 'pass' },
          { num: 4, title: 'Resource Policy', desc: 'No resource-based override in same account', result: 'pass' },
          { num: 5, title: 'Permissions Boundary', desc: 'Action NOT in boundary ceiling (s3:PutObject missing) ➔ HALT', result: 'deny' },
          { num: 6, title: 'Session Policy', desc: 'Skipped', result: 'skip' },
          { num: 7, title: 'Identity Policy', desc: 'Skipped', result: 'skip' }
        ];
      case 'full_allow':
      default:
        return [
          { num: 1, title: 'Default State', desc: 'Request begins in Implicit Deny status', result: 'pass' },
          { num: 2, title: 'Explicit Deny Check', desc: 'No explicit denies found', result: 'pass' },
          { num: 3, title: 'SCP Check', desc: 'Organization SCP allows action', result: 'pass' },
          { num: 4, title: 'Resource Policy', desc: 'Allowed or deferred to identity policy', result: 'pass' },
          { num: 5, title: 'Permissions Boundary', desc: 'Action falls within maximum ceiling permissions', result: 'pass' },
          { num: 6, title: 'Session Policy', desc: 'STS session policy permits action', result: 'pass' },
          { num: 7, title: 'Identity Policy', desc: 'IAM Policy has explicit "Effect": "Allow" ➔ GRANTED!', result: 'final_allow' }
        ];
    }
  };

  const steps = getSteps();

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          AWS IAM Policy Evaluation Engine (The 7-Step Decision Pipeline)
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setScenario('explicit_deny')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${scenario === 'explicit_deny' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
              background: scenario === 'explicit_deny' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.04)',
              color: scenario === 'explicit_deny' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              fontWeight: scenario === 'explicit_deny' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🛑 1. Explicit Deny Short-Circuit
          </button>
          <button
            onClick={() => setScenario('boundary_limit')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${scenario === 'boundary_limit' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
              background: scenario === 'boundary_limit' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.04)',
              color: scenario === 'boundary_limit' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              fontWeight: scenario === 'boundary_limit' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🚧 2. Permission Boundary Drop
          </button>
          <button
            onClick={() => setScenario('full_allow')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${scenario === 'full_allow' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              background: scenario === 'full_allow' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: scenario === 'full_allow' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: scenario === 'full_allow' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ✅ 3. Full Green Evaluation (Allow)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {steps.map((s) => {
            const isDeny = s.result === 'deny';
            const isPass = s.result === 'pass';
            const isFinal = s.result === 'final_allow';
            const isSkip = s.result === 'skip';

            const borderColor = isDeny ? '#f87171' : isFinal ? '#34d399' : isPass ? '#38bdf8' : 'rgba(255,255,255,0.08)';
            const bgColor = isDeny ? 'rgba(248, 113, 113, 0.12)' : isFinal ? 'rgba(52, 211, 153, 0.15)' : isPass ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.02)';
            const badgeText = isDeny ? 'DENIED 🛑' : isFinal ? 'ALLOWED ✅' : isPass ? 'PASSED ➜' : 'SKIPPED ⏸️';
            const badgeColor = isDeny ? '#f87171' : isFinal ? '#34d399' : isPass ? '#38bdf8' : '#64748b';

            return (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: bgColor,
                  opacity: isSkip ? 0.45 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isDeny ? '#f87171' : isFinal ? '#34d399' : isPass ? '#38bdf8' : '#475569',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '11px',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  {s.num}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                    {s.desc}
                  </div>
                </div>

                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: badgeColor,
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${borderColor}`
                }}>
                  {badgeText}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <strong style={{ color: '#38bdf8', fontSize: '11px' }}>Golden Evaluation Rule:</strong>
          <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginLeft: '6px' }}>
            All requests begin as <strong>Implicit Deny</strong>. A single explicit <code>"Effect": "Deny"</code> in <em>any</em> applicable policy immediately halts evaluation. To succeed, an explicit <code>"Effect": "Allow"</code> must be present, and no boundary or SCP may restrict it.
          </span>
        </div>
      </div>
    </div>
  );
}
