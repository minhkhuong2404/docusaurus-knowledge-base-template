import React, { useState } from 'react';

export default function NaiveModuloCascadeDiagram() {
  const [numServers, setNumServers] = useState<number>(3);

  const keys = [
    { key: 'user_1', hash: 12345 },
    { key: 'user_2', hash: 67890 },
    { key: 'user_3', hash: 11111 },
    { key: 'user_4', hash: 22222 },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
        </svg>
        <span>Naive Modulo Hashing Redistribution Cascade</span>

        {/* Server toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setNumServers(3)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: numServers === 3 ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: numServers === 3 ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: numServers === 3 ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            N = 3 Servers
          </button>

          <button onClick={() => setNumServers(4)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: numServers === 4 ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: numServers === 4 ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: numServers === 4 ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            N = 4 Servers (Add Node D) 🚨
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }} className="modulo-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .modulo-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Mapping Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {keys.map((k, idx) => {
            const target = k.hash % numServers;
            const origTarget = k.hash % 3;
            const moved = numServers === 4 && target !== origTarget;
            return (
              <div key={idx} style={{
                padding: '8px 12px', borderRadius: '6px',
                background: moved ? '#f8717115' : 'rgba(255,255,255,0.03)',
                boxShadow: moved ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <strong style={{ fontSize: '12px', color: '#e2e8f0' }}>{k.key}</strong>
                  <span style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginLeft: '8px' }}>
                    hash: {k.hash}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: moved ? '#f87171' : '#34d399' }}>
                  {k.hash} % {numServers} = Server {String.fromCharCode(65 + target)} {moved ? '❌ (REMAPPED)' : '✓'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: numServers === 4 ? '#f8717140' : '#38bdf840' }}>
          <h3 style={{ color: numServers === 4 ? '#f87171' : '#38bdf8', margin: '0 0 6px 0', fontSize: '14px' }}>
            {numServers === 4 ? 'Mass Redistribution Cascade (N=4)' : 'Static State (N=3)'}
          </h3>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
            Formula for remapping probability: <code style={{ color: '#fbbf24' }}>P(Remap) = N / (N + 1)</code>.<br/>
            {numServers === 4
              ? 'Changing denominator N from 3 to 4 caused 100% of keys to change target server! In a 10-node cluster, adding 1 node forces 90% of data to move.'
              : 'Keys map deterministically to Servers A, B, C. Everything appears normal until the cluster size changes.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
