import React, { useState } from 'react';

const ITEMS = [
  { label: 'Insert "apple"', value: 'apple', hashes: [2, 5, 8], type: 'insert' },
  { label: 'Insert "banana"', value: 'banana', hashes: [3, 6, 9], type: 'insert' },
  { label: 'Test "apple"', value: 'apple', hashes: [2, 5, 8], type: 'test' },
  { label: 'Test "cherry" (Uninserted Collision)', value: 'cherry', hashes: [2, 5, 8], type: 'test' },
  { label: 'Test "durian" (Uninserted Clean)', value: 'durian', hashes: [1, 5, 7], type: 'test' }
];

export default function BloomFilterCoreConceptDiagram(): React.JSX.Element {
  const [bitArray, setBitArray] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [log, setLog] = useState<string>('Simulator initialized. Click "Insert" or "Test" options below.');
  const [activeHashes, setActiveHashes] = useState<number[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<'hit' | 'miss' | 'collision' | null>(null);

  const handleAction = (item: typeof ITEMS[0]) => {
    setActiveItem(item.value);
    setActiveHashes(item.hashes);

    if (item.type === 'insert') {
      const updated = [...bitArray];
      item.hashes.forEach(idx => {
        updated[idx] = 1;
      });
      setBitArray(updated);
      setTestResult(null);
      setLog(`Inserted "${item.value}". Hashed indices [${item.hashes.join(', ')}] were flipped to 1.`);
    } else {
      // Test key presence
      const allOn = item.hashes.every(idx => bitArray[idx] === 1);
      if (allOn) {
        // If it's apple, it's a real hit. If cherry, it's a collision false positive!
        if (item.value === 'cherry') {
          setTestResult('collision');
          setLog(`Test "${item.value}": Hashed indices [${item.hashes.join(', ')}] are all 1. Result: "Might be in set" 🟡 (FALSE POSITIVE! "cherry" was never inserted, but overlaps with "apple").`);
        } else {
          setTestResult('hit');
          setLog(`Test "${item.value}": Hashed indices [${item.hashes.join(', ')}] are all 1. Result: "Definitely in set" 🟢.`);
        }
      } else {
        setTestResult('miss');
        const zeroIndices = item.hashes.filter(idx => bitArray[idx] === 0);
        setLog(`Test "${item.value}": Hashed indices [${item.hashes.join(', ')}] checked. Found indices [${zeroIndices.join(', ')}] are 0. Result: "Definitely NOT in set" 🔴.`);
      }
    }
  };

  const handleReset = () => {
    setBitArray([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setActiveHashes([]);
    setActiveItem(null);
    setTestResult(null);
    setLog('Simulator reset.');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
        <span>Bloom Filter Bit Hashing Simulator</span>
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
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {ITEMS.map((item, idx) => {
          const isTest = item.type === 'test';
          const btnColor = isTest ? '#38bdf8' : '#34d399';
          return (
            <button
              key={idx}
              onClick={() => handleAction(item)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '10.5px',
                background: `${btnColor}18`,
                color: btnColor,
                boxShadow: `0 0 0 1px ${btnColor}40`,
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .bfcc-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="bfcc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Bit array display */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>
            10-Bit Array Model (k = 3 Hashes)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
            {bitArray.map((bit, idx) => {
              const isActive = activeHashes.includes(idx);
              const activeColor = bit === 1 ? '#34d399' : '#fbbf24';

              return (
                <div
                  key={idx}
                  style={{
                    width: '32px',
                    height: '42px',
                    borderRadius: '4px',
                    border: `1.5px solid ${isActive ? activeColor : 'rgba(255,255,255,0.15)'}`,
                    background: isActive ? `${activeColor}15` : bit === 1 ? 'rgba(52,211,153,0.05)' : 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? `0 0 6px ${activeColor}30` : 'none',
                    transition: 'all 0.25s'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: bit === 1 ? '#34d399' : 'var(--ifm-color-content-secondary)' }}>
                    {bit}
                  </span>
                  <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {idx}
                  </span>
                </div>
              );
            })}
          </div>
          {activeItem && (
            <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
              Active key: <strong style={{ color: '#38bdf8' }}>{`"${activeItem}"`}</strong> maps to indices [<strong>{activeHashes.join(', ')}</strong>]
            </div>
          )}
        </div>

        {/* Console details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: testResult === 'hit' ? '#34d399' : testResult === 'collision' ? '#fbbf24' : testResult === 'miss' ? '#f87171' : 'rgba(255,255,255,0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              📟 Query Result & Console Log
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
            {log}
          </p>
        </div>
      </div>
    </div>
  );
}
