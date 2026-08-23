import React, { useState } from 'react';

export default function WTinyLfuArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'simulation' | 'config'>('architecture');
  const [simStep, setSimStep] = useState<number>(0);

  const simulationSteps = [
    {
      title: '1. Brand-New Key Arrives (user:101)',
      desc: 'New key enters the 1% Window LRU unconditionally. It is given a grace period to prove its temporal utility without facing immediate frequency scrutiny.',
      windowItems: ['user:101 (freq=1)'],
      probationItems: ['item:98 (freq=4)', 'item:99 (freq=1)'],
      protectedItems: ['hot:A (freq=25)', 'hot:B (freq=18)', 'hot:C (freq=12)'],
      duelStatus: 'New key admitted to Window LRU',
      duelColor: '#38bdf8'
    },
    {
      title: '2. Window Full → Admission Duel Triggered',
      desc: 'user:101 is pushed out of Window LRU. It challenges the weakest victim in Main Cache Probation (item:99, freq=1). Count-Min Sketch shows user:101 has freq=3 vs victim freq=1. Candidate WINS the duel!',
      windowItems: ['new:202 (freq=1)'],
      probationItems: ['user:101 (freq=3)', 'item:98 (freq=4)'],
      protectedItems: ['hot:A (freq=25)', 'hot:B (freq=18)', 'hot:C (freq=12)'],
      duelStatus: 'Candidate (freq=3) > Victim (freq=1) → Victim Evicted, Candidate Enters Probation',
      duelColor: '#34d399'
    },
    {
      title: '3. Subsequent Hit → Promoted to Protected',
      desc: 'user:101 experiences a second read hit while in Probation. It is promoted into the 80% Protected segment of the Main SLRU.',
      windowItems: ['new:202 (freq=1)'],
      probationItems: ['item:98 (freq=4)'],
      protectedItems: ['user:101 (freq=4)', 'hot:A (freq=25)', 'hot:B (freq=18)'],
      duelStatus: 'Key promoted to Protected SLRU tier',
      duelColor: '#34d399'
    },
    {
      title: '4. Midnight Scan Attack (scan:909)',
      desc: 'A cold full table scan key (scan:909, freq=1) passes through Window LRU and challenges Probation victim (item:98, freq=4). Candidate LOSES the duel and is instantly discarded!',
      windowItems: ['scan:910 (freq=1)'],
      probationItems: ['item:98 (freq=4)'],
      protectedItems: ['user:101 (freq=4)', 'hot:A (freq=25)', 'hot:B (freq=18)'],
      duelStatus: 'Scan Candidate (freq=1) < Victim (freq=4) → Candidate REJECTED! Working set protected.',
      duelColor: '#f87171'
    }
  ];

  const currentStep = simulationSteps[simStep];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          W-TinyLFU Architecture: Window LRU + Admission Duel (Caffeine Cache)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('architecture')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'architecture' ? '1px solid #a78bfa50' : '1px solid transparent',
              background: activeTab === 'architecture' ? '#a78bfa18' : 'transparent',
              color: activeTab === 'architecture' ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Architecture Flow
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'simulation' ? '1px solid #a78bfa50' : '1px solid transparent',
              background: activeTab === 'simulation' ? '#a78bfa18' : 'transparent',
              color: activeTab === 'simulation' ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Interactive Simulation
          </button>
          <button
            onClick={() => setActiveTab('config')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'config' ? '1px solid #a78bfa50' : '1px solid transparent',
              background: activeTab === 'config' ? '#a78bfa18' : 'transparent',
              color: activeTab === 'config' ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Caffeine Config
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Architecture SVG Visualizer */}
        {activeTab === 'architecture' && (
          <div>
            <div style={{
              background: '#090b14',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '16px',
              marginBottom: '14px'
            }}>
              <svg width="100%" height="230" viewBox="0 0 620 230">
                <defs>
                  <marker id="wtiny-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,1 L7,4 L0,7" fill="#a78bfa" />
                  </marker>
                  <marker id="wtiny-pass" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,1 L7,4 L0,7" fill="#34d399" />
                  </marker>
                  <marker id="wtiny-reject" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,1 L7,4 L0,7" fill="#f87171" />
                  </marker>
                </defs>

                {/* 1. New Key Entrance */}
                <rect x="10" y="30" width="90" height="34" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="55" y="52" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">New Key</text>

                {/* Arrow to Window LRU */}
                <line x1="100" y1="47" x2="135" y2="47" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#wtiny-arrow)" />

                {/* 2. Window LRU Box */}
                <rect x="140" y="20" width="130" height="54" rx="8" fill="#161b22" stroke="#38bdf8" strokeWidth="2" />
                <text x="205" y="42" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">WINDOW LRU</text>
                <text x="205" y="58" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="middle">~1% Capacity (Trial)</text>

                {/* Arrow from Window to Duel */}
                <line x1="205" y1="74" x2="205" y2="108" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#wtiny-arrow)" />
                <text x="210" y="95" fill="var(--ifm-color-content-secondary)" fontSize="8">Window overflow</text>

                {/* 3. Admission Duel Box */}
                <rect x="110" y="115" width="190" height="48" rx="8" fill="#1f1a3a" stroke="#a78bfa" strokeWidth="2" />
                <text x="205" y="135" fill="#a78bfa" fontSize="11" fontWeight="700" textAnchor="middle">ADMISSION DUEL</text>
                <text x="205" y="150" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="middle">Candidate vs. SLRU Victim</text>

                {/* TinyLFU Count-Min Sketch Box */}
                <rect x="330" y="115" width="130" height="48" rx="6" fill="#0d1117" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" />
                <text x="395" y="134" fill="#fbbf24" fontSize="9.5" fontWeight="700" textAnchor="middle">Count-Min Sketch</text>
                <text x="395" y="148" fill="var(--ifm-color-content-secondary)" fontSize="8.5" textAnchor="middle">4-bit frequency counters</text>
                <line x1="330" y1="139" x2="300" y2="139" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="2 2" />

                {/* Branch Wins -> Main Cache */}
                <path d="M 205 163 L 205 185 L 290 185" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#wtiny-pass)" />
                <text x="220" y="180" fill="#34d399" fontSize="9" fontWeight="700">Wins</text>

                {/* Branch Loses -> Discard */}
                <path d="M 110 139 L 60 139 L 60 185" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#wtiny-reject)" />
                <text x="65" y="170" fill="#f87171" fontSize="9" fontWeight="700">Loses</text>
                <rect x="25" y="190" width="70" height="26" rx="4" fill="#2d1215" stroke="#f87171" strokeWidth="1" />
                <text x="60" y="207" fill="#f87171" fontSize="9.5" fontWeight="700" textAnchor="middle">DISCARD</text>

                {/* 4. Main SLRU Cache */}
                <rect x="295" y="170" width="310" height="52" rx="8" fill="#13231b" stroke="#34d399" strokeWidth="2" />
                <text x="450" y="188" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">MAIN CACHE (SLRU)</text>

                {/* Probation vs Protected splits */}
                <rect x="305" y="195" width="100" height="20" rx="4" fill="#161b22" stroke="#34d39980" strokeWidth="1" />
                <text x="355" y="209" fill="#34d399" fontSize="8.5" textAnchor="middle">Probation (20%)</text>

                <line x1="410" y1="205" x2="425" y2="205" stroke="#34d399" strokeWidth="1" markerEnd="url(#wtiny-pass)" />

                <rect x="430" y="195" width="165" height="20" rx="4" fill="#1e3a2b" stroke="#34d399" strokeWidth="1" />
                <text x="512" y="209" fill="#34d399" fontSize="8.5" fontWeight="700" textAnchor="middle">Protected (80%)</text>

                {/* Hill Climbing feedback arrow */}
                <path d="M 520 170 L 520 40 L 275 40" fill="none" stroke="#a78bfa" strokeWidth="1.2" strokeDasharray="3 3" markerEnd="url(#wtiny-arrow)" />
                <text x="440" y="34" fill="#a78bfa" fontSize="8">Hill Climbing Window Resizing</text>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '11px' }}>
              <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                <strong>1. Window LRU (1%):</strong> Protects new items from premature eviction before they build up frequency.
              </div>
              <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #a78bfa' }}>
                <strong>2. Admission Duel:</strong> Uses 4-bit Count-Min Sketch to compare candidate against SLRU probation victim.
              </div>
              <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                <strong>3. SLRU Main Cache:</strong> 20% Probation / 80% Protected. Hit in Probation promotes to Protected.
              </div>
              <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                <strong>4. Hill Climbing:</strong> Dynamically adapts Window LRU size in real time based on workload shifts.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Simulation */}
        {activeTab === 'simulation' && (
          <div>
            {/* Step Selector Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {simulationSteps.map((step, idx) => (
                <button
                  key={step.title}
                  onClick={() => setSimStep(idx)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: simStep === idx ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                    background: simStep === idx ? '#a78bfa18' : '#090b14',
                    color: simStep === idx ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Step {idx + 1}
                </button>
              ))}
            </div>

            {/* Current Step Overview */}
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: `1px solid ${currentStep.duelColor}40`,
              padding: '16px',
              marginBottom: '14px'
            }}>
              <div style={{ color: currentStep.duelColor, fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                {currentStep.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                {currentStep.desc}
              </div>
              <div style={{
                background: '#090b14',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: currentStep.duelColor,
                borderLeft: `3px solid ${currentStep.duelColor}`
              }}>
                {currentStep.duelStatus}
              </div>
            </div>

            {/* Current Cache Segments State */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid #38bdf840' }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>
                  WINDOW LRU (1%)
                </div>
                {currentStep.windowItems.map(item => (
                  <div key={item} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', background: '#161b22', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid #fbbf2440' }}>
                <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, marginBottom: '6px' }}>
                  SLRU PROBATION (20%)
                </div>
                {currentStep.probationItems.map(item => (
                  <div key={item} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', background: '#161b22', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid #34d39940' }}>
                <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>
                  SLRU PROTECTED (80%)
                </div>
                {currentStep.protectedItems.map(item => (
                  <div key={item} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', background: '#1e3a2b', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Caffeine Config */}
        {activeTab === 'config' && (
          <div>
            <div style={{
              background: '#090b14',
              borderRadius: '8px',
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#34d399',
              lineHeight: 1.6
            }}>
              <span style={{ color: '#a78bfa' }}>// Production Caffeine Configuration (Enforces W-TinyLFU)</span><br />
              Cache&lt;String, Product&gt; productCache = Caffeine.newBuilder()<br />
              &nbsp;&nbsp;.maximumSize(50_000)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--ifm-color-content-secondary)' }}>// Enforces W-TinyLFU admission + SLRU eviction</span><br />
              &nbsp;&nbsp;.expireAfterWrite(10, TimeUnit.MINUTES)&nbsp;<span style={{ color: 'var(--ifm-color-content-secondary)' }}>// Fixed TTL temporal lifecycle</span><br />
              &nbsp;&nbsp;.recordStats()&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--ifm-color-content-secondary)' }}>// Micrometer observability metrics</span><br />
              &nbsp;&nbsp;.build();
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
