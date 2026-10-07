import React, { useState } from 'react';

type ScaleTab = 'sharding' | 'rollup' | 'ipfs';

interface DNode {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}
interface DEdge {
  from: string;
  to: string;
  label?: string;
  color?: string;
}
interface Scenario {
  label: string;
  color: string;
  nodes: DNode[];
  edges: DEdge[];
  note: string;
}

const NODE_W = 124;
const NODE_H = 36;
const FONT = 'Inter, system-ui, sans-serif';

const SCENARIOS: Record<ScaleTab, Scenario> = {
  sharding: {
    label: 'Sharding',
    color: '#f97316',
    nodes: [
      { id: 'beacon', x: 340, y: 40, label: 'Beacon / Coordinator', color: '#a78bfa' },
      { id: 's1', x: 90, y: 150, label: 'Shard 1 (accounts 0-3)', color: '#f97316' },
      { id: 's2', x: 255, y: 150, label: 'Shard 2 (accounts 4-7)', color: '#f97316' },
      { id: 's3', x: 425, y: 150, label: 'Shard 3 (accounts 8-b)', color: '#f97316' },
      { id: 's4', x: 590, y: 150, label: 'Shard 4 (accounts c-f)', color: '#f97316' },
    ],
    edges: [
      { from: 's1', to: 'beacon', label: 'crosslink' },
      { from: 's2', to: 'beacon' },
      { from: 's3', to: 'beacon' },
      { from: 's4', to: 'beacon' },
      { from: 's1', to: 's3', label: 'cross-shard tx (async receipt)', color: '#f87171' },
    ],
    note: 'State is partitioned so each validator stores 1/N of state and processes 1/N of transactions. The hard part is cross-shard atomicity and keeping each shard committee honest (1% attack on a small shard). Ethereum abandoned execution sharding for rollup-centric scaling with data sharding (danksharding, blobs).',
  },
  rollup: {
    label: 'Rollups (L2)',
    color: '#38bdf8',
    nodes: [
      { id: 'users', x: 70, y: 100, label: 'Users / dApps', color: '#38bdf8' },
      { id: 'seq', x: 225, y: 100, label: 'Sequencer', color: '#34d399' },
      { id: 'batch', x: 380, y: 100, label: 'Compress Batch', color: '#fbbf24' },
      { id: 'l1', x: 545, y: 50, label: 'L1 Rollup Contract', color: '#a78bfa' },
      { id: 'proof', x: 545, y: 150, label: 'Validity / Fraud Proof', color: '#f87171' },
    ],
    edges: [
      { from: 'users', to: 'seq', label: 'tx' },
      { from: 'seq', to: 'batch', label: 'order' },
      { from: 'batch', to: 'l1', label: 'blob + state root' },
      { from: 'batch', to: 'proof', label: 'witness' },
      { from: 'proof', to: 'l1', label: 'verify' },
    ],
    note: 'Execute off-chain, post compressed data + state root on L1. ZK rollups prove validity with SNARK/STARK (fast finality, heavy prover); optimistic rollups assume validity and allow a ~7-day fraud-proof challenge window. Data availability on L1 (EIP-4844 blobs) lets anyone reconstruct state and force-exit.',
  },
  ipfs: {
    label: 'IPFS',
    color: '#34d399',
    nodes: [
      { id: 'file', x: 70, y: 100, label: 'File (video.mp4)', color: '#38bdf8' },
      { id: 'chunk', x: 225, y: 100, label: 'Chunk 256 KiB', color: '#fbbf24' },
      { id: 'dag', x: 380, y: 100, label: 'Merkle DAG → CID', color: '#34d399' },
      { id: 'dht', x: 545, y: 50, label: 'Kademlia DHT', color: '#a78bfa' },
      { id: 'peer', x: 545, y: 150, label: 'Peers (Bitswap)', color: '#f97316' },
    ],
    edges: [
      { from: 'file', to: 'chunk' },
      { from: 'chunk', to: 'dag', label: 'sha2-256' },
      { from: 'dag', to: 'dht', label: 'provide(CID)' },
      { from: 'dht', to: 'peer', label: 'find providers' },
      { from: 'peer', to: 'dag', label: 'fetch blocks', color: '#38bdf8' },
    ],
    note: 'Content-addressed: the CID is a hash of the bytes, not a location. Same bytes = same CID (dedup), and the receiver verifies integrity by re-hashing. IPFS does not guarantee persistence: data survives only while someone pins it (Pinata, Filecoin deals, Arweave as alternatives).',
  },
};

function center(n: DNode): { x: number; y: number } {
  return { x: n.x, y: n.y };
}

function edgePoints(a: DNode, b: DNode): { x1: number; y1: number; x2: number; y2: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // distance from center to rectangle border along direction
  const tx = ux === 0 ? Infinity : NODE_W / 2 / Math.abs(ux);
  const ty = uy === 0 ? Infinity : NODE_H / 2 / Math.abs(uy);
  const t = Math.min(tx, ty) + 5;
  const ca = center(a);
  const cb = center(b);
  return { x1: ca.x + ux * t, y1: ca.y + uy * t, x2: cb.x - ux * (t + 4), y2: cb.y - uy * (t + 4) };
}

export default function BlockchainScalingDiagram({ initialTab = 'sharding' }: { initialTab?: ScaleTab }): React.JSX.Element {
  const [tab, setTab] = useState<ScaleTab>(initialTab);
  const sc = SCENARIOS[tab];
  const byId = (id: string): DNode => sc.nodes.find((n) => n.id === id) ?? sc.nodes[0];
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: sc.color, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <path d="M12 7.5v4M12 11.5l-5.5 5.5M12 11.5l5.5 5.5" />
          </svg>
          Scaling &amp; Storage: {sc.label}
        </h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.keys(SCENARIOS) as ScaleTab[]).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)} style={{ background: tab === k ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === k ? SCENARIOS[k].color : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === k ? SCENARIOS[k].color : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
              {SCENARIOS[k].label}
            </button>
          ))}
        </div>
      </div>
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="bc-scale-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="context-stroke" />
            </marker>
          </defs>
          {sc.edges.map((e) => {
            const a = byId(e.from);
            const b = byId(e.to);
            const p = edgePoints(a, b);
            const stroke = e.color ?? sc.color;
            return (
              <g key={`${e.from}-${e.to}`}>
                <path className="interactive-diagram-flowing-path" d={`M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`} stroke={stroke} strokeWidth="1.8" fill="none" markerEnd="url(#bc-scale-arr)" />
                {e.label && (
                  <text x={(p.x1 + p.x2) / 2} y={(p.y1 + p.y2) / 2 - 5} style={{ fontFamily: FONT, fontSize: 8.5, fill: '#e2e8f0', textAnchor: 'middle' }}>{e.label}</text>
                )}
              </g>
            );
          })}
          {sc.nodes.map((n) => (
            <g key={n.id}>
              <rect x={n.x - NODE_W / 2} y={n.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="6" fill="#0d0f1e" stroke={n.color} strokeWidth="1.3" />
              <text x={n.x} y={n.y + 3.5} style={{ fontFamily: FONT, fontSize: 9.5, fontWeight: 700, fill: n.color, textAnchor: 'middle' }}>{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{sc.note}</p>
      </div>
    </div>
  );
}
