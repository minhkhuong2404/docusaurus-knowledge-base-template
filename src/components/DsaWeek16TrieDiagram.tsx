import React, { useState } from 'react';

export default function DsaWeek16TrieDiagram(): React.JSX.Element {
  const [word, setWord] = useState<string>('app');

  const words = ['apple', 'app', 'bat'];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Trie (Prefix Tree) Multiway Tree Structure
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {words.map((w) => (
            <button key={w} onClick={() => setWord(w)} style={{ padding: '3px 8px', borderRadius: '5px', border: word === w ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: word === w ? 'rgba(56,189,248,0.2)' : 'transparent', color: word === w ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              "{w}"
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 500 180" style={{ width: '100%', minWidth: '400px', height: 'auto' }}>
          {/* Root */}
          <circle cx="250" cy="30" r="16" fill="rgba(255,255,255,0.05)" stroke="#38bdf8" />
          <text x="250" y="34" textAnchor="middle" fill="#38bdf8" fontSize="10">ROOT</text>

          {/* Branches */}
          <line x1="240" y1="45" x2="160" y2="80" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="260" y1="45" x2="340" y2="80" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Node 'a' & 'b' */}
          <g transform="translate(160, 85)">
            <circle r="15" fill={word.startsWith('a') ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.03)'} stroke="#38bdf8" />
            <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">a</text>
          </g>
          <g transform="translate(340, 85)">
            <circle r="15" fill={word.startsWith('b') ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.03)'} stroke="#38bdf8" />
            <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">b</text>
          </g>

          {/* Child 'p' under 'a' */}
          <line x1="160" y1="100" x2="160" y2="135" stroke="#38bdf8" strokeWidth="1.5" />
          <g transform="translate(160, 145)">
            <circle r="15" fill={word === 'app' ? 'rgba(52,211,153,0.35)' : 'rgba(56,189,248,0.2)'} stroke={word === 'app' ? '#34d399' : '#38bdf8'} strokeWidth={word === 'app' ? 2 : 1} />
            <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="12" fontWeight="700">p</text>
            <text x="24" y="4" fill="#34d399" fontSize="9" fontWeight="700">isEnd</text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
          Prefix Search for "{word}": O(L) where L = word length (independent of dictionary size N!).
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Shared prefixes save space and enable high-speed autocomplete & IP routing table lookups.
        </div>
      </div>
    </div>
  );
}
