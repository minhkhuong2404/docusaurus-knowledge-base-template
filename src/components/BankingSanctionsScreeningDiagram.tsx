import React, { useState } from 'react';

// Helper for Jaro-Winkler calculation
function jaroWinkler(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const matchWindow = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return Number((jaro + prefix * 0.1 * (1 - jaro)).toFixed(3));
}

const SDN_LIST_SAMPLES = [
  { id: 'SDN-101', name: 'ALI HASSAN MOHAMMED', country: 'IR', program: 'SDGT', type: 'Individual' },
  { id: 'SDN-102', name: 'AL-RASHID TRADING CO', country: 'SY', program: 'SYRIA', type: 'Entity' },
  { id: 'SDN-103', name: 'VLADIMIR PETROV', country: 'RU', program: 'RUSSIA-EO14024', type: 'Individual' },
  { id: 'SDN-104', name: 'KIM JONG UN ENTERPRISES', country: 'KP', program: 'DPRK', type: 'Entity' }
];

export default function BankingSanctionsScreeningDiagram(): React.JSX.Element {
  const [inputName, setInputName] = useState<string>('Ali Hasan Mohammed');
  const [threshold, setThreshold] = useState<number>(0.85);
  const [algorithm, setAlgorithm] = useState<'jaro' | 'exact'>('jaro');
  const [disposition, setDisposition] = useState<'pending' | 'cleared' | 'blocked'>('pending');

  const matches = SDN_LIST_SAMPLES.map(sdn => {
    let score = 0;
    if (algorithm === 'exact') {
      score = inputName.trim().toLowerCase() === sdn.name.toLowerCase() ? 1.0 : 0.0;
    } else {
      score = jaroWinkler(inputName, sdn.name);
    }
    return { ...sdn, score };
  }).sort((a, b) => b.score - a.score);

  const topMatch = matches[0];
  const isAlert = topMatch.score >= threshold;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .sanction-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Sanctions & AML Compliance Fuzzy Screening Engine Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Controls Bar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
            {/* Input Name */}
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                PAYMENT PARTY NAME TO SCREEN:
              </label>
              <input
                type="text"
                value={inputName}
                onChange={e => { setInputName(e.target.value); setDisposition('pending'); }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: '#090b14',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            {/* Threshold Slider */}
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                MATCH THRESHOLD: <span style={{ color: '#fbbf24' }}>{(threshold * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.05"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Algorithm Switcher */}
            <div>
              <label style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                MATCHING ALGORITHM:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setAlgorithm('jaro')}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: algorithm === 'jaro' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                    color: algorithm === 'jaro' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                    boxShadow: algorithm === 'jaro' ? '0 0 0 1px #38bdf8' : 'none'
                  }}
                >
                  Jaro-Winkler
                </button>
                <button
                  onClick={() => setAlgorithm('exact')}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: algorithm === 'exact' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
                    color: algorithm === 'exact' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                    boxShadow: algorithm === 'exact' ? '0 0 0 1px #38bdf8' : 'none'
                  }}
                >
                  Exact Match
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid View */}
        <div className="sanction-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Watchlist Candidates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)' }}>
              SDN WATCHLIST SCORED MATCHES:
            </div>

            {matches.map(m => {
              const isMatchAbove = m.score >= threshold;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isMatchAbove ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMatchAbove ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isMatchAbove ? '#f87171' : 'var(--ifm-color-content)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                      ID: {m.id} • Country: {m.country} • Program: {m.program}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isMatchAbove ? '#f87171' : '#34d399' }}>
                      {(m.score * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: isMatchAbove ? '#f87171' : 'var(--ifm-color-content-secondary)' }}>
                      {isMatchAbove ? 'ALERT' : 'CLEAR'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decision & Disposition Card */}
          <div className={`interactive-diagram-details-card ${isAlert ? 'details-red' : 'details-green'}`} style={{ minHeight: '300px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: isAlert ? '#f87171' : '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
              REAL-TIME COMPLIANCE ENGINE DECISION
            </div>

            {isAlert ? (
              <div>
                <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                    ⛔ POTENTIAL SANCTIONS HIT (AUTO-HOLD)
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    Match score <strong>{(topMatch.score * 100).toFixed(1)}%</strong> exceeds threshold <strong>{(threshold * 100).toFixed(0)}%</strong> against SDN entry <code>{topMatch.name}</code>.
                    <br />
                    Payment automatically held. Compliance Alert raised for Level 1 Analyst review.
                  </div>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '6px' }}>
                  ANALYST DISPOSITION WORKFLOW:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setDisposition('cleared')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: disposition === 'cleared' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
                      color: disposition === 'cleared' ? '#34d399' : 'var(--ifm-color-content)',
                      boxShadow: disposition === 'cleared' ? '0 0 0 1.5px #34d399' : 'none'
                    }}
                  >
                    ✓ False Positive (Clear)
                  </button>
                  <button
                    onClick={() => setDisposition('blocked')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: disposition === 'blocked' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)',
                      color: disposition === 'blocked' ? '#f87171' : 'var(--ifm-color-content)',
                      boxShadow: disposition === 'blocked' ? '0 0 0 1.5px #f87171' : 'none'
                    }}
                  >
                    ⛔ True Hit (Block & Freeze)
                  </button>
                </div>

                {disposition === 'cleared' && (
                  <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', background: 'rgba(52,211,153,0.1)', fontSize: '11px', color: '#34d399' }}>
                    ✓ Documented: "Different date of birth and passport jurisdiction". Payment released to settlement queue.
                  </div>
                )}
                {disposition === 'blocked' && (
                  <div style={{ marginTop: '10px', padding: '8px', borderRadius: '6px', background: 'rgba(248,113,113,0.1)', fontSize: '11px', color: '#f87171' }}>
                    ⛔ Confirmed hit. Payment permanently blocked, funds frozen, SMR report filed with AUSTRAC / OFAC within regulatory window.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
                  ✅ NO SANCTIONS MATCH DETECTED (CLEAR)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Highest candidate match score ({(topMatch.score * 100).toFixed(1)}%) is below configured threshold ({(threshold * 100).toFixed(0)}%). Payment proceeds straight-through to settlement.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
