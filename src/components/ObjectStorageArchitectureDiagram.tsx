import React, { useState } from 'react';

type ObjectStorageTab = 'presigned' | 'multipart' | 'comparison' | 'erasure';

export default function ObjectStorageArchitectureDiagram({ initialTab = 'presigned' }: { initialTab?: ObjectStorageTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ObjectStorageTab>(initialTab);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [failedChunk, setFailedChunk] = useState<number | null>(null);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .blob-2col {
            grid-template-columns: 1fr !important;
          }
          .blob-tab-btn {
            font-size: 11px !important;
            padding: 5px 8px !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
          <polyline points="7.5 19.79 7.5 14.6 3 12" />
          <polyline points="21 12 16.5 14.6 16.5 19.79" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Object Storage &amp; High-Throughput Binary Upload Architecture
        </span>

        {/* Tab Switcher */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'presigned', label: '🚀 1. Presigned Direct Upload', color: '#38bdf8' },
            { id: 'multipart', label: '🧩 2. Multipart Chunking', color: '#2dd4bf' },
            { id: 'comparison', label: '📊 3. Object vs Block vs File', color: '#fbbf24' },
            { id: 'erasure', label: '🛡️ 4. Reed-Solomon Erasure Coding', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              className="blob-tab-btn"
              onClick={() => setActiveTab(t.id as ObjectStorageTab)}
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

        {/* TAB 1: PRESIGNED URL DIRECT UPLOAD */}
        {activeTab === 'presigned' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Why proxying gigabytes of video through API servers is an anti-pattern. Presigned URLs let clients stream directly to S3 with zero backend compute overhead.
            </div>

            {/* SVG Visual Sequence Flow */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 780 230" className="interactive-diagram-svg">
                <defs>
                  <marker id="blob-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                  <marker id="blob-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                  <marker id="blob-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
                  <marker id="blob-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#a78bfa" /></marker>
                </defs>

                {/* 1. Client */}
                <g transform="translate(30, 45)">
                  <rect width="130" height="135" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth={1.5} />
                  <text x="65" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11.5" fontWeight="700">CLIENT (BROWSER / APP)</text>
                  <line x1="12" y1="32" x2="118" y2="32" stroke="rgba(255,255,255,0.1)" />
                  <text x="65" y="55" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">User selects 500MB Video</text>
                  <text x="65" y="74" textAnchor="middle" fill="#38bdf8" fontSize="8.5">1. Request Presigned URL</text>
                  <text x="65" y="94" textAnchor="middle" fill="#34d399" fontSize="8.5">3. Direct PUT to S3</text>
                  <text x="65" y="114" textAnchor="middle" fill="#a78bfa" fontSize="8.5">4. Confirm Metadata</text>
                </g>

                {/* Step 1 & 2 between Client and API */}
                <path d="M 160 70 L 310 70" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#blob-blue)" className="interactive-diagram-flowing-path" />
                <text x="235" y="62" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="700">1. POST /uploads/presign</text>

                <path d="M 310 95 L 160 95" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#blob-amber)" className="interactive-diagram-flowing-path" />
                <text x="235" y="110" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="700">2. Return Signed S3 URL</text>

                {/* 2. API Backend */}
                <g transform="translate(315, 45)">
                  <rect width="145" height="135" rx="8" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" strokeWidth={1.5} />
                  <text x="72" y="24" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">API GATEWAY / BACKEND</text>
                  <line x1="12" y1="32" x2="133" y2="32" stroke="rgba(255,255,255,0.1)" />
                  <text x="72" y="54" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Auth &amp; Rate Limit Check</text>
                  <text x="72" y="72" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Generates HMAC Signature</text>
                  <text x="72" y="92" textAnchor="middle" fill="#86efac" fontSize="8.5">Valid for 15 minutes</text>
                  <text x="72" y="112" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="8.5">Writes DB metadata</text>
                </g>

                {/* Direct Upload Bypass: Client directly to S3 (curved arc on bottom) */}
                <path d="M 95 180 C 180 230, 520 230, 605 180" fill="none" stroke="#34d399" strokeWidth="3" markerEnd="url(#blob-green)" className="interactive-diagram-flowing-path" />
                <text x="350" y="215" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="800">3. DIRECT BINARY STREAM (PUT to https://s3.amazonaws.com/...)</text>

                {/* API to DB */}
                <path d="M 390 45 L 390 15 L 500 15" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3,3" />

                {/* 3. Object Storage (S3) */}
                <g transform="translate(605, 45)">
                  <rect width="145" height="135" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth={2} />
                  <text x="72" y="24" textAnchor="middle" fill="#34d399" fontSize="11.5" fontWeight="800">OBJECT STORE (S3 / GCS)</text>
                  <line x1="12" y1="32" x2="133" y2="32" stroke="rgba(255,255,255,0.1)" />
                  <text x="72" y="54" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Direct TLS Ingest</text>
                  <text x="72" y="74" textAnchor="middle" fill="#86efac" fontSize="8.5">11 Nines Durability</text>
                  <text x="72" y="94" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Flat Namespace (Key/Val)</text>
                  <text x="72" y="114" textAnchor="middle" fill="#38bdf8" fontSize="8">Emits S3:ObjectCreated</text>
                </g>
              </svg>
            </div>

            {/* Benefit Highlights */}
            <div className="blob-2col" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: 'rgba(248, 113, 113, 0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.25)' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>❌ Why Proxying Uploads Collapses</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
                  When 1,000 users upload 50MB files concurrently through the API server: 50GB of RAM is pinned in server memory buffers, saturating network ingress and causing thread pool starvation for normal REST endpoints.
                </p>
              </div>

              <div style={{ background: 'rgba(52, 211, 153, 0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>✅ Direct-to-Cloud S3 Pattern</div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  The backend only issues a 500-byte JSON presigned URL (sub-2ms). The gigabytes of binary payload travel directly from the client's network to AWS S3 edge endpoints without touching your API containers!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTIPART CHUNKING */}
        {activeTab === 'multipart' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              Simulate Multipart Upload: Large files (100MB+) are split into 5MB chunks. Chunks are uploaded in parallel; failed chunks are retried independently without re-uploading the entire file.
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(45, 212, 191, 0.2)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2dd4bf' }}>100MB Video (20 Chunks × 5MB)</span>
                <button
                  onClick={() => setFailedChunk(failedChunk === null ? 3 : null)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: failedChunk !== null ? '#34d399' : '#f87171',
                    color: '#000',
                    fontWeight: 700
                  }}
                >
                  {failedChunk !== null ? 'RETRY FAILED CHUNK' : 'SIMULATE NETWORK DROP ON CHUNK #3 💥'}
                </button>
              </div>

              {/* Chunk Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[...Array(10)].map((_, idx) => {
                  const isFailed = failedChunk === idx;
                  const isCompleted = failedChunk === null || idx !== failedChunk;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        background: isFailed ? 'rgba(248, 113, 113, 0.2)' : 'rgba(52, 211, 153, 0.15)',
                        border: `1px solid ${isFailed ? '#f87171' : '#34d399'}`,
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isFailed ? '#f87171' : '#34d399'
                      }}
                    >
                      Chunk #{idx + 1}
                      <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
                        {isFailed ? 'FAILED ❌' : '5MB UPLOADED ✅'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(45, 212, 191, 0.05)', borderRadius: '6px', border: '1px solid rgba(45, 212, 191, 0.15)', fontSize: '11.5px', color: 'var(--ifm-color-content)' }}>
              🎯 <strong>Resilience Formula:</strong> If chunk #3 fails over mobile 4G, only that 5MB chunk is retried. If you uploaded a 10GB video without multipart and lost connection at 9.9GB, you would lose all 9.9GB and restart from 0!
            </div>
          </div>
        )}

        {/* TAB 3: COMPARISON */}
        {activeTab === 'comparison' && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Storage Type</th>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Namespace</th>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Mutation Support</th>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Access Protocol</th>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Primary Best Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: 'Object (S3 / GCS)', ns: 'Flat (Key/Value string)', mut: 'Immutable (Overwrite only)', proto: 'REST HTTP / HTTPS (S3 API)', fit: 'Images, videos, logs, data lakes' },
                    { type: 'Block (EBS / SAN)', ns: 'Raw 4KB byte sectors', mut: 'Random in-place byte writes', proto: 'NVMe / iSCSI block driver', fit: 'Database storage (Postgres, MySQL, OS disk)' },
                    { type: 'File (EFS / NFS)', ns: 'Hierarchical tree (POSIX)', mut: 'Append & in-place file lock', proto: 'NFSv4 / SMB network mount', fit: 'Shared app media dirs, legacy Linux VMs' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{row.type}</td>
                      <td style={{ padding: '8px', color: 'var(--ifm-color-content-secondary)' }}>{row.ns}</td>
                      <td style={{ padding: '8px', color: idx === 0 ? '#34d399' : 'var(--ifm-color-content-secondary)' }}>{row.mut}</td>
                      <td style={{ padding: '8px', color: '#94a3b8' }}>{row.proto}</td>
                      <td style={{ padding: '8px', color: '#86efac', fontWeight: 600 }}>{row.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ERASURE CODING */}
        {activeTab === 'erasure' && (
          <div>
            <div className="interactive-diagram-helper-text" style={{ marginBottom: '12px' }}>
              How S3 delivers 11 nines (99.999999999%) of durability with only 50% storage overhead using Reed-Solomon (4 Data + 2 Parity fragments).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '14px' }} className="blob-2col">
              {[
                { name: 'Data 1', type: 'Payload', color: '#38bdf8' },
                { name: 'Data 2', type: 'Payload', color: '#38bdf8' },
                { name: 'Data 3', type: 'Payload', color: '#38bdf8' },
                { name: 'Data 4', type: 'Payload', color: '#38bdf8' },
                { name: 'Parity 1', type: 'Reed-Solomon', color: '#a78bfa' },
                { name: 'Parity 2', type: 'Reed-Solomon', color: '#a78bfa' }
              ].map((chunk, idx) => (
                <div key={idx} style={{ padding: '12px 8px', borderRadius: '8px', background: `${chunk.color}15`, border: `1px solid ${chunk.color}50`, textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: chunk.color }}>{chunk.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{chunk.type}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Disk #{idx + 1}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.25)', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
              🛡️ <strong>Durability Proof:</strong> Any 4 fragments out of the 6 can mathematically reconstruct the exact original file using linear algebra matrix multiplication. The cluster can suffer the complete destruction of any 2 hard drives or entire storage racks simultaneously with zero data loss!
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
