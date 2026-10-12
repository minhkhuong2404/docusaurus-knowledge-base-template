import React, { useState } from 'react';

interface ThreatScenario {
  id: string;
  name: string;
  type: string;
  signals: string[];
  severity: string;
  color: string;
  mitigation: string;
  psrImpact: string;
}

const THREAT_SCENARIOS: ThreatScenario[] = [
  {
    id: 'app_scam',
    name: 'Authorised Push Payment (APP) Scam',
    type: 'Social Engineering / Coercion',
    signals: [
      'Active voice call in progress during transaction (MNO signal)',
      'Unusually high hesitation time (>45s) on confirmation screen',
      'First-time beneficiary account created <48h ago',
      'Customer coached to bypass scam warnings via scripted responses'
    ],
    severity: 'CRITICAL',
    color: '#f87171',
    mitigation: 'Enforce mandatory 4-hour cooling-off hold + Biometric voice challenge before rail release.',
    psrImpact: 'Under UK PSR / Aus Scam-Safe Accord, sending and receiving FIs split 50/50 reimbursement liability.'
  },
  {
    id: 'ato_sim_swap',
    name: 'Account Takeover (ATO) via SIM Swap',
    type: 'Credential & Identity Compromise',
    signals: [
      'MNO CAMARA API reports SIM card swap within last 48 hours',
      'New device fingerprint (unknown canvas hash & IMEI)',
      'Immediate attempt to change contact info or drain daily limit',
      'Login from residential proxy / TOR exit node'
    ],
    severity: 'HIGH',
    color: '#fbbf24',
    mitigation: 'Block transaction immediately; freeze session tokens; require in-branch or certified identity re-verification.',
    psrImpact: 'Bank absorbs 100% loss under Regulation E / PSD2 for unauthorized transactions.'
  },
  {
    id: 'mule_ring',
    name: 'Money Mule Ring & Rapid Dissipation',
    type: 'FinCrime Laundering & Smurfing',
    signals: [
      'Inbound NPP instant transfer of $9,850 (just under $10,000 threshold)',
      '95% of incoming funds transferred out within 75 seconds across 4 accounts',
      'Account historically dormant (student account or recently purchased)',
      'Graph analysis links IP to 8 other accounts with similar rapid outflow'
    ],
    severity: 'CRITICAL',
    color: '#a78bfa',
    mitigation: 'Instantly lock destination account via Inbound Mule Heuristic; trigger emergency recall (pacs.004); file AUSTRAC SMR / FinCEN SAR.',
    psrImpact: 'Receiving bank faces regulatory fines and mandatory reimbursement for failing to intercept mule nodes.'
  },
  {
    id: 'synthetic_bustout',
    name: 'Synthetic Identity & Credit Bust-Out',
    type: 'First-Party / Identity Fabrication',
    signals: [
      'SSN/TFN issued recently but applicant claims 15-year credit history',
      'Address linked to commercial mail receiving agency (CMRA)',
      '12-month gradual credit limit seasoning with on-time payments',
      'Sudden simultaneous 100% credit line utilization across 5 cards in 48 hours'
    ],
    severity: 'HIGH',
    color: '#38bdf8',
    mitigation: 'Enforce credit line freezing, cross-bureau synthetic clustering, and demand physical biometric ID matching.',
    psrImpact: 'Credit write-off; requires reporting to national credit bureaus and fraud consortiums.'
  }
];

export default function BankingFinCrimeFraudDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'typologies' | 'simulator'>('pipeline');
  const [selectedThreat, setSelectedThreat] = useState<string>('app_scam');

  // Simulator State
  const [txCount5m, setTxCount5m] = useState<number>(1);
  const [txAmount, setTxAmount] = useState<number>(500);
  const [isNewPayee, setIsNewPayee] = useState<boolean>(false);
  const [activeCallDetected, setActiveCallDetected] = useState<boolean>(false);
  const [simSwapped, setSimSwapped] = useState<boolean>(false);

  // Compute Risk Score (0 - 1000)
  let calculatedScore = 50; // base risk
  if (isNewPayee) calculatedScore += 180;
  if (txCount5m > 3) calculatedScore += 220;
  if (txCount5m > 6) calculatedScore += 300;
  if (txAmount > 2000) calculatedScore += 150;
  if (txAmount > 10000) calculatedScore += 250;
  if (activeCallDetected) calculatedScore += 280;
  if (simSwapped) calculatedScore += 350;
  if (calculatedScore > 1000) calculatedScore = 1000;

  // Derive Policy Decision
  let decision = 'ALLOW';
  let decisionColor = '#34d399';
  let actionDesc = 'Instant rail dispatch (NPP / FedNow / Card Auth). Sub-50ms execution approved.';

  if (calculatedScore >= 750) {
    decision = 'HARD_BLOCK';
    decisionColor = '#f87171';
    actionDesc = 'Transaction aborted. Account frozen. Emergency alert routed to Tier-2 Fraud Ops + SAR/SMR queue.';
  } else if (calculatedScore >= 500) {
    decision = '24H_COOLING_HOLD';
    decisionColor = '#f97316';
    actionDesc = 'Outbound payment placed on 24-hour cooling-off hold. Push notification sent to payer with scam warning.';
  } else if (calculatedScore >= 250) {
    decision = 'STEP_UP_CHALLENGE';
    decisionColor = '#fbbf24';
    actionDesc = 'Trigger FIDO2 WebAuthn biometric challenge or in-app push verification with interactive scam questions.';
  }

  const activeThreatObj = THREAT_SCENARIOS.find(t => t.id === selectedThreat) || THREAT_SCENARIOS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @keyframes anim-flowing-fraud-path {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        .fraud-flowing-line {
          stroke-dasharray: 8, 4;
          animation: anim-flowing-fraud-path 1.2s linear infinite;
        }
        @media (max-width: 768px) {
          .fincrime-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          FinCrime Defense & Real-Time Fraud Intelligence Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '⚡ Real-Time In-Flight Pipeline (<50ms)', color: '#38bdf8' },
            { id: 'typologies', label: '🛡️ FinCrime Threat Typologies & Mules', color: '#a78bfa' },
            { id: 'simulator', label: '🧮 Multi-Signal Risk Score Simulator', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: REAL-TIME IN-FLIGHT PIPELINE */}
        {activeTab === 'pipeline' && (
          <div>
            <div style={{
              background: '#0d0f1e',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
                End-to-End Real-Time Ingress Scoring & Execution Flow (SLA &lt; 50ms)
              </div>

              {/* Responsive SVG Architecture Pipeline */}
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg viewBox="0 0 880 230" style={{ width: '100%', minWidth: '760px', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="marker-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker id="marker-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                    </marker>
                    <marker id="marker-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                    </marker>
                    <marker id="marker-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
                    </marker>
                  </defs>

                  {/* Node 1: Client Ingress */}
                  <rect x="10" y="70" width="130" height="75" rx="8" fill="#13172b" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="75" y="95" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">1. Client Ingress</text>
                  <text x="75" y="115" fill="#94a3b8" fontSize="10" textAnchor="middle">App / Web / API</text>
                  <text x="75" y="130" fill="#64748b" fontSize="9" textAnchor="middle">+ Device Telemetry</text>

                  {/* Flow 1 -> 2 */}
                  <line x1="140" y1="107" x2="185" y2="107" stroke="#38bdf8" strokeWidth="2" className="fraud-flowing-line" markerEnd="url(#marker-blue)" />

                  {/* Node 2: Streaming Feature Store */}
                  <rect x="195" y="55" width="160" height="105" rx="8" fill="#13172b" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="275" y="80" fill="#a78bfa" fontSize="12" fontWeight="700" textAnchor="middle">2. Feature Store</text>
                  <text x="275" y="100" fill="#e2e8f0" fontSize="10" textAnchor="middle">Flink + Redis Cluster</text>
                  <text x="275" y="120" fill="#94a3b8" fontSize="9" textAnchor="middle">Sliding Window Counters</text>
                  <text x="275" y="135" fill="#64748b" fontSize="9" textAnchor="middle">(5m, 1h, 24h, 7d velocity)</text>
                  <text x="275" y="150" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle">Read Latency: &lt; 5ms</text>

                  {/* Flow 2 -> 3 */}
                  <line x1="355" y1="107" x2="400" y2="107" stroke="#a78bfa" strokeWidth="2" className="fraud-flowing-line" markerEnd="url(#marker-purple)" />

                  {/* Node 3: Hybrid Scoring Engine */}
                  <rect x="410" y="40" width="180" height="135" rx="8" fill="#13172b" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="500" y="65" fill="#fbbf24" fontSize="12" fontWeight="700" textAnchor="middle">3. Hybrid Scoring</text>
                  <text x="500" y="85" fill="#e2e8f0" fontSize="10" textAnchor="middle">Ensemble Engine</text>
                  <text x="500" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle">• Rules Engine (Drools / DSL)</text>
                  <text x="500" y="120" fill="#94a3b8" fontSize="9" textAnchor="middle">• ML LightGBM (Score 0-1000)</text>
                  <text x="500" y="135" fill="#94a3b8" fontSize="9" textAnchor="middle">• Graph Entity Resolution</text>
                  <text x="500" y="155" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">Infer Latency: &lt; 15ms</text>

                  {/* Flow 3 -> 4 */}
                  <line x1="590" y1="107" x2="635" y2="107" stroke="#fbbf24" strokeWidth="2" className="fraud-flowing-line" markerEnd="url(#marker-blue)" />

                  {/* Node 4: Policy & Decision Orchestration */}
                  <rect x="645" y="45" width="220" height="125" rx="8" fill="#13172b" stroke="#34d399" strokeWidth="1.5" />
                  <text x="755" y="70" fill="#34d399" fontSize="12" fontWeight="700" textAnchor="middle">4. Decision & Routing</text>

                  {/* Decision branches */}
                  <rect x="660" y="82" width="85" height="22" rx="4" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1" />
                  <text x="702" y="97" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle">ALLOW (NPP/Card)</text>

                  <rect x="760" y="82" width="90" height="22" rx="4" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="805" y="97" fill="#fbbf24" fontSize="9" fontWeight="700" textAnchor="middle">STEP-UP (FIDO2)</text>

                  <rect x="660" y="112" width="85" height="22" rx="4" fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="1" />
                  <text x="702" y="127" fill="#f97316" fontSize="9" fontWeight="700" textAnchor="middle">24H HOLD (Scam)</text>

                  <rect x="760" y="112" width="90" height="22" rx="4" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="805" y="127" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="middle">BLOCK & SMR</text>

                  <text x="755" y="155" fill="#94a3b8" fontSize="9" textAnchor="middle">Total Roundtrip: &lt; 45ms</text>

                  {/* Async branch to Case Management */}
                  <path d="M 500 175 L 500 205 L 755 205" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" markerEnd="url(#marker-blue)" />
                  <text x="610" y="200" fill="#64748b" fontSize="9" textAnchor="middle">Async Event Stream (Kafka ➔ AUSTRAC / FinCEN Case Ops)</text>
                </svg>
              </div>
            </div>

            {/* Key Mechanics Cards */}
            <div className="fincrime-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#0c0e17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  1. Pre-Payment Telemetry
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.5 }}>
                  Collects canvas hashes, WebGL fingerprint, MNO SIM swap status, and behavioral dynamics (mouse hesitation, touchscreen angles).
                </div>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  2. Hybrid Scoring Engine
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.5 }}>
                  Combines hard velocity tripwires with LightGBM gradient boosted trees and real-time graph traversal to detect money mule rings.
                </div>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  3. Dynamic Step-Up Policy
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.5 }}>
                  Balances friction and security. Low-risk passes seamlessly; medium-risk triggers FIDO2 biometrics; high-risk invokes cooling-off delays.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THREAT TYPOLOGIES & MULE RINGS */}
        {activeTab === 'typologies' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {THREAT_SCENARIOS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThreat(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: selectedThreat === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)',
                    color: selectedThreat === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: selectedThreat === t.id ? `0 0 0 1px ${t.color}` : 'none'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div style={{
              background: '#0d0f1e',
              border: `1px solid ${activeThreatObj.color}40`,
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: activeThreatObj.color }}>
                    {activeThreatObj.name}
                  </span>
                  <span style={{ marginLeft: '10px', fontSize: '11px', color: '#94a3b8' }}>
                    ({activeThreatObj.type})
                  </span>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  background: `${activeThreatObj.color}20`,
                  color: activeThreatObj.color,
                  border: `1px solid ${activeThreatObj.color}50`
                }}>
                  {activeThreatObj.severity}
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                  Critical Real-Time Telemetry & Anomaly Signals:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {activeThreatObj.signals.map((sig, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      borderLeft: `3px solid ${activeThreatObj.color}`
                    }}>
                      {sig}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  Engine Defense & Remediation Policy:
                </div>
                <div style={{ fontSize: '11px', color: '#e2e8f0' }}>
                  {activeThreatObj.mitigation}
                </div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 12px',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                  Regulatory Reimbursement & Legal Impact:
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {activeThreatObj.psrImpact}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-SIGNAL RISK SCORE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div>
            <div className="fincrime-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
              {/* Left Column: Interactive Controls */}
              <div style={{
                background: '#0d0f1e',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '14px' }}>
                  In-Flight Telemetry Parameters
                </div>

                {/* Amount Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#e2e8f0', marginBottom: '4px' }}>
                    <span>Payment Amount:</span>
                    <span style={{ fontWeight: 700, color: '#34d399' }}>${txAmount.toLocaleString()} AUD</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="15000"
                    step="50"
                    value={txAmount}
                    onChange={e => setTxAmount(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#34d399' }}
                  />
                </div>

                {/* Velocity Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#e2e8f0', marginBottom: '4px' }}>
                    <span>Velocity (Transactions in Last 5 Minutes):</span>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{txCount5m} tx</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={txCount5m}
                    onChange={e => setTxCount5m(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#fbbf24' }}
                  />
                </div>

                {/* Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isNewPayee}
                      onChange={e => setIsNewPayee(e.target.checked)}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    <span>First-Time Beneficiary Account (Zero Transfer History)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeCallDetected}
                      onChange={e => setActiveCallDetected(e.target.checked)}
                      style={{ accentColor: '#f87171' }}
                    />
                    <span>Active Voice Call Detected during Checkout (APP Scam Indicator)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={simSwapped}
                      onChange={e => setSimSwapped(e.target.checked)}
                      style={{ accentColor: '#a78bfa' }}
                    />
                    <span>MNO SIM Swap Reported within Last 48 Hours (ATO Indicator)</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Engine Decision Output */}
              <div style={{
                background: '#0c0e17',
                border: `1px solid ${decisionColor}50`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    ML Risk Engine Output
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: decisionColor }}>
                      {calculatedScore}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>/ 1000 Risk Points</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{
                      width: `${(calculatedScore / 1000) * 100}%`,
                      height: '100%',
                      background: decisionColor,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: `${decisionColor}15`,
                    border: `1px solid ${decisionColor}40`,
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Enforced Policy Action
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: decisionColor }}>
                      {decision}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {actionDesc}
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '10px',
                  fontSize: '10px',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Evaluated Signals: 142</span>
                  <span>Execution Time: 28ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
