import React, { useState } from 'react';

type TabMode = 'lifecycle' | 'dirty_checking' | 'cache_levels';

interface EntityState {
  id: string;
  name: string;
  badgeColor: string;
  description: string;
  hasDbId: boolean;
  isInSession: boolean;
  sqlTiming: string;
  gotcha: string;
}

const ENTITY_STATES: EntityState[] = [
  {
    id: 'transient',
    name: '1. Transient (New)',
    badgeColor: '#94a3b8',
    description: 'Instantiated via "new User()". Has no database identity and is not connected to any active Hibernate Session/EntityManager.',
    hasDbId: false,
    isInSession: false,
    sqlTiming: 'No SQL issued yet (until persist() or save() is called).',
    gotcha: 'If the session closes or GC runs, this object is lost without persistence.'
  },
  {
    id: 'managed',
    name: '2. Managed (Persistent)',
    badgeColor: '#34d399',
    description: 'Tracked inside the L1 Persistence Context. Hibernate watches every setter call. On flush/commit, changes automatically turn into SQL UPDATE statements.',
    hasDbId: true,
    isInSession: true,
    sqlTiming: 'INSERT queued (delayed until commit unless IDENTITY generation). UPDATE queued automatically via Dirty Checking.',
    gotcha: 'Calling repository.save(entity) on a managed entity is redundant! Hibernate auto-detects dirty fields.'
  },
  {
    id: 'detached',
    name: '3. Detached',
    badgeColor: '#fbbf24',
    description: 'Has a valid database ID, but the Session that loaded it has closed, or em.detach(entity) / em.clear() was explicitly executed.',
    hasDbId: true,
    isInSession: false,
    sqlTiming: 'Zero SQL issued for setter calls. Changes are completely ignored by Hibernate.',
    gotcha: 'Must call entity = em.merge(detachedEntity) to reconnect. Note: merge() returns a NEW managed instance; the original detached object remains detached!'
  },
  {
    id: 'removed',
    name: '4. Removed',
    badgeColor: '#f87171',
    description: 'Entity was managed and em.remove(entity) was called. Scheduled for database row deletion on the next flush or transaction commit.',
    hasDbId: true,
    isInSession: true,
    sqlTiming: 'DELETE statement executed on next transaction flush / commit.',
    gotcha: 'Do not access lazy relationships after remove(); EntityNotFoundException may trigger.'
  }
];

export default function JpaEntityLifecycleDiagram({ initialTab }: { initialTab?: TabMode }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab || 'lifecycle');
  const [selectedStateId, setSelectedStateId] = useState<string>('managed');

  // Dirty Checking Interactive Simulator State
  const [currentName, setCurrentName] = useState<string>('Alice');
  const [currentEmail, setCurrentEmail] = useState<string>('alice@work.com');
  const [isFlushed, setIsFlushed] = useState<boolean>(false);

  const snapshot = { name: 'Alice', email: 'alice@work.com' };
  const isDirty = currentName !== snapshot.name || currentEmail !== snapshot.email;

  const selectedState = ENTITY_STATES.find(s => s.id === selectedStateId) || ENTITY_STATES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          JPA & Hibernate Entity Lifecycle & Persistence Context
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'lifecycle', label: '🔄 Entity State Machine', color: '#34d399' },
            { id: 'dirty_checking', label: '🧪 Dirty Checking Simulator', color: '#38bdf8' },
            { id: 'cache_levels', label: '🗄️ L1 vs L2 vs Query Cache', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabMode)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: ENTITY STATE MACHINE */}
        {activeTab === 'lifecycle' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="arrow-yellow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fbbf24" />
                  </marker>
                  <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
                  </marker>
                  <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Node 1: TRANSIENT */}
                <g transform="translate(30, 85)" onClick={() => setSelectedStateId('transient')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="0" y="0" width="150" height="70" rx="8"
                    fill={selectedStateId === 'transient' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.1)'}
                    stroke="#94a3b8" strokeWidth={selectedStateId === 'transient' ? 2.5 : 1}
                  />
                  <text x="14" y="26" fill="#f1f5f9" fontSize="12" fontWeight="700">TRANSIENT (New)</text>
                  <text x="14" y="44" fill="#94a3b8" fontSize="9.5">new User()</text>
                  <text x="14" y="58" fill="#64748b" fontSize="8.5">No DB Identity • No Session</text>
                </g>

                {/* Arrow: persist() */}
                <path d="M 185 120 L 295 120" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="205" y="112" fill="#34d399" fontSize="10" fontWeight="700">em.persist()</text>

                {/* Node 2: MANAGED (Centerpiece) */}
                <g transform="translate(305, 55)" onClick={() => setSelectedStateId('managed')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="0" y="0" width="210" height="130" rx="10"
                    fill={selectedStateId === 'managed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.08)'}
                    stroke="#34d399" strokeWidth={selectedStateId === 'managed' ? 2.5 : 1.5}
                  />
                  <text x="16" y="28" fill="#34d399" fontSize="14" fontWeight="800">MANAGED (Persistent)</text>
                  <text x="16" y="48" fill="#e2e8f0" fontSize="10.5">Inside L1 Persistence Context</text>
                  <rect x="14" y="58" width="182" height="30" rx="4" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(52, 211, 153, 0.3)" />
                  <text x="22" y="77" fill="#86efac" fontSize="9">✨ Automatic Dirty Checking</text>
                  <text x="16" y="110" fill="#64748b" fontSize="9">Has DB ID • Tracked by Session</text>
                </g>

                {/* Arrow: find() / query from Database */}
                <path d="M 410 20 L 410 48" fill="none" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#arrow-blue)" />
                <text x="418" y="32" fill="#38bdf8" fontSize="9.5" fontWeight="600">em.find() / JPQL</text>

                {/* Arrow: detach() / clear() */}
                <path d="M 520 90 L 630 90" fill="none" stroke="#fbbf24" strokeWidth="1.8" markerEnd="url(#arrow-yellow)" />
                <text x="532" y="82" fill="#fbbf24" fontSize="9.5" fontWeight="600">detach() / clear()</text>

                {/* Arrow: merge() */}
                <path d="M 630 135 L 522 135" fill="none" stroke="#34d399" strokeWidth="1.8" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="548" y="150" fill="#34d399" fontSize="9.5" fontWeight="600">em.merge()</text>

                {/* Node 3: DETACHED */}
                <g transform="translate(640, 75)" onClick={() => setSelectedStateId('detached')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="0" y="0" width="150" height="90" rx="8"
                    fill={selectedStateId === 'detached' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.08)'}
                    stroke="#fbbf24" strokeWidth={selectedStateId === 'detached' ? 2.5 : 1}
                  />
                  <text x="14" y="26" fill="#fef08a" fontSize="12" fontWeight="700">DETACHED</text>
                  <text x="14" y="44" fill="#cbd5e1" fontSize="9.5">Session Closed / Evicted</text>
                  <text x="14" y="62" fill="#e2e8f0" fontSize="8.5">Has ID • Not in Session</text>
                  <text x="14" y="78" fill="#f87171" fontSize="8">Setters DO NOT update DB</text>
                </g>

                {/* Arrow: remove() downwards */}
                <path d="M 410 190 L 410 215" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow-red)" />
                <text x="418" y="206" fill="#f87171" fontSize="9.5" fontWeight="700">em.remove()</text>

                {/* Node 4: REMOVED */}
                <g transform="translate(335, 218)" onClick={() => setSelectedStateId('removed')} style={{ cursor: 'pointer' }}>
                  <rect
                    x="0" y="0" width="150" height="28" rx="5"
                    fill={selectedStateId === 'removed' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(248, 113, 113, 0.12)'}
                    stroke="#f87171" strokeWidth={selectedStateId === 'removed' ? 2 : 1}
                  />
                  <text x="18" y="19" fill="#fca5a5" fontSize="11" fontWeight="700">🗑️ REMOVED (Delete Scheduled)</text>
                </g>
              </svg>
            </div>

            {/* Clicked State Detail Inspector */}
            <div style={{ padding: '14px 16px', background: `${selectedState.badgeColor}0d`, border: `1.5px solid ${selectedState.badgeColor}40`, borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: selectedState.badgeColor }}>
                  {selectedState.name}
                </span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${selectedState.badgeColor}25`, color: selectedState.badgeColor, fontWeight: 700 }}>
                  Has DB ID: {selectedState.hasDbId ? 'YES' : 'NO'} | In Session: {selectedState.isInSession ? 'YES' : 'NO'}
                </span>
              </div>

              <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                {selectedState.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>⚡ SQL Timing:</strong>
                  <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>{selectedState.sqlTiming}</span>
                </div>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#fbbf24', fontSize: '11px', display: 'block', marginBottom: '4px' }}>⚠️ Senior Trap / Gotcha:</strong>
                  <span style={{ fontSize: '11.5px', color: '#fef08a' }}>{selectedState.gotcha}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIRTY CHECKING SIMULATOR */}
        {activeTab === 'dirty_checking' && (
          <div>
            <div style={{ marginBottom: '14px', padding: '12px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <strong>How Hibernate Dirty Checking Works:</strong> When an entity is loaded into the L1 cache, Hibernate stores both the <em>Current Entity Instance</em> and a read-only <em>Original Snapshot</em>. On transaction commit or flush, Hibernate loops through all fields. If any value changed, an SQL <code>UPDATE</code> is generated automatically without needing <code>save()</code>!
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              {/* Snapshot (Immutable Read-Only) */}
              <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                  📷 HIBERNATE SNAPSHOT MAP (Loaded State):
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1', lineHeight: 1.8 }}>
                  <div>id: <span style={{ color: '#38bdf8' }}>1L</span></div>
                  <div>name: <span style={{ color: '#34d399' }}>"{snapshot.name}"</span></div>
                  <div>email: <span style={{ color: '#34d399' }}>"{snapshot.email}"</span></div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748b' }}>
                  🔒 Read-only byte array created when entity entered Session.
                </div>
              </div>

              {/* Live Entity (Mutable) */}
              <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.06)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  ✏️ MANAGED ENTITY INSTANCE (Live in Memory):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>user.setName(...):</label>
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => { setCurrentName(e.target.value); setIsFlushed(false); }}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: '#090b14', color: '#ffffff', width: '100%', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>user.setEmail(...):</label>
                    <input
                      type="text"
                      value={currentEmail}
                      onChange={(e) => { setCurrentEmail(e.target.value); setIsFlushed(false); }}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: '#090b14', color: '#ffffff', width: '100%', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
              <button
                onClick={() => setIsFlushed(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: isDirty ? '#38bdf8' : '#334155',
                  color: isDirty ? '#000000' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 'none',
                  cursor: isDirty ? 'pointer' : 'default'
                }}
              >
                ⚡ Trigger em.flush() / Transaction Commit
              </button>
              <span style={{ fontSize: '12px', color: isDirty ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                {isDirty ? '⚠️ Entity State: DIRTY (Differences Detected)' : '✅ Entity State: CLEAN (No Changes)'}
              </span>
            </div>

            {/* Flush Output */}
            {isFlushed && (
              <div style={{ padding: '12px 16px', background: '#090b14', borderRadius: '8px', border: `1.5px solid ${isDirty ? '#34d399' : '#94a3b8'}` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: isDirty ? '#34d399' : '#94a3b8', marginBottom: '4px' }}>
                  {isDirty ? '🚀 SQL GENERATED BY DIRTY CHECKING FLUSH:' : 'ℹ️ NO SQL GENERATED (State identical to snapshot):'}
                </div>
                {isDirty ? (
                  <pre style={{ margin: 0, padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace' }}>
                    {`UPDATE users \nSET name = '${currentName}', email = '${currentEmail}' \nWHERE id = 1;`}
                  </pre>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Zero JDBC statements sent across the wire. Database I/O skipped.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: L1 vs L2 vs QUERY CACHE */}
        {activeTab === 'cache_levels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.08)', border: '1.5px solid #34d399', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
                1️⃣ First-Level Cache (L1)
              </div>
              <div style={{ fontSize: '11px', color: '#86efac', fontWeight: 700, marginBottom: '8px' }}>
                Session-Scoped • Mandatory • Zero Config
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                Bound to the current <code>EntityManager</code> or <code>Session</code> thread. Guarantees <strong>repeatable reads</strong> within the same transaction. Discarded immediately when session closes.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'rgba(56, 189, 248, 0.08)', border: '1.5px solid #38bdf8', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                2️⃣ Second-Level Cache (L2)
              </div>
              <div style={{ fontSize: '11px', color: '#7dd3fc', fontWeight: 700, marginBottom: '8px' }}>
                SessionFactory-Scoped • Shared • Optional (Redis / Hazelcast)
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                Shared across ALL sessions and application instances. Caches entity field values by primary key ID. Requires careful invalidation to prevent stale reads across multi-node clusters.
              </p>
            </div>

            <div style={{ padding: '14px', background: 'rgba(167, 139, 250, 0.08)', border: '1.5px solid #a78bfa', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px' }}>
                3️⃣ Query Cache
              </div>
              <div style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: 700, marginBottom: '8px' }}>
                Caches ID Lists • High Invalidation Penalty
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                Caches only the query parameters and the list of entity IDs returned (not the entity data itself). Any INSERT/UPDATE to the queried table invalidates the entire query cache space!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
