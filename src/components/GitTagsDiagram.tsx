import React, { useState } from 'react';

export default function GitTagsDiagram(): React.JSX.Element {
  const [tagType, setTagType] = useState<'lightweight' | 'annotated'>('annotated');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Release Tag Types: Lightweight vs Annotated Tags (`git tag -a`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setTagType('lightweight')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: tagType === 'lightweight' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: tagType === 'lightweight' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Lightweight Tag (`v1.0.0`)
          </button>
          <button onClick={() => setTagType('annotated')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: tagType === 'annotated' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: tagType === 'annotated' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Annotated Tag (`git tag -a -m`)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {tagType === 'lightweight' ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Lightweight Tag</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>A simple pointer file inside `.git/refs/tags/v1.0.0` holding only a 40-character SHA-1 commit hash. No author, no message, no date metadata.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>Annotated Tag (Full Object in `.git/objects/`)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>A complete, immutable Git object containing tagger name, email, date timestamp, tag message, and optional GPG cryptographic signature!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
