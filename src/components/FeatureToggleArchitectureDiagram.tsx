import React, { useState } from 'react';

type ToggleTab = 'evaluator' | 'canary' | 'killswitch' | 'types';

export default function FeatureToggleArchitectureDiagram({ initialTab = 'evaluator' }: { initialTab?: ToggleTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ToggleTab>(initialTab);
  const [rolloutPct, setRolloutPct] = useState<number>(20);
  const [testUserId, setTestUserId] = useState<string>('user_8821');
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');

  // Simple deterministic hash simulation
  const calculateBucket = (uid: string): number => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = (hash << 5) - hash + uid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  };

  const userBucket = calculateBucket(testUserId);
  const isEnrolledByHash = userBucket < rolloutPct;
  const isFeatureActive = !killSwitchActive && (isEnrolledByHash || userPlan === 'enterprise');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .ft-2col {
            grid-template-columns: 1fr !important;
          }
          .ft-tab-btn {
            font-size: 11px !important;
            padding: 5px 8px !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
          <circle cx="16" cy="12" r="3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Feature Flag Evaluation Engine &amp; Dynamic Rollout Simulator
        </span>

        {/* Tab Switcher */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'evaluator', label: '🧪 1. Evaluation Engine', color: '#38bdf8' },
            { id: 'canary', label: '🎚️ 2. Percentage Rollout', color: '#2dd4bf' },
            { id: 'killswitch', label: '🚨 3. Emergency Kill Switch', color: '#f87171' },
            { id: 'types', label: '📋 4. Toggle Types', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              className="ft-tab-btn"
              onClick={() => setActiveTab(t.id as ToggleTab)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                background: activeTab === t.id ? `${t.color}22` : 'rgba(255,255,255,0.03)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* TAB 1: EVALUATION ENGINE */}
        {activeTab === 'evaluator' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              How the in-memory Flag Evaluator determines feature availability in sub-millisecond latency using local rule caching.
            </div>

            {/* SVG Visual Flow */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 760 210" className="interactive-diagram-svg">
                <defs>
                  <marker id="ft-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                  <marker id="ft-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                  <marker id="ft-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
                </defs>

                {/* Incoming Request */}
                <g transform="translate(30, 45)">
                  <rect width="140" height="120" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="70" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">INCOMING REQUEST</text>
                  <line x1="12" y1="32" x2="128" y2="32" stroke="rgba(255,255,255,0.1)" />
                  <text x="20" y="52" fill="var(--ifm-color-content)" fontSize="9">User: {testUserId}</text>
                  <text x="20" y="70" fill="var(--ifm-color-content)" fontSize="9">Plan: {userPlan.toUpperCase()}</text>
                  <text x="20" y="88" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Bucket: {userBucket}%</text>
                  <text x="20" y="106" fill="#86efac" fontSize="8">Geo: US-East</text>
                </g>

                {/* Arrow to Evaluator */}
                <path d="M 170 105 L 235 105" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#ft-blue)" className="interactive-diagram-flowing-path" />

                {/* Flag Evaluator Engine */}
                <g transform="translate(240, 30)">
                  <rect width="210" height="150" rx="10" fill="rgba(45, 212, 191, 0.12)" stroke="#2dd4bf" strokeWidth="2" />
                  <text x="105" y="24" textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="800">FLAG EVALUATOR (IN-MEMORY)</text>
                  <line x1="15" y1="32" x2="195" y2="32" stroke="rgba(255,255,255,0.1)" />

                  <rect x="15" y="44" width="180" height="26" rx="4" fill="rgba(255,255,255,0.04)" />
                  <text x="25" y="60" fill="#fbbf24" fontSize="9">1. Kill Switch Check: {killSwitchActive ? 'TRIGGERED 🚨' : 'OFF (OK)'}</text>

                  <rect x="15" y="76" width="180" height="26" rx="4" fill="rgba(255,255,255,0.04)" />
                  <text x="25" y="92" fill="#38bdf8" fontSize="9">2. Plan Rule: enterprise ➔ ALWAYS ON</text>

                  <rect x="15" y="108" width="180" height="26" rx="4" fill="rgba(255,255,255,0.04)" />
                  <text x="25" y="124" fill="#34d399" fontSize="9">3. Hash Bucket &lt; {rolloutPct}% ➔ {isEnrolledByHash ? 'MATCH' : 'SKIP'}</text>
                </g>

                {/* Arrow to Execution Result */}
                <path d="M 450 105 L 530 105" stroke={isFeatureActive ? '#34d399' : '#f87171'} strokeWidth="2" markerEnd="url(#ft-green)" className="interactive-diagram-flowing-path" />

                {/* Execution Branch */}
                <g transform="translate(535, 45)">
                  <rect width="185" height="120" rx="8" fill={isFeatureActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.12)'} stroke={isFeatureActive ? '#34d399' : '#f87171'} strokeWidth={2} />
                  <text x="92" y="26" textAnchor="middle" fill={isFeatureActive ? '#34d399' : '#f87171'} fontSize="11" fontWeight="800">
                    {isFeatureActive ? '✅ NEW CODE PATH (V2)' : '🛡️ LEGACY FALLBACK (V1)'}
                  </text>
                  <line x1="15" y1="36" x2="170" y2="36" stroke="rgba(255,255,255,0.1)" />
                  <text x="92" y="62" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">
                    {isFeatureActive ? 'New React Checkout Modal' : 'Standard Checkout Form'}
                  </text>
                  <text x="92" y="84" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">
                    {isFeatureActive ? 'Stripe Elements SDK' : 'Legacy Payment Gateway'}
                  </text>
                  <text x="92" y="105" textAnchor="middle" fill={isFeatureActive ? '#86efac' : '#fca5a5'} fontSize="9" fontWeight="700">
                    Latency: &lt;0.05ms (Local RAM)
                  </text>
                </g>
              </svg>
            </div>

            {/* Interactive Control Panel */}
            <div className="ft-2col" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>Test Context Controls</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>User ID:</span>
                  <input
                    type="text"
                    value={testUserId}
                    onChange={e => setTestUserId(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#38bdf8', padding: '3px 8px', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#fbbf24' }}>➔ Bucket #{userBucket}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tier:</span>
                  {(['free', 'pro', 'enterprise'] as const).map(tier => (
                    <button
                      key={tier}
                      onClick={() => setUserPlan(tier)}
                      style={{
                        padding: '3px 8px', fontSize: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                        background: userPlan === tier ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                        color: userPlan === tier ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                        fontWeight: 700
                      }}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>Active Evaluation Result</div>
                <div style={{ fontSize: '12px', color: isFeatureActive ? '#34d399' : '#f87171', fontWeight: 800 }}>
                  Feature Status: {isFeatureActive ? 'ENABLED (Showing New Feature)' : 'DISABLED (Showing Fallback)'}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  Reason: {killSwitchActive ? 'Emergency kill switch is engaged.' : userPlan === 'enterprise' ? 'Enterprise plan overrides percentage rule.' : isEnrolledByHash ? `User bucket (${userBucket}) is within current rollout (${rolloutPct}%).` : `User bucket (${userBucket}) exceeds rollout threshold (${rolloutPct}%).`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERCENTAGE ROLLOUT */}
        {activeTab === 'canary' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Simulate Canary percentage rollouts using consistent hashing: <code>murmurhash3(flagKey + ":" + userId) % 100 &lt; rolloutPercentage</code>.
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(45, 212, 191, 0.2)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2dd4bf' }}>Rollout Percentage: {rolloutPct}%</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 5, 25, 50, 100].map(p => (
                    <button
                      key={p}
                      onClick={() => setRolloutPct(p)}
                      style={{
                        padding: '3px 8px', fontSize: '10.5px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                        background: rolloutPct === p ? 'rgba(45,212,191,0.25)' : 'rgba(255,255,255,0.05)',
                        color: rolloutPct === p ? '#2dd4bf' : 'var(--ifm-color-content-secondary)',
                        fontWeight: 700
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={rolloutPct}
                onChange={e => setRolloutPct(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />

              {/* Progress Visualizer */}
              <div style={{ height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '7px', marginTop: '10px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${rolloutPct}%`, background: '#2dd4bf', transition: 'width 0.2s ease' }} />
                <div style={{ width: `${100 - rolloutPct}%`, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', background: 'rgba(45, 212, 191, 0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(45, 212, 191, 0.15)' }}>
              💎 <strong>Consistent Hashing Invariant:</strong> If user <code>user_8821</code> is enrolled at 20%, they are mathematically guaranteed to remain enrolled when rollout advances to 25%, 50%, or 100%. A user never flip-flops between versions across requests!
            </div>
          </div>
        )}

        {/* TAB 3: EMERGENCY KILL SWITCH */}
        {activeTab === 'killswitch' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Test how Ops/SRE teams use a Feature Flag as a Circuit Breaker to instantly cut traffic to a degraded third-party provider without deploying code.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: killSwitchActive ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.12)', borderRadius: '8px', border: `1px solid ${killSwitchActive ? '#f87171' : '#34d399'}`, marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: killSwitchActive ? '#f87171' : '#34d399' }}>
                  {killSwitchActive ? '🚨 EMERGENCY KILL SWITCH ENGAGED' : '✅ SYSTEM RUNNING NORMALLY'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  {killSwitchActive ? 'All traffic forced to fallback payment gateway. Downstream outage contained.' : 'Normal routing through high-efficiency primary integration.'}
                </div>
              </div>

              <button
                onClick={() => setKillSwitchActive(!killSwitchActive)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '12px',
                  background: killSwitchActive ? '#34d399' : '#f87171',
                  color: '#000',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                {killSwitchActive ? 'RESTORE TRAFFIC' : 'PULL KILL SWITCH 🚨'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TOGGLE TYPES */}
        {activeTab === 'types' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }} className="ft-2col">
              {[
                { name: '1. Release Toggle', life: 'Days ➔ Weeks', owner: 'Dev Team', color: '#38bdf8', desc: 'Hides unfinished code in Trunk-Based Development. Must be deleted shortly after 100% rollout.' },
                { name: '2. Experiment Toggle', life: 'A/B Test Window', owner: 'Product & Data', color: '#2dd4bf', desc: 'A/B testing user flows with statistical significance tracking. Retired once winning variant is picked.' },
                { name: '3. Ops / Circuit Breaker', life: 'Permanent / Months', owner: 'SRE / Ops', color: '#f87171', desc: 'Emergency switch to disable non-essential features (e.g. comments, recommendations) during Black Friday load.' },
                { name: '4. Permission Toggle', life: 'Permanent', owner: 'Product / Sales', color: '#fbbf24', desc: 'Entitlements for SaaS tiers (e.g. SSO enabled for Enterprise plan, CSV export for Pro plan).' }
              ].map((item, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: `1px solid ${item.color}30` }}>
                  <div style={{ color: item.color, fontWeight: 700, fontSize: '12.5px', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '6px' }}>Lifetime: <strong>{item.life}</strong> · Owner: <strong>{item.owner}</strong></div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
