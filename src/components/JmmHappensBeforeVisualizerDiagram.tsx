import React, { useState } from 'react';

export type JmmTab = 'jit_hoisting' | 'store_buffer' | 'piggyback';

interface JmmHappensBeforeVisualizerDiagramProps {
  initialTab?: JmmTab;
}

export default function JmmHappensBeforeVisualizerDiagram({
  initialTab = 'jit_hoisting',
}: JmmHappensBeforeVisualizerDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<JmmTab>(initialTab);
  const [jitVariant, setJitVariant] = useState<'plain' | 'volatile' | 'xint' | 'println'>('plain');
  const [archMode, setArchMode] = useState<'x86_plain' | 'arm_plain' | 'volatile_fence'>('x86_plain');

  const JIT_DETAILS = {
    plain: {
      title: 'Variant (a): Plain boolean stop = false (JDK 17 C2 Default)',
      outcome: 'HANGS FOREVER (5/5 runs Worker stays alive after 3s)',
      codeBefore: 'while (!stop) { spins++; }',
      codeAfter: 'if (!stop) { while (true) { spins++; } } // Hoisted into register!',
      reason: 'With no method calls, locks, or volatile barriers inside the loop, HotSpot C2 proves stop is not modified locally and hoists the read outside the loop. Even though MESI cache coherence updates L1 cache in nanoseconds, the CPU never reads memory again!',
      color: '#f87171',
    },
    volatile: {
      title: 'Variant (d): static volatile boolean stop = false',
      outcome: 'TERMINATES CLEANLY (~2.6 billion loops)',
      codeBefore: 'while (!stop) { spins++; }',
      codeAfter: 'loop: movzx eax, byte ptr [stop] ; test eax, eax ; jnz exit',
      reason: 'JLS 17.4.5 Volatile Variable Rule: A write to a volatile field happens-before every subsequent read. Forbids C2 loop-invariant hoisting and inserts a StoreLoad memory barrier on write.',
      color: '#34d399',
    },
    xint: {
      title: 'Variant (b/c): -Xint (Interpreter) or -XX:TieredStopAtLevel=1 (C1 Only)',
      outcome: 'TERMINATES (~173M loops in -Xint / ~1.95B in C1)',
      codeBefore: 'getstatic #stop // Executed every iteration',
      codeAfter: 'No C2 loop-invariant hoisting applied',
      reason: 'Proves the bug is caused by the C2 JIT compiler, NOT stale CPU L1 caches! When C2 optimization is disabled, the worker reads from coherent L1 cache and stops immediately.',
      color: '#38bdf8',
    },
    println: {
      title: 'Variant (e/f): Adding println() or Thread.sleep(0) Inside Loop',
      outcome: 'MASKS THE BUG (Worker stops, but ZERO JLS guarantee!)',
      codeBefore: 'while (!stop) { spins++; Thread.sleep(0); }',
      codeAfter: 'Native call / internal lock prevents C2 hoisting',
      reason: 'println acquires an internal lock and Thread.sleep(0) is a non-inlinable native call, forcing C2 to reload stop from memory. However, JLS 17.3 states sleep has NO synchronization semantics—removing the log statement in production resurrects the hang!',
      color: '#fbbf24',
    },
  };

  const curJit = JIT_DETAILS[jitVariant];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .jmm-hb-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: '#a78bfa', fontWeight: 700 }}>
          JMM Under the Hood: C2 JIT Hoisting, Store Buffers (x86 vs ARM) &amp; Piggybacking
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'jit_hoisting', label: '1. C2 JIT Hoisting vs CPU Cache Myth', color: '#f87171' },
            { id: 'store_buffer', label: '2. Store Buffer (Dekker Test) & x86 vs ARM', color: '#38bdf8' },
            { id: 'piggyback', label: '3. Transitive Piggybacking & Safe Publication', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as JmmTab)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : '#94a3b8',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: JIT HOISTING */}
        {activeTab === 'jit_hoisting' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'plain', label: '(a) Plain boolean (C2 Hoisted)', color: '#f87171' },
                { id: 'volatile', label: '(d) volatile boolean (Safe)', color: '#34d399' },
                { id: 'xint', label: '(b/c) -Xint / C1 Only', color: '#38bdf8' },
                { id: 'println', label: '(e/f) println / sleep(0) Heisenbug', color: '#fbbf24' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setJitVariant(v.id as 'plain' | 'volatile' | 'xint' | 'println')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: jitVariant === v.id ? `${v.color}25` : 'rgba(255,255,255,0.04)',
                    color: jitVariant === v.id ? v.color : '#94a3b8',
                    boxShadow: jitVariant === v.id ? `0 0 0 1px ${v.color}` : 'none',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="jmm-hb-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
              <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg viewBox="0 0 540 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <marker id="jit-arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#34d399" />
                    </marker>
                    <marker id="jit-arr-r" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#f87171" />
                    </marker>
                  </defs>

                  {/* Main Thread */}
                  <rect x="20" y="30" width="145" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="92" y="52" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">Core 0: Main Thread</text>
                  <text x="92" y="70" fill="#34d399" fontSize="9.5" textAnchor="middle">stop = true (t = 1s)</text>
                  <text x="92" y="85" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Flushes via MESI Protocol</text>

                  <path d="M 171 62 L 210 62" fill="none" stroke="#34d399" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#jit-arr-g)" />

                  {/* Coherent L1/L2 Cache */}
                  <rect x="218" y="30" width="130" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="283" y="52" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">L1/L2 Cache (MESI)</text>
                  <text x="283" y="70" fill="#38bdf8" fontSize="9.5" textAnchor="middle">stop == true</text>
                  <text x="283" y="85" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Hardware Cache IS Coherent!</text>

                  <path
                    d="M 354 62 L 388 62"
                    fill="none"
                    stroke={jitVariant === 'plain' ? '#f87171' : '#34d399'}
                    strokeWidth="2"
                    className="interactive-diagram-flowing-path"
                    markerEnd={jitVariant === 'plain' ? 'url(#jit-arr-r)' : 'url(#jit-arr-g)'}
                  />

                  {/* Worker Thread */}
                  <rect x="396" y="30" width="125" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke={curJit.color} strokeWidth="1.5" />
                  <text x="458" y="52" fill="#ffffff" fontSize="10.5" fontWeight="700" textAnchor="middle">Core 1: Worker</text>
                  <text x="458" y="70" fill={curJit.color} fontSize="9.5" fontWeight="700" textAnchor="middle">
                    {jitVariant === 'plain' ? 'NEVER READS CACHE!' : 'Reloads Each Loop'}
                  </text>
                  <text x="458" y="85" fill="#94a3b8" fontSize="8.5" textAnchor="middle">
                    {jitVariant === 'plain' ? 'Loops on Register' : 'Sees stop == true'}
                  </text>

                  {/* Code Transformation Box */}
                  <rect x="20" y="120" width="500" height="90" rx="8" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.1)" />
                  <text x="35" y="142" fill="#94a3b8" fontSize="10" fontWeight="700">
                    HotSpot C2 JIT Compilation Transformation (After ~1-10ms Warmup):
                  </text>
                  <text x="35" y="164" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                    Source:   {curJit.codeBefore}
                  </text>
                  <text x="35" y="186" fill={curJit.color} fontSize="10" fontFamily="monospace" fontWeight="700">
                    Compiled: {curJit.codeAfter}
                  </text>
                </svg>
              </div>

              <div style={{ background: '#0c0e17', padding: '14px', borderRadius: '10px', border: `1px solid ${curJit.color}50` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: curJit.color, marginBottom: '4px' }}>
                  {curJit.outcome}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {curJit.title}
                </div>
                <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55, margin: 0 }}>
                  {curJit.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORE BUFFER & X86 VS ARM */}
        {activeTab === 'store_buffer' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'x86_plain', label: 'x86-64 TSO (Store-Load Reordering Only — 6.29% r1=0, r2=0)', color: '#fbbf24' },
                { id: 'arm_plain', label: 'ARMv8 Weak Ordering (All 4 Reorderings Allowed — Unsafe DCL)', color: '#f87171' },
                { id: 'volatile_fence', label: 'volatile / StoreLoad Barrier (Drains Store Buffer — 0% r1=0, r2=0)', color: '#34d399' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setArchMode(m.id as 'x86_plain' | 'arm_plain' | 'volatile_fence')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: archMode === m.id ? `${m.color}25` : 'rgba(255,255,255,0.04)',
                    color: archMode === m.id ? m.color : '#94a3b8',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg viewBox="0 0 660 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="sb-arr-b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#38bdf8" />
                  </marker>
                  <marker id="sb-arr-r" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Core 0 */}
                <rect x="20" y="20" width="180" height="80" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="110" y="42" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Core 0 (Actor 1)</text>
                <text x="110" y="60" fill="#fbbf24" fontSize="10" fontFamily="monospace" textAnchor="middle">1. x = 1 (Buffered)</text>
                <text x="110" y="78" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle">2. r1 = y (Reads 0!)</text>

                {/* Store Buffer 0 */}
                <rect x="235" y="30" width="150" height="60" rx="6" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="310" y="52" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">
                  {archMode === 'volatile_fence' ? 'StoreLoad Barrier (lock addl)' : 'Core 0 Store Buffer'}
                </text>
                <text x="310" y="70" fill="#e2e8f0" fontSize="9.5" textAnchor="middle">
                  {archMode === 'volatile_fence' ? 'Flushed before r1 = y!' : 'Holds [x = 1] queue'}
                </text>

                <path d="M 204 60 L 228 60" fill="none" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#sb-arr-b)" />

                {/* Shared L3 / RAM */}
                <rect x="425" y="20" width="215" height="175" rx="8" fill="rgba(15,23,42,0.9)" stroke={archMode === 'volatile_fence' ? '#34d399' : '#f87171'} strokeWidth="1.5" />
                <text x="532" y="45" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Coherent Cache / Main Memory</text>
                <text x="532" y="72" fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {archMode === 'volatile_fence' ? 'x = 1, y = 1 (Visible)' : 'x = 0, y = 0 (Stale during read)'}
                </text>
                <text x="532" y="102" fill={archMode === 'volatile_fence' ? '#34d399' : '#f87171'} fontSize="10.5" fontWeight="700" textAnchor="middle">
                  {archMode === 'volatile_fence'
                    ? 'Result (0, 0): FORBIDDEN (0%)'
                    : 'Result (r1=0, r2=0): ~6.29% in jcstress!'}
                </text>
                <text x="532" y="130" fill="#94a3b8" fontSize="9" textAnchor="middle">
                  {archMode === 'arm_plain'
                    ? 'ARMv8 also reorders Store-Store (breaks DCL!)'
                    : 'x86 TSO only reorders Store-Load via Store Buffer'}
                </text>
                <text x="532" y="152" fill="#38bdf8" fontSize="9" textAnchor="middle">
                  Verify with OpenJDK jcstress harness
                </text>

                {/* Core 1 */}
                <rect x="20" y="115" width="180" height="80" rx="8" fill="rgba(15,23,42,0.9)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="110" y="137" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Core 1 (Actor 2)</text>
                <text x="110" y="155" fill="#fbbf24" fontSize="10" fontFamily="monospace" textAnchor="middle">1. y = 1 (Buffered)</text>
                <text x="110" y="173" fill="#a78bfa" fontSize="10" fontFamily="monospace" textAnchor="middle">2. r2 = x (Reads 0!)</text>

                {/* Store Buffer 1 */}
                <rect x="235" y="125" width="150" height="60" rx="6" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="310" y="147" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">
                  {archMode === 'volatile_fence' ? 'StoreLoad Barrier (lock addl)' : 'Core 1 Store Buffer'}
                </text>
                <text x="310" y="165" fill="#e2e8f0" fontSize="9.5" textAnchor="middle">
                  {archMode === 'volatile_fence' ? 'Flushed before r2 = x!' : 'Holds [y = 1] queue'}
                </text>

                <path d="M 204 155 L 228 155" fill="none" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#sb-arr-b)" />
                <path d="M 391 60 L 418 60" fill="none" stroke="#f87171" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#sb-arr-r)" />
                <path d="M 391 155 L 418 155" fill="none" stroke="#f87171" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#sb-arr-r)" />
              </svg>
            </div>
          </div>
        )}

        {/* TAB 3: PIGGYBACKING */}
        {activeTab === 'piggyback' && (
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg viewBox="0 0 660 190" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="pb-arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill="#34d399" />
                </marker>
                <marker id="pb-arr-c" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill="#38bdf8" />
                </marker>
              </defs>

              <rect x="20" y="25" width="135" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="87" y="48" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">(1) Thread A: Plain Write</text>
              <text x="87" y="66" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle">data = 42;</text>
              <text x="87" y="81" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Non-volatile field</text>

              <path d="M 161 57 L 192 57" fill="none" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#pb-arr-c)" />
              <text x="176" y="48" fill="#94a3b8" fontSize="8" textAnchor="middle">PO</text>

              <rect x="200" y="25" width="135" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#34d399" strokeWidth="2" />
              <text x="267" y="48" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">(2) Thread A: Release</text>
              <text x="267" y="66" fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="middle">ready = true;</text>
              <text x="267" y="81" fill="#94a3b8" fontSize="8.5" textAnchor="middle">volatile write / unlock()</text>

              <path d="M 341 57 L 378 57" fill="none" stroke="#34d399" strokeWidth="2.5" className="interactive-diagram-flowing-path" markerEnd="url(#pb-arr-g)" />
              <text x="359" y="48" fill="#34d399" fontSize="8.5" fontWeight="700" textAnchor="middle">SW</text>

              <rect x="386" y="25" width="125" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#34d399" strokeWidth="2" />
              <text x="448" y="48" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">(3) Thread B: Acquire</text>
              <text x="448" y="66" fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="middle">if (ready)</text>
              <text x="448" y="81" fill="#94a3b8" fontSize="8.5" textAnchor="middle">volatile read == true</text>

              <path d="M 517 57 L 542 57" fill="none" stroke="#38bdf8" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#pb-arr-c)" />
              <text x="529" y="48" fill="#94a3b8" fontSize="8" textAnchor="middle">PO</text>

              <rect x="550" y="25" width="95" height="65" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="597" y="48" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">(4) Thread B</text>
              <text x="597" y="66" fill="#34d399" fontSize="10" fontFamily="monospace" textAnchor="middle">read(data)</text>
              <text x="597" y="81" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Guaranteed 42!</text>

              {/* Transitivity Arc */}
              <path d="M 87 98 Q 340 165 597 98" fill="none" stroke="#a78bfa" strokeWidth="2" className="interactive-diagram-flowing-path" markerEnd="url(#pb-arr-c)" />
              <text x="342" y="155" fill="#a78bfa" fontSize="10" fontWeight="700" textAnchor="middle">
                Transitivity: hb(1, 2) + hb(2, 3) + hb(3, 4) ⇒ hb(1, 4) (Used by AQS state &amp; LinkedBlockingQueue count)
              </text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
