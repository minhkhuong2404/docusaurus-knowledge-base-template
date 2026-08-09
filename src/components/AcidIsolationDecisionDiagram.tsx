import React, { useState } from 'react';

interface WorkloadProfile {
  id: string;
  name: string;
  recommendedLevel: string;
  color: string;
  tpsRating: string;
  latencyRating: string;
  anomalyPrevented: string;
  springCode: string;
  sqlCode: string;
}

const PROFILES: WorkloadProfile[] = [
  {
    id: 'oltp',
    name: '1. Standard Web Reads / High-Throughput OLTP',
    recommendedLevel: 'READ COMMITTED',
    color: '#38bdf8',
    tpsRating: 'Maximum (50k+ TPS)',
    latencyRating: '< 1 ms',
    anomalyPrevented: 'Dirty Reads',
    springCode: `@Transactional(isolation = Isolation.READ_COMMITTED)\npublic void updateProfile(Long id) { ... }`,
    sqlCode: `UPDATE accounts SET balance = balance - 50\nWHERE id = 1 AND balance >= 50;`,
  },
  {
    id: 'hot_inventory',
    name: '2. Inventory Reservation / Flash Sales',
    recommendedLevel: 'READ COMMITTED + SELECT FOR UPDATE',
    color: '#fbbf24',
    tpsRating: 'High (10k TPS)',
    latencyRating: '1 - 5 ms',
    anomalyPrevented: 'Lost Updates (Pessimistic Lock)',
    springCode: `@Transactional(isolation = Isolation.READ_COMMITTED)\npublic void reserveTicket(Long eventId) {\n    Event e = repo.findByIdForUpdate(eventId);\n}`,
    sqlCode: `SELECT * FROM events WHERE id = 1 FOR UPDATE;`,
  },
  {
    id: 'reporting',
    name: '3. Financial Reporting / Ledger Audit',
    recommendedLevel: 'REPEATABLE READ',
    color: '#a78bfa',
    tpsRating: 'Moderate (5k TPS)',
    latencyRating: '5 - 15 ms',
    anomalyPrevented: 'Non-Repeatable Reads & Phantoms (PG)',
    springCode: `@Transactional(isolation = Isolation.REPEATABLE_READ, readOnly = true)\npublic LedgerReport generateReport() { ... }`,
    sqlCode: `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT SUM(balance) FROM accounts;`,
  },
  {
    id: 'invariant',
    name: '4. Complex Multi-Row Invariant Enforcement',
    recommendedLevel: 'SERIALIZABLE (PostgreSQL SSI)',
    color: '#34d399',
    tpsRating: 'Low (1k TPS - Retries needed)',
    latencyRating: '10 - 50+ ms',
    anomalyPrevented: 'All Anomalies (including Write Skew)',
    springCode: `@Transactional(isolation = Isolation.SERIALIZABLE)\npublic void shiftChange() {\n    // Must wrap in Retry Loop for SQLSTATE 40001\n}`,
    sqlCode: `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT COUNT(*) FROM doctors WHERE on_call = true;`,
  },
];

export default function AcidIsolationDecisionDiagram(): React.JSX.Element {
  const [selectedProfileId, setSelectedProfileId] = useState('oltp');
  const [activeTab, setActiveTab] = useState<'matrix' | 'code'>('matrix');

  const profile = PROFILES.find(p => p.id === selectedProfileId) ?? PROFILES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .iso-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Workload Isolation Level Classifier & Trade-Off Matrix
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'matrix' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'matrix' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'matrix' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Trade-Off Matrix
          </button>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'code' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'code' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'code' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Code Recipes
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="iso-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Workload Profile Classifier List */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Workload Concurrency Profile
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PROFILES.map(p => {
                const isSel = selectedProfileId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${p.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? p.color : 'var(--ifm-color-content)' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Recommended: <strong style={{ color: p.color }}>{p.recommendedLevel}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Trade-Off Matrix or Code Recipe View */}
          <div>
            {activeTab === 'matrix' ? (
              <div className={`interactive-diagram-details-card details-${profile.id === 'oltp' ? 'blue' : profile.id === 'hot_inventory' ? 'yellow' : profile.id === 'reporting' ? 'purple' : 'green'}`} style={{ minHeight: '220px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: profile.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Workload Recommendation
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
                  {profile.recommendedLevel}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Throughput: </span>
                    <strong style={{ color: profile.color }}>{profile.tpsRating}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Latency: </span>
                    <strong style={{ color: 'var(--ifm-color-content)' }}>{profile.latencyRating}</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Prevented Anomalies: </span>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{profile.anomalyPrevented}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Spring Boot @Transactional
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '10.5px', color: '#34d399', margin: '0 0 10px 0', overflowX: 'auto' }}>
                  <code>{profile.springCode}</code>
                </pre>

                <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Raw SQL Query Pattern
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '6px', fontSize: '10.5px', color: '#38bdf8', margin: 0, overflowX: 'auto' }}>
                  <code>{profile.sqlCode}</code>
                </pre>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
