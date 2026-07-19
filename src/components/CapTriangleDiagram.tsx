import React, { useState } from 'react';

interface CapCorner {
  id: string;
  name: string;
  desc: string;
  color: string;
}

const CORNERS: Record<string, CapCorner> = {
  C: {
    id: 'C',
    name: 'Consistency (C)',
    desc: 'Every read receives the most recent write or an error. In CAP context, this refers to linearizable strong consistency.',
    color: '#38bdf8',
  },
  A: {
    id: 'A',
    name: 'Availability (A)',
    desc: 'Every non-failing node returns a non-error response for every request—without guarantees that it contains the latest write.',
    color: '#fbbf24',
  },
  P: {
    id: 'P',
    name: 'Partition Tolerance (P)',
    desc: 'The system continues to function despite any communication breakages or packet drops between nodes in the network cluster.',
    color: '#a78bfa',
  },
};

interface Combination {
  id: string;
  name: string;
  why: string;
  color: string;
  databases: string[];
}

const COMBOS: Record<string, Combination> = {
  CP: {
    id: 'CP',
    name: 'CP (Consistency + Partition Tolerance)',
    why: 'When a network split occurs, the system stops writing/reading from partitioned partitions to prevent data divergence, sacrificing availability.',
    color: '#34d399',
    databases: ['Google Spanner', 'CockroachDB', 'MongoDB', 'HBase'],
  },
  AP: {
    id: 'AP',
    name: 'AP (Availability + Partition Tolerance)',
    why: 'Nodes on both sides of a network split continue accepting reads/writes. Data diverges temporarily and converges later, sacrificing strong consistency.',
    color: '#f472b6',
    databases: ['Apache Cassandra', 'DynamoDB', 'CouchDB', 'Riak'],
  },
  CA: {
    id: 'CA',
    name: 'CA (Consistency + Availability) — The Myth',
    why: 'CA is theoretically possible only on 100% reliable networks. Since physical hardware partitions are inevitable in production, CA distributed databases cannot exist.',
    color: '#94a3b8',
    databases: ['Traditional RDBMS (Single node PostgreSQL/MySQL only)'],
  },
};

export default function CapTriangleDiagram(): React.JSX.Element {
  const [selectedCorner, setSelectedCorner] = useState<string>('C');
  const [selectedCombo, setSelectedCombo] = useState<string>('CP');

  const corner = CORNERS[selectedCorner];
  const combo = COMBOS[selectedCombo];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span style={{ color: '#34d399' }}>The CAP Theorem Trade-off Triangle</span>
      </div>

      <style>{`
        .cap-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .cap-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cap-grid">
        
        {/* SVG Triangle Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 300" className="interactive-diagram-svg">
            {/* Background connection lines */}
            {/* C - A */}
            <line x1="175" y1="45" x2="65" y2="225" stroke={selectedCombo === 'CA' ? '#fbbf24' : 'rgba(148,163,184,0.15)'} strokeWidth={selectedCombo === 'CA' ? '3' : '1.5'} />
            {/* C - P */}
            <line x1="175" y1="45" x2="285" y2="225" stroke={selectedCombo === 'CP' ? '#34d399' : 'rgba(148,163,184,0.15)'} strokeWidth={selectedCombo === 'CP' ? '3' : '1.5'} />
            {/* A - P */}
            <line x1="65" y1="225" x2="285" y2="225" stroke={selectedCombo === 'AP' ? '#f472b6' : 'rgba(148,163,184,0.15)'} strokeWidth={selectedCombo === 'AP' ? '3' : '1.5'} />

            {/* Edge Selection Triggers (Clickable mid-points) */}
            {/* CA Edge Button */}
            <g onClick={() => setSelectedCombo('CA')} style={{ cursor: 'pointer' }}>
              <circle cx="120" cy="135" r="14" fill={selectedCombo === 'CA' ? '#fbbf24' : 'rgba(15,23,42,0.85)'} stroke="#fbbf24" strokeWidth="1" />
              <text x="120" y="139" textAnchor="middle" fill={selectedCombo === 'CA' ? '#000' : '#fbbf24'} fontSize="9" fontWeight="900">CA</text>
            </g>

            {/* CP Edge Button */}
            <g onClick={() => setSelectedCombo('CP')} style={{ cursor: 'pointer' }}>
              <circle cx="230" cy="135" r="14" fill={selectedCombo === 'CP' ? '#34d399' : 'rgba(15,23,42,0.85)'} stroke="#34d399" strokeWidth="1" />
              <text x="230" y="139" textAnchor="middle" fill={selectedCombo === 'CP' ? '#000' : '#34d399'} fontSize="9" fontWeight="900">CP</text>
            </g>

            {/* AP Edge Button */}
            <g onClick={() => setSelectedCombo('AP')} style={{ cursor: 'pointer' }}>
              <circle cx="175" cy="225" r="14" fill={selectedCombo === 'AP' ? '#f472b6' : 'rgba(15,23,42,0.85)'} stroke="#f472b6" strokeWidth="1" />
              <text x="175" y="229" textAnchor="middle" fill={selectedCombo === 'AP' ? '#000' : '#f472b6'} fontSize="9" fontWeight="900">AP</text>
            </g>

            {/* Vertex: Consistency (C) */}
            <g onClick={() => { setSelectedCorner('C'); }} style={{ cursor: 'pointer' }}>
              <circle cx="175" cy="45" r="22" fill={selectedCorner === 'C' ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.9)'} stroke="#38bdf8" strokeWidth={selectedCorner === 'C' ? '2.5' : '1.2'} />
              <text x="175" y="49" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">C</text>
              <text x="175" y="15" textAnchor="middle" fill={selectedCorner === 'C' ? '#38bdf8' : '#94a3b8'} fontSize="8" fontWeight="bold">Consistency</text>
            </g>

            {/* Vertex: Availability (A) */}
            <g onClick={() => { setSelectedCorner('A'); }} style={{ cursor: 'pointer' }}>
              <circle cx="65" cy="225" r="22" fill={selectedCorner === 'A' ? 'rgba(251,191,36,0.2)' : 'rgba(15,23,42,0.9)'} stroke="#fbbf24" strokeWidth={selectedCorner === 'A' ? '2.5' : '1.2'} />
              <text x="65" y="229" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">A</text>
              <text x="65" y="260" textAnchor="middle" fill={selectedCorner === 'A' ? '#fbbf24' : '#94a3b8'} fontSize="8" fontWeight="bold">Availability</text>
            </g>

            {/* Vertex: Partition Tolerance (P) */}
            <g onClick={() => { setSelectedCorner('P'); }} style={{ cursor: 'pointer' }}>
              <circle cx="285" cy="225" r="22" fill={selectedCorner === 'P' ? 'rgba(167,135,250,0.2)' : 'rgba(15,23,42,0.9)'} stroke="#a78bfa" strokeWidth={selectedCorner === 'P' ? '2.5' : '1.2'} />
              <text x="285" y="229" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">P</text>
              <text x="285" y="260" textAnchor="middle" fill={selectedCorner === 'P' ? '#a78bfa' : '#94a3b8'} fontSize="8" fontWeight="bold">Partition Tolerance</text>
            </g>

            <text x="175" y="288" textAnchor="middle" fill="#475569" fontSize="8.2" fontStyle="italic">
              💡 Click vertices (C, A, P) or edges (CP, AP, CA) for details.
            </text>
          </svg>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Corner Info card */}
          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${corner.color}`, minHeight: '105px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '11px', color: corner.color, textTransform: 'uppercase' }}>
              CAP Vertex: {corner.name}
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
              {corner.desc}
            </p>
          </div>

          {/* Combination Info card */}
          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${combo.color}`, minHeight: '125px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '11px', color: combo.color, textTransform: 'uppercase' }}>
              Trade-Off Selection: {combo.name}
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 8px', lineHeight: 1.45 }}>
              {combo.why}
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                Databases matching this trade-off
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {combo.databases.map((db, idx) => (
                  <span key={idx} style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9.5px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'var(--ifm-color-content)',
                  }}>
                    {db}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
