import React, { useState } from 'react';

export default function JavaObjectLayoutDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'layout' | 'markword' | 'falsesharing'>('layout');
  const [compressedOops, setCompressedOops] = useState<boolean>(true);
  const [selectedFieldCount, setSelectedFieldCount] = useState<number>(2); // 2 long fields (16 bytes)
  const [lockState, setLockState] = useState<'unlocked' | 'lightweight' | 'heavyweight' | 'gc'>('unlocked');
  const [paddingEnabled, setPaddingEnabled] = useState<boolean>(false);

  // Calculations for Object Layout
  const markWordBytes = 8;
  const klassWordBytes = compressedOops ? 4 : 8;
  const fieldsBytes = selectedFieldCount * 8; // assuming 8-byte long fields
  const subtotal = markWordBytes + klassWordBytes + fieldsBytes;
  const paddingBytes = (8 - (subtotal % 8)) % 8;
  const totalBytes = subtotal + paddingBytes;

  const markWordBits = {
    unlocked: {
      bits: 'unused: 25 | hash: 31 | unused: 1 | age: 4 | biased: 0 | tag: 01',
      tag: '01',
      desc: 'Normal unowned object. Stores 31-bit Identity HashCode, 4-bit GC Age (0-15), biased_lock=0.',
      color: '#34d399'
    },
    lightweight: {
      bits: 'ptr_to_displaced_mark_word (on Thread Stack): 62 bits | tag: 00',
      tag: '00',
      desc: 'Thin lock held by thread. Points directly into the lock record on the thread’s execution stack.',
      color: '#38bdf8'
    },
    heavyweight: {
      bits: 'ptr_to_real_object_monitor (in Native C++ Heap): 62 bits | tag: 10',
      tag: '10',
      desc: 'Inflated monitor lock. Points to native C++ ObjectMonitor with WaitSet and EntryList OS mutex.',
      color: '#f87171'
    },
    gc: {
      bits: 'marked_for_gc / cms_free_block: 62 bits | tag: 11',
      tag: '11',
      desc: 'Marked by GC thread during collection cycle or forward pointer during relocation.',
      color: '#a78bfa'
    }
  };

  const currMark = markWordBits[lockState];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @keyframes anim-cacheline-bounce {
          0% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
          100% { opacity: 0.4; transform: translateY(0); }
        }
        .cacheline-active {
          animation: anim-cacheline-bounce 1.5s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .jol-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Java Object Layout (JOL), Mark Word & Hardware Cache Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'layout', label: '🧱 64-Bit HotSpot Object Layout & Padding', color: '#38bdf8' },
            { id: 'markword', label: '🏷️ Mark Word Bitwise State Machine', color: '#34d399' },
            { id: 'falsesharing', label: '⚡ CPU Cache Line (64B) & False Sharing', color: '#f87171' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OBJECT LAYOUT & PADDING */}
        {activeTab === 'layout' && (
          <div>
            <div className="jol-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', marginBottom: '16px' }}>
              {/* Left Column: Visual Object Memory Stack */}
              <div style={{
                background: '#0d0f1e',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
                  Heap Memory Footprint: {totalBytes} Bytes (8-Byte Aligned)
                </div>

                {/* Visual Stack of Bytes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Mark Word */}
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    borderRadius: '6px',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>1. Mark Word (Object Header)</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Identity HashCode, GC Age, Lock Bits</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>8 Bytes (64 bits)</span>
                  </div>

                  {/* Klass Word */}
                  <div style={{
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid #34d399',
                    borderRadius: '6px',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>2. Klass Pointer (Metadata)</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {compressedOops ? 'Compressed OOPs Enabled (-XX:+UseCompressedClassPointers)' : 'Uncompressed 64-bit Pointer'}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>{klassWordBytes} Bytes ({klassWordBytes * 8} bits)</span>
                  </div>

                  {/* Instance Fields */}
                  <div style={{
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>3. Instance Payload Fields</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{selectedFieldCount} x 64-bit primitive long fields</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>{fieldsBytes} Bytes</span>
                  </div>

                  {/* Alignment Padding */}
                  <div style={{
                    background: paddingBytes > 0 ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: paddingBytes > 0 ? '1px dashed #f87171' : '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: paddingBytes > 0 ? '#f87171' : '#64748b' }}>
                        4. 8-Byte Alignment Padding
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {paddingBytes > 0 ? `Unused space added to satisfy 8-byte word alignment` : 'Zero padding required (Already multiple of 8)'}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: paddingBytes > 0 ? '#f87171' : '#64748b' }}>
                      {paddingBytes} Bytes
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls & JVM Rules */}
              <div style={{
                background: '#0c0e17',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '12px' }}>
                    JVM Configuration Controls
                  </div>

                  {/* Compressed OOPs toggle */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#e2e8f0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={compressedOops}
                        onChange={e => setCompressedOops(e.target.checked)}
                        style={{ accentColor: '#34d399' }}
                      />
                      <span>Enable Compressed OOPs (Heap &lt; 32GB)</span>
                    </label>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', marginLeft: '22px' }}>
                      Reduces Klass pointer from 8 bytes to 4 bytes using 3-bit zero shift.
                    </div>
                  </div>

                  {/* Field Count Selector */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#e2e8f0', marginBottom: '4px' }}>
                      Instance Fields: <strong style={{ color: '#fbbf24' }}>{selectedFieldCount} long fields (8B each)</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={selectedFieldCount}
                      onChange={e => setSelectedFieldCount(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: '#fbbf24' }}
                    />
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    lineHeight: 1.5
                  }}>
                    <strong style={{ color: '#38bdf8' }}>Mechanical Sympathy Truth:</strong> HotSpot aligns every heap object on an 8-byte boundary so that the lowest 3 bits of any object address are always <code style={{ color: '#34d399' }}>000</code>. This enables Compressed OOPs to address up to 32GB of heap using 32-bit integer offsets.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '10px', color: '#64748b' }}>
                  Formula: total_size = ceil((8 + klass + fields) / 8) * 8
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MARK WORD BITWISE STATE MACHINE */}
        {activeTab === 'markword' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'unlocked', label: '1. Unlocked (Tag 01)', color: '#34d399' },
                { id: 'lightweight', label: '2. Lightweight Lock (Tag 00)', color: '#38bdf8' },
                { id: 'heavyweight', label: '3. Heavyweight Monitor (Tag 10)', color: '#f87171' },
                { id: 'gc', label: '4. Marked for GC (Tag 11)', color: '#a78bfa' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setLockState(t.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: lockState === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)',
                    color: lockState === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: lockState === t.id ? `0 0 0 1px ${t.color}` : 'none'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{
              background: '#0d0f1e',
              border: `1px solid ${currMark.color}40`,
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: currMark.color }}>
                  Mark Word 64-Bit Layout in State: {lockState.toUpperCase()}
                </span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: `${currMark.color}20`,
                  color: currMark.color,
                  border: `1px solid ${currMark.color}50`
                }}>
                  Tag Bits: {currMark.tag}
                </span>
              </div>

              {/* Bitwise Layout Visualizer */}
              <div style={{
                background: '#070913',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: currMark.color,
                marginBottom: '12px',
                wordBreak: 'break-all'
              }}>
                {currMark.bits}
              </div>

              <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '14px', lineHeight: 1.5 }}>
                {currMark.desc}
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                <strong style={{ color: '#fbbf24' }}>JDK 15+ Lock Note:</strong> Biased Locking (tag <code style={{ color: '#38bdf8' }}>101</code>) was deprecated in JEP 374 and disabled by default because the STW safepoint cost of bias revocation on modern multi-threaded architectures exceeded the performance gains of single-thread lock elision.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CPU CACHE LINE & FALSE SHARING */}
        {activeTab === 'falsesharing' && (
          <div>
            <div style={{
              background: '#0d0f1e',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>
                  Hardware L1/L2/L3 Cache Line Invalidation (64 Bytes)
                </span>
                <button
                  onClick={() => setPaddingEnabled(!paddingEnabled)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: paddingEnabled ? '#34d39925' : '#f8717125',
                    color: paddingEnabled ? '#34d399' : '#f87171',
                    boxShadow: `0 0 0 1px ${paddingEnabled ? '#34d399' : '#f87171'}`
                  }}
                >
                  {paddingEnabled ? '✅ @Contended / 64B Padding Enabled' : '❌ No Padding (False Sharing Active)'}
                </button>
              </div>

              {/* Cache Line Visualizer */}
              <div style={{ width: '100%', overflowX: 'auto', marginBottom: '14px' }}>
                <svg viewBox="0 0 760 180" style={{ width: '100%', minWidth: '680px', height: 'auto', display: 'block' }}>
                  {/* CPU Core 1 */}
                  <rect x="20" y="20" width="160" height="60" rx="6" fill="#13172b" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="100" y="45" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">CPU Core 1</text>
                  <text x="100" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Mutating: valueA</text>

                  {/* CPU Core 2 */}
                  <rect x="580" y="20" width="160" height="60" rx="6" fill="#13172b" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="660" y="45" fill="#fbbf24" fontSize="12" fontWeight="700" textAnchor="middle">CPU Core 2</text>
                  <text x="660" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">Mutating: valueB</text>

                  {/* Cache Line Container (64 Bytes) */}
                  <rect
                    x="200"
                    y="100"
                    width="360"
                    height="60"
                    rx="8"
                    fill="#0a0c16"
                    stroke={paddingEnabled ? '#34d399' : '#f87171'}
                    strokeWidth="2"
                    className={paddingEnabled ? '' : 'cacheline-active'}
                  />
                  <text x="380" y="125" fill="#e2e8f0" fontSize="11" fontWeight="700" textAnchor="middle">
                    Single 64-Byte Hardware Cache Line
                  </text>

                  {paddingEnabled ? (
                    <>
                      <rect x="210" y="135" width="80" height="18" rx="3" fill="#38bdf8" />
                      <text x="250" y="148" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">valueA (8B)</text>
                      <rect x="295" y="135" width="255" height="18" rx="3" fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="422" y="148" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle">56 Bytes Padding (valueB pushed to next Line)</text>
                    </>
                  ) : (
                    <>
                      <rect x="230" y="135" width="140" height="18" rx="3" fill="#38bdf8" />
                      <text x="300" y="148" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">valueA (Core 1 - 8B)</text>
                      <rect x="390" y="135" width="140" height="18" rx="3" fill="#fbbf24" />
                      <text x="460" y="148" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">valueB (Core 2 - 8B)</text>
                    </>
                  )}

                  {/* Flow arrows */}
                  <line x1="100" y1="80" x2="280" y2="100" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" />
                  <line x1="660" y1="80" x2="480" y2="100" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,4" />
                </svg>
              </div>

              <div style={{
                background: paddingEnabled ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${paddingEnabled ? '#34d39950' : '#f8717150'}`,
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                lineHeight: 1.5,
                color: '#cbd5e1'
              }}>
                {paddingEnabled ? (
                  <div>
                    <strong style={{ color: '#34d399' }}>False Sharing Eliminated:</strong> By adding 56 bytes of padding (or using <code style={{ color: '#38bdf8' }}>@jdk.internal.vm.annotation.Contended</code>), <code style={{ color: '#38bdf8' }}>valueA</code> and <code style={{ color: '#fbbf24' }}>valueB</code> reside on completely separate 64-byte cache lines. Both CPU cores update their respective L1 caches without invalidating each other via the MESI bus protocol.
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: '#f87171' }}>False Sharing Hazard:</strong> Even though Core 1 modifies only <code style={{ color: '#38bdf8' }}>valueA</code> and Core 2 modifies only <code style={{ color: '#fbbf24' }}>valueB</code>, both variables share the same physical 64-byte cache line. Every write invalidates the remote core’s L1 cache, forcing expensive bus snooping and memory stalls (throughput drops by 10x-50x).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
