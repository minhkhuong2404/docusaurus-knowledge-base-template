import React, { useState } from 'react';

export default function JavaOffHeapFfmDiagram({ initialTab = 'comparison' }: { initialTab?: 'comparison' | 'evolution' | 'lifecycle' | 'k8s_pitfalls' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'comparison' | 'evolution' | 'lifecycle' | 'k8s_pitfalls'>(initialTab);
  const [elementCountMillions, setElementCountMillions] = useState<number>(10);
  const [selectedArena, setSelectedArena] = useState<'confined' | 'shared' | 'auto' | 'global'>('confined');

  // K8s OOM Calculator state
  const [containerLimitGb, setContainerLimitGb] = useState<number>(4);
  const [xmxHeapGb, setXmxHeapGb] = useState<number>(2.5);
  const [offHeapGb, setOffHeapGb] = useState<number>(1.2);
  const [metaspaceOverheadGb, setMetaspaceOverheadGb] = useState<number>(0.6);

  const totalUsedMemory = xmxHeapGb + offHeapGb + metaspaceOverheadGb;
  const isOomKilled = totalUsedMemory > containerLimitGb;

  // On-Heap vs Off-Heap memory math (10M integers)
  // On-Heap: java.lang.Integer object = 12B header + 4B int value + 4B reference pointer (with CompressedOOPs) = 24 bytes per integer
  const onHeapMb = (elementCountMillions * 1000000 * 24) / (1024 * 1024);
  // Off-Heap: 4 bytes per raw int
  const offHeapMb = (elementCountMillions * 1000000 * 4) / (1024 * 1024);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .ffm-grid {
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
          Modern Java (Java 22+) Off-Heap Memory & FFM API Engine (JEP 454)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'comparison', label: '📊 1. On-Heap vs Off-Heap Architecture', color: '#38bdf8' },
            { id: 'evolution', label: '⚡ 2. Unsafe vs JNI vs FFM (JEP 454)', color: '#34d399' },
            { id: 'lifecycle', label: '🛡️ 3. Arena Lifecycles & Concurrency', color: '#fbbf24' },
            { id: 'k8s_pitfalls', label: '⚠️ 4. K8s OOM & Container Sizing', color: '#f87171' }
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

        {/* TAB 1: ON-HEAP VS OFF-HEAP ARCHITECTURE */}
        {activeTab === 'comparison' && (
          <div>
            <div className="ffm-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '14px', marginBottom: '14px' }}>
              {/* Architecture SVG diagram */}
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg viewBox="0 0 420 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="ffm-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker id="ffm-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                    </marker>
                  </defs>

                  {/* JVM Boundary */}
                  <rect x="10" y="10" width="395" height="135" rx="8" fill="rgba(248,113,113,0.06)" stroke="#f87171" strokeWidth="1.2" strokeDasharray="4 4" />
                  <text x="25" y="30" fill="#f87171" fontSize="11" fontWeight="700">JVM Process Managed Area (On-Heap)</text>

                  {/* Heap box */}
                  <rect x="25" y="45" width="220" height="85" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1" />
                  <text x="135" y="68" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">JVM Heap (-Xmx)</text>
                  <text x="135" y="86" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">12-16B Object Headers per Box</text>
                  <text x="135" y="102" textAnchor="middle" fill="#fbbf24" fontSize="9">Subject to GC Mark & Sweep</text>
                  <text x="135" y="118" textAnchor="middle" fill="#f87171" fontSize="9">💥 Stop-The-World Pauses (p99 latency)</text>

                  {/* GC Thread */}
                  <rect x="260" y="45" width="130" height="85" rx="6" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="325" y="70" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">Garbage Collector</text>
                  <path d="M 260 88 L 245 88" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#ffm-arrow-red)" />
                  <text x="325" y="92" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Scanning Object Graph</text>
                  <text x="325" y="108" textAnchor="middle" fill="#f87171" fontSize="8">High CPU overhead</text>

                  {/* Native OS Memory Boundary */}
                  <rect x="10" y="155" width="395" height="135" rx="8" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.2" />
                  <text x="25" y="175" fill="#38bdf8" fontSize="11" fontWeight="700">OS Native Address Space (Off-Heap / FFM)</text>

                  {/* Off Heap MemorySegment */}
                  <rect x="25" y="190" width="220" height="85" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="135" y="212" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">MemorySegment (Native RAM)</text>
                  <text x="135" y="230" textAnchor="middle" fill="#34d399" fontSize="9">✅ 0-Byte Object Overhead (Pure Bytes)</text>
                  <text x="135" y="246" textAnchor="middle" fill="#34d399" fontSize="9">✅ 100% Invisible to Garbage Collector</text>
                  <text x="135" y="262" textAnchor="middle" fill="#34d399" fontSize="9">✅ Deterministic Scope Deallocation</text>

                  {/* Hardware NIC / NVMe Zero Copy */}
                  <rect x="260" y="190" width="130" height="85" rx="6" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1" />
                  <text x="325" y="215" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">Zero-Copy I/O</text>
                  <path d="M 260 232 L 245 232" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#ffm-arrow)" />
                  <text x="325" y="238" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Direct DMA Transfer</text>
                  <text x="325" y="254" textAnchor="middle" fill="#38bdf8" fontSize="8">NIC / NVMe direct bus</text>
                </svg>
              </div>

              {/* Memory savings calculator */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  Live Memory Overhead Simulator
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                  Store an array of primitive integers (Java <code>int</code>) and compare RAM usage:
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Number of Integers:</span>
                    <strong style={{ color: '#38bdf8' }}>{elementCountMillions} Million Elements</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={elementCountMillions}
                    onChange={e => setElementCountMillions(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>

                {/* Side by side comparison cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>On-Heap (Integer[])</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
                      {Math.round(onHeapMb)} MB
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      ~24 bytes/int (12B header + 4B int + 8B pointer). Heavy GC scan burden.
                    </div>
                  </div>

                  <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>Off-Heap (FFM Segment)</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                      {Math.round(offHeapMb)} MB
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Exact 4 bytes/int. <strong>{(onHeapMb / offHeapMb).toFixed(1)}x more compact</strong>. Zero GC impact!
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px' }}>
                  💡 <strong>Key takeaway:</strong> Whether you allocate 10MB or 200GB in Off-Heap memory, JVM GC pause times remain completely flat because the garbage collector never scans Native addresses.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UNSAFE VS JNI VS FFM API */}
        {activeTab === 'evolution' && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
              The evolution of native interoperability in Java: from perilous pointer arithmetic to safe deterministic off-heap memory:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              {/* JNI Card */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  1. Classic JNI (Java Native Interface)
                </div>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, marginBottom: '6px' }}>
                  Heavy Boundary Cost & Fragility
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
                  <li>Requires compiling external C/C++ libraries (<code>.so</code> / <code>.dll</code>).</li>
                  <li>JNI transition penalty: 10-20ns per call to cross the VM boundary.</li>
                  <li>Array pinning disables GC compaction during native calls.</li>
                  <li>Hard to debug, zero type-safety between C and Java.</li>
                </ul>
              </div>

              {/* Unsafe Card */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  2. sun.misc.Unsafe (Internal API)
                </div>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, marginBottom: '6px' }}>
                  Fast but Instant Fatal SegFaults
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
                  <li>Direct raw memory allocation (<code>allocateMemory</code>).</li>
                  <li>Zero bounds checking: reading 1 byte out-of-bounds causes an instant <strong>Segmentation Fault</strong> that terminates the entire JVM!</li>
                  <li>No memory lifecycle ownership: risk of use-after-free or severe leaks.</li>
                  <li>Encapsulated and heavily deprecated in modern JDKs.</li>
                </ul>
              </div>

              {/* FFM API Card */}
              <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  3. FFM API (JEP 454 - Java 22+)
                </div>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
                  C Performance + 100% JVM Safety
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
                  <li><strong>Spatial Safety:</strong> Bounds are strictly enforced. Out-of-bounds throws <code>IndexOutOfBoundsException</code>, never crashes the JVM!</li>
                  <li><strong>Temporal Safety:</strong> Accessing a closed segment throws <code>IllegalStateException</code>, preventing use-after-free bugs.</li>
                  <li><strong>Deterministic Deallocation:</strong> Native memory freed reliably via <code>Arena</code> try-with-resources.</li>
                  <li>No external C build files needed: call C libraries dynamically via <code>Linker</code>!</li>
                </ul>
              </div>
            </div>

            {/* Code example of FFM API */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                Standard FFM API Native Allocation Pattern (Java 22+)
              </div>
              <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`// 1. Try-with-resources defines deterministic temporal lifecycle
try (Arena arena = Arena.ofConfined()) {
    // 2. Allocate 40MB off-heap native memory (10,000,000 ints)
    MemorySegment segment = arena.allocate(10_000_000L * ValueLayout.JAVA_INT.byteSize());
    
    // 3. Ultra-fast native read/write without object overhead
    segment.setAtIndex(ValueLayout.JAVA_INT, 0, 42);
    int value = segment.getAtIndex(ValueLayout.JAVA_INT, 0);
    
    // 4. Spatial Safety: accessing index 10_000_001 throws IndexOutOfBoundsException, NOT SIGSEGV!
} // 5. Arena closes here: native memory freed INSTANTLY with zero GC pressure`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: ARENA LIFECYCLES */}
        {activeTab === 'lifecycle' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'confined', label: 'Arena.ofConfined() [Single Thread]', color: '#38bdf8' },
                { id: 'shared', label: 'Arena.ofShared() [Multi-Threaded]', color: '#34d399' },
                { id: 'auto', label: 'Arena.ofAuto() [GC Managed]', color: '#fbbf24' },
                { id: 'global', label: 'Arena.global() [Never Closed]', color: '#a78bfa' }
              ].map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArena(a.id as any)}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11px',
                    background: selectedArena === a.id ? `${a.color}25` : 'rgba(255,255,255,0.05)',
                    color: selectedArena === a.id ? a.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: selectedArena === a.id ? `0 0 0 1px ${a.color}` : 'none'
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Arena inspection card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: selectedArena === 'confined' ? '#38bdf8' : selectedArena === 'shared' ? '#34d399' : selectedArena === 'auto' ? '#fbbf24' : '#a78bfa', marginBottom: '6px' }}>
                {selectedArena === 'confined' && 'Arena.ofConfined() — Thread-Confined High Performance'}
                {selectedArena === 'shared' && 'Arena.ofShared() — Cross-Thread & Virtual Thread Coordination'}
                {selectedArena === 'auto' && 'Arena.ofAuto() — Phantom Reference & Cleaner Lifecycle'}
                {selectedArena === 'global' && 'Arena.global() — Unbounded Process Lifetime'}
              </div>

              <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--ifm-color-content-secondary)' }}>
                {selectedArena === 'confined' && (
                  <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Thread Ownership:</strong> Strictly bound to the single thread that instantiated the Arena. Any read/write access from another thread throws a fast <code>WrongThreadException</code>.
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Performance:</strong> Zero synchronization overhead, maximum JIT optimization, perfect for request-scoped buffers, file parsers, and local socket framing.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Deallocation:</strong> Explicit and deterministic via <code>arena.close()</code> or <code>try-with-resources</code>.
                    </p>
                  </div>
                )}
                {selectedArena === 'shared' && (
                  <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Thread Ownership:</strong> Can be concurrently accessed by multiple Platform Threads or Virtual Threads in worker pools.
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Performance:</strong> Uses lightweight atomic safety checks. JIT handles memory fences cleanly. Ideal for shared in-memory caches, message queues, and thread pool worker buffers.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Deallocation:</strong> Thread-safe <code>arena.close()</code> blocks until all active operations finish, then invalidates access atomically across all threads.
                    </p>
                  </div>
                )}
                {selectedArena === 'auto' && (
                  <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Thread Ownership:</strong> Can be shared across any thread.
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Performance:</strong> Memory is backed by Java Cleaners. When the <code>MemorySegment</code> becomes unreachable, native memory is reclaimed automatically by the garbage collector.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Caveat:</strong> Lacks deterministic deallocation! Do not use for massive allocations where immediate memory reclamation is critical.
                    </p>
                  </div>
                )}
                {selectedArena === 'global' && (
                  <div>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Thread Ownership:</strong> Global access across all threads for the entire lifespan of the JVM.
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong>Deallocation:</strong> Cannot be closed! Calling <code>arena.close()</code> throws <code>UnsupportedOperationException</code>.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Use Case:</strong> Lifelong C function pointers loaded via <code>Linker.nativeLinker()</code> or global static lookup tables.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: K8S OOM & CONTAINER SIZING */}
        {activeTab === 'k8s_pitfalls' && (
          <div>
            <div className="ffm-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              {/* Sliders */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  Kubernetes Memory Sizing Calculator
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>Container Limit (<code>resources.limits.memory</code>):</span>
                    <strong style={{ color: '#38bdf8' }}>{containerLimitGb} GB</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="16"
                    step="0.5"
                    value={containerLimitGb}
                    onChange={e => setContainerLimitGb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>JVM Heap Max (<code>-Xmx</code>):</span>
                    <strong style={{ color: '#fbbf24' }}>{xmxHeapGb} GB</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={xmxHeapGb}
                    onChange={e => setXmxHeapGb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#fbbf24' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>Off-Heap Memory (FFM / Netty):</span>
                    <strong style={{ color: '#34d399' }}>{offHeapGb} GB</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.1"
                    value={offHeapGb}
                    onChange={e => setOffHeapGb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>Metaspace + Threads + CodeCache:</span>
                    <strong style={{ color: '#a78bfa' }}>{metaspaceOverheadGb} GB</strong>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2"
                    step="0.1"
                    value={metaspaceOverheadGb}
                    onChange={e => setMetaspaceOverheadGb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#a78bfa' }}
                  />
                </div>

                <div style={{ background: isOomKilled ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)', border: `1px solid ${isOomKilled ? '#f87171' : '#34d399'}`, borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Total Process Memory Consumption:</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isOomKilled ? '#f87171' : '#34d399', marginTop: '2px' }}>
                    {totalUsedMemory.toFixed(2)} GB / {containerLimitGb} GB Limit
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: isOomKilled ? '#f87171' : '#34d399', marginTop: '4px' }}>
                    {isOomKilled ? '💥 Pod OOMKilled by Linux Kernel! (Exit Code 137)' : '✅ Pod Safe: Memory fits within cgroup limits'}
                  </div>
                </div>
              </div>

              {/* Senior Pitfalls Checklist */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  Senior Production Guardrails
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
                  <li>
                    <strong style={{ color: '#f87171' }}>The -Xmx Trap:</strong> <code>-Xmx</code> ONLY controls On-Heap memory! It does not constrain FFM Native Segments or Netty Direct ByteBuffers.
                  </li>
                  <li>
                    <strong style={{ color: '#fbbf24' }}>Leave 25-30% Headroom:</strong> In Kubernetes, set <code>-Xmx</code> to no more than 70% of the container memory limit if your application uses heavy Off-Heap caching.
                  </li>
                  <li>
                    <strong style={{ color: '#34d399' }}>Avoid Deep Serialization:</strong> Off-heap data is flat bytes. Converting complex POJOs with Jackson/Kryo back and forth will waste more CPU cycles than GC pauses ever cost. Keep off-heap data flat!
                  </li>
                  <li>
                    <strong style={{ color: '#38bdf8' }}>Enable Native Tracking:</strong> Run JVM with <code>-XX:NativeMemoryTracking=summary</code> and inspect off-heap allocations using <code>jcmd &lt;pid&gt; VM.native_memory</code>.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
