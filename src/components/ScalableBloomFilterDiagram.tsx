import React, { useState } from 'react';

interface FilterInstance {
  id: number;
  keys: string[];
  capacity: number;
  color: string;
}

export default function ScalableBloomFilterDiagram(): React.JSX.Element {
  const [filters, setFilters] = useState<FilterInstance[]>([
    { id: 1, keys: ['apple', 'banana', 'cherry'], capacity: 3, color: '#f87171' }
  ]);
  const [log, setLog] = useState<string>('Filter 1 is at maximum capacity (3/3). Click "Insert new item" to see a new filter instantiated.');
  const [queryKey, setQueryKey] = useState<string>('banana');
  const [queryPath, setQueryPath] = useState<number[]>([]);

  const handleInsert = () => {
    const nextItemPool = ['durian', 'elderberry', 'fig', 'grape', 'honeydew'];
    const activeKeys = filters.flatMap(f => f.keys);
    const keyToInsert = nextItemPool.find(k => !activeKeys.includes(k));

    if (!keyToInsert) {
      setLog('Pool exhausted! Reset to start again.');
      return;
    }

    setFilters(prev => {
      const updated = [...prev];
      const activeFilter = updated[updated.length - 1];

      if (activeFilter.keys.length < activeFilter.capacity) {
        // Insert into current filter
        activeFilter.keys.push(keyToInsert);
        setLog(`Inserted "${keyToInsert}" into active Filter ${activeFilter.id} (${activeFilter.keys.length}/${activeFilter.capacity}).`);
      } else {
        // Current filter is full, spawn a new one with larger capacity (e.g. double capacity)
        const nextId = activeFilter.id + 1;
        const newFilter: FilterInstance = {
          id: nextId,
          keys: [keyToInsert],
          capacity: activeFilter.capacity,
          color: nextId === 2 ? '#38bdf8' : '#a78bfa'
        };
        updated.push(newFilter);
        setLog(`Filter ${activeFilter.id} was full! Instantiated new Filter ${nextId} and inserted "${keyToInsert}".`);
      }
      return updated;
    });
  };

  const handleQuery = () => {
    // Sequentially check each filter
    const checkedFilterIds: number[] = [];
    let found = false;

    for (const f of filters) {
      checkedFilterIds.push(f.id);
      if (f.keys.includes(queryKey)) {
        found = true;
        break;
      }
    }

    setQueryPath(checkedFilterIds);
    if (found) {
      setLog(`Query "${queryKey}": Checked filters [${checkedFilterIds.join(' &rarr; ')}]. Found match in Filter ${checkedFilterIds[checkedFilterIds.length - 1]} 🟢.`);
    } else {
      setLog(`Query "${queryKey}": Checked all filters [${checkedFilterIds.join(' &rarr; ')}]. Not found in any filter 🔴.`);
    }
  };

  const handleReset = () => {
    setFilters([
      { id: 1, keys: ['apple', 'banana', 'cherry'], capacity: 3, color: '#f87171' }
    ]);
    setQueryPath([]);
    setLog('Simulator reset.');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Scalable Bloom Filter Multi-Layer Stacking</span>
        <button
          onClick={handleReset}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--ifm-color-content-secondary)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          Reset
        </button>
      </div>

      {/* Simulator buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          onClick={handleInsert}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11.5px',
            background: 'rgba(52,211,153,0.15)',
            color: '#34d399',
            boxShadow: '0 0 0 1px #34d39950'
          }}
        >
          Insert new item ➕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <select
            value={queryKey}
            onChange={e => setQueryKey(e.target.value)}
            style={{
              padding: '5px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#090b14',
              color: 'var(--ifm-color-content)',
              fontSize: '11px'
            }}
          >
            <option value="banana">Query "banana"</option>
            <option value="durian">Query "durian"</option>
            <option value="grape">Query "grape"</option>
            <option value="zucchini">Query "zucchini"</option>
          </select>
          <button
            onClick={handleQuery}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11.5px',
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              boxShadow: '0 0 0 1px #38bdf850'
            }}
          >
            Check Filter
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .sbf-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="sbf-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Visual Stack display */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filters.map(f => {
              const isChecked = queryPath.includes(f.id);
              const isFull = f.keys.length === f.capacity;
              const fillPct = (f.keys.length / f.capacity) * 100;
              const borderColor = isChecked ? '#fbbf24' : f.color;

              return (
                <div
                  key={f.id}
                  style={{
                    border: `1.5px solid ${borderColor}`,
                    background: isChecked ? 'rgba(251,191,36,0.04)' : 'rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: isChecked ? '0 0 8px rgba(251,191,36,0.15)' : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span style={{ color: borderColor }}>Filter {f.id} (m = 8k)</span>
                    <span style={{ color: isFull ? '#f87171' : '#34d399' }}>
                      {isFull ? 'FULL (Locked)' : `${f.keys.length}/${f.capacity} active`}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ width: `${fillPct}%`, height: '100%', background: f.color }} />
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
                    Keys: [{f.keys.join(', ')}]
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Console logs */}
        <div className="interactive-diagram-details-card" style={{ borderColor: queryPath.length > 0 ? '#fbbf24' : 'rgba(255,255,255,0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              📟 Query Execution Log
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
            {log}
            <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              **Chaining logic**: Writes go only to the latest, active filter. Reads must check filters sequentially starting from Filter 1. Once a match is found, lookup stops.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
