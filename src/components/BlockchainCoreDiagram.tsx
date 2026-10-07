import React, { useState } from 'react';

type CoreTab = 'chain' | 'merkle' | 'consensus';
type ConsensusMode = 'pow' | 'pos';

const TABS: { id: CoreTab; label: string; color: string }[] = [
  { id: 'chain', label: 'Hash-Linked Chain', color: '#38bdf8' },
  { id: 'merkle', label: 'Merkle Proof', color: '#34d399' },
  { id: 'consensus', label: 'Consensus', color: '#a78bfa' },
];

const FONT = 'Inter, system-ui, sans-serif';

const LEAVES = ['tx A', 'tx B', 'tx C', 'tx D'];
const LEAF_X = [100, 260, 420, 580];
const MID_X = [180, 500];

function ChainPanel(): React.JSX.Element {
  const [tampered, setTampered] = useState<boolean>(false);
  const blocks = [
    { x: 20, title: 'Block #100', prev: '0000a1…', own: '0000c4…', color: '#38bdf8' },
    { x: 240, title: 'Block #101', prev: '0000c4…', own: tampered ? '9f3e7b… (changed)' : '0000d9…', color: tampered ? '#f87171' : '#38bdf8' },
    { x: 460, title: 'Block #102', prev: tampered ? '0000d9… ≠ 9f3e7b…' : '0000d9…', own: tampered ? 'INVALID' : '0000e2…', color: tampered ? '#f87171' : '#38bdf8' },
  ];
  return (
    <>
      <div style={{ padding: '0.5rem 1rem 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => setTampered(!tampered)}
          style={{ background: tampered ? 'rgba(248,113,113,0.14)' : 'rgba(52,211,153,0.12)', border: `1px solid ${tampered ? '#f87171' : '#34d399'}`, borderRadius: 4, color: tampered ? '#f87171' : '#34d399', cursor: 'pointer', padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700 }}
        >
          {tampered ? 'Restore Block #101' : 'Tamper Block #101'}
        </button>
      </div>
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 190" className="interactive-diagram-svg">
          <defs>
            <marker id="bc-chain-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="context-stroke" />
            </marker>
          </defs>
          {blocks.map((b) => (
            <g key={b.title} transform={`translate(${b.x}, 20)`}>
              <rect width="200" height="130" rx="6" fill="#0d0f1e" stroke={b.color} strokeWidth="1.4" />
              <text x="12" y="22" style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, fill: b.color }}>{b.title}</text>
              <text x="12" y="46" style={{ fontFamily: FONT, fontSize: 9, fill: '#94a3b8' }}>prevHash</text>
              <text x="12" y="60" style={{ fontFamily: 'monospace', fontSize: 9.5, fill: '#e2e8f0' }}>{b.prev}</text>
              <text x="12" y="82" style={{ fontFamily: FONT, fontSize: 9, fill: '#94a3b8' }}>merkleRoot · nonce · timestamp</text>
              <text x="12" y="96" style={{ fontFamily: 'monospace', fontSize: 9.5, fill: '#e2e8f0' }}>7c1d… · 48213 · t+12s</text>
              <text x="12" y="116" style={{ fontFamily: FONT, fontSize: 9, fill: '#94a3b8' }}>blockHash</text>
              <text x="62" y="116" style={{ fontFamily: 'monospace', fontSize: 9.5, fill: b.color }}>{b.own}</text>
            </g>
          ))}
          <path className="interactive-diagram-flowing-path" d="M 222 85 L 238 85" stroke={tampered ? '#f87171' : '#38bdf8'} strokeWidth="2.2" fill="none" markerEnd="url(#bc-chain-arr)" />
          <path className="interactive-diagram-flowing-path" d="M 442 85 L 458 85" stroke={tampered ? '#f87171' : '#38bdf8'} strokeWidth="2.2" fill="none" markerEnd="url(#bc-chain-arr)" />
          <text x="340" y="176" style={{ fontFamily: FONT, fontSize: 10, fill: tampered ? '#f87171' : '#94a3b8', textAnchor: 'middle' }}>
            {tampered ? 'Block #102 stores the old hash of #101 → every later block must be re-mined' : 'Each block commits to its parent hash → history is tamper-evident'}
          </text>
        </svg>
      </div>
    </>
  );
}

function MerklePanel(): React.JSX.Element {
  const [sel, setSel] = useState<number>(0);
  const sibling = sel % 2 === 0 ? sel + 1 : sel - 1;
  const myMid = Math.floor(sel / 2);
  const uncleMid = myMid === 0 ? 1 : 0;
  const hot = '#34d399';
  const dim = 'rgba(148,163,184,0.35)';
  const nodeRect = (x: number, y: number, label: string, active: boolean, proof: boolean, onClick?: () => void) => (
    <g key={`${label}-${x}-${y}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x - 55} y={y - 14} width="110" height="28" rx="5" fill={active ? 'rgba(52,211,153,0.16)' : proof ? 'rgba(251,191,36,0.14)' : '#0d0f1e'} stroke={active ? hot : proof ? '#fbbf24' : '#475569'} strokeWidth="1.3" />
      <text x={x} y={y + 4} style={{ fontFamily: 'monospace', fontSize: 10, fill: active ? hot : proof ? '#fbbf24' : '#cbd5e1', textAnchor: 'middle' }}>{label}</text>
    </g>
  );
  const edge = (x1: number, y1: number, x2: number, y2: number, on: boolean, key: string) => (
    <path key={key} className={on ? 'interactive-diagram-flowing-path' : undefined} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={on ? hot : dim} strokeWidth={on ? 2 : 1.2} fill="none" />
  );
  return (
    <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
      <svg viewBox="0 0 680 250" className="interactive-diagram-svg">
        {LEAVES.map((_, i) => edge(LEAF_X[i], 186, MID_X[Math.floor(i / 2)], 124, i === sel || i === sibling, `l${i}`))}
        {MID_X.map((x, i) => edge(x, 96, 340, 54, i === myMid || i === uncleMid, `m${i}`))}
        {nodeRect(340, 40, 'Merkle Root', true, false)}
        {MID_X.map((x, i) => nodeRect(x, 110, i === 0 ? 'H(AB)' : 'H(CD)', i === myMid, i === uncleMid))}
        {LEAVES.map((t, i) => nodeRect(LEAF_X[i], 200, `H(${t})`, i === sel, i === sibling, () => setSel(i)))}
        <text x="340" y="240" style={{ fontFamily: FONT, fontSize: 10, fill: '#94a3b8', textAnchor: 'middle' }}>
          Click a leaf. Proof for {LEAVES[sel]} = [H({LEAVES[sibling]}), {uncleMid === 0 ? 'H(AB)' : 'H(CD)'}] → log2(4) = 2 hashes
        </text>
      </svg>
    </div>
  );
}

function ConsensusPanel(): React.JSX.Element {
  const [mode, setMode] = useState<ConsensusMode>('pow');
  const steps =
    mode === 'pow'
      ? ['Mempool txs', 'Miners hash header + nonce', 'First hash < target wins', 'Gossip block', 'Nodes verify & extend longest-work chain']
      : ['Mempool txs', 'Proposer picked by stake (RANDAO)', 'Committee attests (BLS votes)', 'Justified → Finalized (2 epochs)', 'Slash on double-vote / surround-vote'];
  const color = mode === 'pow' ? '#fbbf24' : '#a78bfa';
  return (
    <>
      <div style={{ padding: '0.5rem 1rem 0', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {(['pow', 'pos'] as ConsensusMode[]).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} style={{ background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${mode === m ? color : 'rgba(255,255,255,0.1)'}`, borderRadius: 4, color: mode === m ? color : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700 }}>
            {m === 'pow' ? 'Proof of Work (Bitcoin)' : 'Proof of Stake (Ethereum)'}
          </button>
        ))}
      </div>
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 150" className="interactive-diagram-svg">
          <defs>
            <marker id="bc-cons-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="context-stroke" />
            </marker>
          </defs>
          {steps.map((s, i) => (
            <g key={s}>
              <rect x={8 + i * 134} y="40" width="118" height="60" rx="6" fill="#0d0f1e" stroke={color} strokeWidth="1.2" />
              <foreignObject x={12 + i * 134} y="44" width="110" height="52">
                <div style={{ fontFamily: FONT, fontSize: 9.5, lineHeight: 1.3, color: '#e2e8f0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{s}</div>
              </foreignObject>
              {i < steps.length - 1 && (
                <path className="interactive-diagram-flowing-path" d={`M ${128 + i * 134} 70 L ${140 + i * 134} 70`} stroke={color} strokeWidth="2" fill="none" markerEnd="url(#bc-cons-arr)" />
              )}
            </g>
          ))}
          <text x="340" y="130" style={{ fontFamily: FONT, fontSize: 10, fill: '#94a3b8', textAnchor: 'middle' }}>
            {mode === 'pow' ? 'Security = energy burned; finality is probabilistic (≈6 confirmations)' : 'Security = stake at risk; economic finality via Casper FFG'}
          </text>
        </svg>
      </div>
    </>
  );
}

export default function BlockchainCoreDiagram({ initialTab = 'chain' }: { initialTab?: CoreTab }): React.JSX.Element {
  const [tab, setTab] = useState<CoreTab>(initialTab);
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: active.color, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="8.5" y="14" width="7" height="7" rx="1" />
            <path d="M10 6.5h4M6.5 10v3.5h2M17.5 10v3.5h-2" />
          </svg>
          Blockchain Core Mechanics
        </h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === t.id ? t.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === t.id ? t.color : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'chain' && <ChainPanel />}
      {tab === 'merkle' && <MerklePanel />}
      {tab === 'consensus' && <ConsensusPanel />}
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {tab === 'chain' && 'Every header embeds the hash of its parent. Changing any historic byte changes that block hash, which invalidates the parent pointer of every descendant, so an attacker must redo all subsequent work (PoW) or control a supermajority of stake (PoS).'}
          {tab === 'merkle' && 'A light client holding only block headers can verify a transaction with O(log n) sibling hashes against the header Merkle root, without downloading the block body (SPV).'}
          {tab === 'consensus' && 'Consensus is how mutually distrusting nodes agree on one canonical history. PoW pays with external energy; PoS pays with slashable internal capital.'}
        </p>
      </div>
    </div>
  );
}
