import React, { useState } from 'react';

type SignMode = 'signing' | 'verification';

export default function DigitalSigningDiagram(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<SignMode>('signing');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ✍️ Digital Signing vs. Verification Step-by-Step
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveMode('signing')} style={{ background: activeMode === 'signing' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeMode === 'signing' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeMode === 'signing' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1. Signing Flow (Private Key)</button>
          <button onClick={() => setActiveMode('verification')} style={{ background: activeMode === 'verification' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeMode === 'verification' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeMode === 'verification' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>2. Verification Flow (Public Key)</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="ds-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {activeMode === 'signing' ? (
            // Signing Flow
            <>
              <g transform="translate(60, 90)">
                <rect x="-40" y="-20" width="80" height="40" rx="4" fill="#090b14" stroke="#a78bfa" strokeWidth="1" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#a78bfa', fontWeight: 700, textAnchor: 'middle' }}>Original Payload</text>
              </g>

              <path d="M 100 90 L 170 90" fill="none" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ds-arr)" />

              <g transform="translate(220, 90)">
                <rect x="-50" y="-20" width="100" height="40" rx="4" fill="#090b14" stroke="#e2e8f0" strokeWidth="1" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#e2e8f0', textAnchor: 'middle' }}>SHA-256 Hash</text>
              </g>

              <path d="M 270 90 L 340 90" fill="none" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ds-arr)" />

              <g transform="translate(410, 90)">
                <rect x="-70" y="-30" width="140" height="60" rx="4" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="0" y="-5" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#a78bfa', fontWeight: 700, textAnchor: 'middle' }}>Encrypt with Private Key</text>
                <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>(Done by Sender)</text>
              </g>

              <path d="M 480 90 L 550 90" fill="none" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ds-arr)" />

              <g transform="translate(600, 90)">
                <rect x="-40" y="-20" width="80" height="40" rx="4" fill="#090b14" stroke="#4ade80" strokeWidth="1.5" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#4ade80', fontWeight: 700, textAnchor: 'middle' }}>Signature</text>
              </g>
            </>
          ) : (
            // Verification Flow
            <>
              {/* Top Branch: Hash received payload */}
              <g transform="translate(60, 40)">
                <rect x="-40" y="-20" width="80" height="40" rx="4" fill="#090b14" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#38bdf8', textAnchor: 'middle' }}>Recv Payload</text>
              </g>
              <path d="M 100 40 L 180 40" fill="none" stroke="#475569" strokeWidth="1.2" markerEnd="url(#ds-arr)" />
              <g transform="translate(230, 40)">
                <rect x="-50" y="-20" width="100" height="40" rx="4" fill="#090b14" stroke="#e2e8f0" strokeWidth="1" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#e2e8f0', textAnchor: 'middle' }}>Computed Hash A</text>
              </g>

              {/* Bottom Branch: Decrypt signature */}
              <g transform="translate(60, 130)">
                <rect x="-40" y="-20" width="80" height="40" rx="4" fill="#090b14" stroke="#a78bfa" strokeWidth="1" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#a78bfa', textAnchor: 'middle' }}>Recv Signature</text>
              </g>
              <path d="M 100 130 L 180 130" fill="none" stroke="#475569" strokeWidth="1.2" markerEnd="url(#ds-arr)" />
              <g transform="translate(230, 130)">
                <rect x="-50" y="-20" width="100" height="40" rx="4" fill="#090b14" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="5" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#38bdf8', textAnchor: 'middle' }}>Decrypted Hash B</text>
              </g>

              {/* Compare box */}
              <g transform="translate(480, 85)">
                <rect x="-60" y="-35" width="120" height="70" rx="5" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
                <text x="0" y="-10" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#94a3b8', textAnchor: 'middle' }}>Compare hashes:</text>
                <text x="0" y="6" style={{ fontFamily: 'Inter', fontSize: 9.5, fill: '#4ade80', fontWeight: 800, textAnchor: 'middle' }}>Hash A == Hash B?</text>
                <text x="0" y="20" style={{ fontFamily: 'Inter', fontSize: 7.2, fill: '#86efac', textAnchor: 'middle' }}>✅ Verified Authentic</text>
              </g>

              <path d="M 280 40 L 420 70" fill="none" stroke="#475569" strokeWidth="1" markerEnd="url(#ds-arr)" />
              <path d="M 280 130 L 420 100" fill="none" stroke="#475569" strokeWidth="1" markerEnd="url(#ds-arr)" />
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {activeMode === 'signing' ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Signing Process:</strong> Instead of encrypting the entire payload directly (which is slow for large datasets), the application computes a fast 32-byte SHA-256 hash. The hash is then encrypted using the sender's Private Key to produce the <code>Signature</code>, which is attached alongside the payload.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Verification Process:</strong> The receiver does two things in parallel: computes a SHA-256 hash over the received payload, and decrypts the signature using the sender's Public Key. If the decrypted hash matches the computed hash, it proves the payload has not been modified and was signed by the owner of the matching private key.
          </p>
        )}
      </div>
    </div>
  );
}
