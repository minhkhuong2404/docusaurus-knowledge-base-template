import React, { useState } from 'react';

interface RepoNode {
  id: string;
  name: string;
  extends: string[];
  color: string;
  purpose: string;
  methods: string[];
  snippet: string;
}

const REPO_DATA: Record<string, RepoNode> = {
  REPOSITORY: {
    id: 'REPOSITORY',
    name: 'Repository<T, ID>',
    extends: ['None'],
    color: '#38bdf8',
    purpose: 'The central marker interface in Spring Data. It contains zero method declarations and serves only to capture the entity type T and ID type, allowing Spring to locate custom interfaces.',
    methods: ['None (marker interface)'],
    snippet: `// Marker interface - provides no built-in query methods\npublic interface UserRepository extends Repository<User, Long> {\n    // Must define all custom query methods manually\n    User findByUsername(String username);\n}`,
  },
  CRUD: {
    id: 'CRUD',
    name: 'CrudRepository<T, ID>',
    extends: ['Repository'],
    color: '#fbbf24',
    purpose: 'Extends Repository to add standard CRUD (Create, Read, Update, Delete) capability methods. Returns Iterable collections.',
    methods: ['save(S entity)', 'saveAll(Iterable<S> entities)', 'findById(ID id)', 'existsById(ID id)', 'findAll()', 'count()', 'deleteById(ID id)', 'delete(T entity)'],
    snippet: `// Extends standard CRUD methods\npublic interface UserRepository extends CrudRepository<User, Long> {\n    // Inherits save(), findById(), delete(), etc.\n}`,
  },
  PAGING: {
    id: 'PAGING',
    name: 'PagingAndSortingRepository<T, ID>',
    extends: ['Repository'],
    color: '#a78bfa',
    purpose: 'Provides methods to retrieve entities using pagination and sorting abstractions. In Spring Data 3.x, it extends Repository directly instead of CrudRepository.',
    methods: ['findAll(Sort sort)', 'findAll(Pageable pageable)'],
    snippet: `// Extends sorting & paging options\npublic interface UserRepository extends PagingAndSortingRepository<User, Long> {\n    // Inherits findAll(Sort) and findAll(Pageable)\n}`,
  },
  JPA: {
    id: 'JPA',
    name: 'JpaRepository<T, ID>',
    extends: ['ListCrudRepository', 'ListPagingAndSortingRepository', 'QueryByExampleExecutor'],
    color: '#34d399',
    purpose: 'JPA-specific extension interface. Combines CRUD, paging, and adds persistence context flush capabilities, batch deletes, and returns List collections instead of Iterable.',
    methods: ['flush()', 'saveAndFlush(S entity)', 'deleteInBatch(Iterable<T> entities)', 'getReferenceById(ID id)', 'findAll(Example<S> example)'],
    snippet: `// Default choice in most Spring Boot projects\npublic interface UserRepository extends JpaRepository<User, Long> {\n    // Inherits all CRUD, Paging, and Flush/Batch operations\n}`,
  },
};

export default function SpringDataRepositoryHierarchyDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<string | null>('JPA');

  const current = selectedNode ? REPO_DATA[selectedNode] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span>Spring Data Commons Repository Hierarchy</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* SVG Hierarchy Graph */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 320 280" className="interactive-diagram-svg">
            <defs>
              <marker id="repo-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
              </marker>
            </defs>

            {/* Repository Root Node */}
            <g onClick={() => setSelectedNode('REPOSITORY')} style={{ cursor: 'pointer' }}>
              <rect
                x="80" y="20" width="160" height="40" rx="6"
                fill={selectedNode === 'REPOSITORY' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                stroke={selectedNode === 'REPOSITORY' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1.5"
                style={{ transition: 'all 0.2s' }}
              />
              <text x="160" y="44" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#38bdf8', textAnchor: 'middle' }}>
                Repository&lt;T, ID&gt;
              </text>
            </g>

            {/* CrudRepository */}
            <g onClick={() => setSelectedNode('CRUD')} style={{ cursor: 'pointer' }}>
              <rect
                x="15" y="110" width="130" height="40" rx="6"
                fill={selectedNode === 'CRUD' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
                stroke={selectedNode === 'CRUD' ? '#fbbf24' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1.5"
                style={{ transition: 'all 0.2s' }}
              />
              <text x="80" y="134" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#fbbf24', textAnchor: 'middle' }}>
                CrudRepository
              </text>
            </g>

            {/* Connection: CrudRepository -> Repository */}
            <path
              d="M 80 110 L 130 65"
              fill="none"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1.5"
              markerEnd="url(#repo-arr)"
              className={selectedNode === 'CRUD' || selectedNode === 'JPA' ? 'interactive-diagram-flowing-path active-path-yellow' : ''}
            />

            {/* PagingAndSortingRepository */}
            <g onClick={() => setSelectedNode('PAGING')} style={{ cursor: 'pointer' }}>
              <rect
                x="175" y="110" width="130" height="40" rx="6"
                fill={selectedNode === 'PAGING' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.6)'}
                stroke={selectedNode === 'PAGING' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1.5"
                style={{ transition: 'all 0.2s' }}
              />
              <text x="240" y="134" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#a78bfa', textAnchor: 'middle' }}>
                PagingAndSortingRepository
              </text>
            </g>

            {/* Connection: PagingAndSortingRepository -> Repository */}
            <path
              d="M 240 110 L 190 65"
              fill="none"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1.5"
              markerEnd="url(#repo-arr)"
              className={selectedNode === 'PAGING' || selectedNode === 'JPA' ? 'interactive-diagram-flowing-path active-path-purple' : ''}
            />

            {/* JpaRepository */}
            <g onClick={() => setSelectedNode('JPA')} style={{ cursor: 'pointer' }}>
              <rect
                x="80" y="200" width="160" height="40" rx="6"
                fill={selectedNode === 'JPA' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                stroke={selectedNode === 'JPA' ? '#34d399' : 'rgba(255,255,255,0.08)'}
                strokeWidth="1.5"
                style={{ transition: 'all 0.2s' }}
              />
              <text x="160" y="224" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#34d399', textAnchor: 'middle' }}>
                JpaRepository&lt;T, ID&gt;
              </text>
            </g>

            {/* Connections: JpaRepository -> Crud / Paging */}
            <path
              d="M 130 200 L 95 155"
              fill="none"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1.5"
              markerEnd="url(#repo-arr)"
              className={selectedNode === 'JPA' ? 'interactive-diagram-flowing-path active-path-green' : ''}
            />
            <path
              d="M 190 200 L 225 155"
              fill="none"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1.5"
              markerEnd="url(#repo-arr)"
              className={selectedNode === 'JPA' ? 'interactive-diagram-flowing-path active-path-green' : ''}
            />

            <text x="160" y="262" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on nodes to inspect method lists &amp; declarations.
            </text>
          </svg>
        </div>

        {/* Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: current ? 'flex-start' : 'center',
        }}>
          {current ? (
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: current.color, display: 'block', marginBottom: '2px' }}>
                {current.name}
              </span>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                Extends: <code style={{ color: current.color }}>{current.extends.join(', ')}</code>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Description &amp; Purpose
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  {current.purpose}
                </div>
              </div>

              <div style={{ marginBottom: '12.5px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Representative Methods
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {current.methods.map(m => (
                    <code key={m} style={{ fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '2px 5px', borderRadius: '4px' }}>
                      {m}
                    </code>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Interface Definition Pattern
                </div>
                <pre style={{
                  fontFamily: 'monospace', fontSize: '10.5px', margin: 0,
                  background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px',
                  color: '#e2e8f0', overflowX: 'auto',
                }}>
                  {current.snippet}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Select a repository node on the left to see its methods, roles, and inheritance pattern.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
