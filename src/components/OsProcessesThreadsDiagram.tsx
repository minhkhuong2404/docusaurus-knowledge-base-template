import React, { useState } from 'react';

const MEMORY_REGIONS = [
  { label: 'Stack', dir: '↓ grows down', color: '#38bdf8', size: 'Default: 8MB (ulimit -s)', y: 0, h: 55, detail: 'Automatic memory for function call frames. Each frame contains: local variables, return address, saved registers, and function arguments. LIFO structure. Stack overflow (infinite recursion) → SIGSEGV. Java: each thread gets its own stack (-Xss512k for virtual threads).' },
  { label: 'Memory-mapped regions', dir: 'mmap() files, libs', color: '#a78bfa', size: 'Shared libs (libc.so, libjvm.so)', y: 60, h: 45, detail: 'Shared libraries mapped here. Multiple processes share the same physical pages of libc.so — Copy-on-Write. Also used by mmap() for file I/O (page cache backed). Java: jar files memory-mapped, G1 GC uses mmap for heap regions.' },
  { label: 'Heap', dir: '↑ grows up', color: '#34d399', size: 'malloc() / new', y: 110, h: 55, detail: 'Dynamic memory allocation (malloc/free, new/delete). Managed by allocator (glibc ptmalloc2, jemalloc, tcmalloc). brk()/sbrk() extends heap. JVM allocates one large mmap region for Java heap — does not use C heap for GC managed objects.' },
  { label: 'BSS Segment', dir: 'Zero-initialized data', color: '#fbbf24', size: 'static int x; (no init)', y: 170, h: 40, detail: 'Uninitialized or zero-initialized global/static variables. No space in ELF binary — just size info. OS zero-fills physical pages on first access (demand paging). Saves disk space for large global arrays.' },
  { label: 'Data Segment', dir: 'Initialized data', color: '#fbbf24', size: 'static int x = 42;', y: 215, h: 40, detail: 'Initialized global and static variables with non-zero values. Loaded from ELF binary .data section into physical RAM. Read-write (unlike Text segment). Writable static fields in Java classes live here via JNI/native interop.' },
  { label: 'Text Segment', dir: 'Executable code', color: '#f97316', size: 'Read-only machine code', y: 260, h: 40, detail: 'Executable machine instructions (ELF .text section). Read-only and executable (W^X: not writable). Shared between all processes running the same binary. JIT-compiled code (JVM JIT, V8) is placed in anonymous executable mmap regions, not here.' },
];

const THREAD_MODELS = [
  { id: 'native', label: '1:1 (Java platform threads)', color: '#38bdf8', detail: 'Each Java thread maps to exactly one OS thread. Scheduler is the OS kernel. Thread creation is expensive (~1MB stack, ~10μs creation). Context switch: ~2–10μs. Max practical threads: 1,000–10,000. Used by Tomcat blocking I/O model.' },
  { id: 'virtual', label: 'M:N (Java 21 Virtual Threads)', color: '#34d399', detail: 'Many virtual threads multiplexed over fewer OS carrier threads (default: CPU core count). Carrier thread stolen back when virtual thread blocks on I/O. Continuation-based: stack stored in heap. Creation cost: ~1μs, ~200 bytes. Supports millions of virtual threads.' },
];

export default function OsProcessesThreadsDiagram(): React.JSX.Element {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [threadModel, setThreadModel] = useState<string>('native');

  const region = MEMORY_REGIONS.find(r => r.label === selectedRegion) ?? null;
  const model = THREAD_MODELS.find(m => m.id === threadModel)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .os-proc-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/>
          <rect x="13" y="13" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Process Memory Layout &amp; Thread Models</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="os-proc-grid" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '16px', alignItems: 'start' }}>
          {/* Memory layout */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Virtual Address Space Layout</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.04)', fontSize: '9px', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>High Address (kernel space ↑)</div>
              {MEMORY_REGIONS.map(r => {
                const isActive = selectedRegion === r.label;
                return (
                  <div key={r.label} onClick={() => setSelectedRegion(selectedRegion === r.label ? null : r.label)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderTop: `1px solid rgba(255,255,255,0.06)`, background: isActive ? `${r.color}15` : 'transparent', cursor: 'pointer', transition: 'background 0.2s ease' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: r.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isActive ? r.color : 'var(--ifm-color-content)' }}>{r.label}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>{r.dir} · {r.size}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.04)', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Low Address (0x0 null page ↓)</div>
            </div>
          </div>

          {/* Detail + Thread model */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Memory region detail */}
            <div className={`interactive-diagram-details-card ${region ? 'details-cyan' : 'details-gray'}`}
              style={{ minHeight: '130px', display: 'flex', flexDirection: 'column', justifyContent: region ? 'flex-start' : 'center' }}>
              {region ? (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: region.color, marginBottom: '8px' }}>{region.label}</div>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{region.detail}</p>
                </div>
              ) : (
                <div className="interactive-diagram-helper-text" style={{ textAlign: 'center', fontSize: '11.5px' }}>Click a memory region to see details</div>
              )}
            </div>

            {/* Thread model */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Threading Model</div>
              <div style={{ display: 'flex', gap: '7px', marginBottom: '10px' }}>
                {THREAD_MODELS.map(m => (
                  <button key={m.id} onClick={() => setThreadModel(m.id)}
                    style={{ flex: 1, padding: '7px 8px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '10.5px', background: threadModel === m.id ? `${m.color}18` : 'rgba(255,255,255,0.04)', color: threadModel === m.id ? m.color : 'var(--ifm-color-content-secondary)', boxShadow: threadModel === m.id ? `0 0 0 1.5px ${m.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ background: `${model.color}0d`, border: `1px solid ${model.color}30`, borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{model.detail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}