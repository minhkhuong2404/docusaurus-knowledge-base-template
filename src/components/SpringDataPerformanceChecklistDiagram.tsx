import React, { useState } from 'react';

interface ChecklistItem {
  id: string;
  category: 'FETCHING' | 'BATCHING' | 'TRANSACTIONS' | 'OTHER';
  type: 'DO' | 'AVOID';
  title: string;
  detail: string;
  solution: string;
}

const ITEMS: ChecklistItem[] = [
  {
    id: 'lazy_fetch',
    category: 'FETCHING',
    type: 'DO',
    title: 'Use LAZY fetch on all associations',
    detail: 'Default fetch type for @ManyToOne and @OneToOne is EAGER, which generates hidden extra select joins even when fields are unused.',
    solution: 'Change mapping: @ManyToOne(fetch = FetchType.LAZY) or @OneToOne(fetch = FetchType.LAZY).',
  },
  {
    id: 'join_fetch',
    category: 'FETCHING',
    type: 'DO',
    title: 'Use JOIN FETCH or @EntityGraph for associations',
    detail: 'Accessing lazy collections in a loop triggers N+1 SQL selections (1 to load parent + N queries for children).',
    solution: 'Use @Query("SELECT u FROM User u JOIN FETCH u.orders") or configure @EntityGraph.',
  },
  {
    id: 'batch_size',
    category: 'BATCHING',
    type: 'DO',
    title: 'Configure default_batch_fetch_size globally',
    detail: 'Solves N+1 queries for collection associations by fetching them in batches using SQL IN clauses.',
    solution: 'Set spring.jpa.properties.hibernate.default_batch_fetch_size=100 in application.properties.',
  },
  {
    id: 'dto_projections',
    category: 'FETCHING',
    type: 'DO',
    title: 'Use DTO/Interface projections for reads',
    detail: 'Entity query loads full tracking state into persistence context, creating dirty check snapshots and consuming extra memory.',
    solution: 'Query a projection interface or record class rather than the raw Entity type.',
  },
  {
    id: 'indexes',
    category: 'OTHER',
    type: 'DO',
    title: 'Define @Index on foreign keys & filter columns',
    detail: 'Missing database indexes results in slow full table scans under load.',
    solution: 'Add annotation: @Table(indexes = @Index(name = "idx_user_email", columnList = "email")).',
  },
  {
    id: 'jpa_sequence',
    category: 'BATCHING',
    type: 'DO',
    title: 'Use SEQUENCE strategy + batch_size for inserts',
    detail: 'GenerationType.IDENTITY forces immediate insert to extract primary keys, disabling statement batching entirely.',
    solution: 'Use GenerationType.SEQUENCE and set spring.jpa.properties.hibernate.jdbc.batch_size=50.',
  },
  {
    id: 'modifying_bulk',
    category: 'BATCHING',
    type: 'DO',
    title: 'Use @Modifying for bulk updates',
    detail: 'Loading a list of 10,000 entities, modifying them in a loop, and calling save() creates huge statement overhead.',
    solution: 'Use @Modifying @Query("UPDATE User u SET u.status = :status WHERE u.active = false").',
  },
  {
    id: 'eager_manytoone',
    category: 'FETCHING',
    type: 'AVOID',
    title: 'Avoid @ManyToOne(fetch = FetchType.EAGER)',
    detail: 'Forces Hibernate to retrieve the related entity on every single load request, polluting join queries.',
    solution: 'Switch explicitly to FetchType.LAZY.',
  },
  {
    id: 'unbounded_findall',
    category: 'OTHER',
    type: 'AVOID',
    title: 'Avoid findAll() without Pageable',
    detail: 'Loading millions of rows in one query triggers OutOfMemoryError heap crashes.',
    solution: 'Ensure all query endpoints pass Pageable and return Page<T> or Slice<T>.',
  },
  {
    id: 'cartesian_product',
    category: 'FETCHING',
    type: 'AVOID',
    title: 'Avoid fetching multiple collections in one query',
    detail: 'Using multiple JOIN FETCH statements triggers a SQL Cartesian product, multiplying results exponentially.',
    solution: 'Fetch only one collection eagerly per query, or rely on default_batch_fetch_size.',
  },
  {
    id: 'stale_modifying',
    category: 'TRANSACTIONS',
    type: 'AVOID',
    title: 'Avoid @Modifying without clearAutomatically = true',
    detail: 'Bulk updates execute directly against the database, bypassing Hibernate L1 cache and leaving stale entity values.',
    solution: 'Set clearAutomatically = true and flushAutomatically = true on the @Modifying annotation.',
  },
  {
    id: 'self_invocation',
    category: 'TRANSACTIONS',
    type: 'AVOID',
    title: 'Avoid local self-invocation of @Transactional methods',
    detail: 'Calling a transactional method from within the same class bypasses the AOP proxy wrapper, ignoring transactional rules.',
    solution: 'Inject the self bean lazily or move the method to a separate service class.',
  },
];

export default function SpringDataPerformanceChecklistDiagram(): React.JSX.Element {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'FETCHING' | 'BATCHING' | 'TRANSACTIONS'>('ALL');
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(ITEMS[0]);

  const filteredItems = ITEMS.filter(item => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const progressPercent = Math.round((checkedIds.length / ITEMS.length) * 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>Spring Data JPA Performance Checklist</span>
        <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
          Verification Progress: {progressPercent}% ({checkedIds.length}/{ITEMS.length})
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: '#34d399', transition: 'width 0.3s ease' }} />
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['ALL', 'FETCHING', 'BATCHING', 'TRANSACTIONS'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 12px', borderRadius: '20px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '11px',
              background: activeCategory === cat ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeCategory === cat ? '#38bdf850' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.2s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Left list container */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '12px'
        }}>
          {filteredItems.map(item => {
            const isChecked = checkedIds.includes(item.id);
            const isSelected = selectedItem?.id === item.id;
            const dotColor = item.type === 'DO' ? '#34d399' : '#f87171';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                  background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: `1.2px solid ${isSelected ? 'rgba(56,189,248,0.3)' : 'transparent'}`,
                }}
              >
                {/* Custom Checkbox */}
                <div
                  onClick={(e) => toggleCheck(item.id, e)}
                  style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    border: `1.5px solid ${isChecked ? '#34d399' : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    background: isChecked ? '#34d39920' : 'transparent',
                    transition: 'all 0.1s',
                  }}
                >
                  {isChecked && <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                </div>

                {/* DO/AVOID badge */}
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                  background: `${dotColor}18`, color: dotColor, border: `1px solid ${dotColor}30`,
                }}>
                  {item.type}
                </span>

                <span style={{
                  fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                  opacity: isChecked ? 0.5 : 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Details Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: selectedItem ? 'flex-start' : 'center',
        }}>
          {selectedItem ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                  background: selectedItem.type === 'DO' ? '#34d39918' : '#f8717118',
                  color: selectedItem.type === 'DO' ? '#34d399' : '#f87171',
                  border: `1px solid ${selectedItem.type === 'DO' ? '#34d39930' : '#f8717130'}`,
                }}>
                  RECOMMENDED ACTION: {selectedItem.type === 'DO' ? 'DO THIS' : 'AVOID THIS'}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>
                  CATEGORY: {selectedItem.category}
                </span>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ifm-color-content)', margin: '0 0 12px 0', lineHeight: 1.3 }}>
                {selectedItem.title}
              </h4>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                  Under The Hood / Why It Matters
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {selectedItem.detail}
                </div>
              </div>

              <div style={{
                background: selectedItem.type === 'DO' ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)',
                border: `1px solid ${selectedItem.type === 'DO' ? '#34d39930' : '#f8717130'}`,
                borderRadius: '8px', padding: '12px'
              }}>
                <div style={{
                  fontSize: '10px', fontWeight: 700,
                  color: selectedItem.type === 'DO' ? '#34d399' : '#f87171',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px'
                }}>
                  How To Fix / Implement
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600, fontFamily: 'monospace' }}>
                  {selectedItem.solution}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              💡 Select a checklist item on the left to see full details and fix code examples.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
