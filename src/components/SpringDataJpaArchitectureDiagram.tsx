import React, { useState } from 'react';

interface NodeData {
  title: string;
  role: string;
  details: string[];
  color: string;
}

const NODES: Record<string, NodeData> = {
  SERVICE: {
    title: 'Application Service Layer',
    role: 'Defines transaction boundaries and invokes CRUD operations on the repository.',
    details: [
      '@Transactional annotation begins a database transaction.',
      'Calls repository methods (e.g., userRepository.save(user)).',
      'Uses domain models/entities without caring about raw SQL details.',
    ],
    color: '#38bdf8',
  },
  REPOSITORY: {
    title: 'Spring Data JPA Proxy',
    role: 'An auto-generated JDK dynamic proxy created at startup implementing your repository interface.',
    details: [
      'Translates method names (findByEmail) into JPQL queries.',
      'Delegates CRUD operations to the underlying JPA EntityManager.',
      'Handles pagination, sorting metadata, and type conversion automatically.',
    ],
    color: '#a78bfa',
  },
  HIBERNATE: {
    title: 'JPA Provider (Hibernate / L1 Cache)',
    role: 'Translates Java entities & JPQL into SQL, handles object states, and manages the Persistence Context.',
    details: [
      'L1 Cache tracks entities inside the current transaction.',
      'Performs dirty checking before committing to find modified fields.',
      'Optimizes writes by queuing JDBC statement batching.',
    ],
    color: '#34d399',
  },
  JDBC: {
    title: 'JDBC & Connection Pool (HikariCP)',
    role: 'Handles physical socket connections and statements transmission to the database.',
    details: [
      'HikariCP loans active DB connections from the connection pool.',
      'Transfers SQL batch statements to the database driver.',
      'Receives raw JDBC ResultSets and returns them to Hibernate for hydration.',
    ],
    color: '#fbbf24',
  },
  DATABASE: {
    title: 'Relation Database (RDBMS)',
    role: 'Performs ACID transaction updates, executes raw SQL queries, and manages indexes.',
    details: [
      'Executes query plans and returns binary rows.',
      'Maintains locking constraints (Pessimistic/Optimistic row locks).',
      'Ensures durability of changes to disk.',
    ],
    color: '#f87171',
  },
};

export default function SpringDataJpaArchitectureDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<string>('REPOSITORY');

  const active = NODES[selectedNode];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span>Spring Data JPA Architecture Layers</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px', alignItems: 'center' }}>
        
        {/* SVG Graph wrapper */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 320 370" className="interactive-diagram-svg">
            <defs>
              <marker id="arch-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
              </marker>
            </defs>

            {/* Path Service -> Repository */}
            <path id="e-srv-repo" d="M 160 55 L 160 85" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#arch-arr)"
                  className={selectedNode === 'SERVICE' || selectedNode === 'REPOSITORY' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />
            {selectedNode === 'SERVICE' && (
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#e-srv-repo" />
                </animateMotion>
              </circle>
            )}

            {/* Path Repository -> Hibernate */}
            <path id="e-repo-hib" d="M 160 125 L 160 155" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#arch-arr)"
                  className={selectedNode === 'REPOSITORY' || selectedNode === 'HIBERNATE' ? 'interactive-diagram-flowing-path active-path-purple' : ''} />
            {selectedNode === 'REPOSITORY' && (
              <circle r="3" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#e-repo-hib" />
                </animateMotion>
              </circle>
            )}

            {/* Path Hibernate -> JDBC */}
            <path id="e-hib-jdbc" d="M 160 195 L 160 225" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#arch-arr)"
                  className={selectedNode === 'HIBERNATE' || selectedNode === 'JDBC' ? 'interactive-diagram-flowing-path active-path-green' : ''} />
            {selectedNode === 'HIBERNATE' && (
              <circle r="3" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#e-hib-jdbc" />
                </animateMotion>
              </circle>
            )}

            {/* Path JDBC -> Database */}
            <path id="e-jdbc-db" d="M 160 265 L 160 295" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#arch-arr)"
                  className={selectedNode === 'JDBC' || selectedNode === 'DATABASE' ? 'interactive-diagram-flowing-path active-path-yellow' : ''} />
            {selectedNode === 'JDBC' && (
              <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#e-jdbc-db" />
                </animateMotion>
              </circle>
            )}

            {/* Service Node */}
            <g onClick={() => setSelectedNode('SERVICE')} style={{ cursor: 'pointer' }}>
              <rect x="50" y="15" width="220" height="40" rx="8"
                    fill={selectedNode === 'SERVICE' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'SERVICE' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="160" y="39" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">
                Application Service Layer (@Transactional)
              </text>
            </g>

            {/* Repository Node */}
            <g onClick={() => setSelectedNode('REPOSITORY')} style={{ cursor: 'pointer' }}>
              <rect x="50" y="85" width="220" height="40" rx="8"
                    fill={selectedNode === 'REPOSITORY' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'REPOSITORY' ? '#a78bfa' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="160" y="109" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="800">
                Spring Data JPA Proxy (JdkDynamicProxy)
              </text>
            </g>

            {/* Hibernate Node */}
            <g onClick={() => setSelectedNode('HIBERNATE')} style={{ cursor: 'pointer' }}>
              <rect x="50" y="155" width="220" height="40" rx="8"
                    fill={selectedNode === 'HIBERNATE' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'HIBERNATE' ? '#34d399' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="160" y="179" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">
                JPA Provider (Hibernate / L1 Cache)
              </text>
            </g>

            {/* JDBC Node */}
            <g onClick={() => setSelectedNode('JDBC')} style={{ cursor: 'pointer' }}>
              <rect x="50" y="225" width="220" height="40" rx="8"
                    fill={selectedNode === 'JDBC' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'JDBC' ? '#fbbf24' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="160" y="249" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="800">
                JDBC Connection Pool (HikariCP)
              </text>
            </g>

            {/* Database Node */}
            <g onClick={() => setSelectedNode('DATABASE')} style={{ cursor: 'pointer' }}>
              <rect x="50" y="295" width="220" height="40" rx="8"
                    fill={selectedNode === 'DATABASE' ? 'rgba(248,113,113,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedNode === 'DATABASE' ? '#f87171' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="160" y="319" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="800">
                Relational Database (RDBMS)
              </text>
            </g>

            <text x="160" y="354" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on any architecture layer to inspect its functions.
            </text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: active.color }}>{active.title}</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
            {active.role}
          </p>
          <ul style={{ margin: 0, paddingLeft: '14px' }}>
            {active.details.map((detail, idx) => (
              <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginBottom: '5px', lineHeight: 1.4 }}>
                {detail}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
